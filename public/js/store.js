// Store functionality
class Store {
    constructor() {
        this.products = [];
        this.stripe = null;
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        this.initializeStripe();
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/products');
            this.products = await response.json();
            this.renderProducts();
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products. Please refresh the page.');
        }
    }

    renderProducts() {
        const grid = document.getElementById('products-grid');
        if (!grid) return;

        grid.innerHTML = this.products.map(product => `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="product-actions">
                        <button class="btn btn-primary" onclick="store.buyProduct('${product.id}')">
                            🛒 Buy Now
                        </button>
                        <button class="btn btn-accent" onclick="store.openQuickPay()">
                            🚀 Quick Pay
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    initializeStripe() {
        // Initialize Stripe (you'll need to add your publishable key)
        if (window.Stripe) {
            this.stripe = Stripe('pk_test_your_publishable_key_here');
        }
    }

    async buyProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        try {
            // Create payment intent
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: product.price,
                    currency: 'usd'
                })
            });

            const { clientSecret } = await response.json();
            
            // For now, we'll just show the quick pay modal
            // In a real implementation, you'd use Stripe Elements here
            this.openQuickPay();

        } catch (error) {
            console.error('Error creating payment:', error);
            this.showError('Payment processing failed. Please try again.');
        }
    }

    openQuickPay() {
        const modal = document.getElementById('quickPayModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    setupEventListeners() {
        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            };
        });

        // Close modal when clicking outside
        window.onclick = (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        };

        // Add some interactive features
        this.addScrollEffects();
    }

    addScrollEffects() {
        // Smooth scroll for internal links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Add fade-in animation for product cards
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe product cards when they're rendered
        setTimeout(() => {
            document.querySelectorAll('.product-card').forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(card);
            });
        }, 100);
    }

    showError(message) {
        // Simple error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fee2e2;
            color: #991b1b;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            z-index: 1001;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(errorDiv);

        // Remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showSuccess(message) {
        // Simple success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d1fae5;
            color: #065f46;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            z-index: 1001;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(successDiv);

        // Remove after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .product-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }
    
    .product-actions .btn {
        flex: 1;
        min-width: 120px;
    }
`;
document.head.appendChild(style);

// Initialize store when DOM is loaded
let store;
document.addEventListener('DOMContentLoaded', () => {
    store = new Store();
});

// Global functions for button clicks
window.store = null;
document.addEventListener('DOMContentLoaded', () => {
    window.store = new Store();
}); 