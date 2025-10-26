const axios = require('axios');

const userId = '68c812b0afc4892c1f8128e3';
const startDate = '2025-07-27';
const endDate = '2025-10-25';
const baseURL = 'http://localhost:6000/api/data';

async function testEndpoint(name, url, params) {
  try {
    console.log(`\n=== TESTING ${name} ===`);
    const response = await axios.get(url, { params });
    console.log(`✓ Status: ${response.status}`);
    console.log(`✓ Data keys: ${Object.keys(response.data).join(', ')}`);
    return response.data;
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Data: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

async function testAllEndpoints() {
  console.log('Testing all API endpoints...\n');
  console.log(`Base URL: ${baseURL}`);
  console.log(`User ID: ${userId}`);
  console.log(`Date Range: ${startDate} to ${endDate}`);

  // Test Dashboard
  const dashboard = await testEndpoint(
    'DASHBOARD',
    `${baseURL}/dashboard`,
    { startDate, endDate, userId }
  );
  if (dashboard) {
    console.log(`  Summary items: ${dashboard.summary?.length || 0}`);
    console.log(`  Performance data points: ${dashboard.performanceChartData?.length || 0}`);
  }

  // Test Marketing
  const marketing = await testEndpoint(
    'MARKETING',
    `${baseURL}/marketingData`,
    { startDate, endDate, userId }
  );
  if (marketing) {
    console.log(`  Summary items: ${marketing.summary?.length || 0}`);
    console.log(`  Spend chart points: ${marketing.spendChartData?.length || 0}`);
    if (marketing.summary && marketing.summary.length > 0) {
      marketing.summary.forEach(([key, value]) => {
        console.log(`    ${key}: ${value}`);
      });
    }
  }

  // Test Analytics (Customer Analysis)
  const analytics = await testEndpoint(
    'ANALYTICS (Customer Analysis)',
    `${baseURL}/analytics`,
    { startDate, endDate, userId }
  );
  if (analytics) {
    console.log(`  Total Customers: ${analytics.summary?.customer?.total || 0}`);
    console.log(`  New Customers: ${analytics.summary?.customer?.new || 0}`);
    console.log(`  Returning Customers: ${analytics.summary?.customer?.returning || 0}`);
  }

  // Test Shipping
  const shipping = await testEndpoint(
    'SHIPPING',
    `${baseURL}/shipping`,
    { startDate, endDate, userId }
  );
  if (shipping) {
    console.log(`  Summary items: ${shipping.summary?.length || 0}`);
    console.log(`  Chart data points: ${shipping.chartData?.length || 0}`);
    if (shipping.totals) {
      console.log(`  Total Shipments: ${shipping.totals.totalShipments}`);
      console.log(`  Delivered: ${shipping.totals.delivered}`);
      console.log(`  RTO: ${shipping.totals.rto}`);
      console.log(`  Delivery Rate: ${shipping.totals.deliveryRate}%`);
    }
  }

  // Test Products
  const products = await testEndpoint(
    'PRODUCTS',
    `${baseURL}/products`,
    { startDate, endDate, userId }
  );
  if (products) {
    console.log(`  Total Products: ${products.summary?.totalProducts || 0}`);
    console.log(`  Best Selling: ${products.bestSelling?.length || 0} items`);
    console.log(`  Least Selling: ${products.leastSelling?.length || 0} items`);
    if (products.bestSelling && products.bestSelling.length > 0) {
      console.log(`  Sample product: ${products.bestSelling[0].name} - ₹${products.bestSelling[0].cost}`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Dashboard: ${dashboard ? '✓' : '✗'}`);
  console.log(`Marketing: ${marketing ? '✓' : '✗'}`);
  console.log(`Analytics: ${analytics ? '✓' : '✗'}`);
  console.log(`Shipping: ${shipping ? '✓' : '✗'}`);
  console.log(`Products: ${products ? '✓' : '✗'}`);
}

testAllEndpoints();
