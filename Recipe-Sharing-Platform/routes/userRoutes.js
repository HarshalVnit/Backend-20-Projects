const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController');

// routes/userRoutes.js
router.post('/', registerUser); // Now maps to /api/users
router.post('/login', loginUser); // Maps to /api/users/login

module.exports = router;