const mongoose = require('mongoose');
   const User = require('../models/User');
   require('dotenv').config();

   mongoose.connect(process.env.MONGODB_URI);

   async function makeAdmin() {
     const email =nwaomavisuals@gmail.com; // ← Change this to YOUR email
     
     const user = await User.findOne({ email });
     
     if (user) {
       user.role = 'admin';
       await user.save();
       console.log(`✅ ${email} is now an admin!`);
     } else {
       console.log(`❌ User with email ${email} not found`);
     }
     
     process.exit();
   }

   makeAdmin().catch(err => {
     console.error('Error:', err);
     process.exit(1);
   });