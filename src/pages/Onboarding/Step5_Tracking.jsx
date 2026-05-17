import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';

export default function Step5_Tracking() {
    const navigate = useNavigate();
    const { onboardingData, updateTracking, finalizeOnboarding, loading, error } = useOnboarding();
    const { method } = onboardingData.tracking;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await finalizeOnboarding();
            navigate('/dashboard');
        } catch (err) {
            console.error("Error finalizing onboarding", err);
        }
    };

    const handleBack = () => {
        navigate('/onboarding/step4');
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-sm text-label-sm mb-4">
                    <span className="material-symbols-outlined text-[14px]">monitoring</span>
                    Step 5
                </div>
                <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Tracking Setup</h1>
                <p className="font-body-md text-on-surface-variant">How do you want to input your daily expenses?</p>
            </div>

            {error && (
                <div className="p-4 mb-6 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-body-md">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                <div className="space-y-4">
                    {/* Manual Tracking */}
                    <div className="relative">
                        <input 
                            type="radio" 
                            id="track-manual" 
                            name="trackingMethod" 
                            className="sr-only" 
                            checked={method === 'manual'}
                            onChange={() => updateTracking({ method: 'manual' })}
                        />
                        <label 
                            htmlFor="track-manual" 
                            className={`flex items-start p-5 rounded-xl border cursor-pointer transition-all ${
                                method === 'manual' 
                                ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                                : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mr-4 ${
                                method === 'manual' ? 'bg-primary text-background' : 'bg-surface-container text-on-surface-variant'
                            }`}>
                                <span className="material-symbols-outlined text-[20px]">edit_note</span>
                            </div>
                            <div>
                                <h3 className={`font-headline-md text-lg mb-1 ${method === 'manual' ? 'text-primary' : 'text-on-surface'}`}>
                                    Manual Entry
                                </h3>
                                <p className="font-body-md text-sm text-on-surface-variant">
                                    I will manually input my transactions. Best for high awareness.
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Bank Sync (Coming Soon) */}
                    <div className="relative opacity-60">
                        <input 
                            type="radio" 
                            id="track-sync" 
                            name="trackingMethod" 
                            className="sr-only" 
                            disabled
                        />
                        <label 
                            htmlFor="track-sync" 
                            className="flex items-start p-5 rounded-xl border bg-white/5 border-white/10 cursor-not-allowed"
                        >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mr-4 bg-surface-container text-on-surface-variant">
                                <span className="material-symbols-outlined text-[20px]">account_balance</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-headline-md text-lg text-on-surface">Auto-Sync via Plaid</h3>
                                    <span className="text-[10px] uppercase tracking-wider bg-surface-variant px-2 py-1 rounded text-on-surface-variant">Coming Soon</span>
                                </div>
                                <p className="font-body-md text-sm text-on-surface-variant">
                                    Securely connect your bank accounts for automatic categorization.
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* System Readiness Box */}
                <div className="mt-8 bg-surface-container-highest/30 border border-white/5 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary">check_circle</span>
                    </div>
                    <div>
                        <h4 className="font-label-md text-label-md text-on-surface">Neural Engine Ready</h4>
                        <p className="text-xs text-on-surface-variant mt-1">Your profile is complete. We're ready to initialize your personalized dashboard.</p>
                    </div>
                </div>

                {/* Navigation */}
                <div className="mt-auto pt-8 flex items-center justify-between border-t border-white/10">
                    <button type="button" onClick={handleBack} disabled={loading} className="text-on-surface-variant hover:text-on-surface font-label-md px-4 py-2 transition-colors disabled:opacity-50">
                        Back
                    </button>
                    <button type="submit" disabled={loading} className="bg-primary-container text-background font-label-md text-label-md px-8 py-3.5 rounded-xl hover:bg-primary hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:scale-100">
                        {loading ? 'Initializing...' : 'Launch Dashboard'}
                        {!loading && <span className="material-symbols-outlined text-[18px]">rocket_launch</span>}
                    </button>
                </div>
            </form>
        </div>
    );
}
