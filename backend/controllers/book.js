const Book = require('../models/book');
const fs = require('fs');

/* ────────────────────────  CRÉER  ──────────────────────── */
exports.createBook = (req, res, next) => {
  try {
    // Vérification de la présence du corps de la requête
    if (!req.body) {
      console.log('createBook ▶︎ req.body est undefined');
      return res.status(400).json({ message: 'Corps de requête manquant' });
    }

    let bookObject = typeof req.body.book === 'string'
      ? JSON.parse(req.body.book)
      : { ...req.body };

    // Conversion automatique grade → rating si besoin
    if (Array.isArray(bookObject.ratings)) {
      bookObject.ratings = bookObject.ratings.map(r => {
        if ('grade' in r && !('rating' in r)) {
          const { grade, ...rest } = r;
          return { ...rest, rating: grade };
        }
        return r;
      });
    }

    delete bookObject._id;
    delete bookObject._userId;

    const imageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      : '';

    console.log('createBook ▶︎ bookObject =', bookObject);

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
  delete bookObject.ratings;
  delete bookObject.averageRating;

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
    const books = await Book.find().sort({ averageRating: -1 }).limit(3);
    res.status(200).json(books);
  } catch (error) {
    res.status(400).json({ error });
  }
};

/* ─────────────────────── NOTER ─────────────────────── */
exports.rateBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    let { rating, grade } = req.body; // on récupère les deux au cas où

    // Si grade est présent mais pas rating (front envoie "grade" !)
    if (rating == null && grade != null) {
      rating = grade;
    }

    const userId = req.auth.userId;

    // Vérification de la notation
    if (rating == null || rating < 0 || rating > 5) {
      return res.status(400).json({ message: 'La note doit être comprise entre 0 et 5.' });
    }
     // Récupère le livre
    const book = await Book.findById(bookId);
    if (!book) {
    return res.status(404).json({ message: 'Livre non trouvé.' });
    }

    // Recherche d'une note existante de cet utilisateur
    const existing = book.ratings.find(r => r.userId?.toString?.() === userId);

    let statusCode;

    if (existing) {
      // Mise à jour de la note existante
      existing.rating = rating;
      statusCode = 200;
    } else {
      // Ajout d'une nouvelle note
      book.ratings.push({ userId, rating });
      statusCode = 201;
    }

    // Recalcul de la note moyenne
    const sum = book.ratings.reduce((total, r) => total + r.rating, 0);
    book.averageRating = book.ratings.length > 0 ? sum / book.ratings.length : 0;

    // Sauvegarde et réponse
    await book.save();
    return res.status(statusCode).json(book);


  } catch (err) {
    console.error('Erreur rateBook :', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};
