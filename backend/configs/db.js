const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true
});

db.connect((err) => {
  if (err) {
    console.log("❌ DB connection failed:", err.message);
  } else {
    console.log("✅ MySQL connected");
  }
});

// We export the promise version so 'await' works in your models
module.exports = db.promise();