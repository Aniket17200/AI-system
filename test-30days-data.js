const axios = require('axios');

async function test30DaysData() {
  const userId = '68c812b0afc4892c1f8128e3';
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0];

  console.log('Testing Last 30 Days Data');
  console.log('='.repeat(60));
  console.log(`Date Range: ${startDate} to ${endDate}\n`);

  try {
    const response = await axios.get('http://localhost:6000/api/data/dashboard', {
      params: { userId, startDate, endDate }
    });

    const summary = response.data.summary;
    
    console.log('Summary Metrics:');
    console.log('-'.repeat(60));
    summary.forEach(item => {
      console.log(`${item.title.padEnd(25)} ${item.value}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\nExpected vs Actual:');
    console.log('-'.repeat(60));
    console.log('Expected Orders:  ~481');
    console.log('Expected Revenue: ~₹8,28,131');
    console.log('Expected ROAS:    ~22.67');
    console.log('Expected POAS:    ~12.51');
    console.log('Expected AOV:     ~₹1,722');

    const actualOrders = summary.find(s => s.title === 'Total Orders')?.value;
    const actualRevenue = summary.find(s => s.title === 'Revenue')?.value;
    const actualROAS = summary.find(s => s.title === 'ROAS')?.value;
    const actualPOAS = summary.find(s => s.title === 'POAS')?.value;
    const actualAOV = summary.find(s => s.title === 'Avg Order Value')?.value;

    console.log('\nActual Orders:   ', actualOrders);
    console.log('Actual Revenue:  ', actualRevenue);
    console.log('Actual ROAS:     ', actualROAS);
    console.log('Actual POAS:     ', actualPOAS);
    console.log('Actual AOV:      ', actualAOV);

    // Check if values match
    const ordersMatch = actualOrders === '481';
    const revenueMatch = actualRevenue === '₹8,28,131';

    console.log('\n' + '='.repeat(60));
    if (ordersMatch && revenueMatch) {
      console.log('✅ Data is CORRECT!');
    } else {
      console.log('❌ Data is INCORRECT!');
      console.log('\nThis means the frontend might be:');
      console.log('1. Caching old data');
      console.log('2. Not sending correct date parameters');
      console.log('3. Displaying data from a different source');
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Response:', error.response.data);
    }
  }
}

test30DaysData();
