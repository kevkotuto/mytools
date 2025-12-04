const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [32, 72, 96, 128, 144, 152, 180, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');
const logoPath = path.join(__dirname, '../public/logo.png');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(logoPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outputPath);
    console.log(`Generated: icon-${size}x${size}.png`);
  }

  // Generate OG image (1200x630)
  const ogPath = path.join(__dirname, '../public/og-image.png');
  await sharp(logoPath)
    .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .extend({
      top: 115,
      bottom: 115,
      left: 400,
      right: 400,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    })
    .png()
    .toFile(ogPath);
  console.log('Generated: og-image.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
