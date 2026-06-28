const fs = require('fs');
const https = require('https');
const path = require('path');

const FONTS_URL = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap";
const CSS_PATH = path.join(__dirname, 'css', 'fonts.css');
const FONTS_DIR = path.join(__dirname, 'fonts');

if (!fs.existsSync(FONTS_DIR)) {
  fs.mkdirSync(FONTS_DIR, { recursive: true });
}

https.get(FONTS_URL, {
  headers: {
    // Need a modern browser user-agent to get woff2 format
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}, (res) => {
  let css = '';
  res.on('data', chunk => css += chunk);
  res.on('end', async () => {
    // Find all url(...) in the css
    const urlRegex = /url\((https:\/\/[^)]+)\)/g;
    let match;
    const downloads = [];
    
    while ((match = urlRegex.exec(css)) !== null) {
      const fontUrl = match[1];
      const filename = fontUrl.split('/').pop();
      const localPath = path.join(FONTS_DIR, filename);
      
      // Replace URL in CSS
      css = css.replace(fontUrl, `../fonts/${filename}`);
      
      downloads.push(new Promise((resolve, reject) => {
        const file = fs.createWriteStream(localPath);
        https.get(fontUrl, (fontRes) => {
          fontRes.pipe(file);
          file.on('finish', () => {
            file.close(resolve);
          });
        }).on('error', (err) => {
          fs.unlink(localPath, () => reject(err));
        });
      }));
    }
    
    await Promise.all(downloads);
    fs.writeFileSync(CSS_PATH, css);
    console.log('Fonts downloaded and css saved successfully.');
  });
}).on('error', (err) => {
  console.error('Error fetching fonts:', err.message);
});
