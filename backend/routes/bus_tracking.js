const { redisClient } = require("../config/redis");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.id);

    // 🔒 Track user's active slot
    socket.currentSlot = null;

    // =========================
    // ✅ JOIN SLOT ROOM
    // =========================
    socket.on("joinSlot", async ({ slotId }) => {
      try {
        if (!slotId) return;

        const room = `slot:${slotId}`;

        // 🚪 Leave previous slot if exists
        if (socket.currentSlot) {
          socket.leave(`slot:${socket.currentSlot}`);
        }

        // ✅ Check slot exists in Redis
        const details = await redisClient.get(`slot:${slotId}:details`);
        if (!details) {
          console.log("❌ Slot not found in Redis");
          return;
        }

        socket.join(room);
        socket.currentSlot = slotId;

        console.log(`👥 ${socket.id} joined ${room}`);

        // 📍 Send last known location
        const last = await redisClient.get(`slot:${slotId}:location`);
        if (last) {
          socket.emit("receiveLocation", JSON.parse(last));
        }

      } catch (err) {
        console.log("❌ joinSlot error:", err);
      }
    });

    // =========================
    // 🚌 SEND LOCATION (DRIVER)
    // =========================
    socket.on("sendLocation", async (data) => {
      try {
        const { slotId, lat, lng } = data;
        if (!slotId || lat == null || lng == null) return;

        // ✅ Check slot status
        const detailsRaw = await redisClient.get(`slot:${slotId}:details`);
        if (!detailsRaw) return;

        const details = JSON.parse(detailsRaw);

        if (details.status !== "running") {
          console.log("⛔ Location blocked (slot not running)");
          return;
        }

        const payload = {
          slotId,
          lat,
          lng,
          updated_at: Date.now(),
        };

        // 💾 Save in Redis
        await redisClient.set(
          `slot:${slotId}:location`,
          JSON.stringify(payload)
        );

        // 🚀 Emit to room
        io.to(`slot:${slotId}`).emit("receiveLocation", payload);

        console.log("📍 Location broadcast:", slotId);

      } catch (err) {
        console.log("❌ sendLocation error:", err);
      }
    });

    // =========================
    // 🚪 LEAVE SLOT
    // =========================
    socket.on("leaveSlot", ({ slotId }) => {
      try {
        if (!slotId) return;

        socket.leave(`slot:${slotId}`);

        if (socket.currentSlot === slotId) {
          socket.currentSlot = null;
        }

        console.log(`🚪 ${socket.id} left slot:${slotId}`);
      } catch (err) {
        console.log("❌ leaveSlot error:", err);
      }
    });

    // =========================
    // 🔴 DISCONNECT
    // =========================
    socket.on("disconnect", () => {
      if (socket.currentSlot) {
        console.log(
          `🔴 ${socket.id} disconnected from slot:${socket.currentSlot}`
        );
      } else {
        console.log("🔴 Disconnected:", socket.id);
      }
    });
  });
};