const Toko = require("../models/Toko");

//Pengecekan Toko
const filterToko = async (req, res, next) => {
  if (req.body.provinsi) {
    const dapetToko = await Toko.findOne({ provinsi: req.body.provinsi, kota: req.body.kota });
    req.toko = dapetToko;
    next();
  } else {
    res.status(500).json(err);
  }
};

module.exports = {
  filterToko,
};
