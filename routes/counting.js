const Toko = require("../models/Toko");
const User = require("../models/Users");
const Product = require("../models/Products");
const Transaksi = require("../models/Transaksi");
const Review = require("../models/Reviews");
const { verifyTokenAndReseller } = require("./verifyToken");

const cekTransaksi = async (req, res, next) => {
  const tokoini = req.tokonya;
  const totalTransaksi = await Transaksi.find({ id_toko: tokoini._id, status: "Selesai" });
  var angka = 0;
  for (let i = 0; i < totalTransaksi.length; i++) {
    angka = angka + totalTransaksi[i].total;
  }
  req.angkatotal = angka;
  req.totalTransaksi = totalTransaksi.length;
  next();
};

const countTransactionReseller = (req, res, next) => {
  verifyTokenAndReseller(req, res, () => {
    Toko.findOne({ id_user: req.user.id }, (err, tokonya) => {
      if (err) return res.status(403).json(err);
      req.tokonya = tokonya;
      cekTransaksi(req, res, () => {
        next();
      });
    });
  });
};

//Hitung Rating
const hitungRating = async (req, res, next) => {
  const dataRating = await Review.find();
  var rat = 0;
  for (let i = 0; i < dataRating.length; i++) {
    rat = parseInt(rat) + parseInt(dataRating[i].rating);
  }
  var rating = rat / dataRating.length;
  var newRating = Math.round(rating);
  req.rating = newRating;
  next();
}

module.exports = {
  countTransactionReseller,
  hitungRating
};
