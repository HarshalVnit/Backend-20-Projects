const Recipe = require('../models/Recipe.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs'); // Built-in Node module for interacting with the File System

// @desc    Create a new recipe with an image
// @route   POST /api/recipes
// @access  Private
const createRecipe = async (req, res) => {
    try {
        // 1. Did Multer actually catch a file?
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image for your recipe.' });
        }

        // 2. Create a safe, unique filename 
        // We add Date.now() so if two people upload "cake.jpg" at the same time, they don't overwrite each other.
        const filename = `recipe-${Date.now()}.jpeg`;
        
        // This builds the exact folder path on your computer: e.g., "C:/your_project/uploads/recipe-12345.jpeg"
        const filepath = path.join(__dirname, '../uploads', filename);

        // (Optional but smart): If the 'uploads' folder doesn't exist yet, Node creates it automatically!
        if (!fs.existsSync(path.join(__dirname, '../uploads'))) {
            fs.mkdirSync(path.join(__dirname, '../uploads'));
        }

        // 3. 🪄 THE SHARP MAGIC 🪄
        // We feed Sharp the raw RAM data (req.file.buffer) that Multer prepared for us.
        await sharp(req.file.buffer)
            .resize(500, 500, { fit: 'cover' }) // Crops the image into a perfect 500x500 square (no stretching!)
            .toFormat('jpeg')                   // Forces the image to be a JPEG (even if they uploaded a PNG)
            .jpeg({ quality: 80 })              // Compresses the file size by 20% to keep your server fast
            .toFile(filepath);                  // Finally, saves the optimized image to your uploads folder!

        // 4. Handle the Ingredients array
        // Because multipart/form-data sends everything as text strings, an array like ["salt", "pepper"] 
        // usually arrives as a single string: "salt, pepper". We need to split it back into an array!
        // We check if it's a string. Sometimes, advanced React frontends actually do figure out how to send a proper array. If it's already an array, we skip the math entirely. But in our case, it's a string, so we proceed inside the if block.
        let parsedIngredients = req.body.ingredients;
        if (typeof req.body.ingredients === 'string') {
            parsedIngredients = req.body.ingredients.split(',').map(item => item.trim());
        }
//         The .split(',') function takes the giant string and chops it into an Array every time it sees a comma.

// Result: ["Eggs", " Cheese", "  Salt ", " Pepper"]

        // 5. Save everything to MongoDB
        const recipe = await Recipe.create({
            title: req.body.title,
            description: req.body.description,
            ingredients: parsedIngredients,
            category: req.body.category,
            instructions: req.body.instructions,
            image: `/uploads/${filename}`, // We only save the TEXT path in the database!
            chef: req.user._id             // The Bouncer (protect middleware) gives us this!
        });

        res.status(201).json({ 
            message: 'Recipe created successfully!', 
            recipe 
        });

    } catch (error) {
        console.error("RECIPE CREATION BUG:", error);
        res.status(500).json({ message: 'Server error while creating recipe' });
    }
};

// @desc    Get all recipes (with Search and Pagination)
// @route   GET /api/recipes
// @access  Public (Anyone can search recipes!)
const getRecipes = async (req, res) => {
    try {
        // 1. Grab query parameters from the URL (e.g., ?page=2&limit=10&search=cake)
        // If they don't provide them, we default to Page 1, and 10 items per page.
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || '';

        // 2. The Pagination Math
        // If we are on Page 3, and limit is 10: (3 - 1) * 10 = Skip the first 20 items!
        const skip = (page - 1) * limit;

        // 3. Build the Database Query
        let query = {};
        
        // If the user typed something in the search bar, trigger our Full-Text Index!
        if (search) {
            query.$text = { $search: search };
        }

        // 4. Fetch the Data!
        const recipes = await Recipe.find(query)
            .skip(skip)
            .limit(limit)
            .populate('chef', 'userName') // Get the Chef's name, but hide their password/email!
            .sort({ createdAt: -1 });     // Show newest recipes first

        // 5. Count total documents (so the frontend knows how many pages exist)
        const totalRecipes = await Recipe.countDocuments(query);

        res.status(200).json({
            recipes,
            currentPage: page,
            totalPages: Math.ceil(totalRecipes / limit),
            totalResults: totalRecipes
        });

    } catch (error) {
        console.error("FETCH RECIPES BUG:", error);
        res.status(500).json({ message: 'Server error while fetching recipes' });
    }
};
module.exports = {
    createRecipe,
    getRecipes 

};