import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useLanguage } from '../../context/LanguageContext';
import { analyzePurchase } from '../../services/geminiService';
import { formatCurrency } from '../../utils/currency';
import { mockProducts } from '../../data/mockProducts';

export default function DashboardLayout() {
    const { currentUser, logout } = useAuth();
    const { profileData, metrics, loading, error } = useUserProfile();
    const { t, formatCurrencyLocal } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    // AI Analysis State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(mockProducts[0]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisError, setAnalysisError] = useState(null);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const handleRunAnalysis = async (productOverride = null) => {
        const targetProduct = productOverride?.id ? productOverride : selectedProduct;
        if (!targetProduct) return;
        
        setIsAnalyzing(true);
        setAnalysisError(null);
        try {
            const result = await analyzePurchase(targetProduct, profileData, currentUser.uid);
            setAnalysisResult(result);
        } catch (err) {
            setAnalysisError(err.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setAnalysisResult(null);
        setAnalysisError(null);
    };

    const navItems = [
        { path: '/dashboard', icon: 'dashboard', label: t('nav.dashboard') },
        { path: '/explorer', icon: 'explore', label: t('nav.explorer') },
        { path: '/analysis', icon: 'query_stats', label: t('nav.analysis') },
        { path: '/budgets', icon: 'account_balance_wallet', label: t('nav.budgets') },
        { path: '/settings', icon: 'settings', label: t('nav.settings') }
    ];

    return (
        <div className="bg-background text-on-surface font-body-md min-h-screen flex selection:bg-primary-container selection:text-white relative">
            
            {/* SideNavBar */}
            <nav className="h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest/90 backdrop-blur-2xl border-r border-white/5 flex-col p-gutter space-y-unit hidden md:flex z-40">
                <div className="mb-8 mt-4 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                        </div>
                        <div>
                            <h1 className="font-headline-md text-headline-md text-primary font-bold tracking-tight">SpendWise AI</h1>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">SpendWise AI</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 space-y-2">
                    {navItems.map(item => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link 
                                key={item.path} 
                                to={item.path} 
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                    isActive 
                                    ? 'bg-primary/10 text-primary border-r-4 border-primary' 
                                    : 'text-on-surface-variant hover:bg-surface-variant hover:text-primary'
                                }`}
                            >
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                                <span className="font-label-md text-label-md">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
                
                <button 
                    onClick={() => {
                        setIsModalOpen(true);
                        setAnalysisResult(null);
                        setAnalysisError(null);
                    }}
                    className="mt-auto w-full py-3 bg-primary-container text-white rounded-lg font-label-md text-label-md hover:bg-primary transition-colors shadow-[0_0_30px_rgba(16,185,129,0.1)] flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    {t('explorer.analyzePurchase')}
                </button>
            </nav>

            {/* Main Content Wrapper */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative z-10">
                
                {/* TopNavBar */}
                <header className="h-20 bg-background/80 backdrop-blur-xl border-b border-outline-variant/30 sticky top-0 z-30 flex items-center justify-between px-8">
                    <div className="relative w-96 hidden sm:block">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                        <input 
                            type="text" 
                            placeholder={`${t('common.search')}...`}
                            className="w-full bg-surface-container-high border-none rounded-full py-2.5 pl-12 pr-4 text-on-surface focus:ring-1 focus:ring-primary focus:outline-none font-body-md text-body-md placeholder:text-on-surface-variant"
                        />
                    </div>
                    
                    <div className="flex items-center gap-6 ml-auto">
                        <button className="relative text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
                        </button>
                        
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden lg:block">
                                <p className="font-label-md text-label-md text-on-surface">
                                    {profileData?.userDoc?.fullName || currentUser?.displayName || 'SpendWise User'}
                                </p>
                                <p className="font-label-sm text-label-sm text-primary capitalize">
                                    {profileData?.userDoc?.subscriptionTier || 'Free'} Tier
                                </p>
                            </div>
                            <div className="group relative">
                                <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/50 overflow-hidden flex items-center justify-center cursor-pointer shadow-sm">
                                    {currentUser?.photoURL ? (
                                        <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-on-surface-variant">person</span>
                                    )}
                                </div>
                                
                                {/* Dropdown Menu */}
                                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-surface-container-high border border-outline-variant/30 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-3 font-body-md text-sm text-error hover:bg-surface-variant rounded-xl flex items-center gap-2 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">logout</span>
                                        {t('nav.logout')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main View Outlet */}
                <div className="flex-1">
                    <Outlet context={{ 
                        profileData, 
                        metrics, 
                        loading, 
                        error, 
                        openAnalyzeModal: (product) => {
                            if (isAnalyzing) return; // Prevent duplicate clicks
                            setIsModalOpen(true);
                            if (product) {
                                setSelectedProduct(product);
                                handleRunAnalysis(product);
                            } else {
                                setAnalysisResult(null);
                                setAnalysisError(null);
                            }
                        }
                    }} />
                </div>
            </div>

            {/* Analyze Purchase Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={closeModal}></div>
                    
                    {/* Modal Content */}
                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl w-full max-w-2xl relative z-10 shadow-lg flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
                        <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                                </div>
                                <div>
                                    <h2 className="font-headline-sm text-headline-sm text-on-surface">{t('aiModal.title')}</h2>
                                    <p className="font-label-sm text-on-surface-variant">{t('aiModal.subtitle')}</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="text-on-surface-variant hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            {!analysisResult && !isAnalyzing ? (
                                <div className="space-y-6">
                                    <p className="text-on-surface-variant font-body-md">{t('aiModal.selectPrompt')}</p>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        {mockProducts.map(product => (
                                            <div 
                                                key={product.id} 
                                                onClick={() => setSelectedProduct(product)}
                                                className={`p-4 rounded-xl border cursor-pointer transition-all shadow-sm ${
                                                    selectedProduct.id === product.id 
                                                    ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                                                    : 'bg-surface-container border-outline-variant/50 hover:border-outline-variant'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-label-md text-on-surface">{product.name}</h4>
                                                        <p className="font-label-sm text-on-surface-variant">{product.category}</p>
                                                    </div>
                                                    <div className="font-headline-sm text-primary">
                                                        {formatCurrencyLocal(product.price, product.currency)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {analysisError && (
                                        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-start gap-3">
                                            <span className="material-symbols-outlined">error</span>
                                            <p className="font-body-sm">{analysisError}</p>
                                        </div>
                                    )}

                                    <button 
                                        onClick={handleRunAnalysis}
                                        className="w-full py-4 bg-primary-container text-white rounded-xl font-label-md hover:bg-primary transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
                                    >
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                        Run Neural Analysis
                                    </button>
                                </div>
                            ) : isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                                    <div className="relative w-24 h-24 flex items-center justify-center">
                                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                                        <span className="material-symbols-outlined text-primary text-3xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-headline-sm text-on-surface mb-2">Analyzing Purchase...</h3>
                                        <p className="text-on-surface-variant font-body-sm animate-pulse">Running data through your personalized financial model.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-fade-in">
                                    {analysisResult.source === 'mock_fallback' && (
                                        <div className="bg-secondary/20 text-secondary border border-secondary/30 rounded-lg px-3 py-1.5 flex items-center justify-center gap-2 inline-flex w-full shadow-sm">
                                            <span className="material-symbols-outlined text-[16px]">info</span>
                                            <span className="font-label-sm font-medium uppercase tracking-wider">{t('aiModal.demoMode')}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl border border-outline-variant/50 shadow-sm">
                                        <div>
                                            <p className="text-on-surface-variant font-label-sm uppercase tracking-wider mb-1">{t('aiModal.subject')}</p>
                                            <h4 className="font-headline-sm text-on-surface">{selectedProduct.name}</h4>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-on-surface-variant font-label-sm uppercase tracking-wider mb-1">{t('aiModal.cost')}</p>
                                            <h4 className="font-headline-sm text-primary">{formatCurrencyLocal(selectedProduct.price, selectedProduct.currency)}</h4>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className={`p-5 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm ${
                                            analysisResult.recommendation === 'Buy' ? 'bg-primary/10 border-primary/30' :
                                            analysisResult.recommendation === 'Wait' ? 'bg-secondary/10 border-secondary/30' :
                                            'bg-error/10 border-error/30'
                                        }`}>
                                            <p className="text-on-surface-variant font-label-sm uppercase tracking-wider mb-2">{t('aiModal.verdict')}</p>
                                            <h2 className={`font-display-sm font-bold ${
                                                analysisResult.recommendation === 'Buy' ? 'text-primary' :
                                                analysisResult.recommendation === 'Wait' ? 'text-secondary' :
                                                'text-error'
                                            }`}>{analysisResult.recommendation}</h2>
                                        </div>

                                        <div className="p-5 rounded-xl bg-surface-container border border-outline-variant/50 flex flex-col items-center justify-center text-center shadow-sm">
                                            <p className="text-on-surface-variant font-label-sm uppercase tracking-wider mb-2">{t('aiModal.confidence')}</p>
                                            <div className="flex items-end gap-1 text-primary">
                                                <h2 className="font-display-sm font-bold">{analysisResult.confidenceScore}</h2>
                                                <span className="font-headline-sm mb-1">%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/50 shadow-sm">
                                            <h4 className="font-label-md text-on-surface flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-[18px] text-tertiary">warning</span>
                                                {t('aiModal.necessityScore')}
                                            </h4>
                                            <p className="font-body-md text-on-surface-variant">{analysisResult.necessityScore}/10</p>
                                        </div>
                                        <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/50 shadow-sm">
                                            <h4 className="font-label-md text-on-surface flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-[18px] text-secondary">event_repeat</span>
                                                {t('aiModal.monthlyBurden')}
                                            </h4>
                                            <p className="font-body-md text-on-surface-variant">{analysisResult.monthlyBurden}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/50 shadow-sm">
                                            <h4 className="font-label-md text-on-surface flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-[18px] text-primary">account_balance</span>
                                                {t('aiModal.budgetSavingsImpact')}
                                            </h4>
                                            <p className="font-body-md text-on-surface-variant mb-2"><strong className="text-on-surface">{t('aiModal.budget')}:</strong> {analysisResult.budgetImpact}</p>
                                            <p className="font-body-md text-on-surface-variant"><strong className="text-on-surface">{t('aiModal.savingsRate')}:</strong> {analysisResult.savingsRateImpact}</p>
                                        </div>

                                        <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/50 shadow-sm">
                                            <h4 className="font-label-md text-on-surface flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-[18px] text-error">flag</span>
                                                {t('aiModal.goalDelayOppCost')}
                                            </h4>
                                            <p className="font-body-md text-on-surface-variant mb-2">{analysisResult.goalDelay}</p>
                                            <p className="font-body-md text-on-surface-variant text-sm italic border-t border-outline-variant/30 pt-2 mt-2">{analysisResult.opportunityCost}</p>
                                        </div>

                                        <div className="bg-tertiary/10 rounded-xl p-4 border border-tertiary/20 shadow-sm">
                                            <h4 className="font-label-md text-tertiary flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                                                {t('aiModal.smartAlternative')}
                                            </h4>
                                            <p className="font-body-md text-on-surface-variant">{analysisResult.smartAlternative}</p>
                                        </div>

                                        <div className="bg-primary/5 rounded-xl p-5 border-l-4 border-l-primary shadow-md mt-6">
                                            <h4 className="font-label-md text-primary flex items-center gap-2 mb-3">
                                                <span className="material-symbols-outlined text-[18px]">psychology</span>
                                                {t('aiModal.aiCoachingInsight')}
                                            </h4>
                                            <p className="font-body-md text-on-surface leading-relaxed">"{analysisResult.aiCoachingInsight}"</p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => { setAnalysisResult(null); setIsModalOpen(false); }}
                                        className="w-full py-4 mt-6 bg-surface-container-high text-on-surface rounded-xl font-label-md hover:bg-surface-variant transition-all border border-outline-variant/30 shadow-sm"
                                    >
                                        {t('aiModal.done')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
