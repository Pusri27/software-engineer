require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const adminData = {
      name: 'Admin Nebwork',
      email: 'admin@gmail.com',
      password: 'AdminPassword@123', // User model will hash this automatically
      division: 'IT Administration',
      role: 'admin'
    };

    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log(`⚠️ Admin with email ${adminData.email} already exists.`);
      process.exit(0);
    }

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Success! Initial admin account created:');
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔑 Password: ${adminData.password}`);
    console.log('---');
    console.log('Please change your password after logging in.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
