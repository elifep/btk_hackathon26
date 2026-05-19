import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import { getCurrencySymbol } from '../../utils/currency';
import { useLanguage } from '../../context/LanguageContext';

export default function Step2_Expenses() {
    const navigate = useNavigate();
    const { onboardingData, updateExpenses } = useOnboarding();
    const { rent, utilities, debt, insurance, subscriptions, customCategories } = onboardingData.expenses;
    const currencySymbol = getCurrencySymbol(onboardingData.income.currency);
    const { t, language } = useLanguage();

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/onboarding/step3');
    };

    const handleBack = () => {
        navigate('/onboarding/step1');
    };

    const handleAddCustom = () => {
        updateExpenses({
            customCategories: [...customCategories, { id: Date.now().toString(), name: '', amount: '' }]
        });
    };

    const handleUpdateCustom = (id, field, value) => {
        const updated = customCategories.map(c => c.id === id ? { ...c, [field]: value } : c);
        updateExpenses({ customCategories: updated });
    };

    const handleRemoveCustom = (id) => {
        const updated = customCategories.filter(c => c.id !== id);
        updateExpenses({ customCategories: updated });
    };

    const inputClasses = "w-full bg-surface-container/30 border border-outline-variant/30 rounded-xl py-3 pl-9 pr-4 font-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container placeholder:text-on-surface-variant/30 transition-all";

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-sm text-label-sm mb-4">
                    <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                    {t('onboarding.stepTitle')} 2
                </div>
                <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">{t('onboarding.step2Title')}</h1>
                <p className="font-body-md text-on-surface-variant leading-relaxed">{t('onboarding.step2Desc')}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Rent / Housing */}
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase ml-1">{t('onboarding.rent')}</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="font-body-lg text-on-surface-variant group-focus-within:text-primary transition-colors">{currencySymbol}</span>
                            </div>
                            <input 
                                type="number" min="0" step="0.01" placeholder="0.00" 
                                value={rent} onChange={(e) => updateExpenses({ rent: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {/* Utilities */}
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase ml-1">{t('onboarding.utilities')}</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="font-body-lg text-on-surface-variant group-focus-within:text-primary transition-colors">{currencySymbol}</span>
                            </div>
                            <input 
                                type="number" min="0" step="0.01" placeholder="0.00" 
                                value={utilities} onChange={(e) => updateExpenses({ utilities: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {/* Debt Payments */}
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase ml-1">{t('onboarding.debt')}</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="font-body-lg text-on-surface-variant group-focus-within:text-primary transition-colors">{currencySymbol}</span>
                            </div>
                            <input 
                                type="number" min="0" step="0.01" placeholder="0.00" 
                                value={debt} onChange={(e) => updateExpenses({ debt: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {/* Insurance */}
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase ml-1">{t('onboarding.insurance')}</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="font-body-lg text-on-surface-variant group-focus-within:text-primary transition-colors">{currencySymbol}</span>
                            </div>
                            <input 
                                type="number" min="0" step="0.01" placeholder="0.00" 
                                value={insurance} onChange={(e) => updateExpenses({ insurance: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {/* Subscriptions */}
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase ml-1">{t('onboarding.subscriptions')}</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="font-body-lg text-on-surface-variant group-focus-within:text-primary transition-colors">{currencySymbol}</span>
                            </div>
                            <input 
                                type="number" min="0" step="0.01" placeholder="0.00" 
                                value={subscriptions} onChange={(e) => updateExpenses({ subscriptions: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    </div>
                </div>

                {customCategories.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase ml-1">
                            {language === 'tr' ? 'Özel Giderler' : 'Custom Expenses'}
                        </h3>
                        {customCategories.map((custom) => (
                            <div key={custom.id} className="flex gap-4 items-center">
                                <div className="flex-1">
                                    <input 
                                        type="text" placeholder={t('onboarding.customExpenseName')} 
                                        value={custom.name} onChange={(e) => handleUpdateCustom(custom.id, 'name', e.target.value)}
                                        className="w-full bg-surface-container/30 border border-outline-variant/30 rounded-xl py-3 px-4 font-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                                    />
                                </div>
                                <div className="flex-1 relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="font-body-lg text-on-surface-variant group-focus-within:text-primary transition-colors">{currencySymbol}</span>
                                    </div>
                                    <input 
                                        type="number" min="0" step="0.01" placeholder="0.00" 
                                        value={custom.amount} onChange={(e) => handleUpdateCustom(custom.id, 'amount', e.target.value)}
                                        className={inputClasses}
                                    />
                                </div>
                                <button type="button" onClick={() => handleRemoveCustom(custom.id)} className="w-12 h-12 flex items-center justify-center rounded-xl bg-error/10 text-error hover:bg-error hover:text-white transition-colors shrink-0 border border-error/20">
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-4">
                    <button type="button" onClick={handleAddCustom} className="text-primary font-label-md text-label-md flex items-center gap-1 hover:text-primary-container transition-colors py-2">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        {t('onboarding.addCustomExpense')}
                    </button>
                </div>

                {/* Navigation */}
                <div className="mt-auto pt-8 flex items-center justify-between border-t border-outline-variant/30">
                    <button type="button" onClick={handleBack} className="text-on-surface-variant hover:text-on-surface font-label-md px-4 py-2 transition-colors">
                        {t('onboarding.back')}
                    </button>
                    <button type="submit" className="bg-primary-container text-white font-label-md text-label-md px-8 py-3.5 rounded-xl hover:bg-primary hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 shadow-lg border border-primary-container">
                        {t('onboarding.continueToGoals')}
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
