const axios = require('axios');

// Your Shopify credentials
const SHOPIFY_STORE = 'e23104-8c.myshopify.com';
const SHOPIFY_TOKEN = 'YOUR_SHOPIFY_ACCESS_TOKEN';
const API_VERSION = '2024-01';

async function testShopifyAPI() {
  console.log('🛍️  Testing Shopify API Connection\n');
  console.log('Store:', SHOPIFY_STORE);
  console.log('API Version:', API_VERSION);
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Test 1: Get Orders
    console.log('📦 Test 1: Fetching Orders...');
    const ordersResponse = await axios.get(
      `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/orders.json?limit=10&status=any`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Found ${ordersResponse.data.orders.length} orders\n`);
    
    if (ordersResponse.data.orders.length > 0) {
      console.log('Sample Orders:');
      ordersResponse.data.orders.slice(0, 3).forEach((order, i) => {
        console.log(`\n${i + 1}. Order #${order.order_number || order.id}`);
        console.log(`   Date: ${order.created_at}`);
        console.log(`   Total: ${order.currency} ${order.total_price}`);
        console.log(`   Items: ${order.line_items.length}`);
        console.log(`   Customer: ${order.customer?.email || 'Guest'}`);
        
        if (order.line_items.length > 0) {
          console.log('   Products:');
          order.line_items.forEach(item => {
            console.log(`     - ${item.name} (Qty: ${item.quantity}, Price: ${item.price})`);
          });
        }
      });
    } else {
      console.log('⚠️  No orders found. This might be a test store.');
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Test 2: Get Products
    console.log('🏷️  Test 2: Fetching Products...');
    const productsResponse = await axios.get(
      `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/products.json?limit=10`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Found ${productsResponse.data.products.length} products\n`);
    
    if (productsResponse.data.products.length > 0) {
      console.log('Sample Products:');
      productsResponse.data.products.slice(0, 3).forEach((product, i) => {
        console.log(`\n${i + 1}. ${product.title}`);
        console.log(`   Product ID: ${product.id}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Variants: ${product.variants.length}`);
        
        if (product.variants.length > 0) {
          const variant = product.variants[0];
          console.log(`   Price: ${variant.price}`);
          console.log(`   SKU: ${variant.sku || 'N/A'}`);
          console.log(`   Inventory: ${variant.inventory_quantity || 0}`);
        }
      });
    } else {
      console.log('⚠️  No products found. Add products to your store first.');
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Test 3: Get Customers
    console.log('👥 Test 3: Fetching Customers...');
    const customersResponse = await axios.get(
      `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/customers.json?limit=10`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Found ${customersResponse.data.customers.length} customers\n`);
    
    if (customersResponse.data.customers.length > 0) {
      console.log('Sample Customers:');
      customersResponse.data.customers.slice(0, 3).forEach((customer, i) => {
        console.log(`\n${i + 1}. ${customer.first_name} ${customer.last_name}`);
        console.log(`   Email: ${customer.email}`);
        console.log(`   Orders: ${customer.orders_count}`);
        console.log(`   Total Spent: ${customer.currency || 'INR'} ${customer.total_spent}`);
        console.log(`   Created: ${customer.created_at}`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Summary
    console.log('📊 API Connection Summary:');
    console.log(`   ✅ Orders API: Working (${ordersResponse.data.orders.length} orders)`);
    console.log(`   ✅ Products API: Working (${productsResponse.data.products.length} products)`);
    console.log(`   ✅ Customers API: Working (${customersResponse.data.customers.length} customers)`);
    console.log('\n🎉 All Shopify API tests passed!\n');

    // Data format example
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 Sample Data Format for Database Storage:\n');
    
    if (ordersResponse.data.orders.length > 0) {
      const order = ordersResponse.data.orders[0];
      console.log('Order Data Structure:');
      console.log(JSON.stringify({
        orderId: order.id,
        orderNumber: order.order_number,
        createdAt: order.created_at,
        totalPrice: parseFloat(order.total_price),
        currency: order.currency,
        customerId: order.customer?.id,
        customerEmail: order.customer?.email,
        lineItems: order.line_items.map(item => ({
          productId: item.product_id,
          variantId: item.variant_id,
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price)
        })),
        financialStatus: order.financial_status,
        fulfillmentStatus: order.fulfillment_status
      }, null, 2));
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Shopify API Error:');
    console.error('   Status:', error.response?.status);
    console.error('   Message:', error.response?.data?.errors || error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if your access token is valid');
    console.error('   2. Verify the store URL is correct');
    console.error('   3. Ensure the token has required permissions');
    console.error('   4. Check if the API version is supported\n');
  }
}

testShopifyAPI();
