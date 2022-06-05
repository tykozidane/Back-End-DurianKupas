const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const resellerRouter = require("./routes/reseller");
const { urlencoded } = require("express");

dotenv.config();

mongoose.connect(    process.env.MONGO_URL)
    .then (() => console.log("DBConnection Succesfull"))
    .catch((err) =>{
        console.log(err);
});

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use("/api/users", userRouter );
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/reseller", resellerRouter);

app.listen(process.env.PORT || 5000, () => {
    console.log("Backend server is running");
});