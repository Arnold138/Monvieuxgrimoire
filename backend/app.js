const express = require('express'); 
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');


const bookRoutes = require('../backend/routes/book');
const userRoutes = require('../backend/routes/user');

// Helmet pour sécuriser les headers HTTP
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

// Rate limiter pour éviter le spam/brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes depuis cette IP, réessayez dans 15 minutes'
});
app.use(limiter);


// Middleware pour servir les images statiques depuis le dossier /images
app.use('/images', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'images')));

// Connexion à la base MongoDB Atlas
mongoose.connect('mongodb+srv://arnaud:arnaud@cluster0.5pluzho.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));


// Middleware global pour gérer les erreurs CORS et autoriser les requêtes cross-origin
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// Middleware global pour parser les données JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/books', bookRoutes);
app.use('/api/auth',userRoutes);
module.exports = app;
