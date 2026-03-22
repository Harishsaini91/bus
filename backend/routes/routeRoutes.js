const express = require("express");
const router = express.Router();
const Route = require("../models/Route");


// ➕ CREATE ROUTE
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

    // 🎯 extract fields
    const startStop = stops[0].name;
    const endStop = stops[stops.length - 1].name;

    const stopNames = stops.map(s => s.name);

    // 🧠 auto generate name
    const name = `${startStop} → ${endStop}`;

    const route = new Route({
      name,
      startStop,
      endStop,
      stopNames,
      stops
    });

    await route.save();

    res.json({ success: true, route });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔍 SEARCH ROUTES BY STOPS
router.post("/search", async (req, res) => {
  try {
    const { startStop, endStop } = req.body;

    const routes = await Route.find({
      stopNames: { $all: [startStop, endStop] }
    });

    // 🔥 direction filter
    const filtered = routes.filter(route => {
      const s = route.stopNames.indexOf(startStop);
      const e = route.stopNames.indexOf(endStop);
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
      name: { $regex: q, $options: "i" }
    });

    res.json(routes);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});






























module.exports = router;