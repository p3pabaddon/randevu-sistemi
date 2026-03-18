const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\121212\\Desktop\\randevu-sistemi-main\\public\\assets';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // adding hidden class instead of removing the button classes
  content = content.replace(/"fixed bottom-6 right-6 z-\[9999\]"/g, '"hidden fixed bottom-6 right-6 z-[9999]"');
  
  if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${file}`);
  }
});
console.log("Chat button hidden successfully.");
