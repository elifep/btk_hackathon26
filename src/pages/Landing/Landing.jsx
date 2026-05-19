import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function Landing() {
    const { t, language } = useLanguage();

    return (
        <div className="flex flex-col gap-12">
            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-container-margin py-section-gap flex flex-col lg:flex-row items-center gap-12 relative w-full">
                {/* Decorative Glow */}
                <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none -z-10"></div>
                
                <div className="flex-1 space-y-8 z-10 text-center lg:text-left">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-md text-label-md mb-4 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <span className="material-symbols-outlined text-[16px] mr-2">bolt</span>
                        {t('landing.obsidianActive')}
                    </div>
                    
                    <h1 className="font-display-lg text-display-lg md:text-[64px] md:leading-[72px] tracking-tight">
                        {t('landing.title1')} <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{t('landing.title2')}</span>
                    </h1>
                    
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto lg:mx-0">
                        {t('landing.subtitle')}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <Link to="/explorer" className="bg-primary-container text-on-primary-container font-label-md text-label-md px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:bg-primary transition-colors duration-300 flex items-center justify-center gap-2 group">
                            {t('landing.startAnalyzing')}
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </Link>
                        <button className="bg-white/5 border border-white/10 text-on-surface font-label-md text-label-md px-8 py-4 rounded-xl backdrop-blur-md hover:bg-white/10 transition-colors duration-300 flex items-center justify-center">
                            {t('landing.viewDemo')}
                        </button>
                    </div>
                </div>

                <div className="flex-1 w-full relative z-10">
                    {/* Hero Graphic Container - Removed strict aspect square to allow flexibility, added min-height */}
                    <div className="relative w-full min-h-[460px] rounded-2xl border border-white/10 bg-surface-container-low/40 backdrop-blur-[20px] overflow-hidden p-6 flex flex-col justify-between group shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                        
                        {/* Mock Data Viz elements */}
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="font-label-sm text-label-sm text-on-surface-variant">{t('landing.projectedImpact')}</p>
                                <p className="font-headline-md text-headline-md text-error">-$1,240.00</p>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-error/10 text-error font-label-sm text-label-sm flex items-center gap-1 border border-error/20">
                                <span className="material-symbols-outlined text-[14px]">warning</span>
                                {t('landing.highFriction')}
                            </div>
                        </div>

                        {/* Chart Area (Abstract representation) */}
                        <div className="h-32 w-full relative mt-12 flex items-end gap-2 pr-4">
                            <div className="w-1/6 bg-surface-variant/50 rounded-t-sm h-[40%]"></div>
                            <div className="w-1/6 bg-surface-variant/50 rounded-t-sm h-[60%]"></div>
                            <div className="w-1/6 bg-surface-variant/50 rounded-t-sm h-[80%]"></div>
                            <div className="w-1/6 bg-primary/20 rounded-t-sm h-[100%] relative border-t-2 border-primary">
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-container-high px-2 py-1 rounded text-primary font-label-sm text-xs border border-white/10 shadow-lg whitespace-nowrap z-20">
                                    {t('landing.purchasePoint')}
                                </div>
                            </div>
                            <div className="w-1/6 bg-error/20 rounded-t-sm h-[30%] border-t-2 border-error"></div>
                            <div className="w-1/6 bg-error/20 rounded-t-sm h-[20%] border-t-2 border-error"></div>
                        </div>

                        {/* AI Recommendation Card inside Hero */}
                        <div className="mt-6 bg-surface-container-highest/50 border border-white/5 rounded-xl p-4 backdrop-blur-md relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-primary">psychology</span>
                                </div>
                                <div>
                                    <h3 className="font-label-md text-label-md text-on-surface">{t('landing.aiAlternativeTitle')}</h3>
                                    <p className="font-body-md text-body-md text-on-surface-variant mt-1 text-sm">{t('landing.aiAlternativeDesc')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Bento Grid */}
            <section className="max-w-7xl mx-auto px-container-margin py-section-gap w-full">
                <div className="text-center mb-16">
                    <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-4">{t('landing.intelligenceCheckout')}</h2>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">{t('landing.intelligenceCheckoutDesc')}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                    {/* Feature 1: AI Insights */}
                    <div className="col-span-1 md:col-span-2 bg-surface-container-low/30 border border-white/5 rounded-2xl p-card-padding backdrop-blur-[20px] relative overflow-hidden group hover:border-primary/30 transition-colors duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                                    <span className="material-symbols-outlined text-primary text-[24px]">model_training</span>
                                </div>
                                <h3 className="font-headline-md text-headline-md mb-2">{t('landing.aiPoweredInsights')}</h3>
                                <p className="font-body-md text-body-md text-on-surface-variant max-w-md">{t('landing.aiPoweredInsightsDesc')}</p>
                            </div>
                            <div className="mt-8 bg-surface-container-highest/40 rounded-xl p-4 border border-white/5 flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-surface-variant border-2 border-surface-container-low flex items-center justify-center"><span className="material-symbols-outlined text-[14px] text-on-surface-variant">shopping_cart</span></div>
                                    <div className="w-8 h-8 rounded-full bg-surface-variant border-2 border-surface-container-low flex items-center justify-center"><span className="material-symbols-outlined text-[14px] text-on-surface-variant">flight</span></div>
                                    <div className="w-8 h-8 rounded-full bg-surface-variant border-2 border-surface-container-low flex items-center justify-center"><span className="material-symbols-outlined text-[14px] text-on-surface-variant">restaurant</span></div>
                                </div>
                                <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-primary/50"></div>
                                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2: Real-time Impact */}
                    <div className="col-span-1 bg-surface-container-low/30 border border-white/5 rounded-2xl p-card-padding backdrop-blur-[20px] relative overflow-hidden group hover:border-primary/30 transition-colors duration-500">
                        <div className="absolute inset-0 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-12 h-12 rounded-xl bg-secondary-container/10 flex items-center justify-center mb-6 border border-secondary-container/20">
                                <span className="material-symbols-outlined text-secondary-container text-[24px]">monitoring</span>
                            </div>
                            <h3 className="font-headline-md text-headline-md mb-2">{t('landing.realtimeBudgetImpact')}</h3>
                            <p className="font-body-md text-body-md text-on-surface-variant mb-8">{t('landing.realtimeBudgetImpactDesc')}</p>
                            
                            <div className="mt-auto space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-on-surface-variant">{t('landing.currentBurnRate')}</span>
                                    <span className="text-primary">{t('landing.healthy')}</span>
                                </div>
                                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                                    <div className="w-[65%] h-full bg-primary rounded-full"></div>
                                </div>
                                
                                <div className="flex justify-between items-center text-sm pt-2">
                                    <span className="text-on-surface-variant">{t('landing.postPurchase')}</span>
                                    <span className="text-error">{t('landing.critical')}</span>
                                </div>
                                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                                    <div className="w-[90%] h-full bg-error rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 3: Alternative Discovery */}
                    <div className="col-span-1 md:col-span-3 bg-surface-container-low/30 border border-white/5 rounded-2xl p-card-padding backdrop-blur-[20px] relative overflow-hidden group hover:border-primary/30 transition-colors duration-500">
                        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                                    <span className="material-symbols-outlined text-primary text-[24px]">manage_search</span>
                                </div>
                                <h3 className="font-headline-md text-headline-md mb-2">{t('landing.altDiscoveryTitle')}</h3>
                                <p className="font-body-md text-body-md text-on-surface-variant">{t('landing.altDiscoveryDesc')}</p>
                            </div>
                            
                            <div className="flex-1 w-full bg-surface-container-highest/30 rounded-xl p-4 border border-white/5 space-y-4">
                                {/* Original Product */}
                                <div className="flex justify-between items-center p-3 rounded-lg bg-surface-variant/30 border border-white/5 opacity-60">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center"><span className="material-symbols-outlined text-on-surface-variant">headphones</span></div>
                                        <div>
                                            <div className="font-label-sm text-label-sm text-on-surface">Premium Brand X</div>
                                            <div className="font-label-sm text-label-sm text-on-surface-variant">$349.99</div>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-on-surface-variant">close</span>
                                </div>
                                
                                {/* AI Alternative */}
                                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                                    <div className="flex items-center gap-3 pl-2">
                                        <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center"><span className="material-symbols-outlined text-primary">headphones</span></div>
                                        <div>
                                            <div className="font-label-sm text-label-sm text-on-surface">Alternative Y (95% Match)</div>
                                            <div className="font-label-sm text-label-sm text-primary font-bold">$129.99</div>
                                        </div>
                                    </div>
                                    <div className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-bold border border-primary/20">
                                        {t('landing.saveAmount').replace('{amount}', '$220')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
