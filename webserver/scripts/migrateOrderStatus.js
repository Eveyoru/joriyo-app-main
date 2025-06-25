import mongoose from "mongoose";
import OrderModel from "../models/order.model.js";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB for migration"))
  .catch((error) => console.error("MongoDB connection error:", error));

async function migrateOrderStatus() {
  try {
    console.log("Starting order status migration...");
    
    // Find all orders without a status field
    const ordersWithoutStatus = await OrderModel.find({ status: { $exists: false } });
    
    console.log(`Found ${ordersWithoutStatus.length} orders without status field`);
    
    if (ordersWithoutStatus.length === 0) {
      console.log("No orders need status migration. All orders already have a status field.");
      process.exit(0);
    }
    
    // Update all orders to have 'pending' status if they don't have one
    const updateResult = await OrderModel.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'pending' } }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} orders with default 'pending' status`);
    
    // Verify the update worked
    const remainingOrdersWithoutStatus = await OrderModel.find({ status: { $exists: false } });
    console.log(`Remaining orders without status: ${remainingOrdersWithoutStatus.length}`);
    
    if (remainingOrdersWithoutStatus.length === 0) {
      console.log("Migration completed successfully!");
    } else {
      console.log("Some orders could not be migrated. Please check logs.");
    }
    
    // Close the connection
    process.exit(0);
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
}

// Run the migration
migrateOrderStatus();
