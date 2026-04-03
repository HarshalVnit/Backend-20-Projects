const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let waitingPlayer = null;
// const activeGames = {}; // <-- NEW: The global memory bank for all matches

const activeGames = {}; // Global memory bank

io.on('connection', (socket) => {
    console.log(`🟢 Player connected: ${socket.id}`);

    if (waitingPlayer) {
        const roomName = `room-${waitingPlayer.id}-${socket.id}`;
        socket.join(roomName);
        waitingPlayer.join(roomName);

        activeGames[roomName] = {
            player1: waitingPlayer.id,
            player2: socket.id,
            boards: {}, 
            readyCount: 0,
            turn: null // <-- NEW: Keeps track of whose turn it is
        };

        socket.roomName = roomName;
        waitingPlayer.roomName = roomName;

        io.to(roomName).emit('gameStart', { 
            message: 'Opponent found! Place your 3 ships on the bottom board.',
            room: roomName
        });

        waitingPlayer = null;

    } else {
        waitingPlayer = socket;
        socket.emit('waiting', { message: 'Waiting for an opponent to join...' });
    }

    socket.on('lockShips', (shipCoordinates) => {
        const room = socket.roomName;
        
        if (room && activeGames[room]) {
            activeGames[room].boards[socket.id] = shipCoordinates;
            activeGames[room].readyCount += 1;

            if (activeGames[room].readyCount === 2) {
                // --- NEW: Set the turn to Player 1 and start the game! ---
                activeGames[room].turn = activeGames[room].player1;
                
                io.to(room).emit('battleStarts', { 
                    message: 'Battle begins!',
                    turn: activeGames[room].turn 
                });
            } else {
                socket.emit('waiting', { message: 'Ships locked! Waiting for opponent...' });
            }
        }
    });

    // --- NEW: The Combat Logic ---
    socket.on('fire', (targetId) => {
        const room = socket.roomName;
        const game = activeGames[room];

        // 1. Security Check: Is the game real, and is it actually this player's turn?
        if (!game || game.turn !== socket.id) return; 

        // 2. Identify the enemy
        const opponentId = (game.player1 === socket.id) ? game.player2 : game.player1;
        const opponentShips = game.boards[opponentId];

        // 3. Hit Detection
        let isHit = false;
        const shipIndex = opponentShips.indexOf(targetId);

        if (shipIndex !== -1) {
            isHit = true;
            opponentShips.splice(shipIndex, 1); // Destroy that piece of the ship!
        }

        // 4. Check for Winner
        if (opponentShips.length === 0) {
            io.to(room).emit('gameOver', {
                message: `Game Over!`,
                winner: socket.id
            });
            delete activeGames[room]; // Clean up RAM!
            return;
        }

        // 5. Change Turns
        game.turn = opponentId;

        // 6. Broadcast the result of the shot to BOTH players
        io.to(room).emit('fireResult', {
            shooter: socket.id,
            targetId: targetId,
            hit: isHit,
            nextTurn: game.turn
        });
    });

    socket.on('disconnect', () => {
        console.log(`🔴 Player disconnected: ${socket.id}`);
        if (waitingPlayer === socket) waitingPlayer = null;
    });
});
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Battleship Server running on http://localhost:${PORT}`);
});