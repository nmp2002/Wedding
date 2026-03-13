const PImage = require('pureimage');
const fs = require('fs');
const path = require('path');

async function removeBg() {
  const src = path.join(__dirname, '..', 'images', 'flower.png');
  const out = path.join(__dirname, '..', 'images', 'flower.png');
  try{
    const img = await PImage.decodePNGFromStream(fs.createReadStream(src));
    const w = img.width;
    const h = img.height;
    const imgData = img.data; // Uint8Array RGBA
    const threshold = 250;
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const i = (y*w + x) * 4;
        const r = imgData[i], g = imgData[i+1], b = imgData[i+2];
        if(r>=threshold && g>=threshold && b>=threshold){
          imgData[i+3] = 0; // alpha
        }
      }
    }
    await PImage.encodePNGToStream(img, fs.createWriteStream(out));
    console.log('Wrote', out);
  }catch(err){
    console.error('Error:', err);
    process.exit(1);
  }
}

removeBg();
