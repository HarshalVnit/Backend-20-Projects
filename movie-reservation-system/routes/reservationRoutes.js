const express = require('express');
const router = express.Router();
// Import the new function
const verifyToken = require('../middleware/authMiddleware'); // Import the bouncer
const { createReservation, checkoutReservation, getUserTickets } = require('../controllers/reservationController');

router.post('/', verifyToken,createReservation);
router.post('/:id/checkout',verifyToken, checkoutReservation);

// NEW ROUTE: Get a user's tickets
router.get('/user/:userId', verifyToken,getUserTickets);

module.exports = router;