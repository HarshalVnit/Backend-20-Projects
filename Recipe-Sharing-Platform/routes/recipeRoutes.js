const express = require('express');
const router = express.Router();
const { createRecipe, searchRecipes } = require('../controllers/recipeController'); // Ensure searchRecipes is imported
const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Route for uploading a recipe
router.post('/', protect, upload.single('image'), createRecipe);

// ADD THIS LINE: Route for searching/getting recipes
router.get('/', searchRecipes); 

module.exports = router;