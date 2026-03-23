const express = require("express");
const router = express.Router();
const Station = require("../models/Station");
const Route = require("../models/Route");
const { redisClient } = require("../config/redis");
const mongoose = require("mongoose");


// ➕ CREATE STATION  ( check ok)
router.post("/create", async (req, res) => {
  try {
    let { name, state, district, lat, lng, type } = req.body;

    if (!name || !state || !district || !lat || !lng) {
      return res.status(400).json({ message: "All fields required" });
    }

    // 🔁 normalize
    const search_name = name.toLowerCase().trim();

    const station = new Station({
      name,
      search_name,
      state,
      district,
      location: {
        type: "Point",
        coordinates: [lng, lat] // ⚠️ lng first
      },
      type: type || "bus_stand"
    });

    await station.save();

    res.json({
      success: true,
      station
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Station already exists in this district"
      });
    }

    res.status(500).json({ error: err.message });
  }
});




// 🔥 GET ALL STATIONS (check ok)
router.get("/all", async (req, res) => {
  console.log("📡 /all API called");

  try {
    const idNameKey = "stations:id_name";
    const nameIdKey = "stations:name_id";
    const versionKey = "stations:version";

    // 🔍 Check Redis
    const [idNameCached, version] = await Promise.all([
      redisClient.get(idNameKey),
      redisClient.get(versionKey)
    ]);

    if (idNameCached) {
      console.log("⚡ Serving from Redis");

      return res.json({
        data: JSON.parse(idNameCached), // ⚡ still "data"
        version
      });
    }

    console.log("📦 Serving from MongoDB");

    // 📦 Load from DB
    const stations = await Station.find({ is_active: true })
      .select("_id search_name")
      .lean();

    // 🔄 Convert to maps
    const idNameMap = {};
    const nameIdMap = {};

    for (const s of stations) {
      const id = String(s._id);
      const name = s.search_name.toLowerCase().trim();

      idNameMap[id] = name;
      nameIdMap[name] = id;
    }

    const newVersion = Date.now();

    // 💾 Store in Redis
    await Promise.all([
      redisClient.set(idNameKey, JSON.stringify(idNameMap), { EX: 86400 }),
      redisClient.set(nameIdKey, JSON.stringify(nameIdMap), { EX: 86400 }),
      redisClient.set(versionKey, newVersion)
    ]);

    // ✅ SAME RESPONSE STRUCTURE
    res.json({
      data: idNameMap,
      version: newVersion
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// find all route which pass by station (check ok )
router.post("/by-station", async (req, res) => {
  try {
    const { stationId } = req.body;

    if (!stationId) {
      return res.status(400).json({ message: "stationId required" });
    }

    if (!mongoose.Types.ObjectId.isValid(stationId)) {
      return res.status(400).json({ message: "Invalid stationId" });
    }

    const cacheKey = `station:${stationId}:routes`;
    const versionKey = `station:${stationId}:routes:version`;

    // 🔥 Redis check
    const cached = await redisClient.get(cacheKey);
    const version = await redisClient.get(versionKey);

    if (cached) {
      console.log("⚡ Routes from Redis");
      return res.json({
        data: JSON.parse(cached),
        version
      });
    }

    console.log("📦 Routes from MongoDB");

    const objectId = new mongoose.Types.ObjectId(stationId);

    const routes = await Route.find({
      stop_ids: objectId,
      is_active: true
    })
      .select("_id name start_station_id end_station_id stop_ids")
      .lean();

    const formatted = routes.map(r => ({
      route_id: r._id,
      name: r.name,
      start_station_id: r.start_station_id,
      end_station_id: r.end_station_id,
      stop_ids: r.stop_ids
    }));

    const newVersion = Date.now();

    await Promise.all([
      redisClient.set(cacheKey, JSON.stringify(formatted), { EX: 86400 }),
      redisClient.set(versionKey, newVersion)
    ]);

    res.json({
      data: formatted,
      version: newVersion
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;