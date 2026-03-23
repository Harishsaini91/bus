const { redisClient } = require("../config/redis");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.id);

    // ✅ USER JOINS SLOT
   socket.on("joinSlot", async ({ slotId }) => {
  const room = `slot:${slotId}`;
  socket.join(room);

  // send last known location
  const last = await redisClient.get(`slot:${slotId}`);
  if (last) {
    socket.emit("receiveLocation", JSON.parse(last));
  }
});

    // 🚌 SEND LOCATION
    socket.on("sendLocation", async (data) => {
      try {
        const { slotId, lat, lng } = data;
        if (!slotId) return;

        const payload = {
          slotId,
          lat,
          lng,
          time: Date.now(),
        };

        // store in Redis
        await redisClient.set(
          `slot:${slotId}`,
          JSON.stringify(payload)
        );

        // 🔥 SEND ONLY TO ROOM
        io.to(`slot:${slotId}`).emit("receiveLocation", payload);

        console.log("📍 Sent to room:", `slot:${slotId}`);
      } catch (err) {
        console.log("❌ Error:", err);
      }
    });



    socket.on("leaveSlot", ({ slotId }) => {
  socket.leave(`slot:${slotId}`);
});

    socket.on("disconnect", () => {
      console.log("🔴 Disconnected:", socket.id);
    });
  });
};