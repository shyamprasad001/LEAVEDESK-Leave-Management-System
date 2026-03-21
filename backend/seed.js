/**
 * SEED SCRIPT - Run once to create demo users
 * Usage: node seed.js
 * Make sure MongoDB URI is set or edit MONGODB_URI below
 */
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/faculty_leave_db';

const seedUsers = [
  {
    name: 'Dr. Ramesh Kumar',
    email: 'faculty@demo.com',
    password: 'demo123',
    role: 'faculty',
    department: 'Computer Science',
    employeeId: 'FAC001',
    designation: 'Assistant Professor',
    phone: '9876543210'
  },
  {
    name: 'Dr. Priya Sharma',
    email: 'faculty2@demo.com',
    password: 'demo123',
    role: 'faculty',
    department: 'Computer Science',
    employeeId: 'FAC002',
    designation: 'Associate Professor',
    phone: '9876543211'
  },
  {
    name: 'Prof. Suresh Reddy',
    email: 'hod@demo.com',
    password: 'demo123',
    role: 'hod',
    department: 'Computer Science',
    employeeId: 'HOD001',
    designation: 'Head of Department',
    phone: '9876543212'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const userData of seedUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`User already exists: ${userData.email}`);
      } else {
        const user = new User(userData);
        await user.save();
        console.log(`Created: ${userData.name} (${userData.role}) - ${userData.email}`);
      }
    }

    console.log('\nSeed completed!');
    console.log('Faculty login: faculty@demo.com / demo123');
    console.log('HOD login:     hod@demo.com / demo123');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
