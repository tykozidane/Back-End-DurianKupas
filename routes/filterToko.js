const Toko = require("../models/Toko");
const Region = require("../models/Region");

//Penambahan Region
// const addRegion = (req, res, next) => {
//   if (req.body.provinsi) {
//     if (req.body.kota) {
//     Region.findOne({provinsi: req.body.provinsi}, async (err, provinsi) => {
//       if (!provinsi) {
//         const newProvinsi = new Region({
//           pronvinsi: req.body.pronvinsi,
//           kota: req.body.kota,
//         });
//         const saveprovinsi = await newProvinsi.save();
//         req.provinsi = saveprovinsi;
//         next();
//       } else {
//         if (provinsi.kota === req.body.kota){
//           res.status(500).json("Kota Sudah memiliki Reseller");
//         }
//         const addKota = await Region.findByIdAndUpdate(
//           provinsi._id,
//           {
//             $push: { 
//               kota: req.body.kota,
//           }
//           }, { new: true });
//           req.provinsi = addKota;
//           next();
//       }
//     });
//     } else {
//       res.status(500).json("Dimana data Kotanya?");
//     }
//   } else {
//     res.status(500).json("Dimana data Provinsinya?");
//   }
// };

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
  // addRegion,
};
