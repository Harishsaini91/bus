const Route = require("../models/Route");

function watchRoutes(io, redisClient) {
  console.log("👀 Watching routes collection...");

  const changeStream = Route.watch([], {
    fullDocument: "updateLookup"
  });

  changeStream.on("change", async (change) => {
    try {
      const { operationType, fullDocument, documentKey } = change;

      console.log("🔥 Route change:", operationType);

      // 🔴 DELETE
      if (operationType === "delete") {
        const routeId = documentKey._id.toString();

        console.log("🗑 Removing route:", routeId);

        // ⚠️ You need old stop_ids (store in Redis or skip)
        // Optional: maintain reverse index

        await redisClient.del(`route:${routeId}:meta`);

        io.emit("routes_updated");
        return;
      }

      // 🟢 INSERT / UPDATE
      if (!fullDocument) return;

      const routeId = fullDocument._id.toString();
      const stopIds = (fullDocument.stop_ids || []).map(id => id.toString());

      // 🔥 Minimal route data
      const routeMeta = {
        route_id: routeId,
        name: fullDocument.name,
        start_station_id: fullDocument.start_station_id?.toString(),
        end_station_id: fullDocument.end_station_id?.toString()
      };

      // 🔥 1. Save route meta
      await redisClient.set(
        `route:${routeId}:meta`,
        JSON.stringify(routeMeta)
      );

      // 🔥 2. Update station → routes mapping
      for (const stationId of stopIds) {
        const key = `station:${stationId}:routes`;

        let existing = await redisClient.get(key);
        let routes = existing ? JSON.parse(existing) : [];

        // remove if already exists (avoid duplicates)
        routes = routes.filter(r => r.route_id !== routeId);

        // add updated route
        routes.push(routeMeta);

        await redisClient.set(key, JSON.stringify(routes));
      }

      console.log("⚡ Route Redis updated");

      // 🚀 Notify frontend
      io.emit("routes_updated", { route_id: routeId });

    } catch (err) {
      console.error("❌ Route watcher error:", err);
    }
  });

  changeStream.on("error", (err) => {
    console.error("❌ Route ChangeStream error:", err);
  });
}

module.exports = watchRoutes;