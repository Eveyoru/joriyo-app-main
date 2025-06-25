import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

// This script manually updates the orders collection to add the status field
// It doesn't use the model to avoid validation issues

async function addStatusToOrders() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB using the URI from .env
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get direct access to the orders collection
    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');
    
    // Count orders without status field
    const countBefore = await ordersCollection.countDocuments({ status: { $exists: false } });
    console.log(`Found ${countBefore} orders without status field`);
    
    if (countBefore === 0) {
      console.log('All orders already have a status field.');
    } else {
      // Update all orders without status field to have 'pending' status
      const result = await ordersCollection.updateMany(
        { status: { $exists: false } },
        { $set: { status: 'pending' } }
      );
      
      console.log(`Updated ${result.modifiedCount} orders to have 'pending' status`);
      
      // Verify the changes
      const countAfter = await ordersCollection.countDocuments({ status: { $exists: false } });
      console.log(`Remaining orders without status: ${countAfter}`);
    }
    
    // Log a few sample documents to verify
    console.log('\nSample orders after update:');
    const sampleOrders = await ordersCollection.find({}).limit(3).toArray();
    sampleOrders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`, {
        orderId: order.orderId,
        status: order.status,
        payment_status: order.payment_status
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

addStatusToOrders();
