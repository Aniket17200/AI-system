const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
const ProductCost = require('./models/ProductCost');
require('dotenv').config();

async function checkAllData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('\n=== USER INFO ===');
    console.log(`User ID: ${user._id}`);
    console.log(`Email: ${user.email}`);

    // Check DailyMetrics
    const metrics = await DailyMetrics.find({ userId: user._id }).sort({ date: 1 });
    console.log(`\n=== DAILY METRICS (${metrics.length} records) ===`);
    
    if (metrics.length > 0) {
      const sample = metrics[metrics.length - 1]; // Last record
      console.log('\nSample record (latest):');
      console.log(`Date: ${sample.date.toISOString().split('T')[0]}`);
      console.log(`Orders: ${sample.totalOrders}`);
      console.log(`Revenue: ₹${sample.revenue}`);
      console.log(`COGS: ₹${sample.cogs}`);
      console.log(`Ad Spend: ₹${sample.adSpend}`);
      console.log(`Shipping Cost: ₹${sample.shippingCost}`);
      console.log(`\nCustomer Data:`);
      console.log(`  New Customers: ${sample.newCustomers}`);
      console.log(`  Returning Customers: ${sample.returningCustomers}`);
      console.log(`  Total Customers: ${sample.totalCustomers}`);
      console.log(`\nMarketing Data:`);
      console.log(`  ROAS: ${sample.roas}`);
      console.log(`  POAS: ${sample.poas}`);
      console.log(`  Reach: ${sample.reach}`);
      console.log(`  Impressions: ${sample.impressions}`);
      console.log(`  Link Clicks: ${sample.linkClicks}`);
      console.log(`  CPC: ${sample.cpc}`);
      console.log(`  CTR: ${sample.ctr}`);
      console.log(`  CPM: ${sample.cpm}`);
      console.log(`\nShipping Data:`);
      console.log(`  Total Shipments: ${sample.totalShipments}`);
      console.log(`  Delivered: ${sample.delivered}`);
      console.log(`  In Transit: ${sample.inTransit}`);
      console.log(`  RTO: ${sample.rto}`);
      console.log(`  NDR: ${sample.ndr}`);
      console.log(`  Delivery Rate: ${sample.deliveryRate}%`);
      console.log(`  RTO Rate: ${sample.rtoRate}%`);
    }

    // Check ProductCost
    const products = await ProductCost.find({ userId: user._id });
    console.log(`\n=== PRODUCT COSTS (${products.length} products) ===`);
    if (products.length > 0) {
      console.log('\nSample products (first 5):');
      products.slice(0, 5).forEach(p => {
        console.log(`  ${p.productName}: ₹${p.cost} (ID: ${p.shopifyProductId})`);
      });
    }

    // Check what data is missing
    console.log('\n=== DATA AVAILABILITY CHECK ===');
    const totals = metrics.reduce((acc, m) => ({
      ordersWithCustomerData: acc.ordersWithCustomerData + (m.newCustomers > 0 || m.returningCustomers > 0 ? 1 : 0),
      ordersWithMarketingData: acc.ordersWithMarketingData + (m.reach > 0 || m.impressions > 0 ? 1 : 0),
      ordersWithShippingData: acc.ordersWithShippingData + (m.totalShipments > 0 ? 1 : 0)
    }), { ordersWithCustomerData: 0, ordersWithMarketingData: 0, ordersWithShippingData: 0 });

    console.log(`Records with customer data: ${totals.ordersWithCustomerData} / ${metrics.length}`);
    console.log(`Records with marketing data: ${totals.ordersWithMarketingData} / ${metrics.length}`);
    console.log(`Records with shipping data: ${totals.ordersWithShippingData} / ${metrics.length}`);

    if (totals.ordersWithCustomerData === 0) {
      console.log('\n⚠️  WARNING: No customer data found!');
    }
    if (totals.ordersWithMarketingData === 0) {
      console.log('⚠️  WARNING: No marketing data found!');
    }
    if (totals.ordersWithShippingData === 0) {
      console.log('⚠️  WARNING: No shipping data found!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllData();
