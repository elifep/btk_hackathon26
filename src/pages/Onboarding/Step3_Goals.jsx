import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import { getCurrencySymbol } from '../../utils/currency';

export default function Step3_Goals() {
    const navigate = useNavigate();
    const { onboardingData, updateGoals } = useOnboarding();
    const { emergencyFund, travel, car, house, debtPayoff, customGoals } = onboardingData.goals;
    const currencySymbol = getCurrencySymbol(onboardingData.income.currency);

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/onboarding/step4');
    };

    const handleBack = () => {
        navigate('/onboarding/step2');
    };

    const handleAddCustom = () => {
        updateGoals({
            customGoals: [...customGoals, { id: Date.now().toString(), name: '', targetAmount: '', timeline: '' }]
        });
    };

    const handleUpdateCustom = (id, field, value) => {
        const updated = customGoals.map(g => g.id === id ? { ...g, [field]: value } : g);
        updateGoals({ customGoals: updated });
    };

    const handleRemoveCustom = (id) => {
        const updated = customGoals.filter(g => g.id !== id);
        updateGoals({ customGoals: updated });
    };

    const inputClasses = "w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-9 pr-4 font-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container placeholder:text-on-surface-variant/30 transition-all";

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-sm text-label-sm mb-4">
                    <span className="material-symbols-outlined text-[14px]">flag</span>
                    Step 3
                </div>
                <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Financial Goals</h1>
                <p className="font-body-md text-on-surface-variant">Set target amounts for your goals. Our AI will help you reach them faster.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Emergency Fund */}
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase ml-1">Emergency Fund Target</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="font-body-lg text-on-surface-variant group-focus-within:text-primary transition-colors">{currencySymbol}</span>
                            </div>
                            <input 
                                type="number" min="0" step="0.01" placeholder="0.00" 
                                value={emergencyFund} onChange={(e) => updateGoals({ emergencyFund: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {/* Travel */}
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase ml-1">Travel Fund</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="font-body-lg text-on-surface-variant group-focus-within:text-primary transition-colors">{currencySymbol}</span>
                            </div>
                            <input 
                                type="number" min="0" step="0.01" placeholder="0.00" 
                                value={travel} onChange={(e) => updateGoals({ travel: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {/* Car */}
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase ml-1">Car Savings</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="font-body-lg text-on-surface-variant group-focus-within:text-primary transition-colors">{currencySymbol}</span>
                            </div>
                            <input 
                                type="number" min="0" step="0.01" placeholder="0.00" 
                                value={car} onChange={(e) => updateGoals({ car: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {/* House Down Payment */}
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase ml-1">House Down Payment</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="font-body-lg text-on-surface-variant group-focus-within:text-primary transition-colors">{currencySymbol}</span>
                            </div>
                            <input 
                                type="number" min="0" step="0.01" placeholder="0.00" 
                                value={house} onChange={(e) => updateGoals({ house: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {/* Debt Payoff Target */}
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase ml-1">Extra Debt Payoff Target</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="font-body-lg text-on-surface-variant group-focus-within:text-primary transition-colors">$</span>
                            </div>
                            <input 
                                type="number" min="0" step="0.01" placeholder="0.00" 
                                value={debtPayoff} onChange={(e) => updateGoals({ debtPayoff: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    </div>
                </div>

                {customGoals.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase ml-1">Custom Goals</h3>
                        {customGoals.map((custom) => (
                            <div key={custom.id} className="flex gap-4 items-center">
                                <div className="flex-1">
                                    <input 
                                        type="text" placeholder="Goal Name" 
                                        value={custom.name} onChange={(e) => handleUpdateCustom(custom.id, 'name', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 font-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                                    />
                                </div>
                                <div className="flex-1 relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="font-body-lg text-on-surface-variant group-focus-within:text-primary transition-colors">{currencySymbol}</span>
                                    </div>
                                    <input 
                                        type="number" min="0" step="0.01" placeholder="Target 0.00" 
                                        value={custom.targetAmount} onChange={(e) => handleUpdateCustom(custom.id, 'targetAmount', e.target.value)}
                                        className={inputClasses}
                                    />
                                </div>
                                <div className="flex-1">
                                    <input 
                                        type="text" placeholder="Timeline (e.g. Dec 2024)" 
                                        value={custom.timeline} onChange={(e) => handleUpdateCustom(custom.id, 'timeline', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 font-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
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
                        Add Custom Goal
                    </button>
                </div>

                {/* Navigation */}
                <div className="mt-auto pt-8 flex items-center justify-between border-t border-white/10">
                    <button type="button" onClick={handleBack} className="text-on-surface-variant hover:text-on-surface font-label-md px-4 py-2 transition-colors">
                        Back
                    </button>
                    <button type="submit" className="bg-primary-container text-background font-label-md text-label-md px-8 py-3.5 rounded-xl hover:bg-primary hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 shadow-lg">
                        Continue to Personality
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
