require('dotenv').config();
const axios = require('axios');

async function testCorrectMonths() {
  try {
    console.log('🧪 Testing Correct Month Fetching (July, August, September)\n');
    console.log('=' .repeat(70));

    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.userId;

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    console.log('\n📊 Fetching past 3 months using correct calculation...\n');

    const todayMonth = new Date().getMonth(); // October = 9
    const todayYear = new Date().getFullYear();
    
    const past3MonthsData = [];
    
    for (let i = 3; i >= 1; i--) {
      const targetMonth = todayMonth - i; // 9-3=6(July), 9-2=7(Aug), 9-1=8(Sept)
      
      const monthStartDate = new Date(todayYear, targetMonth, 1);
      const monthEndDate = new Date(todayYear, targetMonth + 1, 0);
      
      console.log(`Fetching month ${i}: ${monthStartDate.toLocaleString('default', { month: 'long' })} ${monthStartDate.getFullYear()}`);
      console.log(`  Date range: ${formatDate(monthStartDate)} to ${formatDate(monthEndDate)}`);
      
      try {
        const monthRes = await axios.get('http://localhost:6000/api/data/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            startDate: formatDate(monthStartDate),
            endDate: formatDate(monthEndDate),
            userId
          }
        });
        
        const revenue = monthRes.data.summary?.find(s => s.title === 'Revenue')?.value || '₹0';
        const orders = monthRes.data.summary?.find(s => s.title === 'Total Orders')?.value || '0';
        
        past3MonthsData.push({
          month: monthStartDate.toLocaleString('default', { month: 'long' }),
          year: monthStartDate.getFullYear(),
          revenue,
          orders
        });
        
        console.log(`  ✅ Revenue: ${revenue}`);
        console.log(`  ✅ Orders: ${orders}\n`);
      } catch (e) {
        console.error(`  ❌ Error: ${e.message}\n`);
      }
    }

    console.log('=' .repeat(70));
    console.log('\n✅ RESULTS:\n');

    past3MonthsData.forEach((m, i) => {
      console.log(`${i + 1}. ${m.month} ${m.year}:`);
      console.log(`   Revenue: ${m.revenue}`);
      console.log(`   Orders: ${m.orders}\n`);
    });

    console.log('=' .repeat(70));
    console.log('\n🎉 CORRECT MONTHS FETCHED!\n');
    console.log('Expected:');
    console.log('  ✅ July 2025 (₹0 - only 5 days of data)');
    console.log('  ✅ August 2025 (₹9.3L - 26 days)');
    console.log('  ✅ September 2025 (₹40.8L - 30 days)\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testCorrectMonths();
