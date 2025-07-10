const Book = require('../models/book');
const fs   = require('fs');

/* ────────────────────────  CRÉER  ──────────────────────── */
exports.createBook = (req, res, next) => {
  try {
    /* ───── LOG 1 : ce que reçoit réellement Multer ───── */
    console.log('createBook ▶︎ req.body =', req.body);
    console.log('createBook ▶︎ req.file =', req.file);

    /* 1. Corps totalement absent ⇒ 400 clair */
    if (!req.body) {
      console.log('createBook ▶︎ req.body est undefined');
      return res.status(400).json({ message: 'Corps de requête manquant' });
    }

    /* 2. Récupère les données du livre */
    const bookObject = typeof req.body.book === 'string'
      ? JSON.parse(req.body.book)          // format initial : { book: '{"title":"…"}' }
      : { ...req.body };                   // format champs à plat

    delete bookObject._id;
    delete bookObject._userId;

    /* 3. Construit l’URL image (si fichier) */
    const imageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      : '';

    /* ───── LOG 2 : objet final avant sauvegarde ───── */
    console.log('createBook ▶︎ bookObject =', bookObject);

    /* 4. Sauvegarde en base */
    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl
    });

    book.save()
        .then(() => res.status(201).json({ message: 'Livre enregistré !' }))
        .catch(error => {
          console.error('createBook ▶︎ erreur save :', error);
          res.status(400).json({ error });
        });

  } catch (error) {
    console.error('createBook ▶︎ erreur parsing :', error);
    res.status(400).json({ error: 'Requête mal formée' });
  }
};


/* ─────────────────────── MODIFIER ─────────────────────── */
exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      }
    : { ...req.body };

  delete bookObject._userId;

  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (book.userId !== req.auth.userId) {
        return res.status(401).json({ message: 'Non autorisé' });
      }

      if (req.file && book.imageUrl) {
        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, err => { if (err) console.error(err); });
      }

      Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Livre modifié !' }))
          .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(400).json({ error }));
};

/* ─────────────────────── SUPPRIMER ─────────────────────── */
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
      .then(book => {
        if (book.userId !== req.auth.userId) {
          return res.status(401).json({ message: 'Non autorisé' });
        }

        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
              .then(() => res.status(200).json({ message: 'Livre supprimé' }))
              .catch(error => res.status(500).json({ error }));
        });
      })
      .catch(error => res.status(500).json({ error }));
};

/* ───────────────────────  LIRE  ─────────────────────── */
exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
      .then(book => res.status(200).json(book))
      .catch(error => res.status(404).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
      .then(books => res.status(200).json(books))
      .catch(error => res.status(400).json({ error }));
};

exports.getBestRatedBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ averageRating: -1 }).limit(5);
    res.status(200).json(books);
  } catch (error) {
    res.status(400).json({ error });
  }
};
