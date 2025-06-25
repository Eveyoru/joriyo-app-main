import mongoose from 'mongoose';
import CategoryModel from '../models/category.model.js';
import dotenv from 'dotenv';

dotenv.config();

// Main function to activate all categories
async function activateAllCategories() {
  try {
    console.log('Attempting to connect to MongoDB...');
    // Get MongoDB URI from the .env file or use the correct hardcoded one
    const MONGO_URI = 'mongodb+srv://sushantraut392:password123456@cluster0.yz86t.mongodb.net/blinkit?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Update all categories to be active
    const result = await CategoryModel.updateMany({}, { active: true });
    console.log(`Updated ${result.modifiedCount} categories to be active`);

    // Verify by getting all categories
    const categories = await CategoryModel.find({});
    console.log(`Total categories: ${categories.length}`);
    console.log('Sample categories:');
    categories.slice(0, 3).forEach(cat => {
      console.log(`- ${cat.name} (active: ${cat.active}, image: ${cat.image})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
activateAllCategories(); 