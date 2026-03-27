const express = require('express');
const router = express.Router();

// Import our Middlewares
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Import our Controller
const { createRecipe } = require('../controllers/recipeController');

// @route   POST /api/recipes
// @access  Private
// Notice the exact order of the pipeline here!
router.post('/', protect, upload.single('image'), createRecipe);

module.exports = router;