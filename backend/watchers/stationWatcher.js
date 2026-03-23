const Station = require("../models/Station");

function watchStations(io, redisClient) {
  console.log("👀 Watching stations collection...");

  const changeStream = Station.watch([], {
    fullDocument: "updateLookup"
  });

  changeStream.on("change", async (change) => {
    console.log("🔥 Station changed:", change.operationType);

    try {
      console.log("🔄 Fetching latest stations from DB...");

      const stations = await Station.find({ is_active: true })
        .select("_id search_name")
        .lean();

      console.log("📦 Stations count:", stations.length);

      // 🔄 Build Maps
      const idNameMap = {};
      const nameIdMap = {};

      for (const s of stations) {
        const id = String(s._id);
        const name = s.search_name.toLowerCase().trim();

        idNameMap[id] = name;
        nameIdMap[name] = id;
      }

      const version = Date.now();
      console.log("🆕 New version:", version);

      // 💾 Update Redis (NO stations:all anymore)
      await Promise.all([
        redisClient.set("stations:id_name", JSON.stringify(idNameMap)),
        redisClient.set("stations:name_id", JSON.stringify(nameIdMap)),
        redisClient.set("stations:version", version)
      ]);

      console.log("⚡ Redis updated successfully");

      // 🔍 VERIFY
      const check = await redisClient.get("stations:id_name");
      console.log("🧪 Redis verify keys:", Object.keys(JSON.parse(check)).length);

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