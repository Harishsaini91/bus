const express = require("express");
const router = express.Router();
const Slot = require("../models/Slot");
const mongoose = require("mongoose");


// ➕ CREATE SLOT
router.post("/create", async (req, res) => {
  try {
    const { route_id, start_time, journey_date } = req.body;

    if (!route_id || !start_time || !journey_date) {
      return res.status(400).json({ message: "All fields required" });
    }

    const slot = new Slot({
      route_id,
      start_time,
      journey_date,
      slot_name: `${route_id}_${start_time}`,
      room_id: `${route_id}_${start_time}`
    });

    await slot.save();

    res.json({ success: true, slot });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔍 GET SLOTS BY ROUTE
router.get("/by-route/:routeId", async (req, res) => {
  try {
    const { routeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ message: "Invalid routeId" });
    }

    const slots = await Slot.find({
      route_id: routeId,
      is_active: true
    })
      .sort({ start_time: 1 })
      .lean();

    res.json(slots);

  } catch (err) {
    res.status(500).json({ error: err.message });
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


// ▶️ START TRIP
router.patch("/start", async (req, res) => {
  try {
    const { slot_id } = req.body;

    if (!slot_id) {
      return res.status(400).json({ message: "slot_id required" });
    }

    const slot = await Slot.findByIdAndUpdate(
      slot_id,
      { status: "running" },
      { new: true }
    );

    res.json(slot);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ⏹ END TRIP
router.patch("/end", async (req, res) => {
  try {
    const { slot_id } = req.body;

    if (!slot_id) {
      return res.status(400).json({ message: "slot_id required" });
    }

    const slot = await Slot.findByIdAndUpdate(
      slot_id,
      { status: "completed" },
      { new: true }
    );

    res.json(slot);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;