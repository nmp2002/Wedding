const fs = require('fs');
const PImage = require('pureimage');

// Process multiple image files (removes near-white pixels -> transparent)
const FILES = [
  'images/10.png',
  'images/11.png',
  'images/12.png',
  'images/13.png'
];

async function processFile(path){
  return new Promise(async (resolve, reject) => {
    try{
      const stream = fs.createReadStream(path);
      const img = await PImage.decodePNGFromStream(stream);
      const w = img.width, h = img.height;
      const ctx = img.getContext('2d');
      const id = ctx.getImageData(0,0,w,h);
      const d = id.data;
      const t = 235; // threshold for near-white (lower to remove darker off-whites)
      for(let i=0;i<d.length;i+=4){
        const r=d[i], g=d[i+1], b=d[i+2];
        if(r>=t && g>=t && b>=t){ d[i+3] = 0; }
      }
      ctx.putImageData(id,0,0);
      const out = fs.createWriteStream(path);
      await PImage.encodePNGToStream(img, out);
      console.log('Wrote', path);
      resolve();
    }catch(err){
      reject(err);
    }
  });
}

async function run(){
  for(const f of FILES){
    try{
      if(!fs.existsSync(f)){
        console.warn('Skipped, not found:', f);
        continue;
      }
      await processFile(f);
    }catch(err){
      console.error('Failed processing', f, err && err.stack || err);
    }
  }
}

run();
