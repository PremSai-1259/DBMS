const express = require('express')
const db = require("./configs/db");
const availabilityRoutes = require("./routes/availabilityroutes");
const appointmentRoutes = require("./routes/appointmentroutes");

const app = express()
const port = 3000
const authroutes = require("./routes/authroutes")
app.use(express.json());

//Auth Routes
app.use("/",authroutes);
//availability
app.use("/api", availabilityRoutes);
//appoinments
app.use("/api", appointmentRoutes);

app.listen(port, () => {
  console.log(`SERVER IS RUNNING ON PORT ${port}`)
})
