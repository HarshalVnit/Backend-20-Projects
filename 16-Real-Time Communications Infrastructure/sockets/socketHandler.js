// // const connectedUsers = {};

// // module.exports = (io) => {
// //     io.on('connection', (socket) => {
        
// //         // --- PHASE 2 EARS (Already exist) ---
// //         socket.on('user_joined', (username) => {
// //             connectedUsers[socket.id] = username;
// //             socket.emit('server_message', `Welcome, ${username}!`);
// //             socket.broadcast.emit('server_message', `${username} has entered the lobby.`);
// //             io.emit('active_users_list', Object.values(connectedUsers));
// //         });

// //         // ==========================================
// //         // --- PHASE 3 EARS (The New Pipelines) ---
// //         // ==========================================

// //         // 1. The Chat Ear
// //         socket.on('send_message', (messageText) => {
// //             const senderName = connectedUsers[socket.id];
            
// //             // We use BROADCAST. We send the message to everyone EXCEPT the sender.
// //             // (The sender's browser will draw their own message instantly).
// //             socket.broadcast.emit('receive_message', {
// //                 sender: senderName,
// //                 text: messageText
// //             });
// //         });

// //         // 2. The Typing Ear
// //         socket.on('typing', () => {
// //             const senderName = connectedUsers[socket.id];
// //             // Tell everyone else that this specific person is typing
// //             socket.broadcast.emit('user_typing', senderName);
// //         });

// //         // 3. The Stopped Typing Ear
// //         socket.on('stop_typing', () => {
// //             const senderName = connectedUsers[socket.id];
// //             socket.broadcast.emit('user_stopped_typing', senderName);
// //         });

// //         // ==========================================

// //         // --- PHASE 2 DISCONNECT EAR (Already exists) ---
// //         socket.on('disconnect', () => {
// //             const droppedUser = connectedUsers[socket.id];
// //             if (droppedUser) {
// //                 socket.broadcast.emit('server_message', `${droppedUser} has vanished.`);
// //                 delete connectedUsers[socket.id];
// //                 io.emit('active_users_list', Object.values(connectedUsers));
// //             }
// //         });
// //     });
// // };


// //for th phase 3.5 creatg rooms
// // 1. The Nested RAM Database
// // Structure: { "RoomName": { "socketId": "Username" } }
// const rooms = {
//     "General": {},
//     "Tech_Talk": {},
//     "Top_Secret": {}
// };

// module.exports = (io) => {
//     io.on('connection', (socket) => {
        
//         // Every user starts in General by default
//         let currentRoom = "General";

//         socket.on('user_joined', (username) => {
//             // A neat trick: We can attach the username directly to the socket object!
//             // This saves us from having to look it up in the database constantly.
//             socket.username = username;
            
//             // 2. THE MAGIC: Tell the physical network wire to join the "General" frequency
//             socket.join(currentRoom);
            
//             // Add them to our RAM Database
//             rooms[currentRoom][socket.id] = username;

//             // 3. The Room-Specific Announcements
//             // Notice we use `.to(currentRoom)`. This ensures people in Top_Secret don't hear this!
//             socket.emit('server_message', `Welcome to #${currentRoom}, ${username}!`);
//             socket.broadcast.to(currentRoom).emit('server_message', `${username} has joined #${currentRoom}.`);
//             io.to(currentRoom).emit('active_users_list', Object.values(rooms[currentRoom]));
//         });

//         // 4. THE CHANNEL SWITCHER
//         socket.on('switch_room', (newRoom) => {
//             // Step A: Clean up the old room
//             socket.leave(currentRoom); // Unplug from the old frequency
//             delete rooms[currentRoom][socket.id]; // Remove from RAM
//             socket.broadcast.to(currentRoom).emit('server_message', `${socket.username} left for #${newRoom}.`);
//             io.to(currentRoom).emit('active_users_list', Object.values(rooms[currentRoom]));

//             // Step B: Enter the new room
//             currentRoom = newRoom;
//             socket.join(currentRoom); // Plug into the new frequency
//             rooms[currentRoom][socket.id] = socket.username; // Add to RAM
            
//             socket.emit('server_message', `You teleported to #${currentRoom}.`);
//             socket.broadcast.to(currentRoom).emit('server_message', `${socket.username} just arrived.`);
//             io.to(currentRoom).emit('active_users_list', Object.values(rooms[currentRoom]));
//         });

//         // 5. The Targeted Chat Message
//         socket.on('send_message', (text) => {
//             // We NO LONGER use socket.broadcast.emit() alone.
//             // We combine it with .to() so the message stays inside the room walls.
//             socket.broadcast.to(currentRoom).emit('receive_message', {
//                 sender: socket.username,
//                 text: text
//             });
//         });

//         // 6. Targeted Disconnect
//         socket.on('disconnect', () => {
//             if (socket.username) {
//                 socket.broadcast.to(currentRoom).emit('server_message', `${socket.username} vanished from #${currentRoom}.`);
//                 delete rooms[currentRoom][socket.id];
//                 io.to(currentRoom).emit('active_users_list', Object.values(rooms[currentRoom]));
//             }
//         });
//     });
// };


///////COMMENTS EXPLANING



// // 2. The Illusion: What does socket.join("String") actually do?
// // It does not create a new physical network port.
// // It does not physically move the user's connection.
// // The physical copper wire connecting the user's browser to your Port 3000 remains exactly the same.

// // Instead, socket.join() operates purely as a Mailing List Subscriptions Manager (in computer science, this is called the Pub/Sub or Publish-Subscribe pattern).

// // Inside the deep, hidden source code of Socket.io, there is a giant Master Database called the Adapter. It looks exactly like this in your server's RAM:

// // JavaScript
// // // Socket.io's hidden internal memory (The Adapter)
// // io.sockets.adapter.rooms = {
// //     "General": Set { "a7x9_B2k", "c4m9_X1z" },
// //     "Tech_Talk": Set { "z9y2_C3j" },
// //     "Top_Secret": Set {}
// // }
// // Here is the exact step-by-step reality:

// // You write socket.join("Tech_Talk").

// // Socket.io takes that string ("Tech_Talk") and looks inside its hidden Adapter.

// // If the string doesn't exist yet, it creates a new empty JavaScript Set (a type of array that only holds unique values).

// // It takes the user's physical wire ID (socket.id, like "z9y2_C3j") and pushes it into that Set.
// // 3. The Execution: What happens when you .emit?
// // Now, imagine Neo is in "Tech_Talk" and types a message. You run this code:
// // socket.broadcast.to("Tech_Talk").emit('receive_message', ...)

// // Socket.io stops. It looks at the string "Tech_Talk".

// // It goes into its hidden Adapter and finds the "Tech_Talk" key.

// // It grabs the Set of IDs attached to that key.

// // The Routing Filter: Instead of iterating through every wire in the building, Socket.io loops only through the specific IDs in that Set. It drops the data down those specific wires and ignores everyone else.

// // A Room is nothing but a string key attached to an array of IDs.

//OIGINAL PHINAL PHASE CODE WIH ENCRYPTION
// 1. The Upgraded RAM Database
// Structure: { "RoomName": { "socketId": { username: "Neo", publicKey: "A8F1..." } } }
// 1. The Upgraded RAM Database
// Structure: { "RoomName": { "socketId": { username: "Neo", publicKey: "A8F1..." } } }
const rooms = { "General": {}, "Tech_Talk": {}, "Top_Secret": {} };

module.exports = (io) => {
    io.on('connection', (socket) => {
        let currentRoom = "General"; 

        // 2. We now expect a payload object: { username, publicKey }
        socket.on('user_joined', (payload) => {
            socket.username = payload.username;
            socket.publicKey = payload.publicKey; // Store their padlock on the socket
            
            socket.join(currentRoom);
            
            // Save BOTH to the RAM Database
            rooms[currentRoom][socket.id] = { 
                username: socket.username, 
                publicKey: socket.publicKey 
            };

            socket.broadcast.to(currentRoom).emit('server_message', `${socket.username} joined.`);
            
            // 3. Send the WHOLE dictionary (Names + Padlocks) to everyone in the room
            io.to(currentRoom).emit('active_users_list', rooms[currentRoom]);
        });

        // The Switcher expects a payload object: { newRoom: "Tech_Talk" }
        socket.on('switch_room', (payload) => {
            socket.leave(currentRoom); 
            delete rooms[currentRoom][socket.id]; 
            socket.broadcast.to(currentRoom).emit('server_message', `${socket.username} left.`);
            io.to(currentRoom).emit('active_users_list', rooms[currentRoom]);

            currentRoom = payload.newRoom;
            socket.join(currentRoom); 
            
            // Re-register their padlock in the new room
            rooms[currentRoom][socket.id] = { 
                username: socket.username, 
                publicKey: socket.publicKey 
            };
            
            socket.broadcast.to(currentRoom).emit('server_message', `${socket.username} arrived.`);
            io.to(currentRoom).emit('active_users_list', rooms[currentRoom]);
        });

        // 4. THE BLIND RELAY
        socket.on('send_encrypted_message', (encryptedBundle) => {
            // Log this to the terminal! This proves the server is blind!
            console.log("\n🔒 SERVER RELAYING ENCRYPTED BUNDLE:");
            console.log(encryptedBundle);

            socket.broadcast.to(currentRoom).emit('receive_encrypted_message', {
                senderName: socket.username,
                bundle: encryptedBundle
            });
        });

        socket.on('disconnect', () => {
            if (socket.username) {
                socket.broadcast.to(currentRoom).emit('server_message', `${socket.username} vanished.`);
                delete rooms[currentRoom][socket.id];
                io.to(currentRoom).emit('active_users_list', rooms[currentRoom]);
            }
        });
    });
};
//how encryption is done is at last pat of learning watch it to revise