// Dashboard functionality
class Dashboard {
    constructor() {
        this.orders = [];
        this.stats = {};
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.startAutoRefresh();
        this.updateLastUpdated();
    }

    async loadData() {
        try {
            await Promise.all([
                this.loadStats(),
                this.loadOrders()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            this.stats = await response.json();
            this.renderStats();
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadOrders() {
        try {
            const response = await fetch('/api/orders');
            this.orders = await response.json();
            this.renderOrders();
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    renderStats() {
        const elements = {
            'total-revenue': `$${this.stats.totalRevenue?.toFixed(2) || '0.00'}`,
            'total-orders': this.stats.totalOrders || 0,
            'pending-orders': this.stats.pendingOrders || 0,
            'completed-orders': this.stats.completedOrders || 0
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                // Add animation
                element.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 200);
            }
        });
    }

    renderOrders() {
        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;

        if (this.orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center" style="padding: 40px;">
                        <div style="color: #64748b;">
                            <div style="font-size: 2rem; margin-bottom: 10px;">📦</div>
                            No orders yet. When customers make purchases, they'll appear here.
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.orders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10) // Show last 10 orders
            .map(order => `
                <tr>
                    <td>${order.id.substring(0, 8)}...</td>
                    <td>${order.customerName || order.email || 'Anonymous'}</td>
                    <td>$${(order.amount || 0).toFixed(2)}</td>
                    <td>
                        <span class="status-badge status-${order.status}">
                            ${order.status}
                        </span>
                    </td>
                    <td>${this.formatDate(order.createdAt)}</td>
                    <td>
                        <button class="btn btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" 
                                onclick="dashboard.viewOrder('${order.id}')">
                            View
                        </button>
                    </td>
                </tr>
            `).join('');
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    viewOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        // Create a simple modal to show order details
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                <h3>Order Details</h3>
                <div style="margin-top: 20px;">
                    <p><strong>Order ID:</strong> ${order.id}</p>
                    <p><strong>Customer:</strong> ${order.customerName || order.email || 'Anonymous'}</p>
                    <p><strong>Amount:</strong> $${(order.amount || 0).toFixed(2)}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
                    <p><strong>Date:</strong> ${this.formatDate(order.createdAt)}</p>
                    ${order.items ? `<p><strong>Items:</strong> ${JSON.stringify(order.items, null, 2)}</p>` : ''}
                </div>
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="dashboard.updateOrderStatus('${order.id}', 'completed')">
                        Mark as Completed
                    </button>
                    <button class="btn btn-secondary" onclick="dashboard.updateOrderStatus('${order.id}', 'cancelled')" style="margin-left: 10px;">
                        Cancel Order
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async updateOrderStatus(orderId, newStatus) {
        try {
            // In a real app, you'd make an API call to update the order
            const orderIndex = this.orders.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                this.orders[orderIndex].status = newStatus;
                this.renderOrders();
                await this.loadStats();
                this.showNotification(`Order ${newStatus} successfully`, 'success');
                
                // Close any open modals
                document.querySelectorAll('.modal').forEach(modal => modal.remove());
            }
        } catch (error) {
            console.error('Error updating order:', error);
            this.showNotification('Failed to update order', 'error');
        }
    }

    setupEventListeners() {
        // Update last updated time every minute
        setInterval(() => {
            this.updateLastUpdated();
        }, 60000);

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'r':
                        e.preventDefault();
                        this.refreshData();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportOrders();
                        break;
                }
            }
        });
    }

    startAutoRefresh() {
        // Auto-refresh every 30 seconds
        setInterval(async () => {
            await this.loadData();
        }, 30000);
    }

    updateLastUpdated() {
        const element = document.getElementById('last-updated');
        if (element) {
            element.textContent = new Date().toLocaleTimeString();
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const colors = {
            success: { bg: '#d1fae5', color: '#065f46' },
            error: { bg: '#fee2e2', color: '#991b1b' },
            info: { bg: '#dbeafe', color: '#1e40af' }
        };

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]?.bg || colors.info.bg};
            color: ${colors[type]?.color || colors.info.color};
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            z-index: 1001;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Global functions
window.refreshData = async function() {
    if (window.dashboard) {
        await window.dashboard.loadData();
        window.dashboard.showNotification('Data refreshed successfully', 'success');
    }
};

window.exportOrders = function() {
    if (!window.dashboard || !window.dashboard.orders.length) {
        window.dashboard?.showNotification('No orders to export', 'info');
        return;
    }

    // Simple CSV export
    const headers = ['Order ID', 'Customer', 'Amount', 'Status', 'Date'];
    const csvContent = [
        headers.join(','),
        ...window.dashboard.orders.map(order => [
            order.id,
            order.customerName || order.email || 'Anonymous',
            order.amount || 0,
            order.status,
            new Date(order.createdAt).toISOString()
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    window.dashboard.showNotification('Orders exported successfully', 'success');
};

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
    
    .stat-info h3 {
        transition: transform 0.2s ease;
    }
    
    .orders-table tbody tr {
        transition: background-color 0.2s ease;
    }
    
    .notification {
        animation: slideInRight 0.3s ease;
    }
`;
document.head.appendChild(style);

// Initialize dashboard
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
    window.dashboard = dashboard;
}); 