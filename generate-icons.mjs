import sharp from 'sharp';
import fs from 'fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#1a1a2e"/>
  <text x="256" y="340" font-size="300" text-anchor="middle" font-family="serif">🌙</text>
</svg>`;

const svgBuffer = Buffer.from(svg);

await sharp(svgBuffer).resize(192, 192).png().toFile('public/icons/manifest-icon-192.maskable.png');
await sharp(svgBuffer).resize(512, 512).png().toFile('public/icons/manifest-icon-512.maskable.png');
await sharp(svgBuffer).resize(180, 180).png().toFile('public/icons/apple-icon-180.png');

console.log('Icons generated!');