const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const users = new Map();

io.on('connection', (socket) => {
  console.log('New connection');

  socket.on('setUsername', (username) => {
    if (!username) return;
    users.set(socket.id, username);
    socket.username = username;
    socket.emit('usernameSet', { username });
  });

  socket.on('chatMessage', (message) => {
    if (!socket.username) return;
    io.emit('chatMessage', {
      username: socket.username,
      message: message,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chatterbox running on port ${PORT}`);
});
