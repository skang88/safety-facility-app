const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Optimize and save image buffer to uploads directory
 * @param {Buffer} fileBuffer - Raw image file buffer
 * @param {string} originalname - Original file name
 * @param {string} prefix - Optional filename prefix (e.g. 'fw' for firewater)
 * @returns {Promise<string>} - Relative path to the saved image (e.g. /uploads/optimized-xxx.jpg)
 */
async function processAndSaveImage(fileBuffer, originalname, prefix = '') {
  const cleanPrefix = prefix ? `${prefix}-` : '';
  const filename = `optimized-${cleanPrefix}${Date.now()}-${originalname}`;
  const outputPath = path.join(uploadsDir, filename);

  await sharp(fileBuffer)
    .resize({ width: 800, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(outputPath);

  return `/uploads/${filename}`;
}

module.exports = {
  processAndSaveImage
};
