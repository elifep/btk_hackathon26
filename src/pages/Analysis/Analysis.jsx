import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { db } from '../../config/firebase';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { analyzePurchase } from '../../services/geminiService';
import { mockProducts } from '../../data/mockProducts';

const DEMO_PRODUCT = {
    name: "MacBook Pro M3",
    price: 1999,
    currency: "USD",
    category: "Electronics"
};

const DEMO_ANALYSIS_EN = {
    confidenceScore: 78,
    recommendation: "Wait",
    necessityScore: 4,
    monthlyBurden: "$166.58 /mo (12-month equivalent)",
    budgetImpact: "High upfront cost, equates to 25% of your free monthly budget.",
    savingsRateImpact: "-8.5% savings rate",
    goalDelay: "Delays Emergency Fund target by 1.2 months.",
    opportunityCost: "Investing $1,999 at 6% return yields ~$120/year.",
    smartAlternative: "Consider an M2 Refurbished model saving $500, or waiting for Black Friday sales.",
    aiCoachingInsight: "While a MacBook Pro is highly productive, delaying this purchase by 3 months allows you to secure your emergency fund first. Sleep on it.",
    isSubscription: false,
    source: "demo"
};

const DEMO_ANALYSIS_TR = {
    confidenceScore: 78,
    recommendation: "Bekle",
    necessityScore: 4,
    monthlyBurden: "166.58 $ / ay (12 aylık eşdeğer)",
    budgetImpact: "Yüksek başlangıç maliyeti, aylık boş bütçenizin %25'ine denk geliyor.",
    savingsRateImpact: "-%8.5 tasarruf oranı",
    goalDelay: "Acil Durum Fonu hedefinizi 1.2 ay geciktirir.",
    opportunityCost: "1.999 $'ı %6 getiriyle yatırım yapmak yıllık ~120 $ kazandırır.",
    smartAlternative: "500 $ tasarruf sağlayan M2 Yenilenmiş modeli düşünün veya Efsane Cuma indirimlerini bekleyin.",
    aiCoachingInsight: "MacBook Pro son derece üretken olsa da, bu satın almayı 3 ay ertelemek önce acil durum fonunuzu güvence altına almanızı sağlar.",
    isSubscription: false,
    source: "demo"
};

// Deterministic Necessity Score calculator based on requirements
const calculateNecessityScore = (category, price, freeBudget, goals, riskProfile) => {
    const categoryScores = {
        'Electronics': 5,
        'Education': 9,
        'Software & Subscriptions': 7,
        'Home & Living': 6,
        'Travel': 4,
        'Fashion': 3,
        'Furniture': 5,
        'Gifts': 4
    };
    const categoryWeight = categoryScores[category] || 5;

    const ratio = price > 0 ? (freeBudget / price) : 1;
    let normalizedRatio = 1;
    if (ratio >= 3) {
        normalizedRatio = 10;
    } else if (ratio <= 0.1) {
        normalizedRatio = 1;
    } else {
        normalizedRatio = 1 + ((ratio - 0.1) / (3.0 - 0.1)) * 9;
    }

    const activeGoals = Object.values(goals || {}).filter(g => parseFloat(g.target || g.targetAmount || 0) > 0);
    const goalUrgency = activeGoals.length > 0 ? 8 : 4;

    const risk = (riskProfile || 'balanced').toLowerCase();
    const riskTolerance = risk === 'conservative' ? 3 : risk === 'aggressive' ? 9 : 6;

    const necessity = (categoryWeight * 0.35) + (normalizedRatio * 0.35) + (goalUrgency * 0.20) + (riskTolerance * 0.10);
    return Math.max(1, Math.min(10, Math.round(necessity * 10) / 10));
};

export default function Analysis() {
    const { currentUser } = useAuth();
    const { profileData, metrics, loading: contextLoading } = useOutletContext();
    const { t, formatCurrencyLocal, language } = useLanguage();

    const [activeProduct, setActiveProduct] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [activeScenario, setActiveScenario] = useState('buyToday');
    const [selectedProductToAnalyze, setSelectedProductToAnalyze] = useState(mockProducts[0]);

    const fetchHistory = async () => {
        if (!currentUser) return;
        setLoadingHistory(true);
        try {
            const analysesRef = collection(db, 'users', currentUser.uid, 'ai', 'data', 'analyses');
            const q = query(analysesRef, orderBy('createdAt', 'desc'), limit(10));
            const querySnapshot = await getDocs(q);
            const items = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (!data.archived) {
                    items.push({ id: doc.id, ...data });
                }
            });
            setHistory(items);
            
            if (items.length > 0) {
                setAnalysisResult(items[0].analysis);
                setActiveProduct(items[0].purchaseData);
            } else {
                setAnalysisResult(null);
                setActiveProduct(null);
            }
        } catch (e) {
            console.error("Error fetching analysis history: ", e);
            setAnalysisResult(null);
            setActiveProduct(null);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [currentUser, language]);

    const handleRunAnalysis = async () => {
        if (!selectedProductToAnalyze || isAnalyzing) return;
        setIsAnalyzing(true);
        try {
            const result = await analyzePurchase(selectedProductToAnalyze, profileData, currentUser.uid, language);
            setAnalysisResult(result);
            setActiveProduct(selectedProductToAnalyze);
            await fetchHistory();
        } catch (error) {
            console.error("Analysis execution failed", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const clearAllHistory = async () => {
        if (!currentUser) return;
        if (!window.confirm(language === 'tr' ? "Analiz geçmişinizi temizlemek istediğinizden emin misiniz?" : "Are you sure you want to clear your analysis history?")) return;
        
        try {
            const analysesRef = collection(db, 'users', currentUser.uid, 'ai', 'data', 'analyses');
            const q = query(analysesRef);
            const querySnapshot = await getDocs(q);
            
            const batch = writeBatch(db);
            querySnapshot.forEach((doc) => {
                batch.update(doc.ref, { archived: true });
            });
            await batch.commit();
            
            setHistory([]);
            setAnalysisResult(null);
            setActiveProduct(null);
        } catch (error) {
            console.error("Failed to clear history", error);
        }
    };

    const handleExportPDF = () => {
        window.print();
    };

    const selectFromHistory = (item) => {
        setAnalysisResult(item.analysis);
        setActiveProduct(item.purchaseData);
        setActiveScenario('buyToday');
    };

    const freeBudget = metrics?.freeBudget || 1000;
    const monthlySavings = Math.max(1, freeBudget * 0.20);
    const riskProfile = profileData?.preferences?.riskProfile || 'Balanced';
    const goals = profileData?.goals || {};

    // 1. Necessity Score Refactored
    const calculatedNecessity = activeProduct 
        ? calculateNecessityScore(activeProduct.category, activeProduct.price, freeBudget, goals, riskProfile)
        : 5;

    // 3 & 4. Scenario calculations
    const getScenarioValues = (scenario) => {
        if (!analysisResult || !activeProduct) return {};
        
        const price = activeProduct.price;
        const baseConfidence = analysisResult.confidenceScore || 70;
        let monthlyCost = price;
        let compatibility = baseConfidence;
        let delayMonths = Math.ceil(price / monthlySavings);
        let verdict = language === 'tr' ? 'Bekle' : 'Wait';

        if (scenario === 'wait3Months') {
            monthlyCost = price / 3;
            compatibility = Math.min(100, baseConfidence + 12);
            delayMonths = Math.max(0, Math.ceil(price / monthlySavings) - 3);
            verdict = compatibility >= 80 ? (language === 'tr' ? 'Satın Al' : 'Buy') : (compatibility >= 60 ? (language === 'tr' ? 'Değerlendir' : 'Consider') : (language === 'tr' ? 'Bekle' : 'Wait'));
        } else if (scenario === 'finance12Months') {
            monthlyCost = price / 12;
            compatibility = Math.max(0, baseConfidence - 10);
            delayMonths = Math.ceil((price * 1.1) / monthlySavings); // Includes interest multiplier
            verdict = compatibility >= 70 ? (language === 'tr' ? 'Satın Al' : 'Buy') : (compatibility >= 50 ? (language === 'tr' ? 'Değerlendir' : 'Consider') : (language === 'tr' ? 'Bekle' : 'Wait'));
        } else if (scenario === 'alternativeProduct') {
            const altPrice = price * 0.6;
            monthlyCost = altPrice;
            compatibility = Math.min(100, baseConfidence + 18);
            delayMonths = Math.ceil(altPrice / monthlySavings);
            verdict = compatibility >= 75 ? (language === 'tr' ? 'Satın Al' : 'Buy') : (language === 'tr' ? 'Değerlendir' : 'Consider');
        } else { // buyToday
            monthlyCost = price;
            compatibility = baseConfidence;
            delayMonths = Math.ceil(price / monthlySavings);
            verdict = baseConfidence >= 85 && calculatedNecessity >= 7 ? (language === 'tr' ? 'Satın Al' : 'Buy') 
                     : (baseConfidence >= 65 && calculatedNecessity >= 4 ? (language === 'tr' ? 'Değerlendir' : 'Consider') : (language === 'tr' ? 'Bekle' : 'Wait'));
        }

        return {
            monthlyCost,
            compatibility,
            delayMonths,
            verdict
        };
    };

    const activeScenarioData = activeProduct ? getScenarioValues(activeScenario) : {};

    // 5. Timeline sections
    const getRecoveryMonthName = (delay) => {
        const d = new Date();
        d.setMonth(d.getMonth() + delay);
        return d.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' });
    };

    const getGoalResumeMonthName = (delay) => {
        const d = new Date();
        d.setMonth(d.getMonth() + delay + 1);
        return d.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' });
    };

    // 6. AI Coach Section Refactored
    const getDeterministicCoachInsight = (product, necessity, budgetPressure, risk, lang) => {
        if (!product) return '';
        if (lang === 'tr') {
            if (necessity < 4) {
                return `Bu ${product.category} harcaması şu anki finansal durumunuz için düşük gerekliliğe sahip. Acil durum fonunuzu korumak için bu alımı 3 ay ertelemenizi öneririz.`;
            }
            if (budgetPressure > 30) {
                return `Fiyatı aylık boş bütçenize göre oldukça yüksek (%${budgetPressure.toFixed(0)}). Nakit akışınızı riske atmamak için alternatif modelleri değerlendirin.`;
            }
            return `Makul bir bütçe baskısı ile bu satın alım gerçekleştirilebilir görünüyor. Yine de plansız harcamalardan kaçınmak için 48 saat kuralını uygulayabilirsiniz.`;
        } else {
            if (necessity < 4) {
                return `This ${product.category} purchase has low necessity for your current financial situation. We recommend delaying it for 3 months to protect your emergency savings.`;
            }
            if (budgetPressure > 30) {
                return `The price is relatively high compared to your monthly free budget (${budgetPressure.toFixed(0)}%). To avoid risking your cash flow, consider alternatives.`;
            }
            return `This purchase seems manageable with reasonable budget pressure. However, you should still practice the 48-hour rule to prevent discretionary impulse buying.`;
        }
    };

    const coachInsightText = (analysisResult && analysisResult.source === 'gemini')
        ? analysisResult.aiCoachingInsight
        : getDeterministicCoachInsight(activeProduct, calculatedNecessity, activeProduct ? (activeScenarioData.monthlyCost / Math.max(1, freeBudget)) * 100 : 0, riskProfile, language);

    const getRecommendationTranslation = (recommendation) => {
        if (!recommendation) return '';
        const rec = recommendation.toLowerCase().trim();
        if (rec === 'buy' || rec === 'satın al') return language === 'tr' ? 'Satın Al' : 'Buy';
        if (rec === 'consider' || rec === 'değerlendir') return language === 'tr' ? 'Değerlendir' : 'Consider';
        if (rec === 'wait' || rec === 'bekle') return language === 'tr' ? 'Bekle' : 'Wait';
        if (rec === 'avoid' || rec === 'kaçın') return language === 'tr' ? 'Kaçın' : 'Avoid';
        return recommendation;
    };

    if (contextLoading || loadingHistory) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center min-h-[500px]">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="p-6 md:p-8 max-w-[1600px] mx-auto w-full space-y-8 print:p-0 print:bg-white print:text-black">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-6 print:border-black">
                <div>
                    <h1 className="font-headline-lg text-display-sm text-on-surface font-bold tracking-tight print:text-black">
                        {t('aiModal.analysisCenter')}
                    </h1>
                    <p className="font-body-md text-on-surface-variant mt-1 print:text-black/70">
                        {t('aiModal.analysisSubtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-3 print:hidden">
                    <button 
                        onClick={handleExportPDF}
                        disabled={!analysisResult}
                        className="px-4 py-2.5 rounded-lg border border-outline-variant/50 hover:bg-surface-container bg-surface-container-low text-on-surface font-label-md transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                        {t('aiModal.exportPDF')}
                    </button>
                    <button 
                        onClick={clearAllHistory}
                        disabled={history.length === 0}
                        className="px-4 py-2.5 rounded-lg border border-error/30 hover:bg-error/10 text-error font-label-md transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                        {t('aiModal.clearHistory')}
                    </button>
                </div>
            </div>

            {/* Demo Mode Alert Banner */}
            {analysisResult?.source === 'demo' && (
                <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary flex items-center gap-3 print:hidden">
                    <span className="material-symbols-outlined">info</span>
                    <p className="font-body-sm font-medium">{t('aiModal.demoAlert')}</p>
                </div>
            )}

            {/* Interactive Grid Area */}
            {analysisResult && activeProduct ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT PANEL: DECISION */}
                        <div className="lg:col-span-4 space-y-6">
                            <h3 className="font-label-md uppercase tracking-wider text-on-surface-variant font-semibold">{t('aiModal.purchaseDecision')}</h3>
                            
                            {/* Circular Score */}
                            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 flex flex-col items-center shadow-lg relative overflow-hidden print:border-black print:shadow-none">
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-3xl opacity-20 rounded-full print:hidden ${
                                    activeScenarioData.verdict === 'Buy' || activeScenarioData.verdict === 'Satın Al' ? 'bg-primary' : 
                                    activeScenarioData.verdict === 'Avoid' || activeScenarioData.verdict === 'Kaçın' ? 'bg-error' : 'bg-secondary'
                                }`}></div>
                                
                                <div className="relative w-40 h-40 flex flex-col items-center justify-center z-10">
                                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                        <circle cx="80" cy="80" r="70" className="stroke-surface-variant print:stroke-black/10" strokeWidth="8" fill="none" />
                                        <circle cx="80" cy="80" r="70" className={`stroke-current ${
                                            activeScenarioData.verdict === 'Buy' || activeScenarioData.verdict === 'Satın Al' ? 'text-primary' : 
                                            activeScenarioData.verdict === 'Avoid' || activeScenarioData.verdict === 'Kaçın' ? 'text-error' : 'text-secondary'
                                        } print:stroke-black`} strokeWidth="8" fill="none" strokeDasharray={`${(activeScenarioData.compatibility / 100) * 440} 440`} strokeLinecap="round" />
                                    </svg>
                                    <span className="font-display-md font-bold text-on-surface print:text-black">{activeScenarioData.compatibility}%</span>
                                    <span className="font-label-sm text-on-surface-variant uppercase print:text-black/70 flex items-center gap-1">
                                        {t('aiModal.compatibility')}
                                        <span className="group relative inline-block">
                                            <span className="material-symbols-outlined text-xs cursor-pointer text-on-surface-variant align-middle print:hidden">info</span>
                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-surface-container-high text-[10px] text-on-surface rounded shadow-md z-30 normal-case font-normal print:hidden">
                                                {t('aiModal.tooltipConfidence')}
                                            </span>
                                        </span>
                                    </span>
                                </div>
                                
                                <div className={`mt-6 py-2 px-6 rounded-full border border-current font-headline-sm font-bold tracking-wide uppercase shadow-[0_0_15px_currentColor] opacity-90 print:shadow-none print:border-black print:text-black ${
                                    activeScenarioData.verdict === 'Buy' || activeScenarioData.verdict === 'Satın Al' ? 'text-primary bg-primary/10' : 
                                    activeScenarioData.verdict === 'Avoid' || activeScenarioData.verdict === 'Kaçın' ? 'text-error bg-error/10' : 'text-secondary bg-secondary/10'
                                }`}>
                                    {getRecommendationTranslation(activeScenarioData.verdict)}
                                </div>
                                
                                <div className="mt-4 text-center">
                                    <h4 className="font-headline-sm text-on-surface font-semibold print:text-black">{activeProduct.name}</h4>
                                    <p className="font-label-sm text-on-surface-variant print:text-black/70">{formatCurrencyLocal(activeProduct.price, activeProduct.currency)}</p>
                                </div>
                            </div>
                            
                            {/* Necessity & Budget Pressure Progress Bars */}
                            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 shadow-lg space-y-4 print:border-black print:shadow-none">
                                <div>
                                    <div className="flex justify-between font-label-sm mb-1 print:text-black">
                                        <span className="text-on-surface print:text-black flex items-center gap-1">
                                            {t('aiModal.necessityScore')}
                                            <span className="group relative inline-block">
                                                <span className="material-symbols-outlined text-xs cursor-pointer text-on-surface-variant align-middle print:hidden">info</span>
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-surface-container-high text-[10px] text-on-surface rounded shadow-md z-30 normal-case font-normal print:hidden">
                                                    {t('aiModal.tooltipNecessity')}
                                                </span>
                                            </span>
                                        </span>
                                        <span className="text-on-surface-variant print:text-black/70">{calculatedNecessity}/10</span>
                                    </div>
                                    <div className="h-2 w-full bg-surface-variant print:bg-black/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary print:bg-black" style={{ width: `${(calculatedNecessity / 10) * 100}%` }}></div>
                                    </div>
                                    <p className="text-[10px] text-on-surface-variant mt-1.5 italic print:text-black/50 leading-tight">
                                        {t('aiModal.buSkorDetay')}
                                    </p>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between font-label-sm mb-1 print:text-black">
                                        <span className="text-on-surface print:text-black flex items-center gap-1">
                                            {t('aiModal.budgetPressure')}
                                            <span className="group relative inline-block">
                                                <span className="material-symbols-outlined text-xs cursor-pointer text-on-surface-variant align-middle print:hidden">info</span>
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-surface-container-high text-[10px] text-on-surface rounded shadow-md z-30 normal-case font-normal print:hidden">
                                                    {t('aiModal.tooltipBudgetPressure')}
                                                </span>
                                            </span>
                                        </span>
                                        <span className="text-on-surface-variant print:text-black/70">{((activeScenarioData.monthlyCost) / Math.max(1, freeBudget) * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-surface-variant print:bg-black/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-error print:bg-black" style={{ width: `${Math.min(100, (activeScenarioData.monthlyCost) / Math.max(1, freeBudget) * 100)}%` }}></div>
                                    </div>
                                    <p className="text-[10px] text-on-surface-variant mt-1 italic print:text-black/50">{t('aiModal.estimatedText')} ({language === 'tr' ? 'Aylık Maliyet / Serbest Bütçe' : 'Monthly Cost / Free Budget'})</p>
                                </div>

                                <div>
                                    <div className="flex justify-between font-label-sm mb-1 print:text-black">
                                        <span className="text-on-surface print:text-black">{t('aiModal.risk')}</span>
                                        <span className="text-on-surface-variant print:text-black/70 capitalize">{language === 'tr' && riskProfile === 'Balanced' ? 'Dengeli' : (language === 'tr' && riskProfile === 'Conservative' ? 'Muhafazakar' : (language === 'tr' && riskProfile === 'Aggressive' ? 'Agresif' : riskProfile))}</span>
                                    </div>
                                    <div className="h-2 w-full bg-surface-variant print:bg-black/10 rounded-full overflow-hidden flex">
                                        <div className={`h-full ${riskProfile.toLowerCase() === 'conservative' ? 'w-1/3 bg-primary print:bg-black' : riskProfile.toLowerCase() === 'aggressive' ? 'w-full bg-error print:bg-black' : 'w-2/3 bg-secondary print:bg-black'}`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* CENTER PANEL: FINANCIAL IMPACT */}
                        <div className="lg:col-span-4 space-y-6">
                            <h3 className="font-label-md uppercase tracking-wider text-on-surface-variant font-semibold">{t('aiModal.financialImpact')}</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 shadow-sm flex flex-col justify-center min-h-[100px] print:border-black">
                                    <p className="font-label-sm text-on-surface-variant mb-1 print:text-black/70">
                                        {t('aiModal.monthlyEquivalent')} 
                                        <span className="text-[8px] bg-surface-variant print:bg-black/10 px-1 rounded ml-1 print:text-black">{t('aiModal.estimatedText')}</span>
                                    </p>
                                    <p className="font-headline-sm text-primary print:text-black font-bold">
                                        {formatCurrencyLocal(activeScenarioData.monthlyCost, activeProduct.currency)}
                                    </p>
                                </div>
                                <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 shadow-sm flex flex-col justify-center min-h-[100px] print:border-black">
                                    <p className="font-label-sm text-on-surface-variant mb-1 print:text-black/70">
                                        {t('aiModal.savingsImpact')} 
                                        <span className="text-[8px] bg-surface-variant print:bg-black/10 px-1 rounded ml-1 print:text-black">{t('aiModal.estimatedText')}</span>
                                    </p>
                                    <p className="font-headline-sm text-on-surface print:text-black font-bold">
                                        {((activeScenarioData.monthlyCost / freeBudget) * 100).toFixed(1)}%
                                    </p>
                                </div>
                                <div className="col-span-2 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 shadow-sm min-h-[90px] print:border-black">
                                    <p className="font-label-sm text-on-surface-variant mb-1 print:text-black/70">{t('aiModal.cashFlowPressure')}</p>
                                    <p className="font-label-md text-on-surface print:text-black line-clamp-2">
                                        {language === 'tr' 
                                            ? `Bu alım serbest nakit akışınızın %${((activeScenarioData.monthlyCost / freeBudget) * 100).toFixed(0)} kadarını meşgul edecektir.`
                                            : `This purchase will occupy ${((activeScenarioData.monthlyCost / freeBudget) * 100).toFixed(0)}% of your free monthly cash flow.`}
                                    </p>
                                </div>
                                <div className="col-span-2 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 shadow-sm min-h-[90px] print:border-black">
                                    <p className="font-label-sm text-on-surface-variant mb-1 print:text-black/70">{t('aiModal.goalDelayOppCost')}</p>
                                    <p className="font-label-md text-on-surface print:text-black line-clamp-2">
                                        {activeScenarioData.delayMonths > 0 
                                            ? (language === 'tr' 
                                                ? `Bütçenizin toparlanması ve birikim hedeflerine dönmeniz ${activeScenarioData.delayMonths} ay sürecektir.`
                                                : `It will take ${activeScenarioData.delayMonths} months to recover your budget and resume saving goals.`)
                                            : (language === 'tr' ? 'Finansal hedefler üzerinde gecikme etkisi bulunmuyor.' : 'No delay impact on financial goals.')}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Timeline Visualization */}
                            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 shadow-sm print:border-black">
                                <h4 className="font-label-md text-on-surface mb-4 flex items-center gap-2 print:text-black">
                                    <span className="material-symbols-outlined text-[18px] print:hidden">timeline</span>
                                    {t('aiModal.timeline')}
                                </h4>
                                <div className="relative border-l-2 border-outline-variant/30 print:border-black/20 ml-3 space-y-6">
                                    <div className="relative">
                                        <div className="absolute -left-[21px] w-10 h-10 bg-surface-container-lowest border border-outline-variant/50 rounded-full flex items-center justify-center print:border-black print:bg-white">
                                            <div className="w-4 h-4 bg-primary print:bg-black rounded-full"></div>
                                        </div>
                                        <div className="pl-6 pt-2">
                                            <p className="font-label-md text-on-surface print:text-black">{t('aiModal.today')}</p>
                                            <p className="text-xs text-on-surface-variant mt-1 print:text-black/70">
                                                {language === 'tr' ? 'Satın Alma Kararı' : 'Purchase Decision'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <div className="absolute -left-[11px] w-5 h-5 bg-surface-variant print:bg-white print:border-black rounded-full border border-outline-variant/50"></div>
                                        <div className="pl-6">
                                            <p className="font-label-md text-on-surface print:text-black">{t('aiModal.recoveryMonth')}</p>
                                            <p className="text-xs text-error print:text-black/70 mt-0.5">
                                                {getRecoveryMonthName(activeScenarioData.delayMonths)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute -left-[11px] w-5 h-5 bg-surface-variant print:bg-white print:border-black rounded-full border border-outline-variant/50"></div>
                                        <div className="pl-6">
                                            <p className="font-label-md text-on-surface print:text-black">{t('aiModal.goalResume')}</p>
                                            <p className="text-xs text-on-surface-variant print:text-black/70 mt-0.5">
                                                {getGoalResumeMonthName(activeScenarioData.delayMonths)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* RIGHT PANEL: SCENARIO LAB */}
                        <div className="lg:col-span-4 space-y-6">
                            <h3 className="font-label-md uppercase tracking-wider text-on-surface-variant font-semibold">{t('aiModal.scenarioLab')}</h3>
                            
                            <div className="grid grid-cols-2 gap-2 mb-4 print:hidden">
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

                            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 shadow-lg relative overflow-hidden print:border-black print:shadow-none">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full print:hidden"></div>
                                <h4 className="font-headline-sm text-on-surface mb-6 border-b border-outline-variant/30 pb-3 print:text-black print:border-black">
                                    {t('aiModal.' + activeScenario)} 
                                    <span className="text-[10px] uppercase bg-surface-variant print:bg-black/10 text-on-surface-variant print:text-black px-1.5 py-0.5 rounded ml-2 align-middle">{t('aiModal.estimatedText')}</span>
                                </h4>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-white/5 print:border-black/5">
                                        <span className="text-on-surface-variant font-label-sm print:text-black/70">{t('aiModal.compatibility')}</span>
                                        <span className="font-headline-sm text-on-surface print:text-black">{activeScenarioData.compatibility}%</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-white/5 print:border-black/5">
                                        <span className="text-on-surface-variant font-label-sm print:text-black/70">{t('aiModal.cost')} / mo</span>
                                        <span className="font-headline-sm text-primary print:text-black">
                                            {formatCurrencyLocal(activeScenarioData.monthlyCost, activeProduct.currency)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-white/5 print:border-black/5">
                                        <span className="text-on-surface-variant font-label-sm print:text-black/70">{t('aiModal.goalDelayOppCost')}</span>
                                        <span className="font-label-md text-on-surface print:text-black text-right max-w-[60%]">
                                            {activeScenarioData.delayMonths > 0 
                                                ? (language === 'tr' ? `+${activeScenarioData.delayMonths} Ay` : `+${activeScenarioData.delayMonths} Months`) 
                                                : (language === 'tr' ? 'Yok' : 'None')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-on-surface-variant font-label-sm print:text-black/70">{t('aiModal.verdict')}</span>
                                        <span className={`px-3 py-1 rounded font-bold text-xs uppercase border print:border-black print:text-black ${
                                            activeScenarioData.verdict === 'Buy' || activeScenarioData.verdict === 'Satın Al' ? 'bg-primary/10 text-primary border-primary/30' :
                                            activeScenarioData.verdict === 'Avoid' || activeScenarioData.verdict === 'Kaçın' ? 'bg-error/10 text-error border-error/30' :
                                            'bg-secondary/10 text-secondary border-secondary/30'
                                        }`}>{getRecommendationTranslation(activeScenarioData.verdict)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM SECTION: Insights & History */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-outline-variant/30 pt-8 print:border-black">
                        {/* AI Coach & Smart Alternative */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-primary-container/10 border border-primary/30 rounded-2xl p-5 shadow-lg relative overflow-hidden max-h-[220px] overflow-y-auto print:border-black">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary print:bg-black"></div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-primary text-[20px] print:hidden">psychology</span>
                                    <h4 className="font-label-lg text-primary font-bold print:text-black">{t('aiModal.aiCoachingInsight')}</h4>
                                </div>
                                <p className="font-body-md text-on-surface leading-relaxed print:text-black">
                                    "{coachInsightText}"
                                </p>
                            </div>

                            <div className="bg-surface-container-low border border-tertiary/30 rounded-2xl p-5 shadow-lg max-h-[150px] overflow-y-auto print:border-black">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-tertiary text-[20px] print:hidden">lightbulb</span>
                                    <h4 className="font-label-lg text-tertiary font-bold print:text-black">{t('aiModal.smartAlternative')}</h4>
                                </div>
                                <p className="font-body-sm text-on-surface-variant print:text-black/70 leading-relaxed">
                                    {analysisResult?.smartAlternative}
                                </p>
                            </div>
                        </div>

                        {/* RUN NEW ANALYSIS OR VIEW HISTORY */}
                        <div className="lg:col-span-4 space-y-6 print:hidden">
                            <h3 className="font-label-md uppercase tracking-wider text-on-surface-variant font-semibold">{t('aiModal.selectProductToAnalyze')}</h3>
                            
                            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 shadow-lg space-y-4">
                                <div className="flex gap-2">
                                    <select 
                                        value={selectedProductToAnalyze.id}
                                        onChange={(e) => {
                                            const prod = mockProducts.find(p => p.id === parseInt(e.target.value));
                                            if (prod) setSelectedProductToAnalyze(prod);
                                        }}
                                        className="flex-1 bg-surface-container border border-outline-variant/50 rounded-xl p-3 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary font-label-md"
                                    >
                                        {mockProducts.map(prod => (
                                            <option key={prod.id} value={prod.id}>{prod.name} ({formatCurrencyLocal(prod.price, prod.currency)})</option>
                                        ))}
                                    </select>
                                </div>
                                <button 
                                    onClick={handleRunAnalysis}
                                    disabled={isAnalyzing}
                                    className="w-full py-3 bg-primary text-white rounded-xl font-label-md hover:bg-primary-container transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined animate-spin text-[18px]" style={{ display: isAnalyzing ? 'inline-block' : 'none' }}>sync</span>
                                    <span className="material-symbols-outlined text-[18px]" style={{ display: isAnalyzing ? 'none' : 'inline-block' }}>auto_awesome</span>
                                    {t('aiModal.runAnalysis')}
                                </button>
                            </div>

                            {/* HISTORY LIST */}
                            <div className="space-y-3">
                                <h4 className="font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">{t('aiModal.recentHistory')}</h4>
                                <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                                    {history.map(item => (
                                        <div 
                                            key={item.id}
                                            onClick={() => selectFromHistory(item)}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                                                activeProduct.name === item.purchaseData.name && analysisResult?.confidenceScore === item.analysis.confidenceScore
                                                ? 'bg-primary/10 border-primary' 
                                                : 'bg-surface-container-low border-outline-variant/30 hover:border-outline-variant'
                                            }`}
                                        >
                                            <div>
                                                <p className="font-label-md text-on-surface truncate max-w-[140px]">{item.purchaseData.name}</p>
                                                <p className="text-[10px] text-on-surface-variant">
                                                    {new Date(item.createdAt?.seconds * 1000).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-label-sm text-primary">{formatCurrencyLocal(item.purchaseData.price, item.purchaseData.currency)}</p>
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                                    item.analysis.recommendation === 'Buy' || item.analysis.recommendation === 'Satın Al' ? 'bg-primary/20 text-primary' :
                                                    item.analysis.recommendation === 'Avoid' || item.analysis.recommendation === 'Kaçın' ? 'bg-error/20 text-error' :
                                                    'bg-secondary/20 text-secondary'
                                                }`}>{getRecommendationTranslation(item.analysis.recommendation)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* EMPTY STATE & Frictionless launcher */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-6 shadow-lg min-h-[450px]">
                        <span className="material-symbols-outlined text-[64px] text-primary/80 animate-pulse">analytics</span>
                        <h2 className="font-headline-lg font-bold text-on-surface">
                            {t('aiModal.emptyStateTitle')}
                        </h2>
                        <p className="font-body-md text-on-surface-variant max-w-lg mx-auto leading-relaxed">
                            {t('aiModal.emptyStateDesc')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <Link 
                                to="/explorer" 
                                className="px-6 py-3.5 bg-primary text-white font-label-md rounded-xl hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">explore</span>
                                {t('aiModal.kesfetCTA')}
                            </Link>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <h3 className="font-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
                            {t('aiModal.quickLauncherTitle')}
                        </h3>
                        
                        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 shadow-lg space-y-4">
                            <div className="flex gap-2">
                                <select 
                                    value={selectedProductToAnalyze.id}
                                    onChange={(e) => {
                                        const prod = mockProducts.find(p => p.id === parseInt(e.target.value));
                                        if (prod) setSelectedProductToAnalyze(prod);
                                    }}
                                    className="flex-1 bg-surface-container border border-outline-variant/50 rounded-xl p-3 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary font-label-md"
                                >
                                    {mockProducts.map(prod => (
                                        <option key={prod.id} value={prod.id}>{prod.name} ({formatCurrencyLocal(prod.price, prod.currency)})</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                onClick={handleRunAnalysis}
                                disabled={isAnalyzing}
                                className="w-full py-3 bg-primary text-white rounded-xl font-label-md hover:bg-primary-container transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined animate-spin text-[18px]" style={{ display: isAnalyzing ? 'inline-block' : 'none' }}>sync</span>
                                <span className="material-symbols-outlined text-[18px]" style={{ display: isAnalyzing ? 'none' : 'inline-block' }}>auto_awesome</span>
                                {t('aiModal.runAnalysis')}
                            </button>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">{t('aiModal.recentHistory')}</h4>
                            <div className="p-6 rounded-xl border border-dashed border-outline-variant/50 text-center space-y-3 bg-surface-container-low">
                                <span className="material-symbols-outlined text-on-surface-variant text-[32px]">history</span>
                                <p className="text-xs text-on-surface-variant leading-normal">
                                    {t('aiModal.noHistory')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
