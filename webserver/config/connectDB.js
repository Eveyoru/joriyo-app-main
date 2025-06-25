import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config()

if(!process.env.MONGODB_URI){
    throw new Error(
        "Please provide MONGODB_URI in the .env file"
    )
}

async function connectDB(){
    try {
        console.log("Attempting to connect to MongoDB Atlas...");
        
        mongoose.set('strictQuery', false);
        
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        
        console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
        console.log(`Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        
        if (error.name === 'MongoServerSelectionError') {
            console.error("\nPossible issues:");
            console.error("1. Check if your IP is whitelisted in MongoDB Atlas");
            console.error("2. Verify your MongoDB Atlas username and password");
            console.error("3. Ensure your MongoDB Atlas cluster is running");
            console.error("4. Check your network connection");
            console.error("\nError details:", error.reason);
        }
        
        process.exit(1);
    }
}

export default connectDB