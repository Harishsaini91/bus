const mongoose = require("mongoose");

// 🛑 Helper to safely convert to ObjectId
const toObjectId = (val) => {
  if (!val) return null;
  return typeof val === "string"
    ? new mongoose.Types.ObjectId(val)
    : val;
};

// 🔹 STOP SUB-SCHEMA (NO LOCATION)
const StopSchema = new mongoose.Schema(
  {
    station_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      index: true,
      default: null
    },

    name: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    order: {
      type: Number,
      required: true,
      index: true
    }
  },
  { _id: false } // cleaner (no need separate _id per stop)
);

// 🔹 MAIN ROUTE SCHEMA
const RouteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    // 🔥 MUST be ObjectId
    start_station_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
      index: true
    },

    end_station_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
      index: true
    },

    // 🔥 FAST FILTER FIELD
    stop_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Station",
        index: true
      }
    ],

    // 🔍 Flexible search
    stop_names: [
      {
        type: String,
        lowercase: true,
        trim: true,
        index: true
      }
    ],

    stops: {
      type: [StopSchema],
      validate: {
        validator: (stops) => stops.length >= 2,
        message: "Minimum 2 stops required"
      }
    },

    total_stops: {
      type: Number,
      default: 0
    },

    is_active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);



// 🔥 PRE-SAVE HOOK (DATA CLEANING + NORMALIZATION)
RouteSchema.pre("save", function (next) {
  try {
    // 🔁 Convert start/end
    this.start_station_id = toObjectId(this.start_station_id);
    this.end_station_id = toObjectId(this.end_station_id);

    // 🔁 Convert stop_ids
    this.stop_ids = (this.stop_ids || []).map(id => toObjectId(id));

    // 🔁 Clean stops
    this.stops = (this.stops || []).map(stop => {
      if (stop.station_id) {
        stop.station_id = toObjectId(stop.station_id);
      }

      return {
        station_id: stop.station_id || null,
        name: stop.name.toLowerCase().trim(),
        order: stop.order
      };
    });

    // 🔁 Normalize stop_names
    this.stop_names = (this.stop_names || []).map(n =>
      n.toLowerCase().trim()
    );

    // 🔁 Auto total_stops
    this.total_stops = this.stops.length;

    // next();
  } catch (err) {
    next(err);
  }
});



// 🔥 INDEXES (OPTIMIZED)
RouteSchema.index({ start_station_id: 1, end_station_id: 1 });
RouteSchema.index({ stop_ids: 1, is_active: 1 });
RouteSchema.index({ "stops.station_id": 1 }); // fallback
RouteSchema.index({ stop_names: 1 }); // name search



module.exports = mongoose.model("Route", RouteSchema);