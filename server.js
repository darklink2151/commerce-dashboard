const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_key_here');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Simple JSON file database
const DATA_FILE = './data/orders.json';
const PRODUCTS_FILE = './data/products.json';

// Ensure data directory exists
if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

// Initialize data files if they don't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

if (!fs.existsSync(PRODUCTS_FILE)) {
    const defaultProducts = [
        {
            id: '1',
            name: 'Premium Service',
            price: 99.99,
            description: 'Our premium service offering',
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: '2',
            name: 'Basic Service',
            price: 49.99,
            description: 'Our basic service offering',
            image: 'https://via.placeholder.com/300x200'
        }
    ];
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(defaultProducts, null, 2));
}

// Helper functions
const readData = (file) => {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
        return [];
    }
};

const writeData = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// API Routes
app.get('/api/products', (req, res) => {
    const products = readData(PRODUCTS_FILE);
    res.json(products);
});

app.get('/api/orders', (req, res) => {
    const orders = readData(DATA_FILE);
    res.json(orders);
});

app.post('/api/orders', (req, res) => {
    const orders = readData(DATA_FILE);
    const newOrder = {
        id: uuidv4(),
        ...req.body,
        createdAt: new Date().toISOString(),
        status: 'pending'
    };
    
    orders.push(newOrder);
    writeData(DATA_FILE, orders);
    res.json(newOrder);
});

// Stripe payment endpoint
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'usd' } = req.body;
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency,
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Dashboard API - Get statistics
app.get('/api/stats', (req, res) => {
    const orders = readData(DATA_FILE);
    const stats = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + (order.amount || 0), 0),
        pendingOrders: orders.filter(order => order.status === 'pending').length,
        completedOrders: orders.filter(order => order.status === 'completed').length,
    };
    res.json(stats);
});

app.listen(PORT, () => {
    console.log(`🚀 Commerce Dashboard server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`🛍️  Store: http://localhost:${PORT}`);
}); 