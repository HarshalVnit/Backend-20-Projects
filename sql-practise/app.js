const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

// 🛑 CRITICAL MIDDLEWARE: 
// This tells our Express waiter, "If the frontend sends you data (like IDs for a booking), 
// it will be in JSON format. Please parse it so we can read it."
app.use(express.json());

// ==========================================
// 🗺️ OUR API ENDPOINTS (ROUTES)
// ==========================================

// 1. GET /workouts (The "Menu")
// Frontend asks: "What classes are available?"
app.get('/workouts', async (req, res) => {
  try {
    // Tell Prisma to fetch every row in the WorkoutType table
    const workouts = await prisma.workoutType.findMany();
    
    // Send it back to the frontend as a JSON response
    res.json(workouts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong fetching workouts" });
  }
});


// 2. POST /book (The "Order")
// Frontend says: "I want to book Member #1 into Workout #1"
app.post('/book', async (req, res) => {
  try {
    // 1. Grab the dynamic IDs sent from the frontend request body
    const { memberId, workoutId } = req.body;

    // 2. Tell Prisma to create the Reservation (The Bridge)
    const booking = await prisma.reservation.create({
      data: {
        memberId: memberId,     
        workoutId: workoutId    
      }
    });

    // 3. Do our magic JOIN to get the full ticket details
    const fullTicket = await prisma.reservation.findUnique({
      where: { id: booking.id },
      include: {
        member: true,
        workout: true
      }
    });

    // 4. Send the beautiful ticket back to the frontend
    res.status(201).json({ 
      message: "Ticket successfully booked! 🎉", 
      ticket: fullTicket 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to book the class" });
  }
});

// ==========================================
// 🚀 START THE SERVER
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Express Server is running!`);
  console.log(`👉 View Workouts: http://localhost:${PORT}/workouts`);
});