const fs = require('fs');
const PImage = require('pureimage');

const FILES = ['images/10.png','images/11.png','images/12.png','images/13.png'];

async function check(path){
  try{
    if(!fs.existsSync(path)) { console.log(path, 'MISSING'); return; }
    const stream = fs.createReadStream(path);
    const img = await PImage.decodePNGFromStream(stream);
    const w = img.width, h = img.height;
    const ctx = img.getContext('2d');
    const id = ctx.getImageData(0,0,w,h);
    const d = id.data;
    let transparent = 0;
    for(let i=3;i<d.length;i+=4){ if(d[i] < 255) transparent++; }
    console.log(path, '| size:', w+'x'+h, '| transparent pixels:', transparent);
  }catch(e){
    console.error('ERR', path, e && e.message || e);
  }
}

(async ()=>{
  for(const f of FILES) await check(f);
})();