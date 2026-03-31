const pool = require('../config/db');

// @desc    Create a new movie reservation
// @route   POST /api/reservations
const createReservationwithouttimer = async (req, res) => {
  // 1. Extract the data the user sent us from the frontend
  const { user_id, showtime_id, seat_number } = req.body;

  // Validate that they sent all required fields
  if (!user_id || !showtime_id || !seat_number) {
    return res.status(400).json({ error: 'Please provide user_id, showtime_id, and seat_number.' });
  }

  // 2. 🔥 GRAB A DEDICATED PHONE LINE 🔥
  // We cannot use pool.query() here. We need a dedicated client for a transaction.
  const client = await pool.connect();

  try {
    // 3. Start the Transaction (Lock the doors)
    await client.query('BEGIN');

    // 4. Try to insert the reservation
    const insertQuery = `
      INSERT INTO reservations (user_id, showtime_id, seat_number)
      VALUES ($1, $2, $3)
      RETURNING id, seat_number, status;
    `;
    
    // We use our dedicated 'client', NOT the 'pool'//micrsoscopic lock on speciic seat 
      const result = await client.query(insertQuery, [user_id, showtime_id, seat_number]);
    //   The Lock: Because of our UNIQUE(showtime_id, seat_number) rule, the database places a microscopic lock on that specific seat for that specific showtime. If Hacker Bob's request comes in right now, the database forces him to pause and wait.

    // 5. If the insert succeeds, we COMMIT (save it permanently)
    await client.query('COMMIT');

    res.status(201).json({
      message: '🎉 Reservation successful!',
      ticket: result.rows[0]
    });

  } catch (error) {
    // 6. IF ANYTHING FAILS, WE ROLLBACK (Undo everything!)
    await client.query('ROLLBACK');

    // 7. Handle the "Seat Already Taken" error
    // Postgres error code '23505' specifically means "Unique Constraint Violation"
    if (error.code === '23505') {
      return res.status(409).json({ error: `Seat ${seat_number} is already booked for this showtime!` });
    }

    // If it's a different error, log it
    console.error('Transaction Error:', error);
    res.status(500).json({ error: 'Internal Server Error during reservation.' });

  } finally {
    // 8. Always release the client back to the pool, whether it succeeded or failed!
    client.release();
  }
};
const createReservation = async (req, res) => {
  // 1. Extract the data the user sent us from the frontend
  const { showtime_id, seat_number } = req.body;
const user_id = req.user.id; // Securely pulled from the JWT, not the easily-faked request body!

  // Validate that they sent all required fields
  if (!user_id || !showtime_id || !seat_number) {
    return res.status(400).json({ error: 'Please provide user_id, showtime_id, and seat_number.' });
  }

  // 2. 🔥 GRAB A DEDICATED PHONE LINE 🔥
  // We cannot use pool.query() here. We need a dedicated client for a transaction.
  const client = await pool.connect();

//  try {
//     // 1. Start the Transaction
//     await client.query('BEGIN');

//     // 2. Calculate exactly 5 minutes from right now in JavaScript
//     // Date.now() gets the current time in milliseconds. We add 5 mins (5 * 60 seconds * 1000 ms)
//     const expiresAt = new Date(Date.now() + 10 * 1000);

//     // 3. The updated SQL query
//     // Notice we added 'status' and 'expires_at' to the INSERT list, and $4
//     // const insertQuery = `
//     //   INSERT INTO reservations (user_id, showtime_id, seat_number, status, expires_at)
//     //   VALUES ($1, $2, $3, 'pending', $4)
//     //   RETURNING id, seat_number, status, expires_at;
//     // `;
    
//     // // 4. Execute the query, passing our new expiresAt variable as $4
//     // const result = await client.query(insertQuery, [user_id, showtime_id, seat_number, expiresAt]);
// // We REMOVED the Javascript 'expiresAt' calculation completely.
//     //cacleed this because different regions hve diffeent time zones to testing problem
//     // Look at the VALUES. We changed $4 to: NOW() + INTERVAL '30 seconds'
//     const insertQuery = `
//       INSERT INTO reservations (user_id, showtime_id, seat_number, status, expires_at)
//       VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '30 seconds')
//       RETURNING id, seat_number, status, expires_at;
//     `;
    
//     // We only pass 3 variables now, because the database handles the 4th!
//     const result = await client.query(insertQuery, [user_id, showtime_id, seat_number]);
//     // 5. Commit the transaction
//     await client.query('COMMIT');

//     res.status(201).json({
//       message: '⏳ Seat held! You have 5 minutes to complete payment.',
//       ticket: result.rows[0]
//     });

//   }
try {
    await client.query('BEGIN');

    // ==========================================
    // 🧹 THE PRE-SWEEP (Fixes the Garbage Truck Gap)
    // ==========================================
    // If the seat is technically expired, but the 60-second background 
    // sweeper hasn't gotten to it yet, we delete it right now!
    const preSweepQuery = `
      DELETE FROM reservations 
      WHERE showtime_id = $1 AND seat_number = $2 AND expires_at < NOW();
    `;
    await client.query(preSweepQuery, [showtime_id, seat_number]);


    // ==========================================
    // 🎟️ THE INSERT
    // ==========================================
    const insertQuery = `
      INSERT INTO reservations (user_id, showtime_id, seat_number, status, expires_at)
      VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '100 seconds')
      RETURNING id, seat_number, status, expires_at;
    `;
    
    const result = await client.query(insertQuery, [user_id, showtime_id, seat_number]);

    await client.query('COMMIT');

    res.status(201).json({
      message: '⏳ Seat held! You have 30 seconds to complete payment.',
      ticket: result.rows[0]
    });

  }
catch (error) {
    // 6. IF ANYTHING FAILS, WE ROLLBACK (Undo everything!)
    await client.query('ROLLBACK');

    // 7. Handle the "Seat Already Taken" error
    // Postgres error code '23505' specifically means "Unique Constraint Violation"
    if (error.code === '23505') {
      return res.status(409).json({ error: `Seat ${seat_number} is already booked for this showtime!` });
    }

    // If it's a different error, log it
    console.error('Transaction Error:', error);
    res.status(500).json({ error: 'Internal Server Error during reservation.' });

  } finally {
    // 8. Always release the client back to the pool, whether it succeeded or failed!
    client.release();
  }
};
//while reservation we didint check if seat is empty or not becoz
// UNIQUE(showtime_id, seat_number)
// We turned the database itself into a bouncer.
// We literally just yell: "Hey database, insert this ticket for Bob at Seat A1!" The database engine has the UNIQUE rule hardcoded into its DNA

//actually i anted to add timeer facilty in my code but models and data base physically was actually created,so there was no chance to change model type as it will not accept so,
// we had to create upgrade.json



//checkout
// @desc    Process payment and confirm reservation
// @route   POST /api/reservations/:id/checkout
const checkoutReservation = async (req, res) => {
  try {
    const reservationId = req.params.id;
    const { credit_card } = req.body;

    // 1. Basic validation
    if (!credit_card) {
      return res.status(400).json({ error: 'Credit card information is required to checkout.' });
    }

    // 2. Mock Payment Processing (Imagine Stripe is doing this)
    console.log(`💳 Processing payment for reservation ${reservationId}...`);
    // If the card is fake/invalid, we would throw an error here.
    // For now, we assume all cards are approved!
    
    // 3. The Ultimate UPDATE Query
    // We only update it IF it is currently 'pending'. 
    // If it was already deleted by the sweeper, this will update 0 rows!
    // We added: AND expires_at > NOW()
    //we have a flaw our delay is of  30 sec but main sweep is of 60 sec so if user makes payment on 45th sec thats why we addd this condition to check if seat is expired or not at the time of payment
    const updateQuery = `
      UPDATE reservations 
      SET status = 'confirmed' 
      WHERE id = $1 
        AND status = 'pending' 
        AND expires_at > NOW()
      RETURNING id, seat_number, status;
    `;

      const result = await pool.query(updateQuery, [reservationId]);//if reservation id ont found then it does nothing
//       result.rowCount: A simple number telling you how many rows were updated, deleted, or inserted.

// result.rows: The actual data.

      // 4. Check if the ticket survived the sweeper
      //rowcoutn How many rows did this specific query successfully change?"
    if (result.rowCount === 0) {
      return res.status(400).json({ 
        error: 'Checkout failed. This reservation expired or does not exist. Please pick a new seat.' 
      });
    }

    // 5. Success!
    res.status(200).json({
      message: '🎉 Payment successful! Your seat is permanently confirmed.',
      ticket: result.rows[0]
    });

  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ error: 'Internal Server Error during checkout.' });
  }
};
// @desc    Get all tickets for a specific user
// @route   GET /api/reservations/user/:userId
const getUserTickets = async (req, res) => {
  try {
    const userId = req.params.userId;

    // The 3-Table JOIN
    // We start at reservations, attach the matching showtime, and then attach the matching movie.
    const query = `
      SELECT 
        reservations.id AS ticket_id,
        reservations.seat_number,
        reservations.status,
        showtimes.start_time,
        movies.title AS movie_title
      FROM reservations
      JOIN showtimes ON reservations.showtime_id = showtimes.id
      JOIN movies ON showtimes.movie_id = movies.id
      WHERE reservations.user_id = $1
      ORDER BY showtimes.start_time DESC;
    `;

    // We don't need a transaction ('BEGIN'/'COMMIT') here because we are only READING data, not changing it!
    const result = await pool.query(query, [userId]);

    res.status(200).json({
      total_tickets: result.rowCount,
      tickets: result.rows
    });

  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ error: 'Internal Server Error fetching tickets.' });
  }
};
module.exports = {
    createReservation,
    checkoutReservation,
    getUserTickets
    
};
//notye:WHEN WE DIDNT HAD PAYMENT GTEWAY WHAT WE DID WAS WE CRATED SWEEP EVERY 60 DEC IN SERVER AND HERE OUT DELAY WAS OF 30 SEC SO AFTER 4TH SEC OF ANOTHER USER TRI TO BOOK THEN THE ISSSUE WAS THAT  SEAT WAS EXPIRED BU SWEEP WAS GONNA STARTAT 6-0 SEC SO WE UT SWEEP INSIDE BOOKING FTN EVERYTIME BEFORE BOKING