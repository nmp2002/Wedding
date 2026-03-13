const fs = require('fs');
const PImage = require('pureimage');

const FILE = 'images/13.png';

async function run(){
  try{
    if(!fs.existsSync(FILE)){
      console.error('Not found:', FILE);
      return;
    }
    const stream = fs.createReadStream(FILE);
    const img = await PImage.decodePNGFromStream(stream);
    const w = img.width, h = img.height;
    const ctx = img.getContext('2d');
    const id = ctx.getImageData(0,0,w,h);
    const d = id.data;
    const t = 235;
    for(let i=0;i<d.length;i+=4){
      const r=d[i], g=d[i+1], b=d[i+2];
      if(r>=t && g>=t && b>=t) d[i+3]=0;
    }
    ctx.putImageData(id,0,0);
    const out = fs.createWriteStream(FILE);
    await PImage.encodePNGToStream(img, out);
    console.log('Wrote', FILE);
  }catch(err){
    console.error('Failed', FILE, err && err.stack || err);
  }
}

run();
