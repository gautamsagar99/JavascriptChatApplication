const http = require("http");
const socketIO = require("socket.io");
const fs = require("fs");

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    fs.readFile("index.html", "utf8", (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end("Error loading index.html");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      }
    });
  }
});

const io = socketIO(server);

const connectedUsers = new Map();
const chatHistory = []; // Declare and initialize chatHistory array

const emitUserIds = () => {
  const userIDs = Array.from(connectedUsers.values());
  io.emit("user ids", userIDs);
};

io.on("connection", (socket) => {
  console.log("A user connected.");

  socket.on("register user", (username) => {
    connectedUsers.set(socket.id, username);
    console.log(`User ${username} connected.`);
    emitUserIds();
    socket.emit("chat history", chatHistory);
  });

  socket.on("chat message", ({ recipient, message }) => {
    const sender = connectedUsers.get(socket.id);
    const recipientSocket = Array.from(connectedUsers.entries()).find(
      ([_, username]) => username === recipient
    )?.[0];

    const chatMessage = {
      sender,
      recipient,
      message,
      timestamp: new Date().toISOString(),
    };

    chatHistory.push(chatMessage);

    if (recipientSocket) {
      io.to(recipientSocket).emit("chat message", chatMessage);
    }
  });

  socket.on("disconnect", () => {
    const username = connectedUsers.get(socket.id);
    connectedUsers.delete(socket.id);
    console.log(`User ${username} disconnected.`);
    emitUserIds();
  });
});

server.listen(3000, () => {
  console.log("Server started on port 3000.");
});
