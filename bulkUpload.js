const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const newDestination = "uploads/".replace("//", "/");
    var stat = null;
    try {
      stat = fs.statSync(newDestination);
    } catch (err) {
      fs.mkdirSync(newDestination);
    }
    if (stat && !stat.isDirectory()) {
      throw new Error(
        'Directory cannot be created because an inode of a different type exists at "' +
          dest +
          '"'
      );
    }
    cb(null, newDestination);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const maxFileSize = 1024 * 1024 * 20; // 20 MB
const upload = multer({
  storage,
  // limits: {
  //   fileSize: maxFileSize,
  // },
  fileFilter: function (req, file, callback) {
    // console.log("FILE FILE 2", file)
    // const slashIndex = file.mimetype.indexOf("/");
    // const ext = path.extname(file.originalname);
    // const ext2 = file.mimetype.slice(slashIndex).replace("/", ".");
    // const extArray = [".xlsx", ".xls", ".ods", ".csv"];
    // if (!extArray.includes(ext) && !extArray.includes(ext2)) {
    //   return callback(new Error("Only Excel File are allowed" + ext));
    // }
    callback(null, true);
  },
});
module.exports = upload;
