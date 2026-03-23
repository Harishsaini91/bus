const mongoose = require("mongoose");


// 🛑 Helper to safely convert to ObjectId
const toObjectId = (val) => {
  if (!val) return null;
  return typeof val === "string"
    ? new mongoose.Types.ObjectId(val)
    : val;
};


// 🔹 STOP SUB-SCHEMA
const StopSchema = new mongoose.Schema({
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

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: null
    }
  },

  order: {
    type: Number,
    required: true,
    index: true
  }
});


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



// 🔥 PRE-SAVE HOOK (VERY IMPORTANT)
RouteSchema.pre("save", function (next) {
  try {
    // 🔁 Convert start/end
    this.start_station_id = toObjectId(this.start_station_id);
    this.end_station_id = toObjectId(this.end_station_id);

    // 🔁 Convert stop_ids
    this.stop_ids = this.stop_ids.map(id => toObjectId(id));

    // 🔁 Convert stops.station_id
    this.stops = this.stops.map(stop => {
      if (stop.station_id) {
        stop.station_id = toObjectId(stop.station_id);
      }

      // normalize name
      stop.name = stop.name.toLowerCase().trim();

      return stop;
    });

    // 🔁 Normalize stop_names
    this.stop_names = this.stop_names.map(n =>
      n.toLowerCase().trim()
    );

    // 🔁 Auto total_stops
    this.total_stops = this.stops.length;

    next();

  } catch (err) {
    next(err);
  }
});



// 🔥 INDEXES
RouteSchema.index({ start_station_id: 1, end_station_id: 1 });
// RouteSchema.index({ stop_ids: 1 });
RouteSchema.index({ "stops.station_id": 1 }); // fallback search
RouteSchema.index({ "stops.location": "2dsphere" });
RouteSchema.index({ stop_ids: 1, is_active: 1 });

module.exports = mongoose.model("Route", RouteSchema);