const pool = require('../config/db');
const { analyzeReview } = require('../utils/nlp');
const redisClient = require('../config/redisClient'); // <-- 1. Import Redis!

// @desc    Submit a review, run AI, save to SQL, and update Redis
const submitReview = async (req, res) => {
  try {
    const { restaurant_id, review_text } = req.body;

    if (!restaurant_id || !review_text) {
      return res.status(400).json({ error: 'Restaurant ID and Review Text are required.' });
    }

    // 2. The AI Brain processes the text
    const aiResult = analyzeReview(review_text);
    const nlp_score = aiResult.score; 

    // 3. The SQL Vault saves the permanent record
    const insertQuery = `
      INSERT INTO reviews (restaurant_id, review_text, nlp_score)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;
    await pool.query(insertQuery, [restaurant_id, review_text, nlp_score]);

    // 4. The Redis Engine updates the Live Leaderboard!
    await redisClient.zincrby('restaurant_leaderboard', nlp_score, restaurant_id.toString());

    res.status(201).json({
      message: 'Review analyzed, saved, and leaderboard updated!',
      ai_score: nlp_score
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// @desc    Fetch the Top Restaurants instantly from Memory
const getLeaderboard = async (req, res) => {
  try {
    // 5. Ask Redis for the Top 10 list
    const rawLeaderboard = await redisClient.zrange('restaurant_leaderboard', 0, 9, { 
      rev: true, 
      withScores: true 
    });

    // 6. Format the Upstash Redis array into a beautiful JSON object
    const formattedLeaderboard = [];
    for (let i = 0; i < rawLeaderboard.length; i += 2) {
      formattedLeaderboard.push({
        restaurant_id: rawLeaderboard[i],
        total_score: rawLeaderboard[i + 1]
      });
    }

    res.status(200).json({ 
      title: '🏆 Top Restaurants Live Leaderboard',
      leaderboard: formattedLeaderboard 
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { submitReview, getLeaderboard };


// await redisClient.zincrby('restaurant_leaderboard', nlp_score, restaurant_id.toString());

// Explanation: This is the magic of Redis Sorted Sets (ZSET). zincrby stands for "Z-Set Increment By".

// It tells Redis: "Look at the list named restaurant_leaderboard. Find restaurant_id. Add this nlp_score to its total."

// If the restaurant isn't on the board yet, Redis automatically creates it. As soon as the number changes, Redis instantly re-sorts the entire leaderboard in a fraction of a millisecond. No SQL ORDER BY needed!