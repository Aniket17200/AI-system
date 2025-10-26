require('dotenv').config();
const mongoose = require('mongoose');
const DailyMetrics = require('./models/DailyMetrics');

async function addPlaceholderDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const userId = '6882270af4c676a67f2fb70d';
    
    console.log('=== Adding Placeholder Entries for Recent Dates ===\n');
    
    // Add entries for last 7 days
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }
    
    let added = 0;
    let existing = 0;
    
    for (const date of dates) {
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if entry already exists
      const existingEntry = await DailyMetrics.findOne({
        userId,
        date: {
          $gte: new Date(dateStr + 'T00:00:00.000Z'),
          $lte: new Date(dateStr + 'T23:59:59.999Z')
        }
      });
      
      if (existingEntry) {
        console.log(`✓ ${dateStr}: Already exists`);
        existing++;
      } else {
        // Create placeholder entry with zeros
        await DailyMetrics.create({
          userId,
          date,
          revenue: 0,
          totalOrders: 0,
          adSpend: 0,
          cogs: 0,
          grossProfit: 0,
          grossProfitMargin: 0,
          netProfit: 0,
          netProfitMargin: 0,
          roas: 0,
          poas: 0,
          aov: 0,
          cpp: 0,
          cpc: 0,
          ctr: 0,
          cpm: 0,
          reach: 0,
          impressions: 0,
          linkClicks: 0,
          newCustomers: 0,
          returningCustomers: 0,
          totalCustomers: 0,
          returningRate: 0,
          totalShipments: 0,
          delivered: 0,
          inTransit: 0,
          rto: 0,
          ndr: 0,
          deliveryRate: 0,
          rtoRate: 0,
          shippingCost: 0,
          campaigns: []
        });
        
        console.log(`✓ ${dateStr}: Created placeholder entry`);
        added++;
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Added: ${added} new entries`);
    console.log(`Existing: ${existing} entries`);
    
    // Verify
    console.log(`\n=== Verification ===`);
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const entry = await DailyMetrics.findOne({
        userId,
        date: {
          $gte: new Date(dateStr + 'T00:00:00.000Z'),
          $lte: new Date(dateStr + 'T23:59:59.999Z')
        }
      });
      
      if (entry) {
        console.log(`✓ ${dateStr}: Rev=₹${entry.revenue}, Orders=${entry.totalOrders}, AdSpend=₹${entry.adSpend}`);
      }
    }

    await mongoose.connection.close();
    console.log('\n✓ Done! Frontend will now load data for recent dates.');
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

addPlaceholderDates();
