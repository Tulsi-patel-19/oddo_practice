const express = require("express")
const cors = require("cors")
require("dotenv").config();

const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const supplierRoutes = require("./routes/supplierRoutes");

const db = require("./database/db");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/products",productRoutes);
app.use("/categories",categoryRoutes);

app.get("/",(req,res)=>{
    res.send("Inventory Managemnet API is Running !!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
    console.log(`server running on port ${PORT}`);
});