require('dotenv').config();
const mongoose = require('mongoose');
const DailyMetrics = require('./models/DailyMetrics');

async function checkDateQuery() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);
  startDate.setHours(0, 0, 0, 0);
  
  console.log('Query range:');
  console.log('Start:', startDate.toISOString().split('T')[0]);
  console.log('End:', endDate.toISOString().split('T')[0]);
  console.log();
  
  const metrics = await DailyMetrics.find({
    userId: '68c812b0afc4892c1f8128e3',
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
  
  console.log('Found', metrics.length, 'records');
  
  if (metrics.length > 0) {
    console.log('First:', metrics[0].date.toISOString().split('T')[0]);
    console.log('Last:', metrics[metrics.length-1].date.toISOString().split('T')[0]);
    
    const total = metrics.reduce((sum, m) => sum + m.revenue, 0);
    console.log('\nTotal Revenue:', Math.round(total).toLocaleString('en-IN'));
  }
  
  process.exit(0);
}

checkDateQuery();
