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
  verifyTokenAndPembeli,
} = require("./verifyToken");
const { filterToko } = require("./filterToko");
const req = require("express/lib/request");
const Region = require("../models/Region");
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
//Testing
router.get("/", async (req, res) => {
  const products = await Product.find();
  return res.status(200).json(products);
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    uploadimage(req, res, () => {
      const link = req.imageupload;
      return res.status(200).json(link);
    });
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Fungsi Upload Image
const uploadimage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(500).json("File Kosong");
    const result = await cloudinary.uploader.upload(req.file.path);
    req.imageupload = result;
    next();
  } catch (err) {
    return res.status(500).json(err);
  }
};

//profile
router.get("/profile/:userId", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const { password, ...others } = user._doc;
    return res.status(200).json(others);
  } catch (err) {
    return res.status(500).json(err);
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
    return res.status(200).json(updateUser);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Pemesanan
router.post("/pesan", verifyTokenAndPembeli, async (req, res) => {
  if (!req.body.pesanan) return res.status(500).json("Produknya Apa Saja Nih?");
  try {
    const newTransaksi = new Transaksi({
      id_user: req.user.id,
      username: req.pembeli.username,
      pesanan: req.body.pesanan,
    });
    const savedTransaksi = await newTransaksi.save();
    return res.status(200).json(savedTransaksi);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//get region
router.get("/region", async (req, res) => {
  try {
    const dataRegion = await Region.find();
    return res.status(200).json(dataRegion);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Detail Pesanan
router.put("/detail/:transaksiId", verifyTokenAndTransaction, filterToko, async (req, res) => {
  if (!req.body.total) return res.status(500).json("Totalnya Berapa Del");
  if (!req.body.provinsi) return res.status(500).json("Provinsi Belum Diisi !!!");
  if (!req.body.kota) return res.status(500).json("Kota Belum Diisi!!!");
  if (!req.body.kecamatan) return res.status(500).json("Kecamatan Belum Diisi !!!");
  if (!req.body.alamat) return res.status(500).json("Detail Alamatnya Belum Diisi !!!");
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
    return res.status(200).json(updateDetail);
  } catch (err) {
    return res.status(500).json(err);
  }
  // return res.status(200).json(req.transaksi);
});

//Delete / Batalkan Pesanan
router.delete("/deletetransaksi/:transaksiId", verifyTokenAndTransaction, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.transaksiId);
    return res.status(200).json("Transaction Has been Deleted");
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Pembayaran
router.put(
  "/payment/:transaksiId",
  verifyTokenAndTransaction,
  upload.single("image"),
  async (req, res) => {
    // if (!req.body.image) return res.status(500).json("Foto Bukti Belum Dikirim");
    try {
      uploadimage(req, res, () => {
        const link = req.imageupload;
        if (!req.imageupload) return res.status(500).json("Foto Bukti Belum Dikirim");
        Transaksi.findByIdAndUpdate(
          req.params.transaksiId,
          {
            buktipembayaran: link.secure_url,
            status: "Verifikasi Pembayaran",
          },
          { new: true },
          (err, updatePayment) => {
            if (err) return res.status(500).json(err);
            return res.status(200).json(updatePayment);
          }
        );
      });
    } catch (err) {
      return res.status(500).json(err);
    }
    // return res.status(200).json(req.transaksi);
  }
);

//Info Pesanan User
router.get("/mytransaction/:userId", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const transaksiku = await Transaksi.find({ id_user: req.params.userId }).sort({
      createdAt: -1,
    });
    return res.status(200).json(transaksiku);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Info satu transaksi
router.get("/transaksi/:transaksiId", verifyTokenAndTransaction, async (req, res) => {
  try {
    const transaksiku = await Transaksi.findById(req.params.transaksiId);
    return res.status(200).json(transaksiku);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//update stok di Toko
const updatestoknya = async (req, res, next) => {
  const tokonya = req.tokonya;
  const arrayproduk = req.produknya;
  for (let i = 0; i < arrayproduk.length; i++) {
    var jumlah = 0;
    for (let j = 0; j < tokonya.stock.length; j++) {
      if (tokonya.stock[j].product == arrayproduk[i].product) {
        jumlah = tokonya.stock[j].jumlah - arrayproduk[i].jumlah;

        const update = await Toko.updateOne(
          { _id: tokonya._id, "stock.product": tokonya.stock[j].product },
          {
            $set: { "stock.$.jumlah": jumlah },
          }
        );
        j = tokonya.stock.length;
      }
    }
  }
  req.arraybaru = arrayproduk;
  next();
};

//Transaksi Selesai
router.put("/transaksiselesai/:transaksiId", verifyTokenAndTransaction, async (req, res) => {
  try {
    const transaksiSelesai = await Transaksi.findByIdAndUpdate(
      req.params.transaksiId,
      {
        status: "Selesai",
      },
      { new: true }
    );
    Toko.findById(transaksiSelesai.id_toko, (err, tokonya) => {
      if (err) return res.status(500).json(err);
      saldobaru = tokonya.saldo + transaksiSelesai.total;
      req.tokonya = tokonya;
      const produknya = transaksiSelesai.pesanan;
      req.produknya = produknya;
      updatestoknya(req, res, () => {
        Toko.findByIdAndUpdate(
          transaksiSelesai.id_toko,
          {
            saldo: saldobaru,
          },
          { new: true },
          (err, tokoupdate) => {
            if (err) return res.status(500).json(err);
            return res.status(200).json({ transaksiSelesai, tokoupdate });
          }
        );
      });
    });
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Review And Rating
router.post("/rating/:transaksiId", verifyTokenAndReview, async (req, res) => {
  if (!req.review) return res.status(500).json("Reviewnya belum diisi!");
  if (!req.rating) return res.status(500).json("Ratingnya belum diisi!");
  try {
    const newRating = new ReviewAndRating({
      id_transaksi: req.params.transaksiId,
      id_user: req.user.id,
      review: req.body.review,
      rating: req.body.rating,
    });
    const savedRating = await newRating.save();
    Transaksi.findByIdAndUpdate(
      req.params.transaksiId,
      {
        review: true,
      },
      { new: true },
      (err, setelahreview) => {
        if (err) return res.status(500).json(err);

        return res.status(200).json({ savedRating, setelahreview });
      }
    );
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = router;
