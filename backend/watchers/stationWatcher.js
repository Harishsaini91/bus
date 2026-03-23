const Station = require("../models/Station");

function watchStations(io, redisClient) {
  console.log("👀 Watching stations collection...");

  const changeStream = Station.watch([], {
    fullDocument: "updateLookup"
  });

  changeStream.on("change", async (change) => {
    console.log("🔥 Station changed:", change.operationType);

    // 🔍 EXTRA DEBUG (VERY IMPORTANT)
    console.log("📄 Change fullDocument:", change.fullDocument?._id);
    console.log("📄 Change details:", change);

    try {
      console.log("🔄 Fetching latest stations from DB...");

      const stations = await Station.find({ is_active: true })
        .select("_id search_name")
        .lean();

      console.log("📦 Stations count:", stations.length);

      const version = Date.now();
      console.log("🆕 New version:", version);

      // 🔥 Update Redis
      await redisClient.set("stations:all", JSON.stringify(stations));
      await redisClient.set("stations:version", version);

      console.log("⚡ Redis updated successfully");

      // 🔍 VERIFY REDIS DATA
      const check = await redisClient.get("stations:all");
      console.log("🧪 Redis verify count:", JSON.parse(check).length);

      // 🚀 Notify frontend
      console.log("📡 Emitting stations_updated event...");
      io.emit("stations_updated", { version });

    } catch (err) {
      console.error("❌ Watcher error:", err);
    }
  });

  changeStream.on("error", (err) => {
    console.error("❌ ChangeStream error:", err);
  });
}

module.exports = watchStations;