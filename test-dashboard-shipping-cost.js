require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

async function testDashboardShippingCost() {
  try {
    console.log('🧪 Testing Dashboard Shipping Cost\n');
    console.log('=' .repeat(70));

    // Check database first
    await mongoose.connect(process.env.MONGODB_URI);
    const DailyMetrics = require('./models/DailyMetrics');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });

    console.log('📊 DATABASE CHECK:\n');
    const dbMetrics = await DailyMetrics.find({
      userId: user._id,
      date: {
        $gte: new Date('2025-08-26'),
        $lte: new Date('2025-09-26')
      }
    }).sort({ date: 1 });

    const totalShippingCost = dbMetrics.reduce((sum, m) => sum + (m.shippingCost || 0), 0);
    const daysWithShipping = dbMetrics.filter(m => m.shippingCost > 0).length;

    console.log(`Total days: ${dbMetrics.length}`);
    console.log(`Days with shipping cost: ${daysWithShipping}`);
    console.log(`Total shipping cost: ₹${totalShippingCost.toLocaleString('en-IN', {minimumFractionDigits: 2})}\n`);

    if (daysWithShipping > 0) {
      console.log('Sample days:');
      dbMetrics.filter(m => m.shippingCost > 0).slice(0, 3).forEach(m => {
        console.log(`  ${m.date.toISOString().split('T')[0]}: ₹${m.shippingCost.toLocaleString('en-IN', {minimumFractionDigits: 2})}`);
      });
    }

    await mongoose.connection.close();

    // Check API
    console.log('\n' + '=' .repeat(70));
    console.log('📡 API CHECK:\n');

    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;

    const apiResponse = await axios.get('http://localhost:6000/api/data/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: '2025-08-26',
        endDate: '2025-09-26'
      }
    });

    const { summary } = apiResponse.data;

    console.log('Dashboard Summary:');
    summary.forEach(item => {
      console.log(`  ${item.title}: ${item.value}`);
    });

    // Find shipping cost in summary
    const shippingCostItem = summary.find(s => s.title === 'Shipping Cost' || s.title.includes('Shipping'));
    
    console.log('\n' + '=' .repeat(70));
    console.log('📋 RESULT:\n');
    
    if (shippingCostItem) {
      console.log(`✅ Shipping Cost in API: ${shippingCostItem.value}`);
      if (shippingCostItem.value === '₹0' || shippingCostItem.value === '0') {
        console.log('❌ PROBLEM: Showing 0 even though database has data!');
      } else {
        console.log('✅ Shipping Cost is showing correctly!');
      }
    } else {
      console.log('❌ Shipping Cost not found in summary!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testDashboardShippingCost();
