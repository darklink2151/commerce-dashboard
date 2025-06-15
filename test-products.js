const fs = require('fs');
const path = require('path');

// Read products.json file
const productsFile = path.join(__dirname, 'data', 'products.json');

try {
  const data = fs.readFileSync(productsFile, 'utf8');
  const products = JSON.parse(data);
  
  console.log(`Successfully read ${products.length} products:`);
  products.forEach(product => {
    console.log(`- ${product.name} (${product.id})`);
  });
} catch (error) {
  console.error('Error reading products file:', error);
} 