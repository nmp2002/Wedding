// Advanced background removal for 14.png -> 14-nobg2.png
// Preserves antialiased edges by scaling alpha rather than hard-cutting.
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

const INPUT = 'images/14.png';
const OUTPUT = 'images/14-nobg2.png';
const THRESHOLD = 230; // pixels with luminance above this start becoming transparent

loadImage(INPUT).then(img => {
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    // compute perceived luminance
    const lum = Math.round(0.2126*r + 0.7152*g + 0.0722*b);
    if (lum >= THRESHOLD) {
      // scale alpha so pure white becomes fully transparent, but near-threshold remains semi-opaque
      const factor = (255 - lum) / (255 - THRESHOLD);
      const newAlpha = Math.round(a * Math.max(0, Math.min(1, factor)));
      data[i+3] = newAlpha;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  const out = fs.createWriteStream(OUTPUT);
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  out.on('finish', () => console.log('Done:', OUTPUT));
}).catch(err => { console.error('Error loading image:', err); process.exit(1); });
