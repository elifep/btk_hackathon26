import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { OnboardingProvider } from '../../context/OnboardingContext';

const steps = [
    { id: 1, path: '/onboarding/step1', label: 'Income Profile', icon: 'payments' },
    { id: 2, path: '/onboarding/step2', label: 'Fixed Expenses', icon: 'receipt_long' },
    { id: 3, path: '/onboarding/step3', label: 'Financial Goals', icon: 'flag' },
    { id: 4, path: '/onboarding/step4', label: 'Risk Personality', icon: 'psychology' },
    { id: 5, path: '/onboarding/step5', label: 'Tracking Setup', icon: 'monitoring' }
];

export default function OnboardingLayout() {
    const location = useLocation();
    
    // Determine current step based on path
    const currentStepIndex = steps.findIndex(s => s.path === location.pathname);
    const currentStep = currentStepIndex !== -1 ? currentStepIndex + 1 : 1;
    const progressPercentage = (currentStep / steps.length) * 100;

    return (
        <OnboardingProvider>
            <div className="flex w-full min-h-screen bg-background text-on-surface overflow-hidden">
                
                {/* Left Side: Progress & Branding (Desktop Split-Screen) */}
                <div className="hidden lg:flex w-[400px] xl:w-[450px] flex-col justify-between bg-surface-container-low border-r border-white/5 relative p-8 xl:p-12 z-20">
                    <div className="absolute top-0 left-0 w-full h-[50%] bg-primary/10 rounded-br-full blur-[100px] pointer-events-none"></div>
                    
                    <div>
                        <div className="flex items-center gap-2 mb-16">
                            <span className="material-symbols-outlined text-primary-container text-[32px]">analytics</span>
                            <span className="font-headline-md text-headline-md font-bold tracking-tight text-white">SpendWise AI</span>
                        </div>

                        <div className="space-y-8 relative z-10">
                            {steps.map((step, idx) => {
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;
                                
                                return (
                                    <div key={step.id} className="flex items-start gap-4">
                                        <div className="relative flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 z-10 ${
                                                isActive ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]' :
                                                isCompleted ? 'bg-primary border-primary text-background' :
                                                'bg-surface-container border-white/10 text-on-surface-variant'
                                            }`}>
                                                {isCompleted ? (
                                                    <span className="material-symbols-outlined text-[20px]">check</span>
                                                ) : (
                                                    <span className="font-label-md text-label-md">{step.id}</span>
                                                )}
                                            </div>
                                            {idx !== steps.length - 1 && (
                                                <div className={`absolute top-10 w-0.5 h-10 -bottom-8 ${isCompleted ? 'bg-primary' : 'bg-white/10'}`}></div>
                                            )}
                                        </div>
                                        <div className="pt-2">
                                            <div className={`font-label-md text-label-md ${isActive || isCompleted ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                                                {step.label}
                                            </div>
                                            {isActive && (
                                                <div className="font-body-md text-sm text-primary mt-1">In progress...</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    <div className="relative z-10 mt-12 bg-surface-container/50 border border-white/5 rounded-xl p-4 backdrop-blur-md">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary">tips_and_updates</span>
                            <div>
                                <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-1">AI Coach Tip</p>
                                <p className="font-body-md text-sm text-on-surface-variant">We ask these questions to build a hyper-personalized financial neural model specifically for your lifestyle.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Active Step Form */}
                <div className="flex-1 flex flex-col items-center justify-center relative p-4 md:p-8 overflow-y-auto">
                    {/* Background decorations for right side */}
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-container/10 blur-[120px] pointer-events-none z-0"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-secondary-container/10 blur-[120px] pointer-events-none z-0"></div>
                    
                    <div className="w-full max-w-2xl relative z-10">
                        {/* Mobile Header & Progress (Hidden on Desktop) */}
                        <div className="lg:hidden mb-8">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary-container text-[24px]">analytics</span>
                                <span className="font-headline-md text-[20px] font-bold text-white">SpendWise AI</span>
                            </div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Step {currentStep} of {steps.length}</span>
                                <span className="font-label-sm text-label-sm text-primary font-bold">{progressPercentage}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                                <div className="h-full bg-primary-container transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                        </div>

                        {/* Step Content Wrapper (Glassmorphism Card) */}
                        <div className="bg-white/[0.02] backdrop-blur-[20px] border border-white/10 rounded-2xl p-6 md:p-10 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </div>
        </OnboardingProvider>
    );
}
