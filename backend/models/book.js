const mongoose = require('mongoose');

// Schéma pour les notes des livres
const ratingSchema = mongoose.Schema({
  userId: { type: String, required: true },
  rating:  { type: Number, required: true, min: 0, max: 5 }
});

// Schéma principal du livre
const BookSchema = mongoose.Schema({
  userId:        { type: String, required: true },
  title:         { type: String, required: true },
  author:        { type: String, required: true },
  imageUrl:      { type: String, required: true },
  year:          { type: Number, required: true },
  genre:         { type: String, required: true },
  ratings:       { type: [ratingSchema], default: [] },
  averageRating: { type: Number, default: 0 }
});

module.exports = mongoose.model('Book', BookSchema);
