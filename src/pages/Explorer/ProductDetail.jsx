import React from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { mockProducts } from '../../data/mockProducts';
import { calculatePreviewMetrics } from '../../utils/previewMetrics';

export default function ProductDetail() {
    const id = useParams().id;
    const { openAnalyzeModal, profileData } = useOutletContext();
    const { t, formatCurrencyLocal, language } = useLanguage();
    const product = mockProducts.find(p => p.id === id);

    if (!product) {
        return (
            <div className="pt-8 pb-24 px-container-margin max-w-7xl mx-auto w-full text-center">
                <h2 className="text-display-lg text-on-surface mb-4">{t('productDetail.notFound')}</h2>
                <Link to="/explorer" className="text-primary hover:underline">{t('productDetail.backToExplorer')}</Link>
            </div>
        );
    }

    const metrics = calculatePreviewMetrics(product, profileData, language);

    return (
        <div className="pt-8 pb-24 md:pb-section-gap px-container-margin max-w-7xl mx-auto w-full animate-fade-in">
            <Link to="/explorer" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-8">
                <span className="material-symbols-outlined">arrow_back</span>
                {t('productDetail.backToExplorer')}
            </Link>

            <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl overflow-hidden flex flex-col md:flex-row shadow-sm">
                <div className="md:w-1/2 h-64 md:h-auto bg-surface-container-lowest relative">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover opacity-90" />
                </div>
                
                <div className="p-8 md:w-1/2 flex flex-col">
                    <div className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 backdrop-blur-md px-3 py-1 rounded-full text-primary font-label-sm text-label-sm w-fit mb-4">
                        <span className="material-symbols-outlined text-sm">category</span> {product.category}
                    </div>
                    
                    <h1 className="font-display-lg text-headline-lg md:text-display-lg text-on-surface mb-2">{product.name}</h1>
                    <span className="font-headline-md text-headline-md text-primary mb-6">{formatCurrencyLocal(product.price, product.currency)}</span>
                    
                    <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">{product.description}</p>
                    
                    {/* Pre-Analysis Decision Hub */}
                    <div className="space-y-6 mb-8 flex-grow">
                        {/* Why this purchase matters */}
                        <div className="bg-surface-container-highest/20 rounded-lg p-4 border border-outline-variant/15">
                            <h4 className="font-label-md text-on-surface flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-sm text-secondary">info</span>
                                {t('productDetail.purchaseOverview')}
                            </h4>
                            <p className="font-body-md text-on-surface-variant leading-relaxed">{metrics.quickPreview}</p>
                        </div>

                        {/* Financial Impact Summary */}
                        <div className="bg-surface-container-highest/20 rounded-lg p-4 border border-outline-variant/15 grid grid-cols-2 gap-4">
                            <div>
                                <span className="block font-label-sm text-on-surface-variant mb-1">{t('explorer.previewScore')}</span>
                                <span className="font-headline-md text-on-surface">{metrics.previewScore}/100</span>
                            </div>
                            <div>
                                <span className="block font-label-sm text-on-surface-variant mb-1">{t('explorer.estCompatibility')}</span>
                                <span className="font-headline-md text-on-surface">{metrics.estimatedCompatibility}</span>
                            </div>
                            <div>
                                <span className="block font-label-sm text-on-surface-variant mb-1">{t('explorer.estImpact')}</span>
                                <span className="font-headline-md text-error">{metrics.estimatedImpact}</span>
                            </div>
                            <div>
                                <span className="block font-label-sm text-on-surface-variant mb-1">{t('explorer.monthlyEstimate')}</span>
                                <span className="font-headline-md text-on-surface">{metrics.monthlyCostEstimate}</span>
                            </div>
                        </div>

                        {/* Long Term Savings Impact (Mock visual representation) */}
                        <div className="bg-surface-container-highest/20 rounded-lg p-4 border border-outline-variant/15">
                            <h4 className="font-label-md text-on-surface flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-sm text-tertiary">trending_down</span>
                                {t('productDetail.freeCashFlowPressure')}
                            </h4>
                            <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${metrics.previewScore > 70 ? 'bg-primary' : metrics.previewScore > 40 ? 'bg-secondary' : 'bg-error'}`} 
                                    style={{ width: `${Math.max(0, 100 - metrics.previewScore)}%` }}
                                ></div>
                            </div>
                            <span className="block font-label-sm text-on-surface-variant mt-2 text-right">
                                {Math.max(0, 100 - metrics.previewScore)}% {t('productDetail.utilizationIncrease')}
                            </span>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button 
                            onClick={() => openAnalyzeModal(product)}
                            className="w-full bg-primary-container text-white py-4 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary transition-colors shadow-[0_5px_20px_rgba(16,185,129,0.15)] hover:shadow-[0_5px_25px_rgba(16,185,129,0.3)] border border-primary-container"
                        >
                            <span className="material-symbols-outlined">psychology</span>
                            {t('productDetail.runDeepAnalysis')}
                        </button>
                        <p className="text-center font-label-sm text-on-surface-variant/60 mt-3">{t('productDetail.engageGemini')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
