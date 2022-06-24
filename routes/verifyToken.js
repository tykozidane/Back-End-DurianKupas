const jwt = require("jsonwebtoken");
const Transaksi = require("../models/Transaksi");
const Tarikuang = require("../models/Tarikuang")
const ReviewAndRating = require("../models/Reviews");
const User = require("../models/Users");
const Toko = require("../models/Toko");
const admin = "admin";
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.token;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SEC, (err, user) => {
      if (err) return res.status(403).json("Token Is Not Valid !!!");
      req.user = user;
      next();
    });
  } else {
    return res.status(401).json("You are not Authenticated !!!");
  }
};
const verifyTokenAndAuthorization = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.userId || req.user.role === admin) {
      next();
    } else {
      return res.status(403).json("You are not alowed to do that!");
    }
  });
};

const verifyTokenAndAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === admin) {
      next();
    } else {
      return res.status(403).json("You Are Not Admin!");
    }
  });
};

const verifyTokenAndTransaction = async (req, res, next) => {
  const transaksi = await Transaksi.findById(req.params.transaksiId);
  verifyToken(req, res, () => {
    if (req.user.id === transaksi.id_user || req.user.role === admin) {
      req.transaksi = transaksi;
      next();
    } else {
      return res.status(403).json("You are not alowed to do that!");
    }
  });
};

const verifyTokenAndReview = async (req, res, next) => {
  ReviewAndRating.find({ id_transaksi: req.params.transaksiId }, (err, adaReview) => {
    if (err) return res.status(403).json(err);
    req.review = adaReview;
    verifyTokenAndTransaction(req, res, () => {
      if (req.review.length === 0) {
        next();
      } else {
        return res.status(200).json("Anda Sudah Memberikan Review Atas Transaksi Ini, Terimakasih");
      }
    });
  });
};

const verifyTokenAndReseller = async (req, res, next) => {
  verifyToken(req, res, () => {
    if(req.user.role === "reseller") {
      Toko.findOne({id_user: req.user.id}, (err, tokonya) => {
      if (err) return res.status(403).json(err);
      req.tokonya = tokonya;
      next();
      });
    } else {
      return res.status(500).json("Anda bukan Reseller");
    }
  });
};

const verifyTokenAndPembeli = async (req, res, next) => {
  verifyToken(req, res, () => {
    User.findById(req.user.id, (err, pembeli) => {
      if (err) return res.status(500).json(err)
      req.pembeli = pembeli;
      next();
    })
  });
};
module.exports = {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
  verifyTokenAndTransaction,
  verifyTokenAndReview,
  verifyTokenAndReseller,
  verifyTokenAndPembeli
};
