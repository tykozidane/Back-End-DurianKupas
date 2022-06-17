const mongoose = require("mongoose")

const transaksiSchema = new mongoose.Schema({
    id_user: {type: String , required:true},
    id_toko: {type: String , default: " "},
    pesanan: { type: Array},
    total: { type: Number, default: 0 },
    provinsi: { type: String, default: " " },
    kota: {  type: String, default: " " },
    kecamatan: { type: String, default: " " },
    alamat: { type: String, default: " " },
    buktipembayaran: { type: String, default: " "},
    status: { type: String, default: "Menunggu Konfirmasi"},
}, { timestamps: true});

module.exports = mongoose.model("Transaksi", transaksiSchema);