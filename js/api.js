// API Configuration
class CryptoAPI {
    constructor() {
        this.baseURL = 'https://api.coingecko.com/api/v3';
        this.cacheDuration = 60000; // 1 minute cache
        this.cache = {};
    }

    // Helper function to format numbers
    formatNumber(num, decimals = 2) {
        if (num === null || num === undefined) return '-';
        
        if (num >= 1e12) {
            return '$' + (num / 1e12).toFixed(decimals) + 'T';
        } else if (num >= 1e9) {
            return '$' + (num / 1e9).toFixed(decimals) + 'B';
        } else if (num >= 1e6) {
            return '$' + (num / 1e6).toFixed(decimals) + 'M';
        } else if (num >= 1e3) {
            return '$' + (num / 1e3).toFixed(decimals) + 'K';
        } else {
            return '$' + num.toFixed(decimals);
        }
    }

    // Helper function to format percentage
    formatPercentage(num) {
        if (num === null || num === undefined) return '-';
        return num.toFixed(2) + '%';
    }

    // Get global crypto market data
    async getGlobalData() {
        try {
            const cacheKey = 'global';
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;

            const response = await fetch(`${this.baseURL}/global`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const result = {
                totalMarketCap: this.formatNumber(data.data.total_market_cap.usd, 2),
                totalVolume: this.formatNumber(data.data.total_volume.usd, 2),
                btcDominance: this.formatPercentage(data.data.market_cap_percentage.btc)
            };

            this.setCachedData(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Error fetching global data:', error);
            throw error;
        }
    }

    // Get top cryptocurrencies
    async getTopCryptos(currency = 'usd', limit = 100) {
        try {
            const cacheKey = `top-${currency}-${limit}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;

            const response = await fetch(
                `${this.baseURL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=24h`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching crypto data:', error);
            throw error;
        }
    }

    // Cache management
    getCachedData(key) {
        const cached = this.cache[key];
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.data;
        }
        return null;
    }

    setCachedData(key, data) {
        this.cache[key] = {
            data: data,
            timestamp: Date.now()
        };
    }

    // Clear cache
    clearCache() {
        this.cache = {};
    }
}

export default CryptoAPI;