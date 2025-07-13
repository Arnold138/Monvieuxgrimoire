const express = require('express'); 
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const helmet = require('helmet');
const cookieParser = require('cookie-parser');


const bookRoutes = require('./routes/book');
const userRoutes = require('./routes/user');

// Middleware pour parser les cookies
app.use(cookieParser());

// Helmet pour sécuriser les headers HTTP
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);



// Middleware pour servir les images statiques depuis le dossier /images
app.use('/images', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'images')));

// Connexion à la base MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.error('MongoDB connection error:', err.message));


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
