// middleware/optionalUpload.js
const multer = require('multer');
const sharp  = require('sharp');
const fs     = require('fs');
const path   = require('path');

// 1) Configuration Multer
const MIME_TYPES = {
  'image/jpg':  'jpg',
  'image/jpeg': 'jpg',
  'image/png':  'png'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'images/'),
  filename:    (req, file, cb) => {
    const baseName = file.originalname.split(' ').join('_').split('.')[0];
    const extension = MIME_TYPES[file.mimetype];
    cb(null, `${Date.now()}_${baseName}.${extension}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }  // 5 Mo max
});

// 2) Middleware unique qui gère l’upload + optimisation Sharp
module.exports = (fieldName = 'image') => {
  return (req, res, next) => {
    const contentType = (req.headers['content-type'] || '').toLowerCase();
    // Si pas de multipart, on skip
    if (!contentType.startsWith('multipart/form-data')) {
      return next();
    }

    // Sinon, on lance multer.single
    upload.single(fieldName)(req, res, async err => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ message: 'Upload invalide', error: err.message });
      }
      // Pas de fichier à traiter
      if (!req.file) {
        return next();
      }
      // 3) Optimisation Sharp en JPEG 800px
      try {
        const oldPath = req.file.path;
        const newPath = oldPath.replace(/\.[^.]+$/, '-opt.jpg');
        await sharp(oldPath)
          .resize({ width: 800 })
          .jpeg({ quality: 80 })
          .toFile(newPath);

        fs.unlinkSync(oldPath);
        req.file.filename = path.basename(newPath);
        req.file.path     = newPath;
        next();
      } catch (sharpErr) {
        console.error('Sharp error:', sharpErr);
        next(sharpErr);
      }
    });
  };
};
