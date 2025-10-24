const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Your Shopify credentials
const USER_DATA = {
  email: 'test@e23104-8c.myshopify.com',
  shopifyStore: 'e23104-8c.myshopify.com',
  shopifyAccessToken: 'YOUR_SHOPIFY_ACCESS_TOKEN',
  isActive: true
};

async function sync3MonthsData() {
  try {
    console.log('🚀 Starting 3-Month Data Sync\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Calculate date range (last 3 months)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    console.log('📅 Date Range:');
    console.log('   Start Date:', startDate.toISOString().split('T')[0]);
    console.log('   End Date:', endDate.toISOString().split('T')[0]);
    console.log('   Duration: 3 months (~90 days)\n');

    // Step 1: Check if user exists or create new one
    console.log('👤 Step 1: Setting up user...');
    let userId;
    
    try {
      // Try to get existing users
      const usersResponse = await axios.get(`${API_BASE}/users`);
      const existingUser = usersResponse.data.data.find(u => u.email === USER_DATA.email);
      
      if (existingUser) {
        userId = existingUser._id;
        console.log('✅ Found existing user');
        console.log('   User ID:', userId);
        console.log('   Email:', existingUser.email);
      } else {
        // Create new user
        const userResponse = await axios.post(`${API_BASE}/users`, USER_DATA);
        userId = userResponse.data.data._id;
        console.log('✅ Created new user');
        console.log('   User ID:', userId);
        console.log('   Email:', userResponse.data.data.email);
      }
    } catch (error) {
      console.log('⚠️  Could not check existing users, creating new one...');
      const userResponse = await axios.post(`${API_BASE}/users`, USER_DATA);
      userId = userResponse.data.data._id;
      console.log('✅ User created');
      console.log('   User ID:', userId);
    }
    console.log('');

    // Step 2: Fetch and add product costs
    console.log('💰 Step 2: Syncing product costs...');
    try {
      const productsResponse = await axios.get(
        `https://${USER_DATA.shopifyStore}/admin/api/2024-01/products.json?limit=250`,
        {
          headers: {
            'X-Shopify-Access-Token': USER_DATA.shopifyAccessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`   Found ${productsResponse.data.products.length} products`);
      
      let addedCount = 0;
      for (const product of productsResponse.data.products) {
        const variant = product.variants[0];
        const estimatedCost = parseFloat(variant.price) * 0.4; // 40% of price

        try {
          await axios.post(`${API_BASE}/product-costs`, {
            userId,
            shopifyProductId: product.id.toString(),
            productName: product.title,
            cost: estimatedCost
          });
          addedCount++;
        } catch (error) {
          // Product cost might already exist, skip
        }
      }
      
      console.log(`✅ Added/updated ${addedCount} product costs`);
    } catch (error) {
      console.log('   ⚠️  Could not sync product costs:', error.message);
    }
    console.log('');

    // Step 3: Sync 3 months of data
    console.log('🔄 Step 3: Syncing 3 months of data...');
    console.log('   This may take a few minutes...\n');

    const syncStartTime = Date.now();
    
    const syncResponse = await axios.post(`${API_BASE}/sync/manual`, {
      userId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });

    const syncDuration = ((Date.now() - syncStartTime) / 1000).toFixed(2);

    console.log('✅ Sync completed!');
    console.log('   Duration:', syncDuration, 'seconds');
    console.log('   Records synced:', syncResponse.data.data.recordsSynced);
    console.log('   Errors:', syncResponse.data.data.errors.length);
    
    if (syncResponse.data.data.errors.length > 0) {
      console.log('\n   ⚠️  Errors encountered:');
      syncResponse.data.data.errors.forEach(err => {
        console.log('      -', err);
      });
    }
    console.log('');

    // Step 4: Verify data in database
    console.log('🔍 Step 4: Verifying stored data...');
    
    const metricsResponse = await axios.get(
      `${API_BASE}/metrics?userId=${userId}&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
    );

    console.log('✅ Data verification:');
    console.log('   Total days with data:', metricsResponse.data.count);
    console.log('   Date range:', metricsResponse.data.data[0]?.date.split('T')[0], 'to', metricsResponse.data.data[metricsResponse.data.count - 1]?.date.split('T')[0]);
    console.log('');

    // Step 5: Show 3-month summary
    console.log('📊 Step 5: 3-Month Summary...');
    
    const summaryResponse = await axios.get(`${API_BASE}/metrics/summary/${userId}?days=90`);
    const metrics = summaryResponse.data.data;

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('   📈 3-MONTH PERFORMANCE SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('   💰 REVENUE & PROFIT');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Total Orders:', metrics.totalOrders);
    console.log('   Revenue: ₹', metrics.revenue.toLocaleString('en-IN', {minimumFractionDigits: 2}));
    console.log('   COGS: ₹', metrics.cogs.toLocaleString('en-IN', {minimumFractionDigits: 2}));
    console.log('   Gross Profit: ₹', metrics.grossProfit.toLocaleString('en-IN', {minimumFractionDigits: 2}), `(${metrics.grossProfitMargin.toFixed(2)}%)`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Ad Spend: ₹', metrics.adSpend.toLocaleString('en-IN', {minimumFractionDigits: 2}));
    console.log('   Shipping: ₹', metrics.shippingCost.toLocaleString('en-IN', {minimumFractionDigits: 2}));
    console.log('   Net Profit: ₹', metrics.netProfit.toLocaleString('en-IN', {minimumFractionDigits: 2}), `(${metrics.netProfitMargin.toFixed(2)}%)`);
    console.log('');
    console.log('   📈 MARKETING METRICS');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   ROAS:', metrics.roas.toFixed(2) + 'x');
    console.log('   POAS:', metrics.poas.toFixed(2) + 'x');
    console.log('   AOV: ₹', metrics.aov.toLocaleString('en-IN', {minimumFractionDigits: 2}));
    console.log('');
    console.log('   👥 CUSTOMER METRICS');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Total Customers:', metrics.totalCustomers);
    console.log('   New Customers:', metrics.newCustomers);
    console.log('   Returning Customers:', metrics.returningCustomers);
    console.log('   Returning Rate:', metrics.returningRate ? metrics.returningRate.toFixed(2) + '%' : '0%');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    // Step 6: Show monthly breakdown
    console.log('📅 Step 6: Monthly Breakdown...\n');
    
    const dailyMetrics = summaryResponse.data.dailyMetrics;
    
    // Group by month
    const monthlyData = {};
    dailyMetrics.forEach(day => {
      const month = day.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = {
          orders: 0,
          revenue: 0,
          netProfit: 0
        };
      }
      monthlyData[month].orders += day.totalOrders;
      monthlyData[month].revenue += day.revenue;
      monthlyData[month].netProfit += day.netProfit;
    });

    console.log('   Month      | Orders | Revenue      | Net Profit   | Margin');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    Object.entries(monthlyData).sort().forEach(([month, data]) => {
      const margin = data.revenue > 0 ? (data.netProfit / data.revenue * 100).toFixed(1) : 0;
      console.log(
        `   ${month}   | ${String(data.orders).padStart(6)} | ₹${String(data.revenue.toFixed(0)).padStart(11)} | ₹${String(data.netProfit.toFixed(0)).padStart(11)} | ${String(margin).padStart(5)}%`
      );
    });
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Final summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('   🎉 3-MONTH DATA SYNC COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('   ✅ User ID:', userId);
    console.log('   ✅ Days synced:', metricsResponse.data.count);
    console.log('   ✅ Total orders:', metrics.totalOrders);
    console.log('   ✅ Total revenue: ₹', metrics.revenue.toLocaleString('en-IN'));
    console.log('   ✅ Net profit: ₹', metrics.netProfit.toLocaleString('en-IN'));
    console.log('');
    console.log('   🔄 Automatic sync will continue every hour');
    console.log('   📊 Data is ready for dashboard integration');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('\n   Details:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('\n💡 Make sure the server is running: npm run dev');
  }
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get('http://localhost:5000/');
    return true;
  } catch (error) {
    console.error('❌ Server is not running!');
    console.error('');
    console.error('Please start the server first:');
    console.error('   npm run dev');
    console.error('');
    console.error('Then run this script again:');
    console.error('   npm run sync:3months');
    console.error('');
    return false;
  }
}

// Run the sync
(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await sync3MonthsData();
  }
})();
