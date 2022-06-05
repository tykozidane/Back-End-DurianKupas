const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username: {type: String , required:true, unique:true},
    email: {type: String , required:true , unique:true},
    password: { type: String, required: true },
    phone: { type: String, required:true },
    alamat: { type: Array },
    role: { type: String, default: "user" },
}, { timestamps: true});

module.exports = mongoose.model("Users", userSchema);