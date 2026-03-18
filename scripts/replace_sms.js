const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\121212\\Desktop\\randevu-sistemi-main\\public\\assets';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  content = content.replace(/SMS Bildirim Desteği/g, 'Otomatik Hatırlatmalar');
  
  if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${file}`);
  }
});
console.log("SMS Feature text updated successfully.");
