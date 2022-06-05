const mongoose = require("mongoose")

const restockSchema = new mongoose.Schema({
    id_toko: {type: String, required: true},
    tanggal: {type: Date},
    product: {type: Array},
    status: {type: String, default: "Pending"},
}, {timestamps: true});

module.exports = mongoose.model("Restock", restockSchema);