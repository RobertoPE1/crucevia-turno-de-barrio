// Dependency-free ZIP builder: node build.cjs
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const files=['index.html','platform.js','campaign.js','game.js','privacy.html','NOTICE.txt'];
function crc32(data){let c=0xffffffff;for(const b of data){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
const local=[],directory=[];let offset=0;
for(const name of files){
  const filename=Buffer.from(name),data=fs.readFileSync(path.join(__dirname,name));
  const compressed=zlib.deflateRawSync(data),crc=crc32(data),header=Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50,0);header.writeUInt16LE(20,4);header.writeUInt16LE(8,8);header.writeUInt16LE(0x21,12);
  header.writeUInt32LE(crc,14);header.writeUInt32LE(compressed.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(filename.length,26);
  local.push(header,filename,compressed);
  const entry=Buffer.alloc(46);
  entry.writeUInt32LE(0x02014b50,0);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(8,10);entry.writeUInt16LE(0x21,14);
  entry.writeUInt32LE(crc,16);entry.writeUInt32LE(compressed.length,20);entry.writeUInt32LE(data.length,24);entry.writeUInt16LE(filename.length,28);entry.writeUInt32LE(offset,42);
  directory.push(entry,filename);offset+=header.length+filename.length+compressed.length;
}
const central=Buffer.concat(directory),end=Buffer.alloc(22);
end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(central.length,12);end.writeUInt32LE(offset,16);
const release=path.join(__dirname,'release');fs.mkdirSync(release,{recursive:true});
const output=path.join(release,'crucevia-crazygames.zip');fs.writeFileSync(output,Buffer.concat([...local,central,end]));
console.log(output+' ('+fs.statSync(output).size+' bytes)');
