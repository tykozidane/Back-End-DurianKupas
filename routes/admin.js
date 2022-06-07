const router = require("express").Router();
const User = require("../models/Users");
const Product = require("../models/Products");
const Toko = require("../models/Toko");
const Restock = require("../models/Restocks");
const Tarikuang = require("../models/Tarikuang");
const {
  verifyTokenAndAdmin,
} = require("./verifyToken");
const Transaksi = require("../models/Transaksi");
const { required } = require("nodemon/lib/config");

//Add Product
router.post("/addproduct", verifyTokenAndAdmin, async (req, res) => {
    const newProduct = new Product({
        nama: req.body.nama,
        deskripsi: req.body.deskripsi,
        harga: req.body.harga,
        img: req.body.img
    });
    try {
        const savedProduct = await newProduct.save();
        res.status(200).json(savedProduct);
    } catch (err) {
        res.status(500).json(err);
    }
});

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
        res.status(200).json(saveToko);
    } catch (err) {
        res.status(500).json(err);
    }
});

//Verifikasi Pembayaran
router.put("/pembayaranterverifikasi/:idtransaksi", verifyTokenAndAdmin, async (req, res) => {
    try {
        const updateTransaksi = await Transaksi.findByIdAndUpdate(
            req.params.idtransaksi,{
                status: "Menunggu Pengiriman",
            },
            { new: true}
        );
        res.status(200).json(updateTransaksi);
    } catch (err) {
        res.status(500).json(err);
    }
});

//Data Reseller
router.get("/datareseller", verifyTokenAndAdmin, async (req, res) => {
    const semuatoko = await Toko.find();
    User.find({role: "reseller"}, (err, reseller) => {
        if(err) {
            res.status(500).json(err);
        } else {
            res.status(200).json({semuatoko, reseller});
        }
    });
    
});

//Data Pembeli
router.get("/datapembeli", verifyTokenAndAdmin, async (req, res) => {
    try {
        const datapembeli = await User.find({role: "user"});
        res.status(200).json(datapembeli);
    } catch (err) {
        res.status(500).json(err);
    }
});

//Data Restock
router.get("/datarestock", verifyTokenAndAdmin, async (req, res) => {
    try {
        const dataRestock = await Restock.find({status: "Pending"});
        Restock.find({status: "Dikirim"}, (err, doneRestock) => {
            if (err) res.status(500).json(err);
            res.status(200).json({dataRestock, doneRestock}); 
        });
    } catch (err) {
        res.status(500).json(err);
    }
});

//Pengiriman Restock
router.put("/restockdikirim/:idrestock", verifyTokenAndAdmin, async (req, res) => {
    try {
        const updateRestock = await Restock.findByIdAndUpdate (
            req.params.idrestock,
            {
                tanggal: Date.now(),
                status: "Dikirim",
            },
            { new: true }
        );
        res.status(200).json(updateRestock);
    } catch (err) {
        res.status(500).json(err);
    }
});

//Data Tarik Uang
router.get("/datatarikuang", verifyTokenAndAdmin, async (req, res) => {
    try {
        const datatarikuang = await Tarikuang.find({status: "Pending"});
        Tarikuang.find({status: "Berhasil"}, (err, donetarikuang) => {
            if (err) res.status(500).json(err);
            res.status(200).json({datatarikuang, donetarikuang});
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
                bukti: req.body.linkimg,
                status: "Berhasil"
            },
            { new : true }
        );
        res.status(200).json(updateTarikuang);
    } catch (err) {
        res.status(500).json(err);
    }
});

//Data Product
router.get("/dataproduct", verifyTokenAndAdmin,async (req, res) => {
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
                $set: req.body
            },
            {new: true}
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