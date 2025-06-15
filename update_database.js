const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import the actual Product model
const Product = require('./models/Product');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/commerce-dashboard';

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
    
    // Process products to ensure they have the correct fields
    const processedProducts = products.map(product => {
      // Remove the 'id' field and let MongoDB generate _id
      const { id, ...productData } = product;
      
      // Ensure isActive is set to true
      productData.isActive = true;
      
      // Ensure required fields are present
      if (!productData.type) {
        productData.type = 'digital';
      }
      
      return productData;
    });
    
    // Insert new products
    const result = await Product.insertMany(processedProducts);
    console.log(`✅ Inserted ${result.length} products into database`);
    
    // Verify products are active
    const activeCount = await Product.countDocuments({ isActive: true });
    console.log(`✅ ${activeCount} products are active and ready for sale`);
    
    console.log('📊 Database update complete!');
  } catch (error) {
    console.error('❌ Database update error:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the update
updateDatabase(); 