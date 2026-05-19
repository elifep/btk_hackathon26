import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { mockProducts } from '../../data/mockProducts';
import { calculatePreviewMetrics } from '../../utils/previewMetrics';

export default function Explorer() {
    const { openAnalyzeModal, profileData } = useOutletContext();
    const { t, formatCurrencyLocal } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([
        'Electronics', 'Home & Living', 'Fashion', 'Education', 'Software & Subscriptions', 'Gifts', 'Travel', 'Furniture'
    ]);
    const [maxPrice, setMaxPrice] = useState(150000);
    const [minScore, setMinScore] = useState(0);

    const handleCategoryToggle = (category) => {
        setSelectedCategories(prev => 
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const filteredProducts = mockProducts.filter(product => {
        const metrics = calculatePreviewMetrics(product, profileData);
        
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              product.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategories.includes(product.category);
        const matchesPrice = product.price <= maxPrice;
        const matchesScore = metrics.previewScore >= minScore;
        
        return matchesSearch && matchesCategory && matchesPrice && matchesScore;
    });

    const categoriesList = ['Electronics', 'Home & Living', 'Fashion', 'Education', 'Software & Subscriptions', 'Gifts', 'Travel', 'Furniture'];

    return (
        <div className="pt-8 pb-24 md:pb-section-gap px-container-margin max-w-7xl mx-auto w-full">
            {/* Header & Search */}
            <section className="mb-section-gap text-center max-w-3xl mx-auto">
                <h1 className="font-display-lg text-display-lg text-on-surface mb-4">{t('explorer.title')}</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">{t('explorer.subtitle')}</p>
                
                <div className="relative w-full shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-primary text-3xl">youtube_searched_for</span>
                    </div>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-14 pr-4 py-5 bg-surface-container-low border border-outline-variant/30 rounded-xl font-body-lg text-body-lg text-on-surface placeholder-on-surface-variant focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all outline-none shadow-sm" 
                        placeholder={t('explorer.searchPlaceholder')}
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                        <button className="bg-surface-container text-on-surface px-4 py-2 rounded-lg font-label-md text-label-md hover:text-primary transition-colors border border-outline-variant/50 flex items-center shadow-sm">
                            <span className="material-symbols-outlined text-sm mr-1">tune</span> {t('common.filters')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Main Layout: Sidebar + Grid */}
            <div className="flex flex-col lg:flex-row gap-gutter">
                {/* Sidebar Filters */}
                <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
                    {/* Categories */}
                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-card-padding shadow-sm">
                        <h3 className="font-headline-md text-headline-md text-on-surface mb-4 border-b border-outline-variant/30 pb-2">{t('explorer.categories')}</h3>
                        <div className="flex flex-col gap-2">
                            {categoriesList.map(category => (
                                <label key={category} className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedCategories.includes(category)}
                                        onChange={() => handleCategoryToggle(category)}
                                        className="form-checkbox bg-surface-container-high border-white/20 text-primary-container focus:ring-primary-container rounded" 
                                    />
                                    <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">{category}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    {/* Functional Price Range */}
                    <div className="bg-surface-container-low/30 backdrop-blur-xl border border-white/10 rounded-xl p-card-padding">
                        <h3 className="font-headline-md text-headline-md text-on-surface mb-4 border-b border-white/10 pb-2 flex justify-between">
                            {t('explorer.priceLimit')}
                            <span className="text-primary text-sm">{maxPrice >= 150000 ? t('explorer.any') : `< ${formatCurrencyLocal(maxPrice, 'TRY')}`}</span>
                        </h3>
                        <div className="pt-2">
                            <input 
                                type="range" 
                                min="100" 
                                max="150000" 
                                step="1000"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(Number(e.target.value))}
                                className="w-full accent-primary"
                            />
                            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mt-2">
                                <span>$100</span>
                                <span>Max</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-surface-container-low/30 backdrop-blur-xl border border-white/10 rounded-xl p-card-padding">
                        <h3 className="font-headline-md text-headline-md text-on-surface mb-4 border-b border-white/10 pb-2 flex justify-between">
                            {t('explorer.spendWiseScore')}
                            {minScore > 0 && (
                                <button onClick={() => setMinScore(0)} className="text-on-surface-variant hover:text-white text-xs underline">{t('common.clear')}</button>
                            )}
                        </h3>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => setMinScore(90)}
                                className={`flex items-center justify-between w-full p-2 rounded-lg transition-colors border ${minScore === 90 ? 'bg-primary/20 border-primary text-primary' : 'bg-transparent border-transparent hover:border-white/5 text-on-surface'}`}
                            >
                                <span className="flex items-center gap-2 font-label-md text-label-md">
                                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    {t('explorer.exceptional')}
                                </span>
                            </button>
                            <button 
                                onClick={() => setMinScore(70)}
                                className={`flex items-center justify-between w-full p-2 rounded-lg transition-colors border ${minScore === 70 ? 'bg-secondary-fixed/20 border-secondary-fixed text-secondary-fixed' : 'bg-transparent border-transparent hover:border-white/5 text-on-surface-variant'}`}
                            >
                                <span className="flex items-center gap-2 font-label-md text-label-md">
                                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
                                    {t('explorer.good')}
                                </span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Product Grid */}
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
                    {filteredProducts.map(product => {
                        const metrics = calculatePreviewMetrics(product, profileData);
                        
                        return (
                            <div key={product.id} className="group bg-surface-container-low border border-outline-variant/30 rounded-xl overflow-hidden flex flex-col hover:border-outline-variant transition-colors shadow-sm hover:shadow-md">
                                <Link 
                                    to={`/product/${product.id}`} 
                                    className="block relative h-48 bg-surface-container-highest overflow-hidden"
                                >
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent opacity-50"></div>
                                    <div className="absolute top-3 left-3 bg-surface/90 border border-outline-variant/50 backdrop-blur-md px-2 py-1 rounded text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1 shadow-sm">
                                        <span className="material-symbols-outlined text-xs">shopping_cart</span> {product.category}
                                    </div>
                                    <div className="absolute top-3 right-3 bg-surface/90 border border-outline-variant/50 backdrop-blur-md px-2 py-1 rounded text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1 shadow-sm">
                                        {t('explorer.previewScore')}: {metrics.previewScore}
                                    </div>
                                </Link>
                                <div className="p-card-padding flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <Link to={`/product/${product.id}`}>
                                            <h3 className="font-headline-md text-headline-md text-on-surface hover:text-primary transition-colors">{product.name}</h3>
                                        </Link>
                                        <span className="font-label-md text-label-md text-on-surface-variant border border-outline-variant/50 rounded px-2 py-1 bg-surface-container-high">{formatCurrencyLocal(product.price, product.currency)}</span>
                                    </div>
                                    <p className="font-body-md text-body-md text-on-surface-variant mb-4 flex-grow">{product.description}</p>
                                    
                                    <div className="bg-surface-container-lowest rounded-lg p-3 mb-4 flex flex-col gap-2 border border-outline-variant/50 shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="font-label-sm text-label-sm text-on-surface-variant">{t('explorer.estCompatibility')}</span>
                                            <span className="font-label-md text-label-md text-on-surface-variant">{metrics.estimatedCompatibility}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-label-sm text-label-sm text-on-surface-variant">{t('explorer.estImpact')}</span>
                                            <span className="font-label-md text-label-md text-on-surface-variant">{metrics.estimatedImpact}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-label-sm text-label-sm text-on-surface-variant">{t('explorer.monthlyEstimate')}</span>
                                            <span className="font-label-md text-label-md text-on-surface-variant">{metrics.monthlyCostEstimate}</span>
                                        </div>
                                        <div className="mt-1 pt-2 border-t border-outline-variant/50 flex items-start gap-2">
                                            <span className="material-symbols-outlined text-on-surface-variant text-sm mt-0.5">lightbulb</span>
                                            <span className="font-label-sm text-label-sm text-on-surface-variant opacity-80">{t('explorer.quickPreview')}: {metrics.quickPreview}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-auto">
                                        <p className="text-center font-label-sm text-[10px] text-on-surface-variant/70 mb-2 uppercase tracking-wider">{t('explorer.runAnalysisText')}</p>
                                        <button 
                                            onClick={() => openAnalyzeModal(product)}
                                            className="w-full bg-primary-container text-white py-3 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary transition-colors shadow-[0_5px_20px_rgba(16,185,129,0.15)] group-hover:shadow-[0_5px_25px_rgba(16,185,129,0.3)] border border-primary-container"
                                        >
                                            <span className="material-symbols-outlined">analytics</span>
                                            {t('explorer.analyzePurchase')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full py-24 text-center bg-surface-container-low/30 backdrop-blur-xl border border-white/10 rounded-xl mt-4">
                            <span className="material-symbols-outlined text-6xl text-primary/40 mb-4 animate-pulse">search_off</span>
                            <h3 className="font-headline-md text-on-surface mb-2">{t('explorer.noMatch')}</h3>
                            <p className="font-body-lg text-on-surface-variant max-w-md mx-auto">{t('explorer.noMatchDesc')}</p>
                            <button 
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategories(['Electronics', 'Home & Living', 'Fashion', 'Education', 'Software & Subscriptions', 'Gifts', 'Travel', 'Furniture']);
                                    setMaxPrice(150000);
                                    setMinScore(0);
                                }}
                                className="mt-6 text-primary hover:underline font-label-md"
                            >
                                {t('explorer.resetFilters')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
