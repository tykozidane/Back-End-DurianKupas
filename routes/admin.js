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
// const { addRegion } = require("./filterToko");

//Add Product
router.post("/addproduct", verifyTokenAndAdmin, async (req, res) => {
  const newProduct = new Product({
    nama: req.body.nama,
    deskripsi: req.body.deskripsi,
    harga: req.body.harga,
    img: req.body.img,
  });
  try {
    const savedProduct = await newProduct.save();
    res.status(200).json(savedProduct);
  } catch (err) {
    res.status(500).json(err);
  }
});

const addRegion = async (req, res, next) => {
  if (req.body.provinsi) {
    if (req.body.kota) {
      // const region = await Region.find({provinsi: req.params.provinsi})
      // if (!region) res.status(200).json("provinsi ga ada");
      Region.find({ provinsi: req.body.provinsi }, async (err, provinsi) => {
          if (err) res.status(500).json(err);
        if (!provinsi.provinsi) {
        //   res.status(200).json("provinsi ga ada");
          const newProvinsi = new Region({
            provinsi: req.body.provinsi,
            kota: req.body.kota,
          });
          const saveprovinsi = await newProvinsi.save();
          req.provinsi = saveprovinsi;
          next();
        } else {
          if (provinsi.kota === req.body.kota) {
            res.status(500).json("Kota Sudah memiliki Reseller");
          } else {
            // res.status(200).json("Kota ga ada");
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
          }
        }
      });
    } else {
      res.status(500).json("Dimana data Kotanya?");
    }
  } else {
    res.status(500).json("Dimana data Provinsinya?");
  }
};

//Add Toko
router.post("/addtoko", verifyTokenAndAdmin, async (req, res) => {
  const newToko = new Toko({
    namatoko: req.body.namatoko,
    id_user: req.body.id_user,
    email: req.body.email,
    phone: req.body.phone,
    provinsi: req.body.provinsi,
    kota: req.body.kota,
    stock: req.body.stock,
    saldo: 0,
  });
  try {
    const saveToko = await newToko.save();
    addRegion(req, res, () => {
      User.findByIdAndUpdate(
        req.body.id_user,
        {
          role: "reseller",
        },
        { new: true },
        (err, reseller) => {
          if (err) res.status(500).json(err);
          res.status(200).json({ saveToko, reseller });
        }
      );
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

//Data Pesanan
router.get("/datapesanan", verifyTokenAndAdmin, async (req, res) => {
  try {
    const datapesanan = await Transaksi.find().nor({ status: "Verifikasi Pembayaran" });
    Transaksi.find({ status: "Verifikasi Pembayaran" }, (err, verifikasi) => {
      if (err) res.status(500).json(err);
      res.status(200).json({ datapesanan, verifikasi });
    });
  } catch (err) {
    res.status(500).json(err);
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
    res.status(200).json(updateTransaksi);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Data Reseller
router.get("/datareseller", verifyTokenAndAdmin, async (req, res) => {
  const semuatoko = await Toko.find();
  User.find({ role: "reseller" }, (err, reseller) => {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(200).json({ semuatoko, reseller });
    }
  });
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
    res.status(200).json(updateToko);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Delete Toko
router.delete("/deletetoko/:idtoko", verifyTokenAndAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.idtoko);
    res.status(200).json("Toko Has Been Deleted . . .");
  } catch (err) {
    res.status(500).json(err);
  }
});

//Data Pembeli
router.get("/datapembeli", verifyTokenAndAdmin, async (req, res) => {
  try {
    const datapembeli = await User.find({ role: "user" });
    res.status(200).json(datapembeli);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Update Pembeli
router.put("/updatepembeli/:iduser", verifyTokenAndAdmin, async (req, res) => {
  try {
    const updatePembeli = await Toko.findByIdAndUpdate(
      req.params.iduser,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updatePembeli);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Delete Pembeli
router.delete("/deletePembeli/:iduser", verifyTokenAndAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.iduser);
    res.status(200).json("Account Has Been Deleted . . .");
  } catch (err) {
    res.status(500).json(err);
  }
});

//Data Restock
router.get("/datarestock", verifyTokenAndAdmin, async (req, res) => {
  try {
    const dataRestock = await Restock.find({ status: "Pending" });
    Restock.find({ status: "Dikirim" }, (err, doneRestock) => {
      if (err) res.status(500).json(err);
      res.status(200).json({ dataRestock, doneRestock });
    });
  } catch (err) {
    res.status(500).json(err);
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
        jumlah = tokonya.stock[j].jumlah + arrayproduk[i].jumlah;

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
      if (err) res.status(500).json(err);
      req.tokonya = tokonya;
      updatestoknya(req, res, () => {
        res.status(200).json(updateRestock);
      });
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

//Data Tarik Uang
router.get("/datatarikuang", verifyTokenAndAdmin, async (req, res) => {
  try {
    const datatarikuang = await Tarikuang.find({ status: "Pending" });
    Tarikuang.find({ status: "Berhasil" }, (err, donetarikuang) => {
      if (err) res.status(500).json(err);
      res.status(200).json({ datatarikuang, donetarikuang });
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

//Bukti Transfer Uang Reseller
router.put("/transfer/:idtarikuang", verifyTokenAndAdmin, async (req, res) => {
  try {
    const updateTarikuang = await Tarikuang.findByIdAndUpdate(
      req.params.idtarikuang,
      {
        tanggal: Date.now(),
        bukti: req.body.bukti,
        status: "Berhasil",
      },
      { new: true }
    );
    var saldobaru = 0;
    Toko.findById(updateTarikuang.id_toko, (err, tokonya) => {
      if (err) res.status(500).json(err);
      saldobaru = tokonya.saldo - updateTarikuang.jumlah;
      Toko.findByIdAndUpdate(
        updateTarikuang.id_toko,
        {
          saldo: saldobaru,
        },
        { new: true },
        (err, tokoupdate) => {
          if (err) res.status(500).json(err);
          res.status(200).json({ updateTarikuang, tokoupdate });
        }
      );
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

//Data Product
router.get("/dataproduct", verifyTokenAndAdmin, async (req, res) => {
  try {
    const product = await Product.find();
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Update Product
router.put("/updateproduct/:idproduct", verifyTokenAndAdmin, async (req, res) => {
  try {
    const updateProduct = await Product.findByIdAndUpdate(
      req.params.idproduct,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updateProduct);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Delete Product
router.delete("/deleteproduct/:idproduct", verifyTokenAndAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.idproduct);
    res.status(200).json("Product Has Been Deleted . . .");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
