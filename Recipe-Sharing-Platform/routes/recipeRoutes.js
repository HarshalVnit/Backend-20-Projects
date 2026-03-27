// routes/recipeRoutes.js
const express = require('express');
const router = express.Router();
// FIX 1: Change searchRecipes to getRecipes
const { createRecipe, getRecipes } = require('../controllers/recipeController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.single('image'), createRecipe);
// FIX 2: Change to getRecipes
router.get('/', getRecipes);

module.exports = router;