import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';

export default function Step4_Risk() {
    const navigate = useNavigate();
    const { onboardingData, updateRisk } = useOnboarding();
    const { personality } = onboardingData.risk;

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/onboarding/step5');
    };

    const handleBack = () => {
        navigate('/onboarding/step3');
    };

    const riskOptions = [
        {
            id: 'conservative',
            title: 'Conservative',
            description: 'Prioritize saving and debt payoff. Minimize risky spending.',
            icon: 'shield'
        },
        {
            id: 'balanced',
            title: 'Balanced',
            description: 'A mix of saving and lifestyle enjoyment. The standard path.',
            icon: 'balance'
        },
        {
            id: 'aggressive',
            title: 'Aggressive',
            description: 'High risk tolerance for spending or aggressive investing.',
            icon: 'local_fire_department'
        }
    ];

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-sm text-label-sm mb-4">
                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                    Step 4
                </div>
                <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Financial Personality</h1>
                <p className="font-body-md text-on-surface-variant">How should our AI coach you? This determines the strictness of your budget guards.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                <div className="space-y-4">
                    {riskOptions.map(option => (
                        <div key={option.id} className="relative">
                            <input 
                                type="radio" 
                                id={`risk-${option.id}`} 
                                name="risk" 
                                className="sr-only" 
                                checked={personality === option.id}
                                onChange={() => updateRisk({ personality: option.id })}
                            />
                            <label 
                                htmlFor={`risk-${option.id}`} 
                                className={`flex items-start p-5 rounded-xl border cursor-pointer transition-all ${
                                    personality === option.id 
                                    ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                                    : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mr-4 ${
                                    personality === option.id ? 'bg-primary text-background' : 'bg-surface-container text-on-surface-variant'
                                }`}>
                                    <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
                                </div>
                                <div>
                                    <h3 className={`font-headline-md text-lg mb-1 ${personality === option.id ? 'text-primary' : 'text-on-surface'}`}>
                                        {option.title}
                                    </h3>
                                    <p className="font-body-md text-sm text-on-surface-variant">
                                        {option.description}
                                    </p>
                                </div>
                            </label>
                        </div>
                    ))}
                </div>

                {/* Navigation */}
                <div className="mt-auto pt-8 flex items-center justify-between border-t border-white/10">
                    <button type="button" onClick={handleBack} className="text-on-surface-variant hover:text-on-surface font-label-md px-4 py-2 transition-colors">
                        Back
                    </button>
                    <button type="submit" className="bg-primary-container text-background font-label-md text-label-md px-8 py-3.5 rounded-xl hover:bg-primary hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 shadow-lg">
                        Continue to Tracking
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
