const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      // Dynamic mapping for text-[#...]
      content = content.replace(/\btext-\[\#([A-Fa-f0-9]{6})\]\b(?! dark:text-)/g, (match, hex) => {
        let firstDigit = parseInt(hex[0], 16);
        let darkColor = 'gray-300'; // Default
        
        // Very dark grey -> very light
        if (firstDigit <= 3) {
          darkColor = 'gray-100';
        }
        // Medium dark -> light
        else if (firstDigit <= 6) {
          darkColor = 'gray-200';
        }
        // Medium grey -> medium light
        else if (firstDigit <= 8) {
          darkColor = 'gray-300';
        }
        // Light grey -> stay or slightly lighter
        else {
          darkColor = 'gray-400';
        }
        
        // Let's not modify colors that are clearly colored (reds, blues, greens, yellows)
        // If it has strong saturation, skip it for now. We just check if it's roughly grayscale.
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        const maxDiff = Math.max(Math.abs(r-g), Math.abs(g-b), Math.abs(r-b));
        if (maxDiff > 30) {
           return match; // It's a colorful hex, keep it unchanged.
        }
        
        return `${match} dark:text-${darkColor}`;
      });

      // Special cases
      content = content.replace(/\bbg-\[\#FFF9EE\]\b(?! dark:bg-)/g, 'bg-[#FFF9EE] dark:bg-[#1C1C1C]');
      content = content.replace(/\bbg-\[\#FDFBF7\]\b(?! dark:bg-)/g, 'bg-[#FDFBF7] dark:bg-[#121212]');
      content = content.replace(/\bbg-\[\#F9FAFB\]\b(?! dark:bg-)/g, 'bg-[#F9FAFB] dark:bg-[#121212]');
      content = content.replace(/\bbg-\[\#FAFAFA\]\b(?! dark:bg-)/g, 'bg-[#FAFAFA] dark:bg-[#1A1A1A]');
      content = content.replace(/\bbg-white\b(?! dark:bg-)/g, 'bg-white dark:bg-card');
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'app'));
processDirectory(path.join(__dirname, 'components'));
console.log('Done mapping gray texts dynamically.');
