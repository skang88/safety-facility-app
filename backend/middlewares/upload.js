const multer = require('multer');

// Setup memory storage so we can process files (Excel, sharp images) directly in memory
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = upload;
