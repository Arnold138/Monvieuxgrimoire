const multer = require('multer');
const sharp  = require('sharp');
const fs     = require('fs');
const path   = require('path');

/* — config Multer + Sharp identique à avant — */
const MIME_TYPES = { 'image/jpg':'jpg','image/jpeg':'jpg','image/png':'png' };
const storage = multer.diskStorage({
  destination: (req,file,cb)=>cb(null,'images/'),
  filename: (req,file,cb)=>{
    const name = file.originalname.split(' ').join('_').split('.')[0];
    const ext  = MIME_TYPES[file.mimetype];
    cb(null, `${Date.now()}_${name}.${ext}`);
  }
});
const uploadSingle = multer({ storage, limits:{ fileSize:5*1024*1024 } })
                     .single('image');

/* — wrapper qui n’exécute Multer QUE si c’est un multipart — */
module.exports = () => (req, res, next) => {
  const ct = (req.headers['content-type'] || '').toLowerCase();
  if (!ct.startsWith('multipart/form-data')) {
    return next();                           // JSON simple : on passe
  }

  /* sinon : on gère l’upload puis Sharp */
  uploadSingle(req, res, async err => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ message:'Upload invalide', error: err.message });
    }
    if (!req.file) return next();            // pas d’image malgré multipart
    try {
      const oldPath = req.file.path;
      const newPath = oldPath.replace(/\.[^.]+$/, '-opt.jpg');
      await sharp(oldPath).resize({ width:800 }).jpeg({ quality:80 }).toFile(newPath);
      fs.unlinkSync(oldPath);
      req.file.filename = path.basename(newPath);
      req.file.path     = newPath;
      next();
    } catch (e) {
      console.error('Sharp error:', e);
      next(e);
    }
  });
};
