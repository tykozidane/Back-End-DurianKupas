const mongoose =  require("mongoose")

const regionSchema = new mongoose.Schema({
    provinsi: {type: String, required: true},
    kota: {type: Array},
}, {timestamps: true});

module.exports = mongoose.model("Region", regionSchema);