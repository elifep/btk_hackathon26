import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { OnboardingProvider } from '../../context/OnboardingContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useUserProfile } from '../../hooks/useUserProfile';

export default function OnboardingLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { t, language, setLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const { profileData, loading } = useUserProfile();

    // Guard route: if onboardingCompleted is true, redirect to dashboard
    useEffect(() => {
        if (!loading && profileData?.userDoc?.onboardingCompleted) {
            navigate('/dashboard');
        }
    }, [profileData, loading, navigate]);

    const steps = [
        { id: 1, path: '/onboarding/step1', label: t('onboarding.step1'), icon: 'payments' },
        { id: 2, path: '/onboarding/step2', label: t('onboarding.step2'), icon: 'receipt_long' },
        { id: 3, path: '/onboarding/step3', label: t('onboarding.step3'), icon: 'flag' },
        { id: 4, path: '/onboarding/step4', label: t('onboarding.step4'), icon: 'psychology' },
        { id: 5, path: '/onboarding/step5', label: t('onboarding.step5'), icon: 'monitoring' }
    ];

    // Determine current step based on path
    const currentStepIndex = steps.findIndex(s => s.path === location.pathname);
    const currentStep = currentStepIndex !== -1 ? currentStepIndex + 1 : 1;
    const progressPercentage = (currentStep / steps.length) * 100;

    return (
        <OnboardingProvider>
            <div className="flex w-full min-h-screen bg-background text-on-surface overflow-hidden relative">
                
                {/* Top-Right Settings Controls */}
                <div className="absolute top-6 right-6 flex items-center gap-3 z-30">
                    {/* Language Switcher */}
                    <button 
                        onClick={() => setLanguage(language === 'en' ? 'tr' : 'en')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:text-on-surface text-sm font-label-md shadow-sm transition-all"
                    >
                        <span className="material-symbols-outlined text-sm">language</span>
                        <span>{language === 'en' ? 'TR' : 'EN'}</span>
                    </button>
                    
                    {/* Theme Toggle */}
                    <button 
                        onClick={toggleTheme}
                        className="p-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:text-on-surface shadow-sm transition-all"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>
                </div>

                {/* Left Side: Progress & Branding (Desktop Split-Screen) */}
                <div className="hidden lg:flex w-[400px] xl:w-[450px] flex-col justify-between bg-surface-container-low border-r border-outline-variant/15 relative p-8 xl:p-12 z-20">
                    <div className="absolute top-0 left-0 w-full h-[50%] bg-primary/10 rounded-br-full blur-[100px] pointer-events-none"></div>
                    
                    <div>
                        <div className="flex items-center gap-2 mb-16">
                            <span className="material-symbols-outlined text-primary-container text-[32px]">analytics</span>
                            <span className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface">SpendWise AI</span>
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
                                                'bg-surface-container border-outline-variant/30 text-on-surface-variant'
                                            }`}>
                                                {isCompleted ? (
                                                    <span className="material-symbols-outlined text-[20px]">check</span>
                                                ) : (
                                                    <span className="font-label-md text-label-md">{step.id}</span>
                                                )}
                                            </div>
                                            {idx !== steps.length - 1 && (
                                                <div className={`absolute top-10 w-0.5 h-10 -bottom-8 ${isCompleted ? 'bg-primary' : 'bg-outline-variant/20'}`}></div>
                                            )}
                                        </div>
                                        <div className="pt-2">
                                            <div className={`font-label-md text-label-md ${isActive || isCompleted ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                                                {step.label}
                                            </div>
                                            {isActive && (
                                                <div className="font-body-md text-sm text-primary mt-1">{t('onboarding.inProgress')}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    <div className="relative z-10 mt-12 bg-surface-container/50 border border-outline-variant/20 rounded-xl p-4 backdrop-blur-md">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary">tips_and_updates</span>
                            <div>
                                <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-1">{t('onboarding.aiCoachTip')}</p>
                                <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">{t('onboarding.aiCoachDesc')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Active Step Form */}
                <div className="flex-1 flex flex-col items-center justify-center relative p-4 md:p-8 overflow-y-auto pt-20 lg:pt-8">
                    {/* Background decorations for right side */}
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-container/10 blur-[120px] pointer-events-none z-0"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-secondary-container/10 blur-[120px] pointer-events-none z-0"></div>
                    
                    <div className="w-full max-w-2xl relative z-10">
                        {/* Mobile Header & Progress (Hidden on Desktop) */}
                        <div className="lg:hidden mb-8">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary-container text-[24px]">analytics</span>
                                <span className="font-headline-md text-[20px] font-bold text-on-surface">SpendWise AI</span>
                            </div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{t('onboarding.stepTitle')} {currentStep} / {steps.length}</span>
                                <span className="font-label-sm text-label-sm text-primary font-bold">{progressPercentage}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                                <div className="h-full bg-primary-container transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                        </div>

                        {/* Step Content Wrapper (Glassmorphism Card) */}
                        <div className="bg-surface-container-low/40 backdrop-blur-[20px] border border-outline-variant/35 rounded-2xl p-6 md:p-10 shadow-lg">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </div>
        </OnboardingProvider>
    );
}
