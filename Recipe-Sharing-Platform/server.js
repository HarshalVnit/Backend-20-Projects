const express = require('express');
const dotenv = require('dotenv');
const path = require('path'); // Node built-in for file paths
const connectDB = require('./config/db');

// Route Imports
const userRoutes = require('./routes/userRoutes');
const recipeRoutes = require('./routes/recipeRoutes');

dotenv.config();
connectDB();

const app = express();

// 1. Standard Middleware
app.use(express.json());

// 2. 🚨 THE NEW PART: Static Folder Middleware
// This tells Express: "If someone asks for a file in /uploads, look in the physical uploads folder"
// Without this line, your image URLs will all return 404 Not Found!
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Routes
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Recipe Server running on port ${PORT}`);
});