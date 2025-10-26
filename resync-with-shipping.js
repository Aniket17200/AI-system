const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
const ShiprocketService = require('./services/shiprocketService');
require('dotenv').config();

function convertToKolkataDate(dateString) {
  const date = new Date(dateString);
  const dateOnly = date.toISOString().split('T')[0];
  return new Date(dateOnly + 'T00:00:00.000Z');
}

function groupShipmentsByDate(shipments) {
  const grouped = {};
  
  shipments.forEach(shipment => {
    try {
      let dateStr;
      if (shipment.created_at) {
        // Parse date like "26th Oct 2024 08:11 AM"
        const parts = shipment.created_at.split(' ');
        if (parts.length >= 3) {
          const day = parts[0].replace(/\D/g, '');
          const monthMap = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', 
                            Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
          const month = monthMap[parts[1]];
          const year = parts[2];
          if (day && month && year) {
            dateStr = `${year}-${month}-${day.padStart(2, '0')}`;
          }
        }
      } else if (shipment.pickup_scheduled_date) {
        dateStr = shipment.pickup_scheduled_date.split(' ')[0];
      }
      
      if (dateStr) {
        if (!grouped[dateStr]) {
          grouped[dateStr] = [];
        }
        grouped[dateStr].push(shipment);
      }
    } catch (error) {
      console.error(`Error parsing shipment date`, error.message);
    }
  });
  
  return grouped;
}

function calculateShippingMetrics(shipments) {
  const totalShipments = shipments.length;
  const delivered = shipments.filter(s => s.status === 'DELIVERED').length;
  const inTransit = shipments.filter(s => s.status === 'IN TRANSIT' || s.status === 'SHIPPED').length;
  const rto = shipments.filter(s => s.status === 'RTO' || s.status === 'RTO DELIVERED').length;
  const ndr = shipments.filter(s => s.status === 'NDR' || s.status === 'OUT FOR DELIVERY').length;
  
  const shippingCost = shipments.reduce((sum, s) => sum + parseFloat(s.shipping_charges || 0), 0);
  
  const deliveryRate = totalShipments > 0 ? (delivered / totalShipments) * 100 : 0;
  const rtoRate = totalShipments > 0 ? (rto / totalShipments) * 100 : 0;
  
  return {
    totalShipments,
    delivered,
    inTransit,
    rto,
    ndr,
    shippingCost,
    deliveryRate,
    rtoRate
  };
}

async function resyncWithShipping() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    if (!user.shiprocketEmail || !user.shiprocketPassword) {
      console.log('Shiprocket credentials not configured');
      return;
    }

    console.log('\n=== FETCHING SHIPROCKET DATA ===');
    const shiprocket = new ShiprocketService(user.shiprocketEmail, user.shiprocketPassword);
    
    // Get all metrics to determine date range
    const allMetrics = await DailyMetrics.find({ userId: user._id }).sort({ date: 1 });
    
    if (allMetrics.length === 0) {
      console.log('No metrics in database');
      return;
    }

    const startDate = new Date(allMetrics[0].date);
    const endDate = new Date(allMetrics[allMetrics.length - 1].date);
    
    console.log(`Fetching shipments from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    const shipments = await shiprocket.getShipments(startDate, endDate);
    console.log(`✓ Fetched ${shipments.length} shipments`);

    if (shipments.length === 0) {
      console.log('No shipments to sync');
      return;
    }

    // Group shipments by date
    const shipmentsByDate = groupShipmentsByDate(shipments);
    console.log(`Grouped into ${Object.keys(shipmentsByDate).length} days`);

    console.log('\n=== UPDATING DATABASE WITH SHIPPING DATA ===');
    let updated = 0;
    let notFound = 0;

    for (const [dateStr, dayShipments] of Object.entries(shipmentsByDate)) {
      try {
        const date = convertToKolkataDate(dateStr);
        const shippingMetrics = calculateShippingMetrics(dayShipments);
        
        const existing = await DailyMetrics.findOne({ userId: user._id, date: date });
        
        if (existing) {
          // Recalculate net profit with shipping cost
          const revenue = existing.revenue || 0;
          const cogs = existing.cogs || 0;
          const adSpend = existing.adSpend || 0;
          const grossProfit = revenue - cogs;
          const netProfit = grossProfit - adSpend - shippingMetrics.shippingCost;
          const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
          const poas = adSpend > 0 ? netProfit / adSpend : 0;
          
          await DailyMetrics.updateOne(
            { _id: existing._id },
            {
              $set: {
                ...shippingMetrics,
                netProfit,
                netProfitMargin,
                poas
              }
            }
          );
          
          updated++;
          console.log(`  ${dateStr}: ${shippingMetrics.totalShipments} shipments, Delivered=${shippingMetrics.delivered}, RTO=${shippingMetrics.rto}`);
        } else {
          notFound++;
        }
      } catch (error) {
        console.error(`  Error on ${dateStr}: ${error.message}`);
      }
    }

    console.log(`\n✓ Updated ${updated} records`);
    if (notFound > 0) {
      console.log(`⚠️  ${notFound} dates had shipments but no metrics record`);
    }

    // Verify
    console.log('\n=== VERIFICATION ===');
    const finalMetrics = await DailyMetrics.find({ userId: user._id });
    const withShipping = finalMetrics.filter(m => m.totalShipments > 0).length;
    console.log(`Records with shipping data: ${withShipping} / ${finalMetrics.length}`);
    
    const totalShipments = finalMetrics.reduce((sum, m) => sum + (m.totalShipments || 0), 0);
    const totalDelivered = finalMetrics.reduce((sum, m) => sum + (m.delivered || 0), 0);
    const totalRTO = finalMetrics.reduce((sum, m) => sum + (m.rto || 0), 0);
    
    console.log(`Total Shipments: ${totalShipments}`);
    console.log(`Total Delivered: ${totalDelivered}`);
    console.log(`Total RTO: ${totalRTO}`);
    console.log(`Delivery Rate: ${totalShipments > 0 ? ((totalDelivered / totalShipments) * 100).toFixed(1) : 0}%`);
    console.log(`RTO Rate: ${totalShipments > 0 ? ((totalRTO / totalShipments) * 100).toFixed(1) : 0}%`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

resyncWithShipping();
