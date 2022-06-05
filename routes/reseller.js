const router = require("express").Router();
const User = require("../models/Users");
const Product = require("../models/Products");
const Transaksi = require("../models/Transaksi");
const Restock = require("../models/Restocks");
const Tarikuang = require("../models/Tarikuang");
const Toko = require("../models/Toko");
const {
  verifyTokenAndAdmin, verifyTokenAndReseller
} = require("./verifyToken");
const {
  countTransactionReseller,
} = require("./counting");

//Dashboard Reseller
router.get("/", countTransactionReseller, async (req, res) => {
  const totalTransaksi = req.totalTransaksi;
  const pendapatan = req.angkatotal;
  const tokonya = req.tokonya;
  // const transaksi = await Transaksi.find({id_transaksi: tokonya._id});
  res.status(200).json({totalTransaksi, pendapatan, tokonya});
});

//Data Pesanan
router.get("/datapesanan", verifyTokenAndReseller, async (req, res) => {
  const tokonya = req.tokonya;
  const pesananBaru = await Transaksi.find({id_toko: tokonya._id, status: "Menunggu Pengiriman"});
  Transaksi.find({id_toko: tokonya._id, status: "Sudah Dikirim"}, (err, pesananLama) => {
    if (err) res.status(403).json(err);
    res.status(200).json({pesananBaru, pesananLama});
  });
});

//Update Pesanan untuk Dikirim
router.put("/dikirim/:idtransaksi", verifyTokenAndReseller, async (req, res) => {
  try {
    const updateTransaksi = await Transaksi.findByIdAndUpdate(
      req.params.idtransaksi,
      {
        status: "Sudah Dikirim"
      },
      { new: true}
    );
    res.status(200).json(updateTransaksi);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Request Restock
router.post("/restock", verifyTokenAndReseller, async (req, res) => {
  try {
    const newRequest = new Restock({
      id_toko: req.tokonya._id,
      product: req.body.product
    });
    const savedRestock =  await newRequest.save();
    res.status(200).json(savedRestock);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Request Tarik Uang
router.post("/tarikuang", verifyTokenAndReseller, async (req, res) => {
  try {
    const newTarikuang = new Tarikuang({
      id_toko: req.tokonya._id,
      jumlah: req.body.jumlah,
    });
    const savedTarikuang = await newTarikuang.save();
    res.status(200).json(savedTarikuang);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;