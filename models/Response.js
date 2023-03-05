const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ResponseSchema = new Schema({
  _id: false,
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: String,
    unique: true,
  },
});

const Product = mongoose.model("Response", ResponseSchema);

module.exports = Product;
