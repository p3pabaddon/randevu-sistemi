const fs = require('fs');
const path = require('path');

const file = 'c:\\Users\\121212\\Desktop\\randevu-sistemi-main\\public\\assets\\index-TPbPZnFO.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /.{0,40}fixed bottom-.{0,40}/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(`Match: ${match[0]}`);
}
