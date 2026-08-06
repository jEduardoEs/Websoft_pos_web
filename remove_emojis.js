const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (emojiRegex.test(content)) {
    const newContent = content.replace(emojiRegex, '');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Removed emojis from ${filePath}`);
  }
}

function traverse(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      traverse(fullPath);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      processFile(fullPath);
    }
  }
}

console.log('Starting emoji removal...');
traverse(srcDir);
console.log('Done!');
