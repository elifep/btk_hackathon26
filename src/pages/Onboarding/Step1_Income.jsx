import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import { getCurrencySymbol } from '../../utils/currency';
import { useLanguage } from '../../context/LanguageContext';

export default function Step1_Income() {
    const navigate = useNavigate();
    const { onboardingData, updateIncome } = useOnboarding();
    const { currency, frequency, primaryIncome, sideIncome } = onboardingData.income;
    const { t } = useLanguage();

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/onboarding/step2');
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-sm text-label-sm mb-4">
                    <span className="material-symbols-outlined text-[14px]">payments</span>
                    {t('onboarding.stepTitle')} 1
                </div>
                <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">{t('onboarding.step1Title')}</h1>
                <p className="font-body-md text-on-surface-variant leading-relaxed">{t('onboarding.step1Desc')}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 space-y-6">
                <div className="space-y-4">
                    {/* Currency Selector */}
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase ml-1">{t('onboarding.baseCurrency')}</label>
                        <div className="relative">
                            <select 
                                value={currency}
                                onChange={(e) => updateIncome({ currency: e.target.value })}
                                className="w-full appearance-none bg-surface-container border border-outline-variant rounded-xl py-3.5 pl-4 pr-10 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            >
                                <option value="USD" className="bg-surface-container">🇺🇸 USD - US Dollar</option>
                                <option value="EUR" className="bg-surface-container">🇪🇺 EUR - Euro</option>
                                <option value="GBP" className="bg-surface-container">🇬🇧 GBP - British Pound</option>
                                <option value="CAD" className="bg-surface-container">🇨🇦 CAD - Canadian Dollar</option>
                                <option value="AUD" className="bg-surface-container">🇦🇺 AUD - Australian Dollar</option>
                                <option value="TRY" className="bg-surface-container">🇹🇷 TRY - Turkish Lira</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
                            </div>
                        </div>
                    </div>

                    {/* Pay Frequency */}
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase ml-1">{t('onboarding.payFrequency')}</label>
                        <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant">
                            {['monthly', 'biweekly', 'weekly'].map((freq) => (
                                <div key={freq} className="flex-1 relative">
                                    <input 
                                        type="radio" 
                                        id={`freq-${freq}`} 
                                        name="frequency" 
                                        className="sr-only" 
                                        checked={frequency === freq}
                                        onChange={() => updateIncome({ frequency: freq })}
                                    />
                                    <label 
                                        htmlFor={`freq-${freq}`} 
                                        className={`block w-full text-center py-2.5 rounded-lg font-label-md cursor-pointer transition-all border text-sm ${
                                            frequency === freq 
                                            ? 'bg-primary text-on-primary border-primary shadow-sm font-semibold' 
                                            : 'text-on-surface-variant border-transparent hover:bg-surface-container-high/40 hover:text-on-surface'
                                        }`}
                                    >
                                        {freq === 'monthly' ? t('onboarding.freqMonthly') : freq === 'biweekly' ? t('onboarding.freqBiweekly') : t('onboarding.freqWeekly')}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Primary Income Input */}
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase ml-1" htmlFor="primaryIncome">{t('onboarding.primaryIncome')}</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="font-headline-md text-[20px] text-on-surface-variant group-focus-within:text-primary transition-colors">{getCurrencySymbol(currency)}</span>
                            </div>
                            <input 
                                id="primaryIncome" 
                                type="number" 
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00" 
                                value={primaryIncome}
                                onChange={(e) => updateIncome({ primaryIncome: e.target.value })}
                                className="w-full bg-surface-container border border-outline-variant rounded-xl py-4 pl-9 pr-4 font-headline-md text-headline-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/30 transition-all"
                            />
                        </div>
                    </div>

                    {/* Side Income Input */}
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase ml-1" htmlFor="sideIncome">{t('onboarding.sideIncome')}</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="font-body-lg text-on-surface-variant group-focus-within:text-primary transition-colors">{getCurrencySymbol(currency)}</span>
                            </div>
                            <input 
                                id="sideIncome" 
                                type="number" 
                                min="0"
                                step="0.01"
                                placeholder="0.00" 
                                value={sideIncome}
                                onChange={(e) => updateIncome({ sideIncome: e.target.value })}
                                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3.5 pl-9 pr-4 font-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/30 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="mt-8 pt-6 border-t border-outline-variant/30 flex justify-end">
                    <button type="submit" className="bg-primary-container text-white font-label-md text-label-md px-8 py-3.5 rounded-xl hover:bg-primary hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 shadow-lg border border-primary-container">
                        {t('onboarding.continueToExpenses')}
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
