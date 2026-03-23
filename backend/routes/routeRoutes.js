const express = require("express");
const router = express.Router();
const Route = require("../models/Route");
const { redisClient } = require("../config/redis");


// ➕ CREATE ROUTE (UPDATED) (check ok )
router.post("/create", async (req, res) => {
  try {
    let { stops } = req.body;

    if (!stops || stops.length < 2) {
      return res.status(400).json({
        error: "At least 2 stops required"
      });
    }

    // 🔁 sort by order
    stops.sort((a, b) => a.order - b.order);

    // 🔥 get name → id map from Redis
    const nameIdMapRaw = await redisClient.get("stations:name_id");

    if (!nameIdMapRaw) {
      return res.status(500).json({
        error: "Station cache not ready"
      });
    }

    const nameIdMap = JSON.parse(nameIdMapRaw);

    let stop_names = [];
    let stop_ids = [];

    // 🔥 process stops
    let processedStops = stops.map((s) => {
      const name = s.name.toLowerCase().trim();

      stop_names.push(name);

      // 🔥 auto map name → id (if not provided)
      let station_id = s.station_id;

      if (!station_id && nameIdMap[name]) {
        station_id = nameIdMap[name];
      }

      if (station_id) {
        stop_ids.push(station_id);
      }

      return {
        station_id: station_id || null,
        name,
        order: s.order
      };
    });

    // 🎯 start & end
    const start_station_id = processedStops[0].station_id || null;
    const end_station_id =
      processedStops[processedStops.length - 1].station_id || null;

    const startName = processedStops[0].name;
    const endName = processedStops[processedStops.length - 1].name;

    // 🧠 auto route name
    const name = `${startName} → ${endName}`;

    // 💾 save to DB ONLY
    const route = new Route({
      name,
      start_station_id,
      end_station_id,
      stop_ids,
      stop_names,
      stops: processedStops,
      total_stops: processedStops.length
    });

    await route.save();

    // ❌ NO REDIS HERE (watcher will handle)

    res.json({
      success: true,
      message: "Route created successfully",
      route
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// 🔍 SEARCH ROUTES (FAST VERSION 🔥) (check ok)
router.post("/search", async (req, res) => {
  try {
    let { from_name, to_name } = req.body;

    if (!from_name || !to_name) {
      return res.status(400).json({ message: "from_name and to_name required" });
    }

    // 🔥 normalize
    const normalize = (s) => s.toLowerCase().trim();
    from_name = normalize(from_name);
    to_name = normalize(to_name);

    // 🔥 1. name → id (Redis)
    const nameIdMapRaw = await redisClient.get("stations:name_id");

    if (!nameIdMapRaw) {
      return res.status(500).json({ message: "Station cache not ready" });
    }

    const nameIdMap = JSON.parse(nameIdMapRaw);

    // ✅ FORCE STRING (IMPORTANT FIX)
    const from_id = String(nameIdMap[from_name]);
    const to_id = String(nameIdMap[to_name]);

    if (!from_id || !to_id || from_id === "undefined" || to_id === "undefined") {
      return res.status(404).json({ message: "Station not found" });
    }

    console.log("✅ from_id:", from_id);
    console.log("✅ to_id:", to_id);

    // 🔥 2. get routeIds from Redis
    const [routesFromRaw, routesToRaw] = await Promise.all([
      redisClient.get(`station:${from_id}:routes`),
      redisClient.get(`station:${to_id}:routes`)
    ]);

    const routesFrom = routesFromRaw ? JSON.parse(routesFromRaw) : [];
    const routesTo = routesToRaw ? JSON.parse(routesToRaw) : [];

    console.log("📦 routesFrom:", routesFrom);
    console.log("📦 routesTo:", routesTo);

    // ❌ If no routes found at station level
    if (!routesFrom.length || !routesTo.length) {
      return res.json([]);
    }

    // 🔥 3. FAST INTERSECTION (SET BASED ⚡)
    const routesToSet = new Set(routesTo);
    const commonRouteIds = routesFrom.filter(r => routesToSet.has(r));

    console.log("🔥 commonRouteIds:", commonRouteIds);

    if (!commonRouteIds.length) {
      return res.json([]);
    }

    // 🔥 4. fetch route details
    const results = [];

    for (const routeId of commonRouteIds) {
      const coreKey = `route:${routeId}:core`;
      const detailsKey = `route:${routeId}:details`;

      const [coreRaw, detailsRaw] = await Promise.all([
        redisClient.get(coreKey),
        redisClient.get(detailsKey)
      ]);

      if (!coreRaw || !detailsRaw) continue;

      const core = JSON.parse(coreRaw);
      const details = JSON.parse(detailsRaw);

      // ✅ FORCE STRING ARRAY (IMPORTANT FIX)
      const stopIds = (details.stop_ids || []).map(id => String(id));

      // 🔥 5. direction check
      const fromIndex = stopIds.indexOf(from_id);
      const toIndex = stopIds.indexOf(to_id);

      console.log(`➡️ Route ${routeId} | fromIndex: ${fromIndex}, toIndex: ${toIndex}`);

      if (fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex) {
        results.push({
          route_id: routeId,
          name: details.name,
          start_station_id: core.start_station_id,
          end_station_id: core.end_station_id,
          stop_ids: stopIds
        });
      }
    }

    return res.json(results);

  } catch (err) {
    console.error("❌ SEARCH ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});
// 🔍 SEARCH BY ROUTE NAME
// 🔍 SEARCH BY ROUTE NAME (FAST + CLEAN)  (check ok)
router.get("/search-name", async (req, res) => {
  try {
    let { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Query (q) required" });
    }

    const normalize = (s) => s.toLowerCase().trim();
    q = normalize(q);

    // 🔥 1. Load route name → id map
    const nameIdRaw = await redisClient.get("routes:name_id");

    if (!nameIdRaw) {
      return res.status(500).json({ message: "Route cache not ready" });
    }

    const nameIdMap = JSON.parse(nameIdRaw);

    // 🔥 2. QUICK FILTER (prefix + includes)
    const matchedRouteIds = [];

    for (const name in nameIdMap) {
      if (name.startsWith(q) || name.includes(q)) {
        matchedRouteIds.push(nameIdMap[name]);

        if (matchedRouteIds.length >= 10) break; // limit
      }
    }

    if (!matchedRouteIds.length) {
      return res.json([]);
    }

    // 🔥 3. Fetch route details from Redis (NO DB)
    const results = [];

    for (const routeId of matchedRouteIds) {
      const coreKey = `route:${routeId}:core`;
      const detailsKey = `route:${routeId}:details`;

      const [coreRaw, detailsRaw] = await Promise.all([
        redisClient.get(coreKey),
        redisClient.get(detailsKey)
      ]);

      if (!coreRaw || !detailsRaw) continue;

      const core = JSON.parse(coreRaw);
      const details = JSON.parse(detailsRaw);

      results.push({
        route_id: routeId,
        name: details.name,
        start_station_id: core.start_station_id,
        end_station_id: core.end_station_id
      });
    }

    return res.json(results);

  } catch (err) {
    console.error("❌ REDIS SEARCH ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});




module.exports = router;