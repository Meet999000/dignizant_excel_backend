const express = require("express");
const user = require("./model/user");
const excel = require("./model/excel");
const upload = require("./bulkUpload");
const router = express.Router();
const path = require("path");
const XLSX = require("xlsx");
const async = require("async");

// function for modify data
var modifyDataOfExcel = async (arrayItem) => {
  let modifyData = [];
  for (let i in arrayItem) {
    let index = Object.keys(arrayItem[i].data);
    for (let j in index) {
      let obj = {};
      let arr = arrayItem[i].data[index[j]];
      for (let k in arr) {
        if (Number(k) === 0) {
          obj = {
            product: arr.Product,
            user: arr.user,
            price: arr.price,
            discount_price: arr.discountprice,
            category: arr.category,
          };
        }
        modifyData.push(obj);
      }
    }
  }
  return modifyData;
};

// function for check validation of the data
var checkExcelValidation = async (arrayItem) => {
  if (arrayItem.length) {
    for (let i in arrayItem) {
      let index = Object.keys(arrayItem[i].data);
      for (let j in index) {
        if (arrayItem[i].data[index[j]]) {
          let arr = arrayItem[i].data[index[j]];
          for (let k in arr) {
            if (Number(k) === 0) {
              if (!arr[k].product) {
                return { success: false, msg: "product is required" };
              } else if (!arr[k].user) {
                return { success: false, msg: "user is required" };
              } else if (!arr[k].price) {
                return { success: false, msg: "price is required" };
              } else if (!arr[k].discount_price) {
                return { success: false, msg: "discount_price is required" };
              } else if (!arr[k].category) {
                return { success: false, msg: "category is required" };
              }
            }
          }
        }
      }
    }
    return { success: true };
  } else {
    return { success: false };
  }
};

// Route of user register
router.post("/register", upload.single("photo"), async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let filePath = __dirname + `/${req.file.path}`;
    filePath = filePath.replace("/", "\\");
    const data = new user({
      name: name,
      email: email,
      password: password,
      photo: filePath,
    });
    const addHotel = await data.save();
    return res.status(200).json(addHotel);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Route of user login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .send({ message: "Email and Password is required to login" });
  }
  try {
    const userData = await user.findOne({ email: email });
    if (!userData) {
      return res.status(400).send({ message: "User Not Found!" });
    }
    if (userData.password !== password) {
      return res.status(400).send({ message: "Wrong Password!" });
    }
    return res
      .status(200)
      .send({ message: "Login Successfully", data: userData });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Route of upload excel
router.post("/upload-excel", upload.single("csv"), async (req, res) => {
  try {
    var data = [];
    var arrayItem = [];
    const csv = req.file;
    const slashIndex = csv.mimetype.indexOf("/");
    const ext = path.extname(csv.originalname);
    const ext2 = csv.mimetype.slice(slashIndex).replace("/", ".");
    const extArray = [".xlsx", ".xls", ".ods", ".csv"];
    if (!extArray.includes(ext) && !extArray.includes(ext2)) {
      return res.status(400).send({ message: "Invalid file format" });
    }
    if (!csv) {
      return res.status(400).send({ message: "File is required!" });
    }
    var workbook = XLSX.readFile(csv.path);
    var sheet_name_list = workbook.SheetNames;
    sheet_name_list.forEach(async function (y) {
      var worksheet = workbook.Sheets[y];
      var headers = {};
      for (z in worksheet) {
        if (z[0] === "!") continue;
        //parse out the column, row, and value
        var col = z.substring(0, 1);
        var row = parseInt(z.substring(1));
        var value = worksheet[z].v;
        var formula = worksheet[z].f;
        //store header names
        if (row == 1) {
          headers[col] = value;
          continue;
        }
        if (!data[row]) data[row] = {};
        data[row][headers[col].replace(/\s+/g, "").trim()] = value;
      }
      //drop those first two rows which are empty
      data.shift();
      data.shift();
      if (data?.length) {
        arrayItem.push({ data: data, sheetName: y.trim() });
      }
    });
    let ExcelValidation = await checkExcelValidation(arrayItem);
    if (ExcelValidation && !ExcelValidation.success) {
      return res.status(400).send({ message: "Validation failed" });
    }

    let modifyData = [];
    modifyData = await modifyDataOfExcel(arrayItem);

    modifyData.filter((values, index) => {
      for (let i = 0; i < modifyData.length; i++) {
        if (
          values.product === modifyData[i].product &&
          values.user === modifyData[i].user &&
          values.price === modifyData[i].price &&
          values.discount_price === modifyData[i].discount_price &&
          values.category === modifyData[i].category
        ) {
          modifyData.splice(index, 1);
        }
      }
      return values;
    });

    // queue for insert data into database
    const queue = async.queue((task, executed) => {
      console.log("Currently Busy Processing Task " + task);

      excel
        .create(task)
        .then((data) => {
          const tasksRemaining = queue.length();
          executed(null, { task, tasksRemaining });
          console.log("data inserting");
        })
        .catch((err) => {
          console.log("error", err);
          executed(err, null);
        });
    }, 100);

    console.log(`Queue Started ? ${queue.started}`);
    modifyData.map((task) => {
      if (task) {
        queue.push(task, (error, { task, tasksRemaining }) => {
          if (error) {
            console.log(`An error occurred while processing task ${error}`);
          } else {
            console.log(
              `Finished processing task ${task}. ${tasksRemaining} tasks remaining`
            );
          }
        });
      }
    });
    queue.drain(() => {
      console.log("All items are succesfully processed !");
    });
    return res.status(200).send({ message: "Data inserting started" });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
