const mongoose = require('mongoose');
const User = require('./models/User');

async function cleanupUserAddresses() {
  await mongoose.connect('mongodb://localhost:27017/ottoman', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('Starting user data cleanup...');

  // Step 1: Ensure data from any old nested 'address' object is moved to top-level fields.
  // This prevents data loss if a user has data in both places.
  const migrationResult = await User.updateMany(
    { 'address': { '$exists': true, '$type': 'object' } },
    [
      {
        '$set': {
          'houseName': { '$ifNull': ['$address.houseName', '$houseName'] },
          'streetArea': { '$ifNull': ['$address.streetArea', '$streetArea'] },
          'city': { '$ifNull': ['$address.city', '$city'] },
          'state': { '$ifNull': ['$address.state', '$state'] },
          'country': { '$ifNull': ['$address.country', '$country'] },
          'pincode': { '$ifNull': ['$address.pincode', '$pincode'] }
        }
      }
    ]
  );
  console.log(`Step 1 (Data Consolidation): Matched: ${migrationResult.matchedCount}, Modified: ${migrationResult.modifiedCount}`);

  // Step 2: Remove the old nested 'address' object from all documents to eliminate duplicates.
  const unsetResult = await User.updateMany(
    { 'address': { '$exists': true } },
    { '$unset': { 'address': '' } }
  );
  console.log(`Step 2 (Cleanup Old Field): Matched: ${unsetResult.matchedCount}, Modified: ${unsetResult.modifiedCount}`);


  console.log('Cleanup complete. Your user data is now consistent.');
  await mongoose.disconnect();
}

cleanupUserAddresses(); 