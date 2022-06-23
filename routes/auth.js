const router = require("express").Router();
const User = require("../models/Users");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

//Testing
router.get("/", (req, res) => {
  res.send("Auth test berhasil");
});

//Register
router.post("/register", async (req, res) => {
  if (!req.body.username) res.status(500).json("Username Harus Di Isi !!!");
  if (!req.body.email) res.status(500).json("Email Harus Di Isi !!!");
  var emailFormat = /^[a-zA-Z0-9_.+]+(?<!^[0-9]*)@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  if (!req.body.email.match(emailFormat)) res.status(500).json("Format Email Salah");
  if (!req.body.password) res.status(500).json("Password Harus Di Isi !!!");
  if (!req.body.phone) res.status(500).json("Phone Harus Di Isi !!!");
  const cekUsername = await User.findOne({ username: req.body.username });
  if (cekUsername) res.status(500).json("Username Sudah Digunakan.");
  const cekEmail = await User.findOne({ email: req.body.email });
  if (cekEmail) res.status(500).json("Email Sudah Digunakan.");
  if (req.body.password.length < 8) res.status(500).json("Password Kurang dari 8 karakter!!!");
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    password: CryptoJS.AES.encrypt(req.body.password, process.env.PASS_SEC),
    phone: req.body.phone,
    alamat: [""],
  });
  try {
    const savedUser = await newUser.save();
    const user = await User.findOne({ username: newUser.username });
    const accessToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SEC,
      { expiresIn: "1d" }
    );
    res.status(201).json({ savedUser, accessToken });
  } catch (err) {
    res.status(500).json(err);
  }
});

//Log In
router.post("/login", async (req, res) => {
  if (!req.body.username) res.status(500).json("Username Harus Di Isi !!!");
  if (!req.body.password) res.status(500).json("Password Harus Di Isi !!!");
  try {
    const user = await User.findOne({ username: req.body.username });
    !user && res.status(401).json("Username Tidak Terdaftar!!!");

    const hashedPassword = CryptoJS.AES.decrypt(user.password, process.env.PASS_SEC);
    const OriginalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);

    OriginalPassword !== req.body.password && res.status(401).json("Wrong credentials!");

    const accessToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SEC,
      { expiresIn: "1d" }
    );

    const { password, ...others } = user._doc;
    res.status(200).json({ ...others, accessToken });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
