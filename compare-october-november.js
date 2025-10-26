require('dotenv').config();
const axios = require('axios');

async function compareOctoberNovember() {
  try {
    console.log('📊 Comparing October 2025 vs November 2025\n');
    console.log('=' .repeat(70));

    // Login
    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.userId || '68c812b0afc4892c1f8128e3';

    // Get October data (current month)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth(), 1); // First day of October

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    console.log('Fetching October 2025 data...');
    const octoberRes = await axios.get('http://localhost:6000/api/data/dashboard', {
      params: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        userId
      },
      headers: { Authorization: `Bearer ${token}` }
    });

    const octoberRevenue = parseFloat(octoberRes.data.summary?.find(s => s.title === 'Revenue')?.value?.replace(/[^0-9.]/g, '') || 0);
    const octoberOrders = parseInt(octoberRes.data.summary?.find(s => s.title === 'Total Orders')?.value || 0);
    const octoberProfit = parseFloat(octoberRes.data.financialsBreakdownData?.pieData?.find(p => p.name === 'Net Profit')?.value || 0);

    console.log('\nOCTOBER 2025 (Actual - Month to Date):');
    console.log('=' .repeat(70));
    console.log(`Revenue: ₹${octoberRevenue.toLocaleString('en-IN')}`);
    console.log(`Orders: ${octoberOrders}`);
    console.log(`Profit: ₹${octoberProfit.toLocaleString('en-IN')}`);

    // Get November predictions
    console.log('\nFetching November 2025 predictions...');
    const novemberRes = await axios.get('http://localhost:6000/api/data/predictions-3month', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const november = novemberRes.data.predictions.monthly[0];

    console.log('\nNOVEMBER 2025 (Predicted - Full Month):');
    console.log('=' .repeat(70));
    console.log(`Revenue: ₹${november.revenue.toLocaleString('en-IN')}`);
    console.log(`Orders: ${november.orders}`);
    console.log(`Profit: ₹${november.profit.toLocaleString('en-IN')}`);

    // Calculate October full month projection (since we only have partial data)
    const daysInOctober = 31;
    const daysPassed = endDate.getDate();
    const octoberFullMonthRevenue = (octoberRevenue / daysPassed) * daysInOctober;
    const octoberFullMonthOrders = Math.round((octoberOrders / daysPassed) * daysInOctober);
    const octoberFullMonthProfit = (octoberProfit / daysPassed) * daysInOctober;

    console.log('\nOCTOBER 2025 (Projected Full Month):');
    console.log('=' .repeat(70));
    console.log(`Revenue: ₹${octoberFullMonthRevenue.toLocaleString('en-IN')}`);
    console.log(`Orders: ${octoberFullMonthOrders}`);
    console.log(`Profit: ₹${octoberFullMonthProfit.toLocaleString('en-IN')}`);

    console.log('\nCOMPARISON (November vs October Full Month):');
    console.log('=' .repeat(70));
    
    const revenueGrowth = ((november.revenue - octoberFullMonthRevenue) / octoberFullMonthRevenue * 100);
    const ordersGrowth = ((november.orders - octoberFullMonthOrders) / octoberFullMonthOrders * 100);
    const profitGrowth = ((november.profit - octoberFullMonthProfit) / octoberFullMonthProfit * 100);

    console.log(`Revenue Growth: ${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`);
    console.log(`Orders Growth: ${ordersGrowth > 0 ? '+' : ''}${ordersGrowth.toFixed(1)}%`);
    console.log(`Profit Growth: ${profitGrowth > 0 ? '+' : ''}${profitGrowth.toFixed(1)}%`);

    if (november.revenue < octoberFullMonthRevenue) {
      console.log('\n❌ ISSUE: November revenue is LESS than October!');
      console.log('November should be greater to show growth.');
    } else {
      console.log('\n✅ November predictions show growth over October');
    }

    console.log('\n' + '=' .repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

compareOctoberNovember();
