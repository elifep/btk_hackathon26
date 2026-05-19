import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';
import { formatCurrencyParts } from '../utils/currency';

const LanguageContext = createContext();

export function useLanguage() {
    return useContext(LanguageContext);
}

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'tr' : 'en');
    };

    const t = (keyString) => {
        const keys = keyString.split('.');
        let value = translations[language];
        for (const key of keys) {
            if (value === undefined) break;
            value = value[key];
        }
        return value || keyString;
    };

    // Global format currency aware of language
    const formatCurrencyLocal = (amount, currencyCode) => {
        if (language === 'tr') {
            return new Intl.NumberFormat('tr-TR', { 
                style: 'currency', 
                currency: currencyCode,
                maximumFractionDigits: 2
            }).format(amount);
        }
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: currencyCode,
            maximumFractionDigits: 2
        }).format(amount);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, formatCurrencyLocal }}>
            {children}
        </LanguageContext.Provider>
    );
}
