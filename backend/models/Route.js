const mongoose = require("mongoose");

const StopSchema = new mongoose.Schema({
  name: { type: String, required: true },

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },

  order: { type: Number, required: true }
});

const RouteSchema = new mongoose.Schema(
  {
    // 🧠 Human readable name
    name: {
      type: String,
      required: true,
      index: true
    },

    // ⚡ Quick filters
    startStop: {
      type: String,
      required: true,
      index: true
    },

    endStop: {
      type: String,
      required: true,
      index: true
    },

    // ⚡ Fast search (no loop needed)
    stopNames: [
      {
        type: String,
        index: true
      }
    ],

    // 🛣️ Full route
    stops: {
      type: [StopSchema],
      validate: {
        validator: (stops) => stops.length >= 2,
        message: "Minimum 2 stops required"
      }
    }
  },
  { timestamps: true }
);

// 🔥 GEO index
RouteSchema.index({ "stops.location": "2dsphere" });

module.exports = mongoose.model("Route", RouteSchema);