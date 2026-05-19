import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrencyParts } from '../../utils/currency';

export default function Dashboard() {
    const { currentUser } = useAuth();
    const { profileData, metrics, loading, error } = useOutletContext();
    const { t, formatCurrencyLocal, language } = useLanguage();

    if (loading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 p-8 text-center text-error">
                <span className="material-symbols-outlined text-[48px] mb-4">error</span>
                <p>Failed to load dashboard data: {error}</p>
            </div>
        );
    }

    if (!metrics || !profileData) {
        return (
            <div className="flex-1 p-8 text-center text-on-surface-variant">
                <p>No dashboard data available. Please complete onboarding.</p>
            </div>
        );
    }

    const { monthlyIncome, monthlyExpenses, freeBudget, healthScore, currency } = metrics;
    const { isNegative, symbol, whole, decimal } = formatCurrencyParts(freeBudget, currency);

    // Mock recent activity formatted with dynamic currency and real fixed expenses if available
    const recentActivity = [
        { id: 1, name: 'Starbucks', date: 'Today, 8:45 AM', amount: -6.45, icon: 'coffee', colorClass: 'text-primary' },
        { id: 2, name: 'Apple Subscription', date: 'Yesterday', amount: -14.99, icon: 'subscriptions', colorClass: 'text-secondary' },
        { id: 3, name: 'Whole Foods', date: 'Oct 24, 2023', amount: -124.30, icon: 'shopping_basket', colorClass: 'text-primary' },
        { id: 4, name: 'Rent Payment', date: 'Oct 1, 2023', amount: -(parseFloat(profileData.expenses?.rent) || 2400), icon: 'home', colorClass: 'text-tertiary' },
        { id: 5, name: 'Gym Membership', date: 'Sep 28, 2023', amount: -55.00, icon: 'fitness_center', colorClass: 'text-secondary' }
    ];

    // Combine standard and custom goals for display
    const getMockPercent = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash) % 80 + 10; // Between 10 and 90
    };

    const standardGoals = [
        { id: 'emergencyFund', label: t('onboarding.emergencyFund'), target: profileData.goals?.emergencyFund, colorClass: 'bg-primary', textClass: 'text-primary' },
        { id: 'travel', label: t('onboarding.travel'), target: profileData.goals?.travel, colorClass: 'bg-secondary', textClass: 'text-secondary' },
        { id: 'car', label: t('onboarding.car'), target: profileData.goals?.car, colorClass: 'bg-tertiary', textClass: 'text-tertiary' },
        { id: 'house', label: t('onboarding.house'), target: profileData.goals?.house, colorClass: 'bg-primary', textClass: 'text-primary' },
        { id: 'debtPayoff', label: t('onboarding.debtPayoff'), target: profileData.goals?.debtPayoff, colorClass: 'bg-secondary', textClass: 'text-secondary' }
    ].filter(g => parseFloat(g.target || 0) > 0).map(g => ({
        ...g,
        currentPercent: getMockPercent(g.id)
    }));

    const customGoals = (profileData.goals?.customGoals || []).filter(g => parseFloat(g.targetAmount || 0) > 0).map((g, i) => ({
        id: g.id,
        label: g.name || `Goal ${i+1}`,
        target: g.targetAmount,
        currentPercent: getMockPercent(g.id),
        colorClass: i % 2 === 0 ? 'bg-primary' : 'bg-secondary',
        textClass: i % 2 === 0 ? 'text-primary' : 'text-secondary'
    }));

    const activeGoals = [...standardGoals, ...customGoals].slice(0, 4);

    const expectedSavings = Math.max(0, freeBudget * 0.15);

    // Generate dynamic chart data based on monthlyIncome and monthlyExpenses
    const chartPaths = useMemo(() => {
        const incomeFactors = [0.92, 0.95, 0.98, 1.02, 0.96, 1.0];
        const expenseFactors = [0.85, 0.92, 1.15, 0.88, 1.05, 1.0];
        
        const maxVal = Math.max(monthlyIncome, monthlyExpenses * 1.3, 1000);
        
        const getY = (val) => {
            const pct = val / maxVal;
            // Map 0 to SVG y=90, and maxVal to SVG y=15
            return Math.max(10, Math.min(95, 90 - pct * 75));
        };
        
        const incomePoints = incomeFactors.map((f, i) => ({
            x: i * 20,
            y: getY(monthlyIncome * f)
        }));
        
        const expensePoints = expenseFactors.map((f, i) => ({
            x: i * 20,
            y: getY(monthlyExpenses * f)
        }));
        
        const savingsPoints = incomeFactors.map((f, i) => {
            const inc = monthlyIncome * f;
            const exp = monthlyExpenses * expenseFactors[i];
            const sav = Math.max(0, inc - exp);
            return {
                x: i * 20,
                y: getY(sav)
            };
        });
        
        const makePath = (pts) => pts.reduce((acc, p, i) => i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`, '');
        const makeAreaPath = (pts) => `${makePath(pts)} L100,100 L0,100 Z`;
        
        return {
            income: makePath(incomePoints),
            expense: makePath(expensePoints),
            savings: makePath(savingsPoints),
            area: makeAreaPath(incomePoints)
        };
    }, [monthlyIncome, monthlyExpenses]);

    return (
        <main className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full animate-fade-in">
            {/* Column 1: Main Overview (Span 3) */}
            <div className="lg:col-span-3 flex flex-col gap-8">
                {/* Hero Metrics Card - Enhanced padding, spacing, and font metrics */}
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 lg:p-8 relative overflow-hidden group h-full shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 group-hover:bg-primary/10 transition-colors duration-700"></div>
                    
                    <div className="relative z-10 flex-grow">
                        <h2 className="font-display-lg text-2xl md:text-3xl text-on-surface mb-3 tracking-tight font-semibold leading-snug">
                            {t('dashboard.welcome')}, <span className="text-primary">{profileData?.userDoc?.fullName?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'User'}</span>
                        </h2>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-6 leading-relaxed">
                            {t('dashboard.onTrackText1')} <span className="text-primary font-semibold">{formatCurrencyLocal(expectedSavings, currency)}</span> {t('dashboard.onTrackText2')}
                        </p>
                        
                        <div className="mb-6">
                            <p className="font-label-sm text-xs text-primary uppercase tracking-widest mb-2.5 font-semibold">{t('dashboard.monthlyFreeBudget')}</p>
                            <h3 className={`font-display-lg text-3xl sm:text-4xl xl:text-5xl font-bold tracking-tight leading-none ${isNegative ? 'text-error' : 'text-on-surface'}`}>
                                {isNegative && '-'}{symbol}{whole}<span className="text-on-surface-variant text-xl xl:text-2xl font-normal ml-0.5">{decimal}</span>
                            </h3>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3.5 mt-auto relative z-10 w-full">
                        <div className="bg-surface-container/50 rounded-xl p-3 md:p-4 border border-outline-variant/30 flex flex-col gap-1 shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">health_and_safety</span>
                                <span className="font-label-sm text-xs text-on-surface-variant font-medium uppercase tracking-wider">{t('dashboard.financialHealth')}</span>
                            </div>
                            <p className="font-headline-md text-headline-md text-on-surface font-semibold mt-1">{healthScore}<span className="text-xs text-on-surface-variant font-normal">/100</span></p>
                        </div>
                        <div className="bg-secondary-container/10 rounded-xl p-3 md:p-4 border border-secondary/30 flex flex-col gap-1 shadow-[0_0_20px_rgba(16,185,129,0.05)] transition-all duration-500">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary text-sm animate-pulse">auto_awesome</span>
                                <span className="font-label-sm text-xs text-on-surface-variant font-medium uppercase tracking-wider">{language === 'tr' ? 'AI Optimizasyonu' : 'AI Optimized'}</span>
                            </div>
                            <p className="font-headline-md text-headline-md text-secondary font-bold tracking-tight mt-1">+{formatCurrencyLocal(expectedSavings * 1.5, currency)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Column 2: Cash Flow Chart (Span 5) */}
            <div className="lg:col-span-5 flex flex-col gap-8">
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 flex-1 min-h-[500px] flex flex-col shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                            <h4 className="font-headline-md text-headline-md text-on-surface font-semibold">{language === 'tr' ? 'Nakit Akışı' : 'Cash Flow'}</h4>
                            <p className="font-body-sm text-on-surface-variant mt-1">
                                <span className="text-primary font-medium">{formatCurrencyLocal(monthlyIncome, currency)} {t('dashboard.in')}</span> • <span className="text-error font-medium">{formatCurrencyLocal(monthlyExpenses, currency)} {t('dashboard.out')}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-4 hidden sm:flex">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                <span className="font-label-sm text-on-surface-variant">{t('dashboard.income')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-error"></span>
                                <span className="font-label-sm text-on-surface-variant">{t('dashboard.expenses')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                                <span className="font-label-sm text-on-surface-variant">{t('dashboard.savings')}</span>
                            </div>
                            <button className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 ml-2">
                                {language === 'tr' ? 'Son 30 Gün' : 'Last 30 Days'} <span className="material-symbols-outlined text-sm">expand_more</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* Simulated CSS Chart */}
                    <div className="flex-1 relative border-l border-b border-outline-variant/30 mt-4 ml-6 mb-6">
                        {/* Faint Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between">
                            <div className="border-t border-outline-variant/10 w-full"></div>
                            <div className="border-t border-outline-variant/10 w-full"></div>
                            <div className="border-t border-outline-variant/10 w-full"></div>
                            <div className="border-t border-outline-variant/10 w-full"></div>
                        </div>
                        {/* Chart Path */}
                        <div className="absolute inset-0 overflow-hidden">
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                                <path d={chartPaths.income} fill="none" opacity="0.9" stroke="#4edea3" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                                <path d={chartPaths.expense} fill="none" opacity="0.7" stroke="#ffb4ab" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                                <path d={chartPaths.savings} fill="none" opacity="0.7" stroke="#4fdbc8" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                                <path d={chartPaths.area} fill="url(#areaGradient)" opacity="0.15"></path>
                                <defs>
                                    <linearGradient id="areaGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                        <stop offset="0%" stopColor="#4edea3"></stop>
                                        <stop offset="100%" stopColor="transparent"></stop>
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Column 3: Insights & Goals & Activity (Span 4) */}
            <div className="lg:col-span-4 flex flex-col gap-8 h-[calc(100vh-140px)] overflow-y-auto pr-2 custom-scrollbar pb-8">
                
                {/* AI Insights */}
                <div className="flex flex-col gap-6">
                    <div className="bg-surface-container-low border border-outline-variant/30 border-l-4 border-l-tertiary rounded-xl p-5 mb-4 shadow-sm">
                        <div className="flex items-start gap-4">
                            <span className="material-symbols-outlined text-tertiary mt-1">thermostat</span>
                            <div>
                                <h4 className="font-label-md text-label-md text-on-surface mb-1 font-semibold">{t('dashboard.upcomingRisk')}</h4>
                                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{t('dashboard.expectedSpike')} <span className="text-tertiary font-medium">{t('dashboard.estIncrease').replace('{amount}', formatCurrencyLocal(45, currency))}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary">auto_awesome</span>
                        <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">{t('dashboard.aiInsights')}</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-surface-container-low border border-outline-variant/30 border-l-4 border-l-error rounded-xl p-5 shadow-sm">
                            <div className="flex items-start gap-4">
                                <span className="material-symbols-outlined text-error mt-1">warning</span>
                                <div>
                                    <h4 className="font-label-md text-label-md text-on-surface mb-1 font-semibold">{t('dashboard.overspendingAlert')}</h4>
                                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{t('dashboard.diningExpenses')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface-container-low border border-outline-variant/30 border-l-4 border-l-secondary rounded-xl p-5 shadow-sm">
                            <div className="flex items-start gap-4">
                                <span className="material-symbols-outlined text-secondary mt-1">cancel_schedule_send</span>
                                <div>
                                    <h4 className="font-label-md text-label-md text-on-surface mb-1 font-semibold">{t('dashboard.subWasteDetected')}</h4>
                                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{t('dashboard.unusedStream').replace('{amount}', formatCurrencyLocal(14.99, currency))}</p>
                                    <button className="mt-3 font-label-sm text-label-sm text-secondary hover:underline transition-colors">{t('dashboard.reviewSubs')}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Goals */}
                {activeGoals.length > 0 && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">{t('dashboard.activeGoals')}</h3>
                            <span className="material-symbols-outlined text-on-surface-variant text-sm hover:text-primary cursor-pointer">add</span>
                        </div>
                        <div className="space-y-4">
                            {activeGoals.map(goal => {
                                const currentAmt = (parseFloat(goal.target) * (goal.currentPercent / 100));
                                return (
                                    <div key={goal.id} className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-label-md text-label-md text-on-surface font-medium">{goal.label}</span>
                                            <span className={`font-label-md text-label-md ${goal.textClass} font-semibold`}>{goal.currentPercent}%</span>
                                        </div>
                                        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                                            <div className={`${goal.colorClass} h-full rounded-full`} style={{ width: `${goal.currentPercent}%` }}></div>
                                        </div>
                                        <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant">
                                            {formatCurrencyLocal(currentAmt, currency)} / {formatCurrencyLocal(goal.target, currency)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Recent Activity */}
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">{t('dashboard.recentActivity')}</h3>
                        <button className="font-label-sm text-label-sm text-primary hover:underline">{t('dashboard.viewAll')}</button>
                    </div>
                    <div className="space-y-3">
                        {recentActivity.map(item => (
                            <div key={item.id} className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                                <div className={`w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center ${item.colorClass}`}>
                                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-label-md text-label-md text-on-surface truncate font-medium">{item.name}</p>
                                    <p className="font-label-sm text-label-sm text-on-surface-variant">{item.date}</p>
                                </div>
                                <p className="font-label-md text-label-md text-on-surface font-semibold">{formatCurrencyLocal(item.amount, currency)}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </main>
    );
}
