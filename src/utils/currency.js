// Utility for consistent currency formatting across the app

export const getCurrencySymbol = (currencyCode) => {
    switch (currencyCode) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'TRY': return '₺';
        case 'CAD': return '$';
        case 'AUD': return '$';
        default: return '$';
    }
};

export const formatCurrency = (amount, currencyCode = 'USD') => {
    // Handle undefined or null
    if (amount === undefined || amount === null) amount = 0;
    
    // Parse to float in case it's a string
    const num = parseFloat(amount);
    
    try {
        let formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
        
        // Force replace currency code letters with our proper symbol
        // Intl.NumberFormat sometimes puts 'TRY' instead of '₺' for en-US locale
        const symbol = getCurrencySymbol(currencyCode);
        formatted = formatted.replace(/[A-Z]{3}\s?/, symbol); // e.g. replaces "TRY " with "₺"
        
        return formatted;
    } catch (e) {
        // Fallback if currency code is not supported by the environment
        const symbol = getCurrencySymbol(currencyCode);
        return `${symbol}${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    }
};

// A helper specifically for standard whole numbers + separated decimals like in the Dashboard
// Returns { whole, decimal, symbol }
export const formatCurrencyParts = (amount, currencyCode = 'USD') => {
    const formatted = formatCurrency(amount, currencyCode);
    
    // Most standard en-US outputs format like $1,234.56 or TRY 1,234.56
    // We'll extract the symbol, the whole part, and the decimal part
    const symbol = getCurrencySymbol(currencyCode);
    
    const numPart = formatCurrency(amount, currencyCode)
        .replace(/[^\d.,-]/g, '') // Remove everything but digits, dots, commas, minus
        .trim();
        
    const isNegative = numPart.startsWith('-');
    const cleanNum = numPart.replace('-', '');
    
    let whole = cleanNum;
    let decimal = '.00';
    
    if (cleanNum.includes('.')) {
        const parts = cleanNum.split('.');
        whole = parts[0];
        decimal = '.' + parts[1];
    }

    return {
        isNegative,
        symbol,
        whole,
        decimal
    };
};
