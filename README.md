# Commerce Dashboard

A simple, free e-commerce dashboard built for DigitalOcean deployment with Stripe payment integration.

## 🚀 Features

- **Modern UI**: Clean, responsive design that works on all devices
- **Stripe Integration**: Secure payment processing with your existing Stripe link
- **Real-time Dashboard**: Live analytics and order management
- **Order Management**: View, update, and track customer orders
- **Export Functionality**: Download order data as CSV
- **Mobile Responsive**: Optimized for all screen sizes
- **Free to Run**: Uses minimal resources, perfect for DigitalOcean's basic droplets

## 🛠️ Tech Stack

- **Backend**: Node.js with Express
- **Frontend**: Vanilla HTML/CSS/JavaScript (no frameworks = faster & lighter)
- **Database**: JSON files (simple and portable)
- **Payments**: Stripe integration
- **Hosting**: Optimized for DigitalOcean

## 📦 Installation

1. **Clone or download this project**
   ```bash
   cd commerce-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file:
   ```env
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   PORT=3000
   ```

4. **Update Stripe configuration**
   - Replace the Stripe link in `public/index.html` and `public/dashboard.html` with your link:
     `https://buy.stripe.com/aFaaEP0HX3bs9yV7la5c401`
   - Add your Stripe publishable key in `public/js/store.js`

## 🚀 Local Development

```bash
# Start the server
npm start

# Or with auto-restart during development
npm run dev
```

Visit:
- **Store**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard

## 🌊 DigitalOcean Deployment

### Option 1: Manual Deployment

1. **Create a DigitalOcean Droplet**
   - Choose Ubuntu 22.04
   - Basic plan ($4-6/month is sufficient)

2. **Connect to your droplet**
   ```bash
   ssh root@your_droplet_ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt-get install -y nodejs
   ```

4. **Upload your code**
   ```bash
   # Clone your repository or upload files
   git clone your-repo-url
   cd commerce-dashboard
   npm install
   ```

5. **Set up PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "commerce-dashboard"
   pm2 startup
   pm2 save
   ```

6. **Set up Nginx (Reverse Proxy)**
   ```bash
   apt-get install nginx
   ```

   Create `/etc/nginx/sites-available/commerce-dashboard`:
   ```nginx
   server {
       listen 80;
       server_name your_domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable the site:
   ```bash
   ln -s /etc/nginx/sites-available/commerce-dashboard /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

### Option 2: DigitalOcean App Platform

1. **Connect your repository** to DigitalOcean App Platform
2. **Configure build settings**:
   - Build Command: `npm install`
   - Run Command: `npm start`
3. **Add environment variables** in the app settings
4. **Deploy** - DigitalOcean handles everything else!

## 🔧 Configuration

### Environment Variables

```env
# Required
STRIPE_SECRET_KEY=sk_test_...
PORT=3000

# Optional
NODE_ENV=production
```

### Stripe Setup

1. **Get your Stripe keys** from https://stripe.com/docs/keys
2. **Update the payment link** in both HTML files
3. **Add your publishable key** in `store.js`

## 📊 Features Overview

### Store Frontend
- Product display
- Shopping cart functionality
- Stripe payment integration
- Responsive design
- Quick purchase options

### Dashboard
- Real-time analytics
- Order management
- Status updates
- Data export
- System monitoring

## 🔒 Security Notes

- Always use HTTPS in production
- Store Stripe keys in environment variables
- Regularly update dependencies
- Use strong passwords for server access
- Enable DigitalOcean firewall

## 💰 Cost Breakdown (DigitalOcean)

- **Basic Droplet**: $6/month
- **Domain** (optional): ~$12/year
- **SSL Certificate**: Free (Let's Encrypt)
- **Total**: ~$6-8/month

## 🛠️ Customization

### Adding Products
Edit `data/products.json` or modify the default products in `server.js`

### Styling
Modify `public/css/style.css` for custom branding

### Features
Add new API endpoints in `server.js` and corresponding frontend code

## 📚 API Endpoints

- `GET /` - Store homepage
- `GET /dashboard` - Dashboard page
- `GET /api/products` - Get all products
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `GET /api/stats` - Get dashboard statistics
- `POST /api/create-payment-intent` - Create Stripe payment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this for personal or commercial projects!

## 🆘 Support

- Check the console for error messages
- Ensure all environment variables are set
- Verify Stripe keys are correct
- Check DigitalOcean droplet resources

---

**Your Stripe Link**: https://buy.stripe.com/aFaaEP0HX3bs9yV7la5c401

Ready to deploy! 🚀 