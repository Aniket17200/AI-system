const axios = require('axios');

async function testShopifyPagination() {
  const store = 'your-store.myshopify.com';
  const accessToken = 'YOUR_SHOPIFY_ACCESS_TOKEN'; // Replace with your token
  const baseUrl = `https://${store}/admin/api/2024-01`;
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 29);

  console.log('Testing Shopify API Pagination');
  console.log('='.repeat(60));
  console.log(`Date Range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);

  let allOrders = [];
  let url = `${baseUrl}/orders.json`;
  let params = {
    status: 'any',
    created_at_min: startDate.toISOString(),
    created_at_max: endDate.toISOString(),
    limit: 250
  };
  let pageCount = 0;

  try {
    while (url) {
      pageCount++;
      console.log(`Fetching page ${pageCount}...`);
      
      const response = await axios.get(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        params: url === `${baseUrl}/orders.json` ? params : undefined
      });

      const orders = response.data.orders || [];
      allOrders = allOrders.concat(orders);
      console.log(`  Got ${orders.length} orders (Total so far: ${allOrders.length})`);

      // Check for next page
      const linkHeader = response.headers['link'];
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        if (nextMatch) {
          url = nextMatch[1];
          params = undefined;
        } else {
          url = null;
        }
      } else {
        url = null;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Total Orders Fetched: ${allOrders.length}`);
    
    // Calculate total revenue
    const totalRevenue = allOrders.reduce((sum, order) => {
      return sum + parseFloat(order.total_price || 0);
    }, 0);
    
    console.log(`Total Revenue: ₹${Math.round(totalRevenue).toLocaleString('en-IN')}`);
    console.log(`Average Order Value: ₹${Math.round(totalRevenue / allOrders.length).toLocaleString('en-IN')}`);
    
    // Group by date
    const ordersByDate = {};
    allOrders.forEach(order => {
      const date = order.created_at.split('T')[0];
      if (!ordersByDate[date]) ordersByDate[date] = [];
      ordersByDate[date].push(order);
    });
    
    console.log(`\nOrders by Date (${Object.keys(ordersByDate).length} days):`);
    Object.keys(ordersByDate).sort().slice(-5).forEach(date => {
      const dayOrders = ordersByDate[date];
      const dayRevenue = dayOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
      console.log(`  ${date}: ${dayOrders.length} orders, ₹${Math.round(dayRevenue).toLocaleString('en-IN')}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testShopifyPagination();
