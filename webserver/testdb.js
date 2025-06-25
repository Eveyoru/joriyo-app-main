import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
console.log("Connection string (with password hidden):", 
  uri.replace(/\/\/([^:]+):([^@]+)@/, '//******:******@'));

async function main() {
  console.log('Attempting to connect to MongoDB...');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');
    
    const dbList = await client.db().admin().listDatabases();
    console.log('Databases:');
    dbList.databases.forEach(db => console.log(` - ${db.name}`));
    
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

main().catch(console.error); 