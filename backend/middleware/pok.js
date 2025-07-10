const multer = require('multer');
const sharp  = require('sharp');
const fs     = require('fs');
const path   = require('path');

/* ────── 1) stockage temporaire ────── */
const MIME_TYPES = {
  'image/jpg':  'jpg',
  'image/jpeg': 'jpg',
  'image/png':  'png'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'images/'),   // dossier « images »
  filename: (req, file, cb) => {
    const name = file.originalname.split(' ').join('_').split('.')[0];
    const ext  = MIME_TYPES[file.mimetype];
    cb(null, `${Date.now()}_${name}.${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 Mo max

/* ────── 2) optimisation avec Sharp ────── */
module.exports = (fieldName = 'image') => [
  upload.single(fieldName),
  async (req, res, next) => {
    if (!req.file) return next();                 // rien à optimiser
    try {
      const oldPath = req.file.path;              // ex. images/162…_book.png
      const extOut  = 'jpg';                      // on uniformise en JPEG
      const newPath = oldPath.replace(/\.[^.]+$/, `-opt.${extOut}`); // …-opt.jpg

      await sharp(oldPath)
        .resize({ width: 800 })                   // max 800 px de large
        .jpeg({ quality: 80 })                    // compression 80 %
        .toFile(newPath);

      fs.unlinkSync(oldPath);                     // supprime l’original
      req.file.filename = path.basename(newPath); // met à jour les infos
      req.file.path     = newPath;
      console.error('Sharp-middleware error:', err);
      next();
    } catch (err) {
      console.error('Sharp error:', err);
      next(err);
    }
  }
];

module.exports = (fieldName = 'image') => [ /* … */ ];
