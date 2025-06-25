import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductModel from '../models/product.model.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to database'))
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

async function fixProductVariations() {
  try {
    console.log('Starting database repair for product variations...');
    
    // Find all products
    const products = await ProductModel.find({});
    console.log(`Found ${products.length} products in the database`);
    
    let fixedCount = 0;
    
    // Process each product
    for (const product of products) {
      let needsUpdate = false;
      const updates = {};
      
      // Check for products that claim to have variations but don't
      if (product.hasVariations === true && (!product.variations || product.variations.length === 0)) {
        console.log(`Product ${product._id} (${product.name}) has hasVariations=true but no variations`);
        updates.hasVariations = false;
        updates.sizingType = 'none';
        needsUpdate = true;
      }
      
      // Check for products that don't claim to have variations but do
      if (product.hasVariations === false && product.variations && product.variations.length > 0) {
        console.log(`Product ${product._id} (${product.name}) has hasVariations=false but has variations`);
        updates.variations = [];
        needsUpdate = true;
      }
      
      // Check for invalid variation data
      if (product.hasVariations === true && product.variations && product.variations.length > 0) {
        const invalidVariations = product.variations.filter(v => 
          !v.size || v.price === undefined || v.price === null
        );
        
        if (invalidVariations.length > 0) {
          console.log(`Product ${product._id} (${product.name}) has ${invalidVariations.length} invalid variations`);
          // If all variations are invalid, disable variations
          if (invalidVariations.length === product.variations.length) {
            updates.hasVariations = false;
            updates.variations = [];
            updates.sizingType = 'none';
          } else {
            // Otherwise, filter out invalid variations
            updates.variations = product.variations.filter(v => 
              v.size && v.price !== undefined && v.price !== null
            );
          }
          needsUpdate = true;
        }
      }
      
      // Specifically check for "Betty Crocker Original Pancake Mix"
      if (product.name && product.name.includes("Betty Crocker")) {
        console.log(`Found Betty Crocker product: ${product._id} (${product.name})`);
        updates.hasVariations = false;
        updates.variations = [];
        updates.sizingType = 'none';
        needsUpdate = true;
      }
      
      // Update the product if needed
      if (needsUpdate) {
        console.log(`Updating product ${product._id} (${product.name})`);
        await ProductModel.findByIdAndUpdate(product._id, { $set: updates });
        fixedCount++;
      }
    }
    
    console.log(`Fixed ${fixedCount} products with variation issues`);
    console.log('Database repair completed successfully');
  } catch (error) {
    console.error('Error during database repair:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the function
fixProductVariations(); 