const express = require("express");
const router = express.Router();
const Route = require("../models/Route");


// ➕ CREATE ROUTE (UPDATED)
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

    // 🔥 normalize + build fields
    let stop_names = [];
    let stop_ids = [];

    let processedStops = stops.map((s) => {
      const name = s.name.toLowerCase().trim();

      stop_names.push(name);

      if (s.station_id) {
        stop_ids.push(s.station_id);
      }

      return {
        station_id: s.station_id || null,
        name,
        order: s.order
      };
    });

    // 🎯 start & end (must be station_id ideally)
    const start_station_id = processedStops[0].station_id;
    const end_station_id = processedStops[processedStops.length - 1].station_id;

    const startName = processedStops[0].name;
    const endName = processedStops[processedStops.length - 1].name;

    // 🧠 auto name
    const name = `${startName} → ${endName}`;

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

    res.json({ success: true, route });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔍 SEARCH ROUTES (FAST VERSION 🔥)
router.post("/search", async (req, res) => {
  try {
    const { from_id, to_id, from_name, to_name } = req.body;

    let routes = [];

    // ⚡ CASE 1: FAST PATH (station_id)
    if (from_id && to_id) {
      routes = await Route.find({
        stop_ids: { $all: [from_id, to_id] },
        is_active: true
      });
    }

    // ⚡ CASE 2: NAME BASED (fallback)
    else if (from_name && to_name) {
      const f = from_name.toLowerCase();
      const t = to_name.toLowerCase();

      routes = await Route.find({
        stop_names: { $all: [f, t] },
        is_active: true
      });
    }

    // 🔥 direction filter
    const filtered = routes.filter(route => {
      const s = route.stop_names.indexOf(
        (from_name || "").toLowerCase()
      );
      const e = route.stop_names.indexOf(
        (to_name || "").toLowerCase()
      );

      return s !== -1 && e !== -1 && s < e;
    });

    res.json(filtered);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔍 SEARCH BY ROUTE NAME
router.get("/search-name", async (req, res) => {
  try {
    const { q } = req.query;

    const routes = await Route.find({
      name: { $regex: `^${q}`, $options: "i" }
    }).limit(10);

    res.json(routes);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;