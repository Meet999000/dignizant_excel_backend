const mongoose = require("mongoose");

const excelSchema = new mongoose.Schema({
  product: { type: String },
  user: { type: String },
  price: { type: String },
  discount_price: { type: String },
  category: { type: String },
  createdAt: { type: Date, default: new Date() },
  updatedAt: { type: Date, default: new Date() },
});

module.exports = mongoose.model("excel", excelSchema);
