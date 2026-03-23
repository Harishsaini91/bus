const Route = require("../models/Route");

function watchRoutes(io, redisClient) {
  console.log("👀 Watching routes collection...");

  const changeStream = Route.watch([], {
    fullDocument: "updateLookup"
  });

  changeStream.on("change", async (change) => {
    console.log("🔥 Route changed:", change.operationType);

    try {
      console.log("🔄 Fetching latest routes from DB...");

      const routes = await Route.find({ is_active: true })
        .select("_id name start_station_id end_station_id stop_ids")
        .lean();

      console.log("📦 Routes count:", routes.length);

      // 🔥 CLEAR OLD CACHE
      const keys = await redisClient.keys("route:*");
      if (keys.length) await redisClient.del(keys);

      const stationKeys = await redisClient.keys("station:*:routes");
      if (stationKeys.length) await redisClient.del(stationKeys);

      // 🔥 NEW: clear route name maps
      await redisClient.del("routes:id_name");
      await redisClient.del("routes:name_id");

      // 🔄 TEMP MAPS
      const routeIdNameMap = {};
      const routeNameIdMap = {};

      // 🔄 REBUILD ALL
      for (const r of routes) {
        const routeId = String(r._id);
        const routeName = r.name;

        const coreKey = `route:${routeId}:core`;
        const detailsKey = `route:${routeId}:details`;

        const stopIds = (r.stop_ids || []).map(id => id.toString());

        // ✅ CORE
        const coreData = {
          route_id: routeId,
          start_station_id: r.start_station_id?.toString(),
          end_station_id: r.end_station_id?.toString()
        };

        // ✅ DETAILS
        const detailsData = {
          route_id: routeId,
          name: routeName,
          stop_ids: stopIds
        };

        await Promise.all([
          redisClient.set(coreKey, JSON.stringify(coreData)),
          redisClient.set(detailsKey, JSON.stringify(detailsData))
        ]);

        // 🔥 station → routes mapping
        for (const stationId of stopIds) {
          const key = `station:${stationId}:routes`;

          let existing = await redisClient.get(key);
          let routesArr = existing ? JSON.parse(existing) : [];

          if (!routesArr.includes(routeId)) {
            routesArr.push(routeId);
          }

          await redisClient.set(key, JSON.stringify(routesArr));
        }

        // 🔥 NEW: build route name maps
        const normalize = (s) => s.toLowerCase().trim();

        routeIdNameMap[routeId] = routeName;
        routeNameIdMap[normalize(routeName)] = routeId;
      }

      // 🔥 SAVE ROUTE NAME MAPS
      await Promise.all([
        redisClient.set("routes:id_name", JSON.stringify(routeIdNameMap)),
        redisClient.set("routes:name_id", JSON.stringify(routeNameIdMap))
      ]);

      console.log("⚡ Redis fully rebuilt (routes + name index)");

      // 🚀 Notify frontend
      io.emit("routes_updated", { version: Date.now() });

    } catch (err) {
      console.error("❌ Route watcher error:", err);
    }
  });

  changeStream.on("error", (err) => {
    console.error("❌ Route ChangeStream error:", err);
  });
}

module.exports = watchRoutes;