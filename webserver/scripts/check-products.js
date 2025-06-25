import mongoose from 'mongoose';
import ProductModel from '../models/product.model.js';
import CategoryModel from '../models/category.model.js';
import dotenv from 'dotenv';

dotenv.config();

// Main function to check products
async function checkProducts() {
  try {
    console.log('Attempting to connect to MongoDB...');
    const MONGO_URI = 'mongodb+srv://sushantraut392:password123456@cluster0.yz86t.mongodb.net/blinkit?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Check all products
    const products = await ProductModel.find({});
    console.log(`Total products: ${products.length}`);
    
    // Check categories
    const categories = await CategoryModel.find({});
    console.log(`Total categories: ${categories.length}`);
    
    // Check products that are published
    const publishedProducts = await ProductModel.find({ publish: true });
    console.log(`Published products: ${publishedProducts.length}`);
    
    // Check products by category
    for (const category of categories) {
      const productsInCategory = await ProductModel.find({
        category: { $in: [category._id] },
        publish: true
      });
      console.log(`Category "${category.name}" (${category._id}) has ${productsInCategory.length} published products`);
      
      // Activate the category if not already active
      if (!category.active) {
        await CategoryModel.updateOne({ _id: category._id }, { active: true });
        console.log(`Activated category "${category.name}"`);
      }
    }
    
    // Update all products to be published
    if (products.length > 0 && publishedProducts.length === 0) {
      console.log("No published products found. Publishing all products...");
      const result = await ProductModel.updateMany({}, { publish: true });
      console.log(`Updated ${result.modifiedCount} products to be published`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
checkProducts(); 