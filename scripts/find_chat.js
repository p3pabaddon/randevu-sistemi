const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\121212\\Desktop\\randevu-sistemi-main\\public\\assets';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') || f.endsWith('.css'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Search for chat button keywords in class or component names
  const regex = /.{0,40}(chat-button|chat-widget|bot-button|ai-bot|chat|ai|message).{0,40}/ig;
  let count = 0;
  let match;
  while ((match = regex.exec(content)) !== null && count < 10) {
      if(file.endsWith('.js') || file.endsWith('.css')){
          console.log(`File: ${file} | Match: ${match[0]}`);
          count++;
      }
  }
});
