const mongoose = require("mongoose")

const tarikuangSchema = new mongoose.Schema({
    id_toko: {type: String , required:true},
    tanggal: { type: Date},
    jumlah: { type: Number, required:true },
    bukti: { type: String, default: " "},
    status: {  type: String, default: "Pending"},
}, { timestamps: true});

module.exports = mongoose.model("Tarikuang", tarikuangSchema);