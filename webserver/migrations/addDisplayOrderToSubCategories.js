import mongoose from 'mongoose';
import SubCategoryModel from '../models/subCategory.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('ENV File Path:', path.resolve(__dirname, '../.env'));
console.log('Attempting to connect with URI:', process.env.MONGODB_URI);

const addDisplayOrderField = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB successfully');
        
        // Find all subcategories that don't have displayOrder
        const subcategories = await SubCategoryModel.find({ displayOrder: { $exists: false } });
        
        console.log(`Found ${subcategories.length} subcategories without displayOrder`);

        // Update each subcategory with a default displayOrder of 0
        for (let i = 0; i < subcategories.length; i++) {
            await SubCategoryModel.findByIdAndUpdate(
                subcategories[i]._id,
                { $set: { displayOrder: 0 } },
                { new: true }
            );
            console.log(`Updated subcategory ${i + 1} of ${subcategories.length}`);
        }
        
        console.log(`Successfully updated ${subcategories.length} subcategories with displayOrder field`);
        
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        
    } catch (error) {
        console.error('Migration error:', error.message);
        process.exit(1);
    }
};

// Run the migration
addDisplayOrderField(); 