const path = require("path");
const fs = require("fs");
const filePath = path.join(__dirname, "public", "keys.json");
var jsonData = [];
fs.readFile(filePath, "utf-8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  jsonData = JSON.parse(data);
});

console.log("Here" +jsonData)
exports.alphabets = jsonData;