const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const videosDir = path.join(uploadsDir, 'videos');
const imagesDir = path.join(uploadsDir, 'images');
const audioDir = path.join(uploadsDir, 'audio');

[uploadsDir, videosDir, imagesDir, audioDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadsDir;
    
    if (file.mimetype.startsWith('video/')) {
      uploadPath = videosDir;
    } else if (file.mimetype.startsWith('image/')) {
      uploadPath = imagesDir;
    } else if (file.mimetype.startsWith('audio/')) {
      uploadPath = audioDir;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Video formats
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/webm',
    'video/mkv',
    // Audio formats
    'audio/mp3',
    'audio/wav',
    'audio/aac',
    'audio/ogg',
    'audio/m4a',
    // Image formats
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video, audio, and image files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB default
    files: 10 // Max 10 files at once
  }
});

// Helper function to get file info
const getFileInfo = (file) => {
  const stats = fs.statSync(file.path);
  return {
    id: uuidv4(),
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: stats.size,
    path: file.path,
    url: `/uploads/${file.mimetype.startsWith('video/') ? 'videos' : 
                   file.mimetype.startsWith('audio/') ? 'audio' : 'images'}/${file.filename}`,
    uploadedAt: new Date(),
    type: file.mimetype.startsWith('video/') ? 'video' : 
          file.mimetype.startsWith('audio/') ? 'audio' : 'image'
  };
};

// @route   POST /api/files/upload
// @desc    Upload files
// @access  Private
router.post('/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
        code: 'NO_FILES'
      });
    }

    const uploadedFiles = req.files.map(file => getFileInfo(file));

    res.json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: {
        files: uploadedFiles
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large',
        code: 'FILE_TOO_LARGE'
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        code: 'TOO_MANY_FILES'
      });
    }

    res.status(500).json({
      success: false,
      message: 'File upload failed',
      code: 'UPLOAD_ERROR'
    });
  }
});

// @route   POST /api/files/upload-single
// @desc    Upload single file
// @access  Private
router.post('/upload-single', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    const uploadedFile = getFileInfo(req.file);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file: uploadedFile
      }
    });

  } catch (error) {
    console.error('Single file upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large',
        code: 'FILE_TOO_LARGE'
      });
    }

    res.status(500).json({
      success: false,
      message: 'File upload failed',
      code: 'UPLOAD_ERROR'
    });
  }
});

// @route   GET /api/files/:filename
// @desc    Get file by filename
// @access  Private
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { type } = req.query; // video, audio, image

    let filePath;
    if (type === 'video') {
      filePath = path.join(videosDir, filename);
    } else if (type === 'audio') {
      filePath = path.join(audioDir, filename);
    } else if (type === 'image') {
      filePath = path.join(imagesDir, filename);
    } else {
      // Try to find the file in any directory
      const directories = [videosDir, audioDir, imagesDir];
      filePath = null;
      
      for (const dir of directories) {
        const testPath = path.join(dir, filename);
        if (fs.existsSync(testPath)) {
          filePath = testPath;
          break;
        }
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.avi': 'video/avi',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve file',
      code: 'FILE_ERROR'
    });
  }
});

// @route   DELETE /api/files/:filename
// @desc    Delete file
// @access  Private
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { type } = req.query;

    let filePath;
    if (type === 'video') {
      filePath = path.join(videosDir, filename);
    } else if (type === 'audio') {
      filePath = path.join(audioDir, filename);
    } else if (type === 'image') {
      filePath = path.join(imagesDir, filename);
    } else {
      // Try to find the file in any directory
      const directories = [videosDir, audioDir, imagesDir];
      filePath = null;
      
      for (const dir of directories) {
        const testPath = path.join(dir, filename);
        if (fs.existsSync(testPath)) {
          filePath = testPath;
          break;
        }
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      code: 'DELETE_ERROR'
    });
  }
});

// @route   GET /api/files
// @desc    Get user's uploaded files
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    
    // This is a simplified version - in a real app, you'd store file metadata in the database
    const directories = [];
    
    if (!type || type === 'video') directories.push(videosDir);
    if (!type || type === 'audio') directories.push(audioDir);
    if (!type || type === 'image') directories.push(imagesDir);

    let allFiles = [];
    
    directories.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).map(filename => {
          const filePath = path.join(dir, filename);
          const stats = fs.statSync(filePath);
          const ext = path.extname(filename).toLowerCase();
          
          return {
            id: uuidv4(),
            filename,
            type: ext.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i) ? 'video' :
                 ext.match(/\.(mp3|wav|aac|ogg|m4a)$/i) ? 'audio' : 'image',
            size: stats.size,
            uploadedAt: stats.birthtime,
            url: `/uploads/${path.basename(dir)}/${filename}`
          };
        });
        allFiles = allFiles.concat(files);
      }
    });

    // Sort by upload date (newest first)
    allFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedFiles = allFiles.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        files: paginatedFiles,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(allFiles.length / limit),
          total: allFiles.length
        }
      }
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files',
      code: 'FETCH_ERROR'
    });
  }
});

module.exports = router;

