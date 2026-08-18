const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri, { maxPoolSize: 10 });
  console.log('MongoDB connected');
};

module.exports = connectDB;
