import mongoose from "mongoose";

const metricsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",  // links to the User model
    required: true
  },
  date: { type: Date, default: Date.now },
  ticketsAssigned: Number,
  ticketsResolved: Number,
  slaBreaches: Number,
  reopenedTickets: Number,
  clientInteractions: Number,
  remarks: String,
  status: { type: String, enum: ["On-Time", "Late"], default: "On-Time" }
});

export default mongoose.model("Metrics", metricsSchema);
