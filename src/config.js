const mongoose = require("mongoose");
const connect = mongoose.connect("mongodb://localhost:27017/database");

connect.then(() => {
  console.log("Database connected Successfully");
})
.catch(() => {
  console.log("Database cannot be connected");
});


const Schema = new mongoose.Schema({
  rollnumber : {
    type : String,
    require : true
  },
  password : {
    type : String,
    require : true 
  }
});

const collection = new mongoose.model("users", Schema);

module.exports = collection;