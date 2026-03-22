const {redisClient} = require("../config/redis");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 New client connected:", socket.id);

    // 🚌 SEND LOCATION (NOW USING SLOT)
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

        // ✅ Store in Redis
        await redisClient.set(
          `slot:${slotId}`,
          JSON.stringify(payload)
        );

        // ✅ Broadcast
        io.emit("receiveLocation", payload);

        console.log("📍 Slot Location Updated:", payload);
      } catch (err) {
        console.log("❌ Error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });
}