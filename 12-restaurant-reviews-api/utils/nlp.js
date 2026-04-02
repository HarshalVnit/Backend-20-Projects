const Sentiment = require('sentiment');

// Initialize the AI
const sentimentAnalyzer = new Sentiment();

/**
 * Reads a text review and returns an AI sentiment score.
 * @param {string} text - The review text provided by the user.
 * @returns {object} - Contains the raw score and a human-readable label.
 */
const analyzeReview = (text) => {
  // 1. Run the AI on the text
  const result = sentimentAnalyzer.analyze(text);

  // 2. Extract the raw numerical score
  const score = result.score;

  // 3. Translate the score into a database-friendly label
  let label = 'neutral';
  if (score > 0) {
    label = 'positive';
  } else if (score < 0) {
    label = 'negative';
  }

  // 4. Return the data payload
  return {
    score: score,
    label: label,
    comparative: result.comparative, // Score adjusted for length of the sentence
    words_matched: result.words // See exactly which words the AI recognized
  };
};

module.exports = { analyzeReview };