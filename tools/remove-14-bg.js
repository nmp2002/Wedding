// Remove white background from 14.png and save as 14-nobg.png
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

const INPUT = 'images/14.png';
const OUTPUT = 'images/14-nobg.png';
const THRESHOLD = 240; // adjust if needed

loadImage(INPUT).then(img => {
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    if (r > THRESHOLD && g > THRESHOLD && b > THRESHOLD) {
      data[i+3] = 0; // transparent
    }
  }
  ctx.putImageData(imageData, 0, 0);
  const out = fs.createWriteStream(OUTPUT);
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  out.on('finish', () => console.log('Done:', OUTPUT));
});
