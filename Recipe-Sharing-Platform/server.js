// server.js (Top of the file)
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors'); // ADD THIS
const connectDB = require('./config/db');

// ... (routes imports)

const app = express();

app.use(cors()); // ADD THIS right before express.json()
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Routes
app.use('/api/users', userRoutes);
app.use('/api/recipes', require('./routes/recipeRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Recipe Server running on port ${PORT}`);
});