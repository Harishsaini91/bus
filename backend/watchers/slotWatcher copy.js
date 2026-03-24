const Slot = require("../models/Slot");

function watchSlots(io, redisClient) {
  console.log("👀 Watching slots collection...");

  const changeStream = Slot.watch([], {
    fullDocument: "updateLookup"
  });

  changeStream.on("change", async (change) => {
    console.log("🔥 Slot changed:", change.operationType);

    try {
      console.log("🔄 Fetching latest slots...");

      const slots = await Slot.find({ is_active: true })
        .select("_id route_id slot_name start_time journey_date status driver_id")
        .lean();

      console.log("📦 Slots count:", slots.length);

      // 🔥 CLEAR OLD CACHE
      const keys = await redisClient.keys("slot:*");
      if (keys.length) await redisClient.del(keys);

      // 🔄 REBUILD ALL
      for (const s of slots) {
        const slotId = String(s._id);
        const routeId = String(s.route_id);

        const routeKey = `slot:${slotId}:route`;
        const detailsKey = `slot:${slotId}:details`;
        const locationKey = `slot:${slotId}:location`;

        // ✅ 1. slot → route
        await redisClient.set(routeKey, routeId);

        // ✅ 2. slot details
        const detailsData = {
          slot_id: slotId,
          route_id: routeId,
          slot_name: s.slot_name,
          start_time: s.start_time,
          journey_date: s.journey_date,
          status: s.status,
          driver_id: s.driver_id ? String(s.driver_id) : null
        };

        await redisClient.set(detailsKey, JSON.stringify(detailsData));

        // ✅ 3. slot location (default empty)
        const existingLocation = await redisClient.get(locationKey);

        if (!existingLocation) {
          await redisClient.set(
            locationKey,
            JSON.stringify({
              lat: null,
              lng: null,
              updated_at: null
            })
          );
        }
      }

      console.log("⚡ Redis fully rebuilt for slots");

      // 🚀 Notify frontend
      io.emit("slots_updated", { version: Date.now() });

    } catch (err) {
      console.error("❌ Slot watcher error:", err);
    }
  });

  changeStream.on("error", (err) => {
    console.error("❌ Slot ChangeStream error:", err);
  });
}

module.exports = watchSlots;