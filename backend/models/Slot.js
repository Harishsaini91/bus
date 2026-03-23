const mongoose = require("mongoose");

const SlotSchema = new mongoose.Schema(
  {
    // 🔗 ROUTE LINK
    route_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: true,
      index: true
    },

    // 🧠 SLOT NAME (for UI / identification)
    slot_name: {
      type: String,
      required: true
      // example: "NRL-RWR-08:00"
    },

    // 🕒 TIME
    start_time: {
      type: String, // "08:00"
      required: true,
      index: true
    },

    journey_date: {
      type: Date,
      required: true,
      index: true
    },

    // 🚦 STATUS
    status: {
      type: String,
      enum: ["available", "running", "completed"],
      default: "available",
      index: true
    },

    // 🧑‍✈️ DRIVER
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    // 🔥 SOCKET ROOM
    room_id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // 🔒 ACTIVE FLAG
    is_active: {
      type: Boolean,
      default: true,
      index: true
    }

  },
  { timestamps: true }
);


// 🔥 INDEXES
SlotSchema.index({ route_id: 1, journey_date: 1 });
SlotSchema.index({ route_id: 1, start_time: 1 });

module.exports = mongoose.model("Slot", SlotSchema);