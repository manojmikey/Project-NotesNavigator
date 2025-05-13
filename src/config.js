const mongoose = require('mongoose');
require('dotenv').config(); // Loads variables from .env

const mongoURI = process.env.MONGO_URL;


mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  rollnumber: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

// Create the User model based on the schema
const User = mongoose.model('User', userSchema);

module.exports = User;