const mongoose = require("mongoose")

const transaksiSchema = new mongoose.Schema({
    id_user: {type: String , required:true},
    id_toko: {type: String , required:true},
    pesanan: { type: Array},
    total: { type: Number, required:true },
    provinsi: { type: String, required: true },
    kota: {  type: String, required: true },
    kecamatan: { type: String, required: true },
    alamat: { type: String, required: true },
    buktipembayaran: { type: String, default: " "},
    status: { type: String, default: "Menunggu Pembayaran"},
}, { timestamps: true});

module.exports = mongoose.model("Transaksi", transaksiSchema);