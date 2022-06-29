const router = require("express").Router();
const User = require("../models/Users");
const Product = require("../models/Products");
const Transaksi = require("../models/Transaksi");
const Restock = require("../models/Restocks");
const Tarikuang = require("../models/Tarikuang");
const Toko = require("../models/Toko");
const {
  verifyTokenAndAdmin,
  verifyTokenAndReseller,
  verifyTokenAndTransaction,
} = require("./verifyToken");
const { countTransactionReseller } = require("./counting");

//Dashboard Reseller
router.get("/", countTransactionReseller, async (req, res) => {
  const totalTransaksi = req.totalTransaksi;
  const pendapatan = req.angkatotal;
  const tokonya = req.tokonya;
  const reseller = await User.findById(req.user.id);
  // const transaksi = await Transaksi.find({id_transaksi: tokonya._id});
  return res.status(200).json({ reseller, totalTransaksi, pendapatan, tokonya });
});

//Data Pesanan
router.get("/datapesanan", verifyTokenAndReseller, async (req, res) => {
  const tokonya = req.tokonya;
  const pesananLama = await Transaksi.find({ id_toko: tokonya._id }).nor({
    status: "Menunggu Pengiriman",
  }).sort({ createdAt: -1 });
  Transaksi.find({ id_toko: tokonya._id, status: "Menunggu Pengiriman" }).sort({ createdAt: -1 }).exec((err, pesananBaru) => {
    if (err) return res.status(403).json(err);
    return res.status(200).json({ pesananBaru, pesananLama });
  });
});

//Update Pesanan untuk Dikirim
router.put("/dikirim/:idtransaksi", verifyTokenAndReseller, async (req, res) => {
  try {
    const updateTransaksi = await Transaksi.findByIdAndUpdate(
      req.params.idtransaksi,
      {
        status: "Sudah Dikirim",
      },
      { new: true }
    );
    return res.status(200).json(updateTransaksi);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Data Restock Reseller
router.get("/datarestock", verifyTokenAndReseller, async (req, res) => {
  try {
    const dataRestock = await Restock.find({ id_toko: req.tokonya._id }).sort({ createdAt: -1 });
    return res.status(200).json(dataRestock);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Request Restock
router.post("/restock", verifyTokenAndReseller, async (req, res) => {
  if (!req.body.product) return res.status(500).json("Product apa saja yang ingin di restock?");
  try {
    var utc = new Date();
    utc.setHours( utc.getHours() + 7);
    const newRequest = new Restock({
      id_toko: req.tokonya._id,
      tanggal: "",
      product: req.body.product,
      createdAt: utc,
    });
    const savedRestock = await newRequest.save();
    return res.status(200).json(savedRestock);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Data Tarik Uang
router.get("/datatarikuang", verifyTokenAndReseller, async (req, res) => {
  try {
    const datatarikuang = await Tarikuang.find({ id_toko: req.tokonya._id }).sort({ createdAt: -1 });
    return res.status(200).json(datatarikuang);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Request Tarik Uang
router.post("/tarikuang", verifyTokenAndReseller, async (req, res) => {
  if (!req.body.jumlah) return res.status(500).json("Berapa jumlah yang ingin ditarik?");
  if (req.body.jumlah < 20000) return res.status(500).json("Jumlah tidak bisa Kurang dari 20.000")
  try {
    if (req.tokonya.saldo < req.body.jumlah) {
      return res.status(500).json("Saldo Anda Kurang dari jumlah Permintaan!!!");
    } else {
      var utc = new Date();
      utc.setHours( utc.getHours() + 7);
      const newTarikuang = new Tarikuang({
        id_toko: req.tokonya._id,
        jumlah: req.body.jumlah,
        createdAt: utc,
      });
      const savedTarikuang = await newTarikuang.save();
      return res.status(200).json(savedTarikuang);
    }
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = router;
