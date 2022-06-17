const router = require("express").Router();
const User = require("../models/Users");
const Product = require("../models/Products");
const Transaksi = require("../models/Transaksi");
const ReviewAndRating = require("../models/Reviews");
const Toko = require("../models/Toko");
const {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndTransaction,
  verifyTokenAndReview,
} = require("./verifyToken");
const { filterToko } = require("./filterToko");
const req = require("express/lib/request");
//Testing
router.get("/", async (req, res) => {
  const products = await Product.find();
  res.status(200).json(products);
});

//profile
router.get("/profile/:userId", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const { password, ...others } = user._doc;
    res.status(200).json(others);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Update Profile
router.put("/update/:userId", verifyTokenAndAuthorization, async (req, res) => {
  if (req.body.password) {
    req.body.password = CryptoJS.AES.encrypt(req.body.password, process.env.PASS_SEC).toString();
  }
  try {
    const updateUser = await User.findByIdAndUpdate(
      req.params.userId,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updateUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Pemesanan
router.post("/pesan", verifyToken, async (req, res) => {
  try {
    const newTransaksi = new Transaksi({
      id_user: req.user.id,
      pesanan: req.body.pesanan,
      
    });
    const savedTransaksi = await newTransaksi.save();
    res.status(200).json(savedTransaksi);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Detail Pesanan
router.put("/detail/:transaksiId", verifyTokenAndTransaction, filterToko, async (req, res) => {
  try {
    const updateDetail = await Transaksi.findByIdAndUpdate(
      req.params.transaksiId,
      {
        id_toko: req.toko._id,
        total: req.body.total,
        provinsi: req.body.provinsi,
        kota: req.body.kota,
        kecamatan: req.body.kecamatan,
        alamat: req.body.alamat,
        status: "Menunggu Pembayaran",
      },
      { new: true }
    );
    res.status(200).json(updateDetail);
  } catch (err) {
    res.status(500).json(err);
  }
  // res.status(200).json(req.transaksi);
});

//Delete / Batalkan Pesanan
router.delete("/deletetransaksi/:transaksiId", verifyTokenAndTransaction, async (req, res) => {
  try {
      await Product.findByIdAndDelete(req.params.transaksiId);
      res.status(200).json("Transaction Has been Deleted");
  } catch (err) {
      res.status(500).json(err);
  }
});

//Pembayaran
router.put("/payment/:transaksiId", verifyTokenAndTransaction, async (req, res) => {
  try {
    const updatePayment = await Transaksi.findByIdAndUpdate(
      req.params.transaksiId,
      {
        buktipembayaran: req.body.buktipembayaran,
        status: "Verifikasi Pembayaran",
      },
      { new: true }
    );
    res.status(200).json(updatePayment);
  } catch (err) {
    res.status(500).json(err);
  }
  // res.status(200).json(req.transaksi);
});

//Info Pesanan User
router.get("/mytransaction/:userId", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const transaksiku = await Transaksi.find({ id_user: req.params.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(transaksiku);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Review And Rating
router.post("/rating/:transaksiId", verifyTokenAndReview, async (req, res) => {
  try {
    const newRating = new ReviewAndRating({
      id_transaksi: req.params.transaksiId,
      id_user: req.user.id,
      review: req.body.review,
      rating: req.body.rating,
    });
    const savedRating = await newRating.save();
    res.status(200).json(savedRating);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
