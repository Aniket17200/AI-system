const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Your actual credentials
const USER_DATA = {
  email: 'test@e23104-8c.myshopify.com',
  shopifyStore: 'e23104-8c.myshopify.com',
  shopifyAccessToken: 'YOUR_SHOPIFY_ACCESS_TOKEN',
  isActive: true
};

async function testCompleteFlow() {
  try {
    console.log('🚀 Starting Complete Flow Test\n');

    // Step 1: Create User
    console.log('📝 Step 1: Creating user with Shopify credentials...');
    const userResponse = await axios.post(`${API_BASE}/users`, USER_DATA);
    const userId = userResponse.data.data._id;
    console.log('✅ User created successfully!');
    console.log('   User ID:', userId);
    console.log('   Email:', userResponse.data.data.email);
    console.log('   Store:', userResponse.data.data.shopifyStore);
    console.log('');

    // Step 2: Test Shopify API directly
    console.log('🛍️  Step 2: Testing Shopify API connection...');
    try {
      const shopifyTest = await axios.get(
        `https://${USER_DATA.shopifyStore}/admin/api/2024-01/orders.json?limit=5`,
        {
          headers: {
            'X-Shopify-Access-Token': USER_DATA.shopifyAccessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Shopify API connected successfully!');
      console.log(`   Found ${shopifyTest.data.orders.length} orders`);
      if (shopifyTest.data.orders.length > 0) {
        const order = shopifyTest.data.orders[0];
        console.log('   Sample Order:');
        console.log('     - Order ID:', order.id);
        console.log('     - Total:', order.total_price, order.currency);
        console.log('     - Date:', order.created_at);
        console.log('     - Items:', order.line_items.length);
      }
    } catch (error) {
      console.log('⚠️  Shopify API test failed:', error.response?.data || error.message);
    }
    console.log('');

    // Step 3: Add sample product costs
    console.log('💰 Step 3: Adding product costs...');
    try {
      const productsResponse = await axios.get(
        `https://${USER_DATA.shopifyStore}/admin/api/2024-01/products.json?limit=5`,
        {
          headers: {
            'X-Shopify-Access-Token': USER_DATA.shopifyAccessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      if (productsResponse.data.products.length > 0) {
        for (const product of productsResponse.data.products.slice(0, 3)) {
          const variant = product.variants[0];
          const estimatedCost = parseFloat(variant.price) * 0.4; // 40% of price

          await axios.post(`${API_BASE}/product-costs`, {
            userId,
            shopifyProductId: product.id.toString(),
            productName: product.title,
            cost: estimatedCost
          });

          console.log(`   ✅ Added: ${product.title} - Cost: ₹${estimatedCost}`);
        }
      }
    } catch (error) {
      console.log('   ⚠️  Could not add product costs:', error.message);
    }
    console.log('');

    // Step 4: Manual Sync
    console.log('🔄 Step 4: Syncing data (last 30 days)...');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const syncResponse = await axios.post(`${API_BASE}/sync/manual`, {
      userId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });

    console.log('✅ Sync completed!');
    console.log('   Records synced:', syncResponse.data.data.recordsSynced);
    console.log('   Errors:', syncResponse.data.data.errors.length);
    if (syncResponse.data.data.errors.length > 0) {
      console.log('   Error details:', syncResponse.data.data.errors);
    }
    console.log('');

    // Step 5: Get Metrics Summary
    console.log('📊 Step 5: Fetching metrics summary...');
    const summaryResponse = await axios.get(`${API_BASE}/metrics/summary/${userId}?days=30`);
    const metrics = summaryResponse.data.data;

    console.log('✅ Metrics Summary (Last 30 Days):');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   📦 Orders:', metrics.totalOrders);
    console.log('   💰 Revenue: ₹', metrics.revenue.toFixed(2));
    console.log('   📉 COGS: ₹', metrics.cogs.toFixed(2));
    console.log('   💵 Gross Profit: ₹', metrics.grossProfit.toFixed(2), `(${metrics.grossProfitMargin.toFixed(2)}%)`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   📢 Ad Spend: ₹', metrics.adSpend.toFixed(2));
    console.log('   🚚 Shipping: ₹', metrics.shippingCost.toFixed(2));
    console.log('   💎 Net Profit: ₹', metrics.netProfit.toFixed(2), `(${metrics.netProfitMargin.toFixed(2)}%)`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   📈 ROAS:', metrics.roas.toFixed(2) + 'x');
    console.log('   💹 POAS:', metrics.poas.toFixed(2) + 'x');
    console.log('   🛒 AOV: ₹', metrics.aov.toFixed(2));
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   👥 Total Customers:', metrics.totalCustomers);
    console.log('   🆕 New Customers:', metrics.newCustomers);
    console.log('   🔄 Returning:', metrics.returningCustomers);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Step 6: Get Daily Breakdown (last 7 days)
    console.log('📅 Step 6: Fetching daily breakdown (last 7 days)...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyResponse = await axios.get(
      `${API_BASE}/metrics?userId=${userId}&startDate=${sevenDaysAgo.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
    );

    console.log('✅ Daily Metrics:');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Date       | Orders | Revenue  | Net Profit | Margin | ROAS');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    dailyResponse.data.data.forEach(day => {
      const date = new Date(day.date).toISOString().split('T')[0];
      console.log(
        `   ${date} | ${String(day.totalOrders).padStart(6)} | ₹${String(day.revenue.toFixed(0)).padStart(7)} | ₹${String(day.netProfit.toFixed(0)).padStart(9)} | ${String(day.netProfitMargin.toFixed(1)).padStart(5)}% | ${day.roas.toFixed(2)}x`
      );
    });
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Step 7: Check Sync Jobs
    console.log('🔍 Step 7: Checking sync job history...');
    const jobsResponse = await axios.get(`${API_BASE}/sync/jobs/${userId}`);
    console.log(`✅ Found ${jobsResponse.data.data.length} sync jobs`);
    if (jobsResponse.data.data.length > 0) {
      const lastJob = jobsResponse.data.data[0];
      console.log('   Last Job:');
      console.log('     - Status:', lastJob.status);
      console.log('     - Records:', lastJob.recordsSynced);
      console.log('     - Started:', new Date(lastJob.startedAt).toLocaleString());
      console.log('     - Completed:', new Date(lastJob.completedAt).toLocaleString());
    }
    console.log('');

    console.log('🎉 Complete Flow Test Finished Successfully!');
    console.log('');
    console.log('📝 Your User ID:', userId);
    console.log('💡 Use this ID for future API calls');
    console.log('');
    console.log('🔄 Automatic sync will run every hour for this user');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
console.log('═══════════════════════════════════════════════════════════════');
console.log('   PROFITFIRST API - COMPLETE FLOW TEST');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

testCompleteFlow();
