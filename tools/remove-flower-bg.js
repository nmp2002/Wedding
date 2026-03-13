const JimpModule = require('jimp');
let Jimp = JimpModule.Jimp || JimpModule.default || JimpModule;
const path = require('path');

async function removeBg() {
  const src = path.join(__dirname, '..', 'images', 'flower.png');
  const out = path.join(__dirname, '..', 'images', 'flower.png'); // overwrite
  try {
    const img = await Jimp.read(src);
    img.rgba(true);
    const w = img.bitmap.width;
    const h = img.bitmap.height;
    // threshold: pixels close to white become transparent
    const threshold = 250; // 0-255
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (w * y + x) << 2;
        const rgba = Jimp.intToRGBA(img.getPixelColor(x, y));
        if (rgba.r >= threshold && rgba.g >= threshold && rgba.b >= threshold) {
          // make transparent
          img.setPixelColor(Jimp.rgbaToInt(rgba.r, rgba.g, rgba.b, 0), x, y);
        }
      }
    }
    await img.writeAsync(out);
    console.log('Wrote', out);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

removeBg();
