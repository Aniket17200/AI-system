// Test the date parsing logic
const testDates = [
  "26th Oct 2024 08:11 AM",
  "1st Jan 2025 12:00 PM",
  "15th Sep 2025 03:45 PM",
  "31st Dec 2024 11:59 PM"
];

console.log('Testing Shiprocket date parsing:\n');

testDates.forEach(dateStr => {
  const dateMatch = dateStr.match(/(\d+)(st|nd|rd|th)\s+(\w+)\s+(\d{4})/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const monthStr = dateMatch[3];
    const year = dateMatch[4];
    
    const months = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    
    const month = months[monthStr];
    if (month) {
      const parsed = `${year}-${month}-${day}`;
      console.log(`${dateStr} → ${parsed}`);
    }
  }
});
