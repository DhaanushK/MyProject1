import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, unique: true, required: true},
    password: {type: String, required: true},
    role: {type: String, enum: ["team_member","team_lead","project_manager"], required: true}
});

export default mongoose.model("User",userSchema);