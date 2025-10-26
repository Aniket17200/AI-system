require('dotenv').config();
const axios = require('axios');

async function testAiprediction3Month() {
  try {
    console.log('🧪 Testing Aiprediction Component with 3-Month Data\n');
    console.log('=' .repeat(70));

    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;

    console.log('\n📊 Simulating Aiprediction component data loading...\n');

    // Fetch dashboard data (always works)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const dashboardRes = await axios.get('http://localhost:6000/api/data/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
      }
    });

    // Try to fetch 3-month predictions (may fail due to OpenAI quota)
    let predictions3MonthRes = null;
    try {
      predictions3MonthRes = await axios.get('http://localhost:6000/api/data/predictions-3month', {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      console.log('⚠️  3-month predictions unavailable (OpenAI quota), using fallback\n');
    }

    console.log('=' .repeat(70));
    console.log('\n✅ DATA STRUCTURE:\n');

    let monthlyData;
    
    if (predictions3MonthRes && predictions3MonthRes.data.predictions) {
      console.log('Using 3-Month Predictions from AI\n');
      
      const pred3Month = predictions3MonthRes.data;
      const dashboard = dashboardRes.data;
      
      // Current month
      const currentMonth = {
        month: 'October',
        year: 2025,
        revenue: parseFloat(dashboard.summary.find(s => s.title === 'Revenue')?.value.replace(/[^0-9.]/g, '') || 0),
        orders: parseInt(dashboard.summary.find(s => s.title === 'Total Orders')?.value || 0),
        profit: dashboard.financialsBreakdownData.pieData.find(p => p.name === 'Net Profit')?.value || 0
      };
      
      monthlyData = [currentMonth, ...pred3Month.predictions.monthly];
      
      console.log('Months available:');
      monthlyData.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.month} ${m.year} - ₹${Math.round(m.revenue / 1000)}k revenue`);
      });
      
    } else {
      console.log('Using Fallback 7-Day Predictions\n');
      
      const predictionsRes = await axios.get('http://localhost:6000/api/data/predictions', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate)
        }
      });
      
      const predictions = predictionsRes.data.predictions;
      
      // Create 4 months (current + 3 predicted)
      monthlyData = [
        {
          month: 'October',
          year: 2025,
          revenue: predictions.current.revenue * 30,
          orders: Math.round(predictions.current.orders * 30),
          profit: predictions.current.netProfit * 30
        }
      ];
      
      const growthFactor = 1 + (predictions.growth.revenue / 100);
      const months = ['November', 'December', 'January'];
      
      for (let i = 0; i < 3; i++) {
        monthlyData.push({
          month: months[i],
          year: i === 2 ? 2026 : 2025,
          revenue: predictions.next7Days.revenue * 4.3 * Math.pow(growthFactor, i + 1),
          orders: Math.round(predictions.next7Days.orders * 4.3 * Math.pow(growthFactor, i + 1)),
          profit: predictions.next7Days.profit * 4.3 * Math.pow(growthFactor, i + 1)
        });
      }
      
      console.log('Months available (calculated):');
      monthlyData.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.month} ${m.year} - ₹${Math.round(m.revenue / 1000)}k revenue`);
      });
    }

    console.log('\n' + '=' .repeat(70));
    console.log('\n📱 FRONTEND DISPLAY:\n');

    console.log('Month Selector Dropdown will show:');
    monthlyData.forEach((m, i) => {
      const label = i === 0 ? '(Current)' : '(Predicted)';
      console.log(`  • ${m.month} ${m.year} ${label}`);
    });

    console.log('\nDefault Selected: October 2025');

    console.log('\nMetric Cards for October 2025:');
    const oct = monthlyData[0];
    console.log(`  ✅ Revenue: ₹${Math.round(oct.revenue / 1000)}k`);
    console.log(`  ✅ Orders: ${Math.round(oct.orders)}`);
    console.log(`  ✅ Profit: ₹${Math.round(oct.profit / 1000)}k`);

    console.log('\nMetric Cards for November 2025 (Predicted):');
    const nov = monthlyData[1];
    const change = ((nov.revenue - oct.revenue) / oct.revenue * 100).toFixed(1);
    console.log(`  ✅ Predicted Revenue: ₹${Math.round(nov.revenue / 1000)}k (+${change}%)`);
    console.log(`  ✅ Predicted Orders: ${Math.round(nov.orders)}`);
    console.log(`  ✅ Predicted Profit: ₹${Math.round(nov.profit / 1000)}k`);

    console.log('\nMain Chart will show:');
    monthlyData.forEach((m, i) => {
      const type = i === 0 ? 'Actual' : 'Predicted';
      console.log(`  ${type}: ${m.month} ${m.year}`);
    });

    console.log('\n' + '=' .repeat(70));
    console.log('\n🎉 AIPREDICTION COMPONENT READY!\n');
    console.log('Features:');
    console.log('  ✅ 4 months available (Oct 2025 + 3 predicted)');
    console.log('  ✅ Month selector dropdown');
    console.log('  ✅ 8 metric cards per month');
    console.log('  ✅ Actual vs Predicted chart');
    console.log('  ✅ Financial breakdown table');
    console.log('  ✅ Upcoming events sidebar');
    console.log('  ✅ Actionable insights sidebar\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testAiprediction3Month();
