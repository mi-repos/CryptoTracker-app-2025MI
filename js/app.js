import CryptoUI from './ui.js';

// Main Application Controller
class CryptoApp {
    constructor() {
        this.ui = new CryptoUI();
        this.autoRefreshInterval = null;
        this.autoRefreshEnabled = true;
        this.init();
    }

    async init() {
        try {
            // Load initial data
            await this.ui.loadData();
            
            // Start auto-refresh (every 2 minutes)
            this.startAutoRefresh();
            
            // Set up visibility change handler for performance
            this.setupVisibilityHandler();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    startAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }

        this.autoRefreshInterval = setInterval(async () => {
            if (this.autoRefreshEnabled && !document.hidden) {
                await this.ui.refreshData();
            }
        }, 120000); // 2 minutes
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.autoRefreshEnabled = false;
            } else {
                this.autoRefreshEnabled = true;
                // Refresh data when coming back to tab
                this.ui.refreshData();
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new CryptoApp();
    
    // Make app globally available for debugging
    window.cryptoApp = app;
});

// Error handling for uncaught errors
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
});

// Handle offline/online status
window.addEventListener('online', () => {
    console.log('Application is online');
    if (window.cryptoApp && window.cryptoApp.ui) {
        window.cryptoApp.ui.loadData();
    }
});

window.addEventListener('offline', () => {
    console.log('Application is offline');
    if (window.cryptoApp && window.cryptoApp.ui) {
        window.cryptoApp.ui.showError('You are currently offline. Please check your internet connection.');
    }
});