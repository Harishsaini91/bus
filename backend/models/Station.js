const mongoose = require("mongoose");

const stationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    search_name: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },

    state: {
      type: String,
      required: true,
      index: true
    },

    district: {
      type: String,
      required: true,
      index: true
    },

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

    type: {
      type: String,
      enum: ["bus_stand", "major_stop"],
      default: "bus_stand",
      index: true
    },

    is_active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

// 🔥 Geo index (for future "near me" feature)
stationSchema.index({ location: "2dsphere" });

// 🔥 Prevent duplicate same-name stations in same district
stationSchema.index(
  { search_name: 1, district: 1 },
  { unique: true }
);

module.exports = mongoose.model("Station", stationSchema);