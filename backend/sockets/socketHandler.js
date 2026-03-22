const { client } = require("../config/redis");

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 Connected:", socket.id);

    // 👤 USER joins route room
    socket.on("joinRoute", (routeId) => {
      socket.join(routeId);
      console.log(`User joined route ${routeId}`);
    });

    // 🧑‍✈️ DRIVER sends location
    socket.on("locationUpdate", async (data) => {
      try {
        const { tripId, busId, routeId, lat, lng } = data;

        const payload = {
          tripId,
          busId,
          lat,
          lng,
          timestamp: Date.now()
        };

        // 🔥 store in Redis
        await client.set(`trip:${tripId}`, JSON.stringify(payload));

        // 🔥 broadcast to route room
        io.to(routeId).emit("busLocation", payload);

      } catch (err) {
        console.error("Socket error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);
    });
  });
};

module.exports = socketHandler;