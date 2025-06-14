const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/commerce-dashboard';

// Import product schema
const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  image: String,
  category: String,
  type: { type: String, enum: ['physical', 'digital', 'subscription'], default: 'physical' },
  featured: { type: Boolean, default: false },
  digitalMeta: {
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    downloadLimit: Number,
    expirationDays: Number,
    licenseType: String,
    version: String,
    requirements: [String],
    features: [String],
    preview: {
      screenshots: [String],
      demoVideo: String,
      samplePages: [String]
    }
  },
  subscriptionMeta: {
    interval: String,
    intervalCount: Number,
    trialDays: Number,
    features: [String]
  }
});

const Product = mongoose.model('Product', productSchema);

// Read products from JSON file
const loadProducts = () => {
  try {
    const productsFile = path.join(__dirname, 'data', 'products.json');
    const data = fs.readFileSync(productsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading products file:', error);
    return [];
  }
};

// Update database with products
const updateDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Connected to MongoDB');
    
    const products = loadProducts();
    console.log(`📦 Found ${products.length} products in JSON file`);
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️ Cleared existing products');
    
    // Insert new products
    const result = await Product.insertMany(products);
    console.log(`✅ Inserted ${result.length} products into database`);
    
    console.log('📊 Database update complete!');
  } catch (error) {
    console.error('❌ Database update error:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the update
updateDatabase(); 