const express = require('express');
const auth = require ('../middleware/auth');
const router = express.Router();
const imageUpload = require('../middleware/optionalUpload')();
const stuffCtrl = require('../controllers/book');


// Crée un nouveau livre avec image envoyée et sauvegarde l'image dans /images
router.get('/',stuffCtrl.getAllBooks );
router.get('/bestrating',stuffCtrl.getBestRatedBooks);
router.post('/',auth,imageUpload, stuffCtrl.createBook); 
router.put('/:id',auth,imageUpload,stuffCtrl.modifyBook);
router.delete('/:id',auth,stuffCtrl.deleteBook);
router.get('/:id',stuffCtrl.getOneBook);
router.post('/:id/rating', auth, stuffCtrl.rateBook);


module.exports = router;
