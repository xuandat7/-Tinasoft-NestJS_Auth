const fs = require('fs');
const path = require('path');

// Create the dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist', 'mail', 'templates');
fs.mkdirSync(distDir, { recursive: true });

// Copy template files
const srcDir = path.join(__dirname, 'src', 'mail', 'templates');
const files = fs.readdirSync(srcDir);

files.forEach(file => {
  const src = path.join(srcDir, file);
  const dest = path.join(distDir, file);
  fs.copyFileSync(src, dest);
  console.log(`Copied ${file} to ${distDir}`);
});

console.log('All templates copied successfully!');
