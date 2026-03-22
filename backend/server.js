require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");

const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");

const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Socket setup
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("🚍 Bus Tracking API Running"); 
});



const socketHandler = require("./sockets/socketHandler");



const routeRoutes = require("./routes/routeRoutes");
const tripRoutes = require("./routes/tripRoutes");

app.use("/api/routes", routeRoutes);
// app.use("/api/trips", tripRoutes);






// Connect DB + Redis
connectDB();
connectRedis();
// after io creation
socketHandler(io);
 
// import socket logic
require("./routes/bus_tracking")(io);


// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});  