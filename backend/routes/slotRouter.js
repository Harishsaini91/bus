const express = require("express");
const router = express.Router();
const Slot = require("../models/Slot");
const mongoose = require("mongoose");
const { redisClient } = require("../config/redis");


// ➕ CREATE SLOT
// ➕ CREATE SLOT (PRODUCTION READY) (check ok)
router.post("/create", async (req, res) => {
  try {
    const { route_id, start_time, journey_date } = req.body;

    if (!route_id || !start_time || !journey_date) {
      return res.status(400).json({ message: "All fields required" });
    }

    // ✅ Normalize date (remove time part)
    const date = new Date(journey_date);
    date.setHours(0, 0, 0, 0);

    // 🔥 1. Prevent duplicate slot
    const existing = await Slot.findOne({
      route_id,
      start_time,
      journey_date: date,
      is_active: true
    });

    if (existing) {
      return res.status(400).json({ message: "Slot already exists" });
    }

    // 🔥 2. Generate clean slot name
    const slot_name = `${route_id}_${start_time}_${date.toISOString().split("T")[0]}`;

    const room_id = `slot_${route_id}_${start_time}_${date.getTime()}`;

    // 🔥 3. Create slot
    const slot = new Slot({
      route_id,
      start_time,
      journey_date: date,
      slot_name,
      room_id
    });

    await slot.save();

    const slotId = String(slot._id);

    // 🚀 4. UPDATE REDIS IMMEDIATELY (NO WAIT FOR WATCHER)

    const routeIdStr = String(route_id);

    const routeKey = `slot:${slotId}:route`;
    const detailsKey = `slot:${slotId}:details`;
    const locationKey = `slot:${slotId}:location`;
    const routeSlotsKey = `route:${routeIdStr}:slots`;

    // ✅ slot → route
    await redisClient.set(routeKey, routeIdStr);

    // ✅ slot details
    const detailsData = {
      slot_id: slotId,
      route_id: routeIdStr,
      slot_name,
      start_time,
      journey_date: date,
      status: "available",
      driver_id: null
    };

    await redisClient.set(detailsKey, JSON.stringify(detailsData));

    // ✅ default location
    await redisClient.set(
      locationKey,
      JSON.stringify({
        lat: null,
        lng: null,
        updated_at: null
      })
    );

    // ✅ route → slots mapping
    let existingSlots = await redisClient.get(routeSlotsKey);
    let slotsArr = existingSlots ? JSON.parse(existingSlots) : [];

    if (!slotsArr.includes(slotId)) {
      slotsArr.push(slotId);
    }

    await redisClient.set(routeSlotsKey, JSON.stringify(slotsArr));

    // 🚀 response
    return res.json({
      success: true,
      slot: {
        slot_id: slotId,
        route_id: routeIdStr,
        slot_name,
        start_time,
        journey_date: date
      }
    });

  } catch (err) {
    console.error("❌ CREATE SLOT ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 🔍 GET SLOTS BY ROUTE
// 🔍 GET SLOTS BY ROUTE (REDIS FAST VERSION) (check ok )
router.get("/by-route/:routeId", async (req, res) => {
  try {
    const { routeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ message: "Invalid routeId" });
    }

    const routeSlotsKey = `route:${routeId}:slots`;

    // 🔥 1. Try Redis first
    let slotIdsRaw = await redisClient.get(routeSlotsKey);
    let slotIds = slotIdsRaw ? JSON.parse(slotIdsRaw) : [];

    let results = [];

    // =========================
    // ✅ CASE 1: REDIS HIT
    // =========================
    if (slotIds.length) {
      console.log("⚡ Redis HIT");

      for (const slotId of slotIds) {
        const detailsKey = `slot:${slotId}:details`;

        const raw = await redisClient.get(detailsKey);
        if (!raw) continue;

        const slot = JSON.parse(raw);

        if (slot.status) {
          results.push(slot);
        }
      }

      // sort
      results.sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      );

      return res.json(results);
    }

    // =========================
    // ❌ CASE 2: REDIS MISS → DB
    // =========================
    console.log("⚠️ Redis MISS → Fetching DB");

    const slots = await Slot.find({
      route_id: routeId,
      is_active: true
    })
      .sort({ start_time: 1 })
      .lean();

    // =========================
    // 🔥 REBUILD REDIS
    // =========================
    if (slots.length) {
      const newSlotIds = [];

      for (const s of slots) {
        const slotId = String(s._id);
        newSlotIds.push(slotId);

        const routeKey = `slot:${slotId}:route`;
        const detailsKey = `slot:${slotId}:details`;
        const locationKey = `slot:${slotId}:location`;

        // ✅ slot → route
        await redisClient.set(routeKey, routeId);

        // ✅ slot details
        const detailsData = {
          slot_id: slotId,
          route_id: routeId,
          slot_name: s.slot_name,
          start_time: s.start_time,
          journey_date: s.journey_date,
          status: s.status,
          driver_id: s.driver_id
            ? String(s.driver_id)
            : null
        };

        await redisClient.set(detailsKey, JSON.stringify(detailsData));

        // ✅ location (default)
        const exists = await redisClient.exists(locationKey);
        if (!exists) {
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

      // ✅ store route → slotIds
      await redisClient.set(
        routeSlotsKey,
        JSON.stringify(newSlotIds)
      );

      console.log("⚡ Redis rebuilt for route:", routeId);
    }

    return res.json(slots);

  } catch (err) {
    console.error("❌ GET SLOTS ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 🧑‍✈️ ASSIGN DRIVER TO SLOT
router.patch("/assign-driver", async (req, res) => {
  try {
    const { slot_id, driver_id } = req.body;

    if (!slot_id || !driver_id) {
      return res.status(400).json({ message: "slot_id & driver_id required" });
    }

    const slot = await Slot.findByIdAndUpdate(
      slot_id,
      { driver_id },
      { new: true }
    );

    res.json(slot);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ▶️ START TRIP (check ok) but changes not fetched by watcher auto
router.patch("/start", async (req, res) => {
  try {
    const { slot_id } = req.body;

    // =========================
    // ✅ 1. Validation
    // =========================
    if (!slot_id || !mongoose.Types.ObjectId.isValid(slot_id)) {
      return res.status(400).json({ message: "Valid slot_id required" });
    }

    // =========================
    // ✅ 2. Find slot
    // =========================
    const slot = await Slot.findById(slot_id);

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (!slot.is_active) {
      return res.status(400).json({ message: "Slot inactive" });
    }

    if (slot.status === "running") {
      return res.json({ message: "Slot already running", slot });
    }

    // =========================
    // ✅ 3. Update DB
    // =========================
    slot.status = "running";
    await slot.save();

    const slotId = String(slot._id);
    const routeId = String(slot.route_id);

    // =========================
    // 🔥 4. UPDATE REDIS (DETAILS)
    // =========================
    const detailsKey = `slot:${slotId}:details`;

    const detailsData = {
      slot_id: slotId,
      route_id: routeId,
      slot_name: slot.slot_name,
      start_time: slot.start_time,
      journey_date: slot.journey_date,
      status: "running",
      driver_id: slot.driver_id
        ? String(slot.driver_id)
        : null
    };

    await redisClient.set(detailsKey, JSON.stringify(detailsData));

    // =========================
    // 🔥 5. INIT LOCATION (IMPORTANT)
    // =========================
    await redisClient.set(
      `slot:${slotId}:location`,
      JSON.stringify({
        slotId,
        lat: 29.9695, // default start (later replace with station)
        lng: 76.8783,
        updated_at: Date.now()
      })
    );

    // =========================
    // 🔥 6. UPDATE ROUTE → SLOT LIST
    // =========================
    const routeSlotsKey = `route:${routeId}:slots`;

    const existing = await redisClient.get(routeSlotsKey);
    let slotIds = existing ? JSON.parse(existing) : [];

    if (!slotIds.includes(slotId)) {
      slotIds.push(slotId);
      await redisClient.set(routeSlotsKey, JSON.stringify(slotIds));
    }

    // =========================
    // 🚀 7. SOCKET EMIT
    // =========================
    const io = req.app.get("io");

    if (io) {
      // 🔹 notify users already in this slot
      io.to(`slot:${slotId}`).emit("slot_started", {
        slotId,
        status: "running",
        message: "Bus started"
      });

      // 🔥 MOST IMPORTANT → update slot list UI
      io.emit("slots_updated");
    }

    console.log("🟢 Slot started:", slotId);

    // =========================
    // ✅ RESPONSE
    // =========================
    return res.json({
      message: "Slot started successfully",
      slot: detailsData
    });

  } catch (err) {
    console.error("❌ START SLOT ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ⏹ END TRIP
router.patch("/end", async (req, res) => {
  try {
    const { slot_id } = req.body;

    // ✅ 1. Validation
    if (!slot_id || !mongoose.Types.ObjectId.isValid(slot_id)) {
      return res.status(400).json({ message: "Valid slot_id required" });
    }

    // ✅ 2. Find slot
    const slot = await Slot.findById(slot_id);

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (!slot.is_active) {
      return res.status(400).json({ message: "Slot inactive" });
    }

    // ⚠️ Prevent duplicate end
    if (slot.status === "completed") {
      return res.json({ message: "Slot already completed", slot });
    }

    // Optional: ensure it was running
    if (slot.status !== "running") {
      return res.status(400).json({
        message: "Slot must be running before ending"
      });
    }

    // =========================
    // ✅ 3. Update DB
    // =========================
    slot.status = "completed";
    await slot.save();

    const slotId = String(slot._id);
    const routeId = String(slot.route_id);

    // =========================
    // 🔥 4. UPDATE REDIS
    // =========================
    const detailsKey = `slot:${slotId}:details`;
    const locationKey = `slot:${slotId}:location`;

    const detailsData = {
      slot_id: slotId,
      route_id: routeId,
      slot_name: slot.slot_name,
      start_time: slot.start_time,
      journey_date: slot.journey_date,
      status: "completed",
      driver_id: slot.driver_id
        ? String(slot.driver_id)
        : null
    };

    await redisClient.set(detailsKey, JSON.stringify(detailsData));

    // 🧹 Optional: clear location (bus ended)
    await redisClient.del(locationKey);

    // =========================
    // 🚀 5. SOCKET EMIT
    // =========================
    const io = req.app.get("io");

    const slotRoom = `slot:${slotId}`;
    const routeRoom = `route:${routeId}`;

    // Notify slot viewers
    io.to(slotRoom).emit("slot_ended", {
      slotId,
      status: "completed",
      message: "Bus journey completed"
    });

    // Notify route viewers (list update)
    io.to(routeRoom).emit("slot_update", {
      slotId,
      status: "completed"
    });

    console.log("🔴 Slot ended:", slotId);

    // =========================
    // ✅ RESPONSE
    // =========================
    return res.json({
      message: "Slot ended successfully",
      slot: detailsData
    });

  } catch (err) {
    console.error("❌ END SLOT ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});


module.exports = router;