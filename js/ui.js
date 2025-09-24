import CryptoAPI from './api.js';

// UI Management Class
class CryptoUI {
    constructor() {
        this.cryptoAPI = new CryptoAPI();
        this.currentSort = { field: 'market_cap', direction: 'desc' };
        this.currentData = [];
        this.filteredData = [];
        this.currentCurrency = 'usd';
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateLastUpdated();
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterData(e.target.value);
            });
        }

        // Currency change
        const currencySelect = document.getElementById('currencySelect');
        if (currencySelect) {
            currencySelect.addEventListener('change', (e) => {
                this.currentCurrency = e.target.value;
                this.loadData();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }

        // Retry button
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.loadData();
            });
        }

        // Table sorting
        const tableHeaders = document.querySelectorAll('.crypto-table th[data-sort]');
        tableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                this.sortTable(header.dataset.sort);
            });
        });
    }

    // Show/hide loading spinner
    setLoading(loading) {
        const spinner = document.getElementById('loadingSpinner');
        const tableBody = document.getElementById('cryptoTableBody');
        const errorMessage = document.getElementById('errorMessage');

        if (loading) {
            if (spinner) spinner.style.display = 'flex';
            if (tableBody) tableBody.innerHTML = '';
            if (errorMessage) errorMessage.style.display = 'none';
        } else {
            if (spinner) spinner.style.display = 'none';
        }
    }

    // Show error message
    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        if (errorText) errorText.textContent = message;
        if (errorMessage) errorMessage.style.display = 'flex';
        this.setLoading(false);
    }

    // Hide error message
    hideError() {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) errorMessage.style.display = 'none';
    }

    // Update global stats
    updateGlobalStats(globalData) {
        const totalMarketCap = document.getElementById('totalMarketCap');
        const totalVolume = document.getElementById('totalVolume');
        const btcDominance = document.getElementById('btcDominance');
        
        if (totalMarketCap) totalMarketCap.textContent = globalData.totalMarketCap;
        if (totalVolume) totalVolume.textContent = globalData.totalVolume;
        if (btcDominance) btcDominance.textContent = globalData.btcDominance;
    }

    // Update crypto table
    updateCryptoTable(data) {
        const tableBody = document.getElementById('cryptoTableBody');
        if (!tableBody) return;
        
        if (!data || data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No data available</td></tr>';
            return;
        }

        const rows = data.map(crypto => this.createTableRow(crypto));
        tableBody.innerHTML = rows.join('');
    }

    // Create table row for a cryptocurrency
    createTableRow(crypto) {
        const priceChange = crypto.price_change_percentage_24h || 0;
        const priceChangeClass = priceChange >= 0 ? 'positive' : 'negative';
        const priceChangeIcon = priceChange >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';

        // Create sparkline SVG
        const sparkline = this.createSparkline(crypto.sparkline_in_7d?.price);

        return `
            <tr>
                <td class="crypto-rank">${crypto.market_cap_rank || '-'}</td>
                <td>
                    <div class="crypto-name">
                        <img src="${crypto.image}" alt="${crypto.name}" class="crypto-icon" 
                             onerror="this.src='https://via.placeholder.com/32x32?text=?'">
                        <span>${crypto.name}</span>
                        <span class="crypto-symbol">${crypto.symbol.toUpperCase()}</span>
                    </div>
                </td>
                <td class="price-positive">${this.formatCurrency(crypto.current_price)}</td>
                <td>
                    <span class="price-change ${priceChangeClass}">
                        <i class="${priceChangeIcon}"></i>
                        ${Math.abs(priceChange).toFixed(2)}%
                    </span>
                </td>
                <td>${this.cryptoAPI.formatNumber(crypto.market_cap)}</td>
                <td>${this.cryptoAPI.formatNumber(crypto.total_volume)}</td>
                <td>
                    <div class="sparkline">
                        ${sparkline}
                    </div>
                </td>
            </tr>
        `;
    }

    // Create sparkline SVG
    createSparkline(prices) {
        if (!prices || prices.length < 2) {
            return '<span style="color: #666;">No data</span>';
        }

        const width = 100;
        const height = 40;
        const padding = 2;

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice || 1;

        const points = prices.map((price, index) => {
            const x = (index / (prices.length - 1)) * (width - padding * 2) + padding;
            const y = height - padding - ((price - minPrice) / priceRange) * (height - padding * 2);
            return `${x},${y}`;
        }).join(' ');

        const isPositive = prices[prices.length - 1] >= prices[0];
        const strokeColor = isPositive ? '#10b981' : '#ef4444';

        return `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                <polyline 
                    points="${points}" 
                    fill="none" 
                    stroke="${strokeColor}" 
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
        `;
    }

    // Format currency based on current selection
    formatCurrency(amount) {
        if (amount === null || amount === undefined) return '-';
        
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: this.currentCurrency.toUpperCase(),
            minimumFractionDigits: amount < 1 ? 4 : 2,
            maximumFractionDigits: amount < 1 ? 6 : 2
        });

        return formatter.format(amount);
    }

    // Filter data based on search input
    filterData(searchTerm) {
        if (!searchTerm) {
            this.filteredData = [...this.currentData];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredData = this.currentData.filter(crypto => 
                crypto.name.toLowerCase().includes(term) ||
                crypto.symbol.toLowerCase().includes(term)
            );
        }
        this.updateCryptoTable(this.filteredData);
    }

    // Sort table data
    sortTable(field) {
        // Map UI field names to API field names
        const fieldMap = {
            'rank': 'market_cap_rank',
            'name': 'name',
            'price': 'current_price',
            'change24h': 'price_change_percentage_24h',
            'marketCap': 'market_cap',
            'volume': 'total_volume'
        };

        const apiField = fieldMap[field] || field;

        // Determine sort direction
        if (this.currentSort.field === apiField) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = apiField;
            this.currentSort.direction = 'desc';
        }

        // Update sort indicators
        this.updateSortIndicators(field);

        // Sort data
        const sortedData = [...this.filteredData].sort((a, b) => {
            let aValue = a[apiField];
            let bValue = b[apiField];

            // Handle different field types
            if (apiField === 'name') {
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
            }

            // Handle null/undefined values
            if (aValue === null || aValue === undefined) aValue = 0;
            if (bValue === null || bValue === undefined) bValue = 0;

            if (this.currentSort.direction === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        this.filteredData = sortedData;
        this.updateCryptoTable(this.filteredData);
    }

    // Update sort indicators in table headers
    updateSortIndicators(currentField) {
        const headers = document.querySelectorAll('.crypto-table th[data-sort]');
        headers.forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
            if (header.dataset.sort === currentField) {
                header.classList.add(`sort-${this.currentSort.direction}`);
            }
        });
    }

    // Update last updated timestamp
    updateLastUpdated() {
        const updateTime = document.getElementById('updateTime');
        if (updateTime) {
            updateTime.textContent = new Date().toLocaleTimeString();
        }
    }

    // Refresh data
    async refreshData() {
        this.cryptoAPI.clearCache();
        await this.loadData();
    }

    // Load all data
    async loadData() {
        try {
            this.setLoading(true);
            this.hideError();

            // Load global data and crypto data in parallel
            const [globalData, cryptoData] = await Promise.all([
                this.cryptoAPI.getGlobalData(),
                this.cryptoAPI.getTopCryptos(this.currentCurrency)
            ]);

            this.updateGlobalStats(globalData);
            this.currentData = cryptoData;
            this.filteredData = [...cryptoData];
            this.updateCryptoTable(this.filteredData);
            this.updateLastUpdated();

        } catch (error) {
            this.showError(`Failed to load data: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }
}

export default CryptoUI;