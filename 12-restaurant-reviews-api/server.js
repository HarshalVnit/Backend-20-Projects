require('dotenv').config();
require('.//config/redisClient.js');
// How did require('./config/redisClient') run automatically?
// In Node.js, require() does not just "copy and paste" code. When you use require() on a file for the first time, Node.js instantly executes every single line of code in that file from top to bottom.

// Look at what we wrote at the very bottom of redisClient.js:

// JavaScript
// // 3. Run the pulse check
// testRedisConnection(); 
// Because that function call was sitting right out in the open, the exact millisecond server.js read the require line, Node ran over to redisClient.js, read the file, hit that function, and fired the ignition.

// We didn't assign it to a variable (like const redis = require(...)) because we didn't need to use it inside server.js. We only wanted the "side effect" of the file turning on the engine. In Enterprise Node.js, this is called a "Side-Effect Import."
const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Alive' });
});

// --- NEW ROUTE WIRING ---
const reviewRoutes = require('./routes/reviewRoutes'); // <-- ADD THIS
app.use('/api/reviews', reviewRoutes);                 // <-- ADD THIS

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ## 📝 Architect's Note: Scope & Focus

// If you are reviewing this repository, you might notice the absence of a User Authentication (JWT) module or an Admin CRUD interface for creating new restaurants. 

// This omission is **intentional**. 

// The sole architectural focus of this microservice was to demonstrate the **Hybrid Data Pipeline** (combining PostgreSQL, Redis In-Memory caching, and local NLP analysis). 

// Standard user authentication, role-based access control (RBAC), and standard CRUD operations were extensively covered and demonstrated in my previous architecture: **[Insert Link to your Movie Theater Repo Here]**. 

// In a true microservices environment, this Restaurant Review engine would simply sit behind an API Gateway, receiving pre-authenticated `user_id` payloads from a dedicated Identity Service.