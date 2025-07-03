const { error } = require('console');
const Book = require('../models/book');
const fs = require ('fs');

exports.createBook = (req, res, next) => {
  try {
    console.log('req.body.book :', req.body.book); // ← AVANT parse
    console.log('req.file :', req.file);

    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });

    book.save()
      .then(() => res.status(201).json({ message: 'Objet enregistré !' }))
      .catch(error => res.status(400).json({ error }));

  } catch (error) {
    console.error('Erreur parsing ou création :', error);
    res.status(400).json({ error: 'Requête invalide ou image manquante' });
  }
};


exports.modifyBook = (req, res, next) => {
  // Prépare le nouvel objet livre en fonction de la présence ou non d'un fichier image
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

      // Si une nouvelle image a été uploadée, on supprime l’ancienne du serveur
      if (req.file && book.imageUrl) {
        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, (err) => {
          if (err) console.error(err);
        });
      }

      // On update seulement les champs reçus (donc on peut juste changer un champ sans toucher au reste)
      Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Objet modifié !' }))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(400).json({ error }));
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (book.userId !== req.auth.userId) {
        return res.status(401).json({ message: 'Non autorisé' });
      }

      const filename = book.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Book.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet supprimé' }))
          .catch(error => res.status(500).json({ error }));
      });
    })
    .catch(error => {
      res.status(500).json({ error });
    });
};

exports.getOneBook = (req,res,next) => { 
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
    const books = await Book.find().sort({ averageRating: -1 }).limit(5); // exemple avec un champ averageRating
    res.status(200).json(books);
  } catch (error) {
    res.status(400).json({ error });
  }
};