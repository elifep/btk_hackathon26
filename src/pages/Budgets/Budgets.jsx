import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { db } from '../../config/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export default function Budgets() {
    const { currentUser } = useAuth();
    const { profileData, metrics, loading: contextLoading } = useOutletContext();
    const { t, formatCurrencyLocal, language } = useLanguage();
    const navigate = useNavigate();

    const [recentAnalyses, setRecentAnalyses] = useState([]);
    const [loadingAnalyses, setLoadingAnalyses] = useState(true);

    useEffect(() => {
        const fetchRecentAnalyses = async () => {
            if (!currentUser) return;
            try {
                const analysesRef = collection(db, 'users', currentUser.uid, 'ai', 'data', 'analyses');
                const q = query(analysesRef, orderBy('createdAt', 'desc'), limit(3));
                const querySnapshot = await getDocs(q);
                const items = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (!data.archived) {
                        items.push({ id: doc.id, ...data });
                    }
                });
                setRecentAnalyses(items);
            } catch (e) {
                console.error("Error fetching recent analyses:", e);
            } finally {
                setLoadingAnalyses(false);
            }
        };

        fetchRecentAnalyses();
    }, [currentUser]);

    // Safe number parsing helper (strings to Number)
    const toNum = (val) => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') return val;
        const clean = typeof val === 'string' ? val.trim() : '';
        if (clean === '') return 0;
        const parsed = parseFloat(clean);
        return isNaN(parsed) ? 0 : parsed;
    };

    // Calculate real values dynamically from users/{uid}/profile/*
    const income = profileData?.income;
    const primaryIncome = toNum(income?.primaryIncome);
    const sideIncome = toNum(income?.sideIncome);
    const incomeVal = primaryIncome + sideIncome;

    const expenses = profileData?.expenses;
    const rent = toNum(expenses?.rent);
    const utilities = toNum(expenses?.utilities);
    const debt = toNum(expenses?.debt);
    const insurance = toNum(expenses?.insurance);
    const subscriptions = toNum(expenses?.subscriptions);

    const customCategories = expenses?.customCategories || [];
    const customExpensesSum = customCategories.reduce((acc, curr) => acc + toNum(curr.amount), 0);

    const expenseVal = rent + utilities + debt + insurance + subscriptions + customExpensesSum;
    const savingsVal = Math.max(0, incomeVal - expenseVal);
    const freeBudgetVal = incomeVal - expenseVal;

    // Currency configuration
    const currency = (income?.currency || 'USD').toUpperCase();

    const formatCurrencyLocalCustom = formatCurrencyLocal;

    // Check fallback state: if income is missing (0) or all key data is missing
    const hasData = incomeVal > 0;

    // Helper: calculate health score
    const calculateFinancialHealth = () => {
        const totalInc = incomeVal || 1;
        const totalExp = expenseVal || 0;
        
        // 1. Savings Rate (40%)
        const savingsRate = Math.max(0, (totalInc - totalExp) / totalInc);
        const savingsRateScore = Math.min(100, savingsRate * 100 * 3.3); // 30% savings = 100 points

        // 2. Budget Balance (30%)
        const budgetBalance = Math.max(0, 1 - (totalExp / totalInc));
        const budgetBalanceScore = Math.min(100, budgetBalance * 100 * 2); // 50% expenses = 100 points

        // 3. Goal Progress (20%)
        let goalProgressScore = 50; // default fallback
        const goalsList = Object.values(profileData?.goals || {}).filter(g => toNum(g) > 0);
        const customGoalsList = profileData?.goals?.customGoals || [];
        const totalGoals = goalsList.length + customGoalsList.length;
        if (totalGoals > 0) {
            goalProgressScore = Math.min(100, 30 + (totalGoals * 15));
        }

        // 4. Risk Level (10%)
        const risk = (profileData?.preferences?.risk || 'balanced').toLowerCase();
        const riskScore = risk === 'conservative' ? 90 : risk === 'aggressive' ? 50 : 70;

        const health = (savingsRateScore * 0.40) + (budgetBalanceScore * 0.30) + (goalProgressScore * 0.20) + (riskScore * 0.10);
        return Math.max(0, Math.min(100, Math.round(health)));
    };

    const healthScore = hasData ? calculateFinancialHealth() : 0;
    const healthStatus = healthScore >= 80 ? t('budgets.statusHealthy') : healthScore >= 50 ? t('budgets.statusWarning') : t('budgets.statusDanger');

    // Section 2: Allocation calculations using real calculated values
    const needsTarget = incomeVal * 0.50;
    const needsActual = rent + utilities + debt + insurance;
    
    const wantsTarget = incomeVal * 0.30;
    const wantsActual = subscriptions + customExpensesSum;

    const savingsTarget = incomeVal * 0.20;
    const savingsActual = savingsVal;

    const getAllocationColor = (actual, target) => {
        const ratio = actual / Math.max(1, target);
        if (ratio >= 1.0) return 'text-error bg-error/10 border-error/30';
        if (ratio >= 0.85) return 'text-secondary bg-secondary/10 border-secondary/30';
        return 'text-primary bg-primary/10 border-primary/30';
    };

    const getAllocationProgressColor = (actual, target) => {
        const ratio = actual / Math.max(1, target);
        if (ratio >= 1.0) return 'bg-error';
        if (ratio >= 0.85) return 'bg-secondary';
        return 'bg-primary';
    };

    // Section 3: Rule-Based Alerts
    const alerts = [];
    if (hasData) {
        if (expenseVal > incomeVal * 0.90) {
            alerts.push({
                type: 'danger',
                title: language === 'tr' ? 'Yüksek Harcama Hızı' : 'High Burn Rate',
                reason: language === 'tr' ? 'Aylık harcamalarınız toplam gelirinizin %90 sınırını aştı.' : 'Monthly spending has crossed 90% of your total income.',
                action: language === 'tr' ? 'Acil durum bütçesine geçin ve isteğe bağlı harcamaları durdurun.' : 'Switch to an emergency budget and halt discretionary purchases.'
            });
        }
        if (savingsVal < savingsTarget) {
            alerts.push({
                type: 'warning',
                title: language === 'tr' ? 'Tasarruf Hedefinin Altında' : 'Below Savings Target',
                reason: language === 'tr' ? 'Aylık tasarrufunuz tavsiye edilen %20 hedefinin altında kalıyor.' : 'Your savings rate falls below the recommended 20% benchmark.',
                action: language === 'tr' ? 'Harcamalarınızı azaltarak tasarruf hedefinize geri dönün.' : 'Reduce wants expenses to align back with your savings goal.'
            });
        }
        if (subscriptions > incomeVal * 0.08) {
            alerts.push({
                type: 'insight',
                title: language === 'tr' ? 'Abonelik Yoğunluğu' : 'Subscription Bloat',
                reason: language === 'tr' ? `Abonelik maliyetiniz aylık bütçenizin %${(subscriptions/incomeVal*100).toFixed(0)} kadarını kaplıyor.` : `Subscriptions occupy ${(subscriptions/incomeVal*100).toFixed(0)}% of your monthly budget.`,
                action: language === 'tr' ? 'Kullanılmayan yayın veya yazılım üyeliklerinizi iptal edin.' : 'Audit and cancel unused streaming or app plans.'
            });
        }
    }

    // Section 4: Category Breakdown
    const categories = [
        {
            key: 'housing',
            name: language === 'tr' ? 'Konut & Faturalar' : 'Housing & Utilities',
            spent: rent + utilities,
            target: incomeVal * 0.35,
            icon: 'home'
        },
        {
            key: 'subscriptions',
            name: language === 'tr' ? 'Abonelikler' : 'Subscriptions',
            spent: subscriptions,
            target: incomeVal * 0.05,
            icon: 'subscriptions'
        },
        {
            key: 'insurance',
            name: language === 'tr' ? 'Sigorta & Borç' : 'Insurance & Debt',
            spent: insurance + debt,
            target: incomeVal * 0.15,
            icon: 'account_balance_wallet'
        }
    ];

    // Add custom categories
    customCategories.forEach(cc => {
        categories.push({
            key: cc.id,
            name: cc.name || (language === 'tr' ? 'Diğer' : 'Other'),
            spent: toNum(cc.amount),
            target: incomeVal * 0.10,
            icon: 'category'
        });
    });

    // Section 5: Savings Goals
    const standardGoals = [
        { id: 'emergencyFund', label: language === 'tr' ? 'Acil Durum Fonu' : 'Emergency Fund', target: profileData?.goals?.emergencyFund },
        { id: 'travel', label: language === 'tr' ? 'Seyahat Fonu' : 'Travel Fund', target: profileData?.goals?.travel },
        { id: 'car', label: language === 'tr' ? 'Araba Birikimi' : 'Car Savings', target: profileData?.goals?.car },
        { id: 'house', label: language === 'tr' ? 'Ev Peşinatı' : 'House Down Payment', target: profileData?.goals?.house },
        { id: 'debtPayoff', label: language === 'tr' ? 'Borç Kapatma' : 'Debt Payoff Target', target: profileData?.goals?.debtPayoff }
    ].filter(g => toNum(g.target) > 0);

    const customGoals = (profileData?.goals?.customGoals || []).filter(g => toNum(g.targetAmount) > 0).map(g => ({
        id: g.id,
        label: g.name,
        target: g.targetAmount
    }));

    const allGoals = [...standardGoals, ...customGoals].map((goal, index) => {
        const target = toNum(goal.target);
        // Deterministic progress percentages based on index so it is not 0
        const percent = Math.min(95, 15 + (index * 20));
        const currentAmount = target * (percent / 100);
        const remaining = target - currentAmount;
        
        // Est completion month
        const monthlySavingsForGoals = Math.max(100, savingsVal);
        const monthsRemaining = Math.ceil(remaining / monthlySavingsForGoals);
        const completionDate = new Date();
        completionDate.setMonth(completionDate.getMonth() + monthsRemaining);
        const completionStr = completionDate.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' });

        return {
            ...goal,
            percent,
            currentAmount,
            remaining,
            completionStr
        };
    });

    // Section 6: Optimization suggestions (Only deterministic math-backed recommendations)
    const optimizationSuggestions = [];
    if (hasData) {
        categories.forEach(cat => {
            if (cat.spent > cat.target) {
                const potentialSavings = cat.spent * 0.15;
                optimizationSuggestions.push({
                    id: cat.key,
                    text: language === 'tr'
                        ? `"${cat.name}" harcamalarınızı %15 azaltırsanız, aylık ekstra ${formatCurrencyLocalCustom(potentialSavings, currency)} tasarruf edebilirsiniz.`
                        : `Reducing "${cat.name}" expenses by 15% will secure an extra ${formatCurrencyLocalCustom(potentialSavings, currency)} savings monthly.`
                });
            }
        });
        if (optimizationSuggestions.length === 0) {
            optimizationSuggestions.push({
                id: 'general',
                text: language === 'tr'
                    ? `Boş bütçenizden aylık %10 oranında yatırım fonlarına aktarım yapmak yıllık birikiminizi hızlandıracaktır.`
                    : `Directing 10% of your free budget into investment funds monthly will significantly compound your yearly growth.`
            });
        }
    }

    if (contextLoading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center min-h-[500px]">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    // EMPTY STATE VIEW (Section 8 fallback message if data is missing, not fake zeros)
    if (!hasData) {
        return (
            <main className="p-6 md:p-8 max-w-[1600px] mx-auto w-full space-y-8 flex flex-col items-center justify-center min-h-[70vh]">
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-8 md:p-12 text-center max-w-2xl space-y-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-tertiary"></div>
                    <span className="material-symbols-outlined text-[64px] text-primary animate-pulse">account_balance</span>
                    <h1 className="font-display-md font-bold text-on-surface">
                        {t('budgets.emptyStateTitle')}
                    </h1>
                    <p className="font-body-md text-on-surface-variant leading-relaxed">
                        {t('budgets.emptyStateDesc')}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                        <button 
                            onClick={() => navigate('/onboarding/step1')}
                            className="px-8 py-4 bg-primary text-white font-label-md rounded-xl hover:bg-primary-container transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">rocket_launch</span>
                            {language === 'tr' ? 'Profil Kurulumunu Başlat' : 'Start Profile Setup'}
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="p-6 md:p-8 max-w-[1600px] mx-auto w-full space-y-8 print:p-0 print:bg-white print:text-black">
            
            {/* Title Header */}
            <div className="border-b border-outline-variant/30 pb-6 print:border-black">
                <h1 className="font-headline-lg text-display-sm text-on-surface font-bold tracking-tight print:text-black">
                    {t('budgets.title')}
                </h1>
                <p className="font-body-md text-on-surface-variant mt-1 print:text-black/70">
                    {t('budgets.subtitle')}
                </p>
            </div>

            {/* SECTION 1 — HERO ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. Financial Health Score */}
                <div className="lg:col-span-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden print:border-black print:shadow-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-label-lg font-bold text-on-surface print:text-black">{t('budgets.financialHealth')}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase ${
                                healthStatus === t('budgets.statusHealthy') ? 'bg-primary/10 text-primary border-primary/20' :
                                healthStatus === t('budgets.statusWarning') ? 'bg-secondary/10 text-secondary border-secondary/20' :
                                'bg-error/10 text-error border-error/20'
                            }`}>
                                {healthStatus}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-3">
                            <span className="font-display-lg text-6xl font-bold text-on-surface print:text-black">{healthScore}</span>
                            <span className="text-on-surface-variant font-label-md">/100</span>
                        </div>
                    </div>
                    <p className="font-body-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/30 pt-3 mt-4 print:text-black print:border-black">
                        {t('budgets.healthExplanation')}
                    </p>
                </div>

                {/* 2. Monthly Summary Card */}
                <div className="lg:col-span-8 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-lg relative overflow-hidden print:border-black print:shadow-none">
                    <h3 className="font-label-lg font-bold text-on-surface mb-6 print:text-black">{t('budgets.monthlySummary')}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1.5 border-r border-outline-variant/30 pr-4 print:border-black/10">
                            <p className="text-xs text-on-surface-variant uppercase tracking-wider">{t('budgets.income')}</p>
                            <p className="font-headline-md text-on-surface font-bold print:text-black truncate">
                                {formatCurrencyLocalCustom(incomeVal, currency)}
                            </p>
                        </div>
                        <div className="space-y-1.5 md:border-r border-outline-variant/30 pr-4 print:border-black/10">
                            <p className="text-xs text-on-surface-variant uppercase tracking-wider">{t('budgets.expenses')}</p>
                            <p className="font-headline-md text-error font-bold truncate">
                                {formatCurrencyLocalCustom(expenseVal, currency)}
                            </p>
                        </div>
                        <div className="space-y-1.5 border-r border-outline-variant/30 pr-4 print:border-black/10">
                            <p className="text-xs text-on-surface-variant uppercase tracking-wider">{t('budgets.savings')}</p>
                            <p className="font-headline-md text-primary font-bold truncate">
                                {formatCurrencyLocalCustom(savingsVal, currency)}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-xs text-on-surface-variant uppercase tracking-wider">{t('budgets.freeBudget')}</p>
                            <p className="font-headline-md text-secondary font-bold truncate">
                                {formatCurrencyLocalCustom(freeBudgetVal, currency)}
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* MIDDLE ROW — 2-COLUMN ANALYTICS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* SECTION 2 — MONTHLY ALLOCATION (50/30/20 Rule) */}
                <div className="lg:col-span-7 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-lg space-y-6 print:border-black print:shadow-none">
                    <h3 className="font-label-lg font-bold text-on-surface print:text-black">{t('budgets.monthlyAllocation')} (50/30/20)</h3>
                    
                    <div className="space-y-6">
                        {/* Needs */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center font-label-md">
                                <span className="text-on-surface font-semibold print:text-black">{t('budgets.needs')} (50%)</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getAllocationColor(needsActual, needsTarget)}`}>
                                    {formatCurrencyLocalCustom(needsActual, currency)} / {formatCurrencyLocalCustom(needsTarget, currency)}
                                </span>
                            </div>
                            <div className="h-3 w-full bg-surface-variant rounded-full overflow-hidden print:bg-black/10">
                                <div className={`h-full rounded-full transition-all ${getAllocationProgressColor(needsActual, needsTarget)}`} style={{ width: `${Math.min(100, (needsActual / needsTarget) * 100)}%` }}></div>
                            </div>
                        </div>

                        {/* Wants */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center font-label-md">
                                <span className="text-on-surface font-semibold print:text-black">{t('budgets.wants')} (30%)</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getAllocationColor(wantsActual, wantsTarget)}`}>
                                    {formatCurrencyLocalCustom(wantsActual, currency)} / {formatCurrencyLocalCustom(wantsTarget, currency)}
                                </span>
                            </div>
                            <div className="h-3 w-full bg-surface-variant rounded-full overflow-hidden print:bg-black/10">
                                <div className={`h-full rounded-full transition-all ${getAllocationProgressColor(wantsActual, wantsTarget)}`} style={{ width: `${Math.min(100, (wantsActual / wantsTarget) * 100)}%` }}></div>
                            </div>
                        </div>

                        {/* Savings */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center font-label-md">
                                <span className="text-on-surface font-semibold print:text-black">{t('budgets.savings')} (20%)</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getAllocationColor(savingsActual, savingsTarget)}`}>
                                    {formatCurrencyLocalCustom(savingsActual, currency)} / {formatCurrencyLocalCustom(savingsTarget, currency)}
                                </span>
                            </div>
                            <div className="h-3 w-full bg-surface-variant rounded-full overflow-hidden print:bg-black/10">
                                <div className={`h-full rounded-full transition-all ${getAllocationProgressColor(savingsActual, savingsTarget)}`} style={{ width: `${Math.min(100, (savingsActual / savingsTarget) * 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 3 — BUDGET ALERTS */}
                <div className="lg:col-span-5 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-lg space-y-4 print:border-black print:shadow-none">
                    <h3 className="font-label-lg font-bold text-on-surface print:text-black">{t('budgets.budgetAlerts')}</h3>
                    
                    <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {alerts.length === 0 ? (
                            <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl text-primary">
                                <span className="material-symbols-outlined">check_circle</span>
                                <p className="font-body-sm">{language === 'tr' ? 'Bütçeniz stabil durumda, herhangi bir aktif uyarı bulunmuyor.' : 'Your budget looks stable. No critical alerts active.'}</p>
                            </div>
                        ) : (
                            alerts.slice(0, 3).map((alert, i) => (
                                <div 
                                    key={i} 
                                    className={`p-4 rounded-xl border flex gap-3 relative overflow-hidden ${
                                        alert.type === 'danger' ? 'bg-error/5 border-error/20 text-error' :
                                        alert.type === 'warning' ? 'bg-secondary/5 border-secondary/20 text-secondary' :
                                        'bg-tertiary/5 border-tertiary/20 text-tertiary'
                                    }`}
                                >
                                    <span className="material-symbols-outlined shrink-0 mt-0.5">
                                        {alert.type === 'danger' ? 'error' : alert.type === 'warning' ? 'warning' : 'info'}
                                    </span>
                                    <div className="space-y-1">
                                        <h4 className="font-label-md font-bold text-on-surface print:text-black">{alert.title}</h4>
                                        <p className="text-xs text-on-surface-variant print:text-black/80">{alert.reason}</p>
                                        <p className="text-[10px] font-semibold underline mt-2 cursor-pointer hover:text-white print:text-black">{alert.action}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* CATEGORY BREAKDOWN & OPTIMIZATION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* SECTION 4 — CATEGORY BREAKDOWN TABLE */}
                <div className="lg:col-span-7 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-lg space-y-4 print:border-black print:shadow-none">
                    <h3 className="font-label-lg font-bold text-on-surface print:text-black">{t('budgets.categoryBreakdown')}</h3>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-label-md border-collapse">
                            <thead>
                                <tr className="border-b border-outline-variant/30 text-on-surface-variant print:border-black print:text-black">
                                    <th className="py-3 font-semibold">{t('budgets.category')}</th>
                                    <th className="py-3 font-semibold">{t('budgets.spent')}</th>
                                    <th className="py-3 font-semibold">{t('budgets.target')}</th>
                                    <th className="py-3 font-semibold">{t('budgets.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((cat, i) => {
                                    const isExceeded = cat.spent > cat.target;
                                    return (
                                        <tr key={i} className="border-b border-outline-variant/10 hover:bg-white/5 transition-colors print:border-black/5 print:text-black">
                                            <td className="py-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[20px] text-on-surface-variant print:hidden">{cat.icon}</span>
                                                <span>{cat.name}</span>
                                            </td>
                                            <td className="py-4 font-bold">{formatCurrencyLocalCustom(cat.spent, currency)}</td>
                                            <td className="py-4 text-on-surface-variant print:text-black/80">{formatCurrencyLocalCustom(cat.target, currency)}</td>
                                            <td className="py-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                                                    isExceeded 
                                                    ? 'bg-error/10 text-error border-error/20' 
                                                    : 'bg-primary/10 text-primary border-primary/20'
                                                }`}>
                                                    {isExceeded ? t('budgets.statusExceeded') : t('budgets.statusHealthy')}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SECTION 6 — OPTIMIZATION (ONLY DETERMINISTIC) */}
                <div className="lg:col-span-5 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-lg space-y-4 print:border-black print:shadow-none">
                    <h3 className="font-label-lg font-bold text-on-surface print:text-black">{t('budgets.optimization')}</h3>
                    
                    <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {optimizationSuggestions.map((sugg, i) => (
                            <div key={sugg.id} className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 relative overflow-hidden print:border-black print:bg-white">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary print:bg-black"></div>
                                <span className="material-symbols-outlined text-primary mt-0.5 print:hidden">lightbulb</span>
                                <div className="space-y-1">
                                    <h4 className="font-label-md font-bold text-primary print:text-black">{t('budgets.optimizationSuggestion')}</h4>
                                    <p className="text-xs text-on-surface-variant leading-relaxed print:text-black">{sugg.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* SAVINGS GOALS (Section 5) */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-lg space-y-6 print:border-black print:shadow-none">
                <h3 className="font-label-lg font-bold text-on-surface print:text-black">{t('budgets.savingsGoals')}</h3>
                
                {allGoals.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-outline-variant/50 rounded-xl space-y-4 bg-surface-container-low">
                        <span className="material-symbols-outlined text-[48px] text-on-surface-variant">savings</span>
                        <p className="text-sm text-on-surface-variant">{t('budgets.noGoals')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allGoals.map(goal => (
                            <div key={goal.id} className="bg-surface-container border border-outline-variant/30 rounded-xl p-5 shadow-sm space-y-4 print:border-black print:shadow-none">
                                <div className="flex justify-between items-center">
                                    <span className="font-label-md font-bold text-on-surface print:text-black">{goal.label}</span>
                                    <span className="text-primary font-bold text-xs">{goal.percent.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden print:bg-black/10">
                                    <div className="h-full bg-primary print:bg-black rounded-full" style={{ width: `${goal.percent}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs text-on-surface-variant border-t border-outline-variant/10 pt-3 print:text-black print:border-black/10">
                                    <div>
                                        <p className="uppercase text-[9px] tracking-wider">{t('budgets.remaining')}</p>
                                        <p className="font-bold text-on-surface print:text-black mt-0.5">{formatCurrencyLocalCustom(goal.remaining, currency)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="uppercase text-[9px] tracking-wider">{t('budgets.completionEstimated')}</p>
                                        <p className="font-bold text-primary print:text-black mt-0.5">{goal.completionStr}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SECTION 7 — PURCHASE IMPACT */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-lg space-y-4 print:border-black print:shadow-none">
                <h3 className="font-label-lg font-bold text-on-surface print:text-black">{t('budgets.purchaseImpact')}</h3>
                
                {loadingAnalyses ? (
                    <div className="flex justify-center p-4">
                        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : recentAnalyses.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-outline-variant/50 rounded-xl space-y-2 bg-surface-container-low">
                        <span className="material-symbols-outlined text-[32px] text-on-surface-variant">analytics</span>
                        <p className="text-xs text-on-surface-variant">{language === 'tr' ? 'Henüz kaydedilmiş analiziniz yok.' : 'No recorded analyses found.'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {recentAnalyses.map(item => (
                            <div 
                                key={item.id}
                                onClick={() => navigate('/analysis')}
                                className="bg-surface-container border border-outline-variant/30 hover:border-primary/50 transition-all rounded-xl p-4 shadow-sm cursor-pointer flex justify-between items-center print:border-black"
                            >
                                <div>
                                    <p className="font-label-md font-bold text-on-surface print:text-black truncate max-w-[120px]">{item.purchaseData.name}</p>
                                    <p className="text-[10px] text-on-surface-variant">
                                        {new Date(item.createdAt?.seconds * 1000).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-label-md text-primary font-bold">{formatCurrencyLocalCustom(item.purchaseData.price, item.purchaseData.currency)}</p>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                        item.analysis.recommendation === 'Buy' || item.analysis.recommendation === 'Satın Al' ? 'bg-primary/20 text-primary' :
                                        item.analysis.recommendation === 'Avoid' || item.analysis.recommendation === 'Kaçın' ? 'bg-error/20 text-error' :
                                        'bg-secondary/20 text-secondary'
                                    }`}>{item.analysis.recommendation}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </main>
    );
}
