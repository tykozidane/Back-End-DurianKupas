const mongoose = require("mongoose")

const tokoSchema = new mongoose.Schema({
    namatoko: {type: String, required: true},
    id_user: {type: String, required: true},
    email: {type: String, required: true},
    phone: {type: String, required: true},
    provinsi: {type: String, required: true},
    kota: {type: String, required: true},
    stock: {type: Array},
    saldo: {type: Number, required: true},
}, { timestamps: true});

module.exports = mongoose.model("Toko", tokoSchema);