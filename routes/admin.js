const router = require("express").Router();
const User = require("../models/Users");
const Product = require("../models/Products");
const Toko = require("../models/Toko");
const Restock = require("../models/Restocks");
const Tarikuang = require("../models/Tarikuang");
const { verifyTokenAndAdmin } = require("./verifyToken");
const Transaksi = require("../models/Transaksi");
const { required } = require("nodemon/lib/config");
const Region = require("../models/Region");
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
// const { addRegion } = require("./filterToko");

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

//Add Product
router.post("/addproduct", verifyTokenAndAdmin, upload.single("image"), async (req, res) => {
  try {
    const allproduct = await Product.findOne({ nama: req.body.nama });
    if (allproduct) return res.status(500).json("Produk ini sudah ada di Database");
    uploadimage(req, res, () => {
      const link = req.imageupload;
      const newProduct = new Product({
        nama: req.body.nama,
        deskripsi: req.body.deskripsi,
        harga: req.body.harga,
        img: link.secure_url,
      });
      newProduct.save();
      return res.status(200).json(newProduct);
    });
  } catch (err) {
    return res.status(500).json(err);
  }
});

const addRegion = async (req, res, next) => {
  if (req.body.provinsi) {
    if (req.body.kota) {
      // const region = await Region.find({provinsi: req.params.provinsi})
      // if (!region) return res.status(200).json("provinsi ga ada");
      Region.findOne({ provinsi: req.body.provinsi }, async (err, provinsi) => {
        if (err) return res.status(500).json(err);
        if (provinsi) {
          const kotanya = provinsi.kota;
          for (let i = 0; i < kotanya.length; i++) {
            if (kotanya[i] === req.body.kota) {
              return res.status(500).json("Kota Sudah memiliki Reseller");
            }
          }
          const addKota = await Region.findByIdAndUpdate(
            provinsi._id,
            {
              $push: {
                kota: req.body.kota,
              },
            },
            { new: true }
          );
          req.provinsi = addKota;
          next();
        } else {
          // return res.status(200).json("provinsi ga ada");
          const newProvinsi = new Region({
            provinsi: req.body.provinsi,
            kota: req.body.kota,
          });
          const saveprovinsi = await newProvinsi.save();
          req.provinsi = saveprovinsi;
          next();
        }
      });
    } else {
      return res.status(500).json("Dimana data Kotanya?");
    }
  } else {
    return res.status(500).json("Dimana data Provinsinya?");
  }
};

//Add Toko
router.post("/addtoko", verifyTokenAndAdmin, async (req, res) => {
  const usernya = await User.findOne({ username: req.body.username });
  if (!usernya._id) return res.status(200).json("Username Tidak Ditemukan");
  const newToko = new Toko({
    namatoko: req.body.namatoko,
    id_user: usernya._id,
    email: usernya.email,
    phone: usernya.phone,
    provinsi: req.body.provinsi,
    kota: req.body.kota,
    stock: req.body.stock,
    saldo: 0,
  });
  try {
    addRegion(req, res, () => {
      User.findByIdAndUpdate(
        usernya._id,
        {
          role: "reseller",
        },
        { new: true },
        (err, reseller) => {
          if (err) return res.status(500).json(err);
          provinsi = req.provinsi;
          if (provinsi.provinsi === req.body.provinsi) {
            newToko.save();
            return res.status(200).json({ newToko, reseller, provinsi });
          }
        }
      );
    });
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Data Pesanan
router.get("/datapesanan", verifyTokenAndAdmin, async (req, res) => {
  try {
    const datapesanan = await Transaksi.find().nor({ status: "Verifikasi Pembayaran" });
    Transaksi.find({ status: "Verifikasi Pembayaran" }, (err, verifikasi) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json({ datapesanan, verifikasi });
    });
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Verifikasi Pembayaran
router.put("/pembayaranterverifikasi/:idtransaksi", verifyTokenAndAdmin, async (req, res) => {
  try {
    const updateTransaksi = await Transaksi.findByIdAndUpdate(
      req.params.idtransaksi,
      {
        status: "Menunggu Pengiriman",
      },
      { new: true }
    );
    return res.status(200).json(updateTransaksi);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Pembayaran ditolak
router.put("/pembayaranditolak/:idtransaksi", verifyTokenAndAdmin, async (req, res) => {
  try {
    const updateTransaksi = await Transaksi.findByIdAndUpdate(
      req.params.idtransaksi,
      {
        status: "Pembayaran Ditolak",
      },
      { new: true }
    );
    return res.status(200).json(updateTransaksi);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Data Reseller
router.get("/datareseller", verifyTokenAndAdmin, async (req, res) => {
  const semuatoko = await Toko.find();
  User.find({ role: "reseller" }, (err, reseller) => {
    if (err) {
      return res.status(500).json(err);
    } else {
      return res.status(200).json({ semuatoko, reseller });
    }
  });
});

//Data Satu Reseller
router.get("/datareseller/:tokoId", verifyTokenAndAdmin, async (req, res) => {
  const tokonya = await Toko.findById(req.params.tokoId);
  const resellernya = await User.findById(tokonya.id_user);
  return res.status(200).json({ tokonya, resellernya });
});

//Update Toko
router.put("/updatetoko/:idtoko", verifyTokenAndAdmin, async (req, res) => {
  try {
    const updateToko = await Toko.findByIdAndUpdate(
      req.params.idtoko,
      {
        $set: req.body,
      },
      { new: true }
    );
    return res.status(200).json(updateToko);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Delete Toko
router.delete("/deletetoko/:idtoko", verifyTokenAndAdmin, async (req, res) => {
  try {
    const tokonya = await Toko.findById(req.params.idtoko);
    await Toko.findByIdAndDelete(req.params.idtoko);
    const region = await Region.findOneAndUpdate(
      { provinsi: tokonya.provinsi },
      {
        $pull: {
          kota: tokonya.kota,
        },
      }, { new: true}
    );
    if (region.kota.length === 0) {
      await Region.findByIdAndDelete(region._id);
    }
    await User.findByIdAndUpdate(
      tokonya.id_user,
      {
        role: "user",
      },
      { new: true }
    );
    return res.status(200).json("Toko Has Been Deleted . . .");
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Data Pembeli
router.get("/datapembeli", verifyTokenAndAdmin, async (req, res) => {
  try {
    const datapembeli = await User.find({ role: "user" }).sort({ createdAt: -1 });
    return res.status(200).json(datapembeli);
  } catch (err) {
    return res.status(500).json(err);
  }
});

////Data Satu Pembeli
router.get("/datapembeli/:userId", verifyTokenAndAdmin, async (req, res) => {
  try {
    const datapembeli = await User.findOne({ _id: req.params.userId, role: "user" });
    return res.status(200).json(datapembeli);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Update Pembeli
router.put("/updatepembeli/:iduser", verifyTokenAndAdmin, async (req, res) => {
  try {
    const updatePembeli = await User.findByIdAndUpdate(
      req.params.iduser,
      {
        $set: req.body,
      },
      { new: true }
    );
    return res.status(200).json(updatePembeli);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Delete Pembeli
router.delete("/deletePembeli/:iduser", verifyTokenAndAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.iduser);
    return res.status(200).json("Account Has Been Deleted . . .");
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Data Restock
router.get("/datarestock", verifyTokenAndAdmin, async (req, res) => {
  try {
    const dataRestock = await Restock.find({ status: "Pending" });
    Restock.find({ status: "Dikirim" })
      .sort({ createdAt: -1 })
      .exec((err, doneRestock) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json({ dataRestock, doneRestock });
      });
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
        var stok1 = tokonya.stock[j].jumlah;
        var stok2 = arrayproduk[i].jumlah;
        jumlah = parseInt(stok1)+parseInt(stok2);

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

//Pengiriman Restock
router.put("/restockdikirim/:idrestock", verifyTokenAndAdmin, async (req, res) => {
  try {
    const updateRestock = await Restock.findByIdAndUpdate(
      req.params.idrestock,
      {
        tanggal: Date.now(),
        status: "Dikirim",
      },
      { new: true }
    );
    const produknya = updateRestock.product;
    req.produknya = produknya;
    Toko.findById(updateRestock.id_toko, (err, tokonya) => {
      if (err) return res.status(500).json(err);
      req.tokonya = tokonya;
      updatestoknya(req, res, () => {
        return res.status(200).json(updateRestock);
      });
    });
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Data Tarik Uang
router.get("/datatarikuang", verifyTokenAndAdmin, async (req, res) => {
  try {
    const datatarikuang = await Tarikuang.find({ status: "Pending" });
    Tarikuang.find({ status: "Berhasil" }, (err, donetarikuang) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json({ datatarikuang, donetarikuang });
    });
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Get satu data tarik uang
router.get("/datatarikuang/:tarikuangId", verifyTokenAndAdmin, async (req, res) => {
  try {
    const dataTarikUang = await Tarikuang.findById(req.params.tarikuangId);
    return res.status(200).json(dataTarikUang);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Bukti Transfer Uang Reseller
router.put(
  "/transfer/:idtarikuang",
  verifyTokenAndAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      uploadimage(req, res, () => {
        const link = req.imageupload;
        Tarikuang.findByIdAndUpdate(
          req.params.idtarikuang,
          {
            tanggal: Date.now(),
            bukti: link.secure_url,
            status: "Berhasil",
          },
          { new: true },
          (err, updateTarikuang) => {
            if (err) return res.status(500).json(err);
            var saldobaru = 0;
            Toko.findById(updateTarikuang.id_toko, (err, tokonya) => {
              if (err) return res.status(500).json(err);
              saldobaru = tokonya.saldo - updateTarikuang.jumlah;
              Toko.findByIdAndUpdate(
                updateTarikuang.id_toko,
                {
                  saldo: saldobaru,
                },
                { new: true },
                (err, tokoupdate) => {
                  if (err) return res.status(500).json(err);
                  return res.status(200).json({ updateTarikuang, tokoupdate });
                }
              );
            });
          }
        );
      });
    } catch (err) {
      return res.status(500).json(err);
    }
  }
);

//Data Product
router.get("/dataproduct", verifyTokenAndAdmin, async (req, res) => {
  try {
    const product = await Product.find();
    return res.status(200).json(product);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Data Product by ID
router.get("/dataproduct/:productId", verifyTokenAndAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    return res.status(200).json(product);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Update Product
router.put(
  "/updateproduct/:idproduct",
  verifyTokenAndAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      if (req.file) {
        uploadimage(req, res, () => {
          const link = req.imageupload;
          req.body.img = link.secure_url;
          Product.findByIdAndUpdate(
            req.params.idproduct,
            {
              img: link.secure_url,
            },
            { new: true }
          ).exec((err, imgproduct) => {
            if (err) return res.status(500).json(err);
            req.imgproduct = imgproduct;
          });
        });
      }
      const updateProduct = await Product.findByIdAndUpdate(
        req.params.idproduct,
        {
          $set: req.body,
        },
        { new: true }
      );
      return res.status(200).json(updateProduct);
    } catch (err) {
      return res.status(500).json(err);
    }
  }
);

//Delete Product
router.delete("/deleteproduct/:idproduct", verifyTokenAndAdmin, async (req, res) => {
  try {
    // await Product.findByIdAndDelete(req.params.idproduct);
    await Product.deleteOne({ _id: req.params.idproduct });
    return res.status(200).json("Product Has Been Deleted . . .");
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = router;
