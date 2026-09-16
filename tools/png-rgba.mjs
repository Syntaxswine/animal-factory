// Minimal dependency-free PNG codec for tooling: 8-bit RGBA or RGB, non-interlaced.
import {inflateSync,deflateSync} from 'node:zlib';

const SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);

export function decodePNG(data){
 if(!data.subarray(0,8).equals(SIGNATURE))throw Error('Not a PNG');
 let offset=8,width=0,height=0,channels=0;const idat=[];
 while(offset<data.length){
  const length=data.readUInt32BE(offset),type=data.toString('latin1',offset+4,offset+8),body=data.subarray(offset+8,offset+8+length);
  if(type==='IHDR'){
   width=body.readUInt32BE(0);height=body.readUInt32BE(4);
   const depth=body[8],color=body[9],interlace=body[12];
   if(depth!==8||![2,6].includes(color)||interlace)throw Error(`Unsupported PNG format (depth ${depth}, color ${color}, interlace ${interlace})`);
   channels=color===6?4:3;
  }else if(type==='IDAT')idat.push(body);
  else if(type==='IEND')break;
  offset+=12+length;
 }
 const raw=inflateSync(Buffer.concat(idat)),stride=width*channels,pixels=new Uint8ClampedArray(width*height*4),line=new Uint8Array(stride),previous=new Uint8Array(stride);
 for(let y=0;y<height;y++){
  const start=y*(stride+1),filter=raw[start];
  for(let x=0;x<stride;x++){
   const value=raw[start+1+x],left=x>=channels?line[x-channels]:0,up=previous[x],corner=x>=channels?previous[x-channels]:0;
   let predicted=0;
   if(filter===1)predicted=left;
   else if(filter===2)predicted=up;
   else if(filter===3)predicted=(left+up)>>1;
   else if(filter===4){const p=left+up-corner,pa=Math.abs(p-left),pb=Math.abs(p-up),pc=Math.abs(p-corner);predicted=pa<=pb&&pa<=pc?left:pb<=pc?up:corner;}
   line[x]=(value+predicted)&255;
  }
  for(let x=0;x<width;x++){const i=(y*width+x)*4,j=x*channels;pixels[i]=line[j];pixels[i+1]=line[j+1];pixels[i+2]=line[j+2];pixels[i+3]=channels===4?line[j+3]:255;}
  previous.set(line);
 }
 return {width,height,pixels};
}

const CRC_TABLE=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
const crc32=buffer=>{let c=0xffffffff;for(const byte of buffer)c=CRC_TABLE[(c^byte)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
function chunk(type,body){const out=Buffer.alloc(12+body.length);out.writeUInt32BE(body.length,0);out.write(type,4,'latin1');body.copy(out,8);out.writeUInt32BE(crc32(out.subarray(4,8+body.length)),8+body.length);return out;}

export function encodePNG({width,height,pixels}){
 const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
 const raw=Buffer.alloc((width*4+1)*height);
 for(let y=0;y<height;y++)Buffer.from(pixels.buffer,pixels.byteOffset+y*width*4,width*4).copy(raw,y*(width*4+1)+1);
 return Buffer.concat([SIGNATURE,chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
