const jwt = require("jsonwebtoken");
const Transaksi = require("../models/Transaksi");
const ReviewAndRating = require("../models/Reviews");
const Toko = require("../models/Toko");
const admin = "admin";
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.token;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SEC, (err, user) => {
      if (err) res.status(403).json("Token Is Not Valid !!!");
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
      res.status(403).json("You are not alowed to do that!");
    }
  });
};

const verifyTokenAndAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === admin) {
      next();
    } else {
      res.status(403).json("You Are Not Admin!");
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
      res.status(403).json("You are not alowed to do that!");
    }
  });
};

const verifyTokenAndReview = async (req, res, next) => {
  ReviewAndRating.find({ id_transaksi: req.params.transaksiId }, (err, adaReview) => {
    if (err) res.status(403).json(err);
    req.review = adaReview;
    verifyTokenAndTransaction(req, res, () => {
      if (req.review.length === 0) {
        next();
      } else {
        res.status(200).json("Anda Sudah Memberikan Review Atas Transaksi Ini, Terimakasih");
      }
    });
  });
};

const verifyTokenAndReseller = async (req, res, next) => {
  verifyToken(req, res, () => {
    if(req.user.role === "reseller") {
      Toko.findOne({id_user: req.user.id}, (err, tokonya) => {
      if (err) res.status(403).json(err);
      req.tokonya = tokonya;
      next();
      });
    } else {
      res.status(500).json("Anda bukan Reseller");
    }
  });
};

module.exports = {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
  verifyTokenAndTransaction,
  verifyTokenAndReview,
  verifyTokenAndReseller,
};
