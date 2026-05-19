import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useLanguage } from '../../context/LanguageContext';
import { analyzePurchase } from '../../services/geminiService';
import { formatCurrency } from '../../utils/currency';
import { mockProducts } from '../../data/mockProducts';

export default function DashboardLayout() {
    const { currentUser, logout } = useAuth();
    const { profileData, metrics, loading, error, refetch } = useUserProfile();
    const { t, formatCurrencyLocal, language } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    // Guard route: if onboarding is not completed, redirect to onboarding step 1
    useEffect(() => {
        if (!loading && currentUser) {
            if (!profileData?.userDoc?.onboardingCompleted) {
                navigate('/onboarding/step1');
            }
        }
    }, [profileData, loading, currentUser, navigate]);

    // AI Analysis State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(mockProducts[0]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisError, setAnalysisError] = useState(null);
    const [activeScenario, setActiveScenario] = useState('buyToday');

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

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
            const result = await analyzePurchase(targetProduct, profileData, currentUser.uid, language);
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
        setActiveScenario('buyToday');
    };

    const navItems = [
        { path: '/dashboard', icon: 'dashboard', label: t('nav.dashboard') },
        { path: '/explorer', icon: 'explore', label: t('nav.explorer') },
        { path: '/analysis', icon: 'query_stats', label: t('nav.analysis') },
        { path: '/budgets', icon: 'account_balance_wallet', label: t('nav.budgets') },
        { path: '/settings', icon: 'settings', label: t('nav.settings') }
    ];

    const getScenarioValues = (scenario) => {
        if (!analysisResult) return {};
        
        let price = selectedProduct.price;
        let monthlyCost = price;
        let delay = analysisResult.goalDelay || '';
        let compatibility = analysisResult.confidenceScore || 50;
        let verdict = analysisResult.recommendation || 'Wait';
        let isSub = analysisResult.isSubscription;

        if (scenario === 'wait3Months') {
            monthlyCost = price / 3;
            compatibility = Math.min(100, compatibility + 10);
            delay = t('common.none') || 'None';
            verdict = compatibility >= 70 ? (language === 'tr' ? 'Satın Al' : 'Buy') : verdict;
        } else if (scenario === 'finance12Months') {
            monthlyCost = isSub ? price : (price * 1.1) / 12; // 10% interest assumed
            compatibility = Math.max(0, compatibility - 15);
            delay = analysisResult.goalDelay;
            verdict = compatibility < 50 ? (language === 'tr' ? 'Kaçın' : 'Avoid') : verdict;
        } else if (scenario === 'alternativeProduct') {
            monthlyCost = isSub ? price * 0.6 : (price * 0.6); // 40% cheaper alternative
            compatibility = Math.min(100, compatibility + 20);
            delay = t('common.none') || 'None';
            verdict = language === 'tr' ? 'Satın Al' : 'Buy';
        } else { // buyToday
            monthlyCost = isSub ? price : price;
        }

        return {
            monthlyCost: formatCurrencyLocal(monthlyCost, selectedProduct.currency),
            compatibility,
            delay,
            verdict
        };
    };
    
    const activeScenarioData = (!isAnalyzing && analysisResult) ? getScenarioValues(activeScenario) : {};
    const riskProfile = profileData?.preferences?.riskProfile || 'Balanced';

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
                        refetch,
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

            {/* Analyze Purchase Dashboard Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex p-4 md:p-8 bg-background/95 backdrop-blur-xl overflow-y-auto custom-scrollbar">
                    {/* Main Container */}
                    <div className="w-full h-full max-w-7xl mx-auto flex flex-col animate-fade-in relative">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/30">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                    <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                                </div>
                                <div>
                                    <h2 className="font-headline-md text-on-surface flex items-center gap-2">
                                        {t('aiModal.title')}
                                        {analysisResult?.source === 'mock_fallback' && (
                                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-secondary/20 text-secondary border border-secondary/30">
                                                {t('aiModal.demoMode')}
                                            </span>
                                        )}
                                    </h2>
                                    <p className="font-label-md text-on-surface-variant">{selectedProduct.name} — {formatCurrencyLocal(selectedProduct.price, selectedProduct.currency)}</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-variant text-on-surface transition-colors border border-outline-variant/50">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Content Area */}
                        {!analysisResult && !isAnalyzing ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="max-w-xl w-full">
                                    <p className="text-on-surface-variant font-body-md mb-6 text-center">{t('aiModal.selectPrompt')}</p>
                                    <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
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
                                    <button 
                                        onClick={handleRunAnalysis}
                                        className="w-full py-4 bg-primary-container text-white rounded-xl font-label-md hover:bg-primary transition-all shadow-lg flex items-center justify-center gap-2 mt-6"
                                    >
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                        Run Neural Analysis
                                    </button>
                                </div>
                            </div>
                        ) : isAnalyzing ? (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                                    <span className="material-symbols-outlined text-primary text-4xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                                </div>
                                <div className="text-center">
                                    <h3 className="font-headline-md text-on-surface mb-2">{t('aiModal.analyzing') || 'Analyzing Purchase...'}</h3>
                                    <p className="text-on-surface-variant font-body-md animate-pulse">Running data through your personalized financial model.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8">
                                
                                {/* LEFT COLUMN: PURCHASE DECISION */}
                                <div className="lg:col-span-4 space-y-6">
                                    <h3 className="font-label-md uppercase tracking-wider text-on-surface-variant mb-4">{t('aiModal.purchaseDecision')}</h3>
                                    
                                    {/* Circular Score */}
                                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 flex flex-col items-center shadow-lg relative overflow-hidden">
                                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-3xl opacity-20 rounded-full ${analysisResult.recommendation === 'Buy' || analysisResult.recommendation === 'Satın Al' ? 'bg-primary' : analysisResult.recommendation === 'Avoid' || analysisResult.recommendation === 'Kaçın' ? 'bg-error' : 'bg-secondary'}`}></div>
                                        
                                        <div className="relative w-40 h-40 flex flex-col items-center justify-center z-10">
                                            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                                <circle cx="80" cy="80" r="70" className="stroke-surface-variant" strokeWidth="8" fill="none" />
                                                <circle cx="80" cy="80" r="70" className={`stroke-current ${analysisResult.recommendation === 'Buy' || analysisResult.recommendation === 'Satın Al' ? 'text-primary' : analysisResult.recommendation === 'Avoid' || analysisResult.recommendation === 'Kaçın' ? 'text-error' : 'text-secondary'}`} strokeWidth="8" fill="none" strokeDasharray={`${(analysisResult.confidenceScore / 100) * 440} 440`} strokeLinecap="round" />
                                            </svg>
                                            <span className="font-display-md font-bold text-on-surface">{analysisResult.confidenceScore}</span>
                                            <span className="font-label-sm text-on-surface-variant uppercase">{t('aiModal.confidence')}</span>
                                        </div>
                                        
                                        <div className={`mt-6 py-2 px-6 rounded-full border border-current font-headline-sm font-bold tracking-wide uppercase shadow-[0_0_15px_currentColor] opacity-90 ${analysisResult.recommendation === 'Buy' || analysisResult.recommendation === 'Satın Al' ? 'text-primary bg-primary/10' : analysisResult.recommendation === 'Avoid' || analysisResult.recommendation === 'Kaçın' ? 'text-error bg-error/10' : 'text-secondary bg-secondary/10'}`}>
                                            {analysisResult.recommendation}
                                        </div>
                                    </div>

                                    {/* Metrics Progress Bars */}
                                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 shadow-lg space-y-4">
                                        <div>
                                            <div className="flex justify-between font-label-sm mb-1">
                                                <span className="text-on-surface">{t('aiModal.necessityScore')}</span>
                                                <span className="text-on-surface-variant">{analysisResult.necessityScore}/10</span>
                                            </div>
                                            <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                                                <div className="h-full bg-primary" style={{ width: `${(analysisResult.necessityScore / 10) * 100}%` }}></div>
                                            </div>
                                            <p className="text-[10px] text-on-surface-variant mt-1 italic">{t('aiModal.estimated')}</p>
                                        </div>
                                        
                                        <div>
                                            <div className="flex justify-between font-label-sm mb-1">
                                                <span className="text-on-surface">{t('aiModal.budgetPressure')}</span>
                                                <span className="text-on-surface-variant">{((activeScenarioData.monthlyCost ? parseFloat(activeScenarioData.monthlyCost.replace(/[^0-9.-]+/g,"")) : selectedProduct.price) / Math.max(1, metrics?.freeBudget) * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                                                <div className="h-full bg-error" style={{ width: `${Math.min(100, (activeScenarioData.monthlyCost ? parseFloat(activeScenarioData.monthlyCost.replace(/[^0-9.-]+/g,"")) : selectedProduct.price) / Math.max(1, metrics?.freeBudget) * 100)}%` }}></div>
                                            </div>
                                            <p className="text-[10px] text-on-surface-variant mt-1 italic">{t('aiModal.estimated')}</p>
                                        </div>

                                        <div>
                                            <div className="flex justify-between font-label-sm mb-1">
                                                <span className="text-on-surface">{t('aiModal.risk')}</span>
                                                <span className="text-on-surface-variant capitalize">{riskProfile}</span>
                                            </div>
                                            <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden flex">
                                                <div className={`h-full ${riskProfile.toLowerCase() === 'conservative' ? 'w-1/3 bg-primary' : riskProfile.toLowerCase() === 'aggressive' ? 'w-full bg-error' : 'w-2/3 bg-secondary'}`}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Coach Insight */}
                                    <div className="bg-primary-container/10 border border-primary/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
                                            <h4 className="font-label-md text-primary">{t('aiModal.aiCoachingInsight')}</h4>
                                        </div>
                                        <p className="font-body-sm text-on-surface leading-relaxed">"{analysisResult.aiCoachingInsight}"</p>
                                    </div>
                                </div>

                                {/* CENTER COLUMN: FINANCIAL IMPACT */}
                                <div className="lg:col-span-4 space-y-6">
                                    <h3 className="font-label-md uppercase tracking-wider text-on-surface-variant mb-4">{t('aiModal.financialImpact')}</h3>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
                                            <p className="font-label-sm text-on-surface-variant mb-1">{t('aiModal.monthlyEquivalent')} <span className="text-[9px] bg-surface-variant px-1 rounded ml-1">{t('aiModal.estimated')}</span></p>
                                            <p className="font-headline-sm text-primary">{activeScenarioData.monthlyCost || formatCurrencyLocal(selectedProduct.price / 12, selectedProduct.currency)}</p>
                                        </div>
                                        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
                                            <p className="font-label-sm text-on-surface-variant mb-1">{t('aiModal.savingsRate')} <span className="text-[9px] bg-surface-variant px-1 rounded ml-1">{t('aiModal.estimated')}</span></p>
                                            <p className="font-label-md text-on-surface">{analysisResult.savingsRateImpact}</p>
                                        </div>
                                        <div className="col-span-2 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 shadow-sm">
                                            <p className="font-label-sm text-on-surface-variant mb-1">{t('aiModal.budget')}</p>
                                            <p className="font-label-md text-on-surface">{analysisResult.budgetImpact}</p>
                                        </div>
                                        <div className="col-span-2 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 shadow-sm">
                                            <p className="font-label-sm text-on-surface-variant mb-1">{t('aiModal.goalDelayOppCost')}</p>
                                            <p className="font-label-md text-on-surface">{analysisResult.goalDelay}</p>
                                        </div>
                                    </div>

                                    {/* Timeline Visualization */}
                                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 shadow-sm">
                                        <h4 className="font-label-md text-on-surface mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">timeline</span>
                                            {t('aiModal.timeline')}
                                        </h4>
                                        <div className="relative border-l-2 border-outline-variant/30 ml-3 space-y-6">
                                            <div className="relative">
                                                <div className="absolute -left-[21px] w-10 h-10 bg-surface-container-lowest border border-outline-variant/50 rounded-full flex items-center justify-center">
                                                    <div className="w-4 h-4 bg-primary rounded-full"></div>
                                                </div>
                                                <div className="pl-6 pt-2">
                                                    <p className="font-label-md text-on-surface">{t('aiModal.today')}</p>
                                                    <p className="text-xs text-on-surface-variant mt-1">Purchase Decision</p>
                                                </div>
                                            </div>
                                            
                                            {Object.values(profileData?.goals || {}).length > 0 ? (
                                                Object.values(profileData.goals).slice(0, 2).map((goal, i) => (
                                                    <div key={i} className="relative">
                                                        <div className="absolute -left-[11px] w-5 h-5 bg-surface-variant rounded-full border border-outline-variant/50"></div>
                                                        <div className="pl-6">
                                                            <p className="font-label-md text-on-surface">{goal.name}</p>
                                                            <p className="text-xs text-error mt-0.5">{analysisResult.recommendation === 'Avoid' || analysisResult.recommendation === 'Kaçın' ? '+2 months' : '+1 month'} delay</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <>
                                                    <div className="relative">
                                                        <div className="absolute -left-[11px] w-5 h-5 bg-surface-variant rounded-full border border-outline-variant/50"></div>
                                                        <div className="pl-6">
                                                            <p className="font-label-md text-on-surface">Emergency Fund</p>
                                                            <p className="text-xs text-error mt-0.5">+1 month delay</p>
                                                        </div>
                                                    </div>
                                                    <div className="relative">
                                                        <div className="absolute -left-[11px] w-5 h-5 bg-surface-variant rounded-full border border-outline-variant/50"></div>
                                                        <div className="pl-6">
                                                            <p className="font-label-md text-on-surface">Vacation Goal</p>
                                                            <p className="text-xs text-on-surface-variant mt-0.5">No impact</p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: SCENARIO LAB */}
                                <div className="lg:col-span-4 space-y-6">
                                    <h3 className="font-label-md uppercase tracking-wider text-on-surface-variant mb-4">{t('aiModal.scenarioLab')}</h3>
                                    
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        {[
                                            { id: 'buyToday', label: t('aiModal.buyToday') },
                                            { id: 'wait3Months', label: t('aiModal.wait3Months') },
                                            { id: 'finance12Months', label: t('aiModal.finance12Months') },
                                            { id: 'alternativeProduct', label: t('aiModal.alternativeProduct') }
                                        ].map(scen => (
                                            <button 
                                                key={scen.id}
                                                onClick={() => setActiveScenario(scen.id)}
                                                className={`p-3 rounded-xl border font-label-sm transition-all text-center ${
                                                    activeScenario === scen.id 
                                                    ? 'bg-primary/20 border-primary text-primary shadow-sm' 
                                                    : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:border-outline-variant hover:text-on-surface'
                                                }`}
                                            >
                                                {scen.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
                                        <h4 className="font-headline-sm text-on-surface mb-6 border-b border-outline-variant/30 pb-3">{t('aiModal.' + activeScenario)} <span className="text-[10px] uppercase bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded ml-2 align-middle">{t('aiModal.estimated')}</span></h4>
                                        
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                                <span className="text-on-surface-variant font-label-sm">{t('aiModal.confidence')}</span>
                                                <span className="font-headline-sm text-on-surface">{activeScenarioData.compatibility}%</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                                <span className="text-on-surface-variant font-label-sm">{t('aiModal.cost')} / mo</span>
                                                <span className="font-headline-sm text-primary">{activeScenarioData.monthlyCost}</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                                <span className="text-on-surface-variant font-label-sm">{t('aiModal.goalDelayOppCost')}</span>
                                                <span className="font-label-md text-on-surface text-right max-w-[60%]">{activeScenarioData.delay}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="text-on-surface-variant font-label-sm">{t('aiModal.verdict')}</span>
                                                <span className={`px-3 py-1 rounded font-bold text-xs uppercase border ${
                                                    activeScenarioData.verdict === 'Buy' || activeScenarioData.verdict === 'Satın Al' ? 'bg-primary/10 text-primary border-primary/30' :
                                                    activeScenarioData.verdict === 'Avoid' || activeScenarioData.verdict === 'Kaçın' ? 'bg-error/10 text-error border-error/30' :
                                                    'bg-secondary/10 text-secondary border-secondary/30'
                                                }`}>{activeScenarioData.verdict}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Smart Alternative */}
                                    <div className="bg-surface-container-low border border-tertiary/30 rounded-2xl p-5 shadow-lg">
                                        <h4 className="font-label-md text-tertiary flex items-center gap-2 mb-3">
                                            <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                                            {t('aiModal.smartAlternative')}
                                        </h4>
                                        <p className="font-body-sm text-on-surface-variant">{analysisResult.smartAlternative}</p>
                                    </div>

                                </div>

                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
