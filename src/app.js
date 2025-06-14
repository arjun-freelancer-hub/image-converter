const express = require('express');
const path = require('path');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const ErrorHandler = require('./middleware/errorHandler');

// Create Express app
const app = express();

// Set up view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../views'));

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json({ limit: config.maxFileSize }));
app.use(express.urlencoded({ limit: config.maxFileSize, extended: true }));

// Routes
app.use(routes);

// Error handling
app.use(ErrorHandler.handle);

module.exports = app; 