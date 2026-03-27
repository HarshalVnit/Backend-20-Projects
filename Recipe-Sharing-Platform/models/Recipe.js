const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    ingredients: [
      {
        type: String,
        required: true,
      },
    ],
    instructions: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true, // e.g., "Dessert", "Vegan", "Dinner"
    },
    image: {
      type: String,
      required: true, // NEW: We will save the file path (e.g., "/uploads/cake.jpg") here!
    },
    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Links to the User who uploaded it (just like the Fitness Tracker!)
      required: true,
    },
  },
  { timestamps: true },
);

// 🚨 THE NEW TRICK: Full-Text Search Index
// Instead of searching exactly for "Spicy Chicken", this creates a Google-style search index.
// It tells MongoDB to scan these three specific fields whenever the user uses the search bar.
recipeSchema.index({ title: "text", description: "text", category: "text" });

module.exports = mongoose.model("Recipe", recipeSchema);
