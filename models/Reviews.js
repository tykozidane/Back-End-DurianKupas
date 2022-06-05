const { text } = require("express");
const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema({
    id_transaksi: {type: String, required: true},
    id_user: {type: String, required: true},
    review: {type: String, required: true},
    rating: {type: Number, required: true},

}, {timestamps: true});

module.exports = mongoose.model("review", reviewSchema);