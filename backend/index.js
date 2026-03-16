const express = require('express')
const db = require("./configs/db");
const app = express()
const port = 3000
const authroutes = require("./routes/authroutes")
app.use(express.json());

//Auth Routes
app.use("/",authroutes);
app.listen(port, () => {
  console.log(`SERVER IS RUNNING ON PORT ${port}`)
})
