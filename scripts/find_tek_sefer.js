const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\121212\\Desktop\\randevu-sistemi-main\\public\\assets';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') || f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  const regex = /.{0,30}Tek Sefer.{0,30}/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
      console.log(`File: ${file} match context: ${match[0]}`);
  }
});
