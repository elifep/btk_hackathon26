import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../config/firebase';
import { doc, updateDoc, setDoc, collection, query, getDocs, orderBy, limit, writeBatch } from 'firebase/firestore';

export default function Settings() {
    const { currentUser } = useAuth();
    const { profileData, metrics, refetch } = useOutletContext();
    const { language, setLanguage, toggleLanguage, t, formatCurrencyLocal } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    // Local form states
    const [fullName, setFullName] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [primaryIncome, setPrimaryIncome] = useState('');
    const [risk, setRisk] = useState('balanced');
    const [monthlySavingsTarget, setMonthlySavingsTarget] = useState('');
    const [purchaseStyle, setPurchaseStyle] = useState('balanced');

    // UI Feedback states
    const [isSaving, setIsSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [lastAnalysisDate, setLastAnalysisDate] = useState(null);

    // Confirmation Modals states
    const [showResetModal, setShowResetModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);

    // Load initial values from profileData context
    useEffect(() => {
        if (profileData) {
            setFullName(profileData.userDoc?.fullName || currentUser?.displayName || '');
            setCurrency(profileData.income?.currency || 'USD');
            setPrimaryIncome(profileData.income?.primaryIncome || '');
            setRisk(profileData.preferences?.risk || 'balanced');
            setMonthlySavingsTarget(profileData.preferences?.monthlySavingsTarget || '');
            setPurchaseStyle(profileData.preferences?.purchaseStyle || 'balanced');
        }
    }, [profileData, currentUser]);

    // Fetch last analysis date
    const fetchLastAnalysisDate = async () => {
        if (!currentUser) return;
        try {
            const analysesRef = collection(db, 'users', currentUser.uid, 'ai', 'data', 'analyses');
            const q = query(analysesRef, orderBy('createdAt', 'desc'), limit(1));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const data = snap.docs[0].data();
                if (data.createdAt) {
                    const date = new Date(data.createdAt.seconds * 1000);
                    setLastAnalysisDate(date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US'));
                }
            } else {
                setLastAnalysisDate(t('aiModal.none'));
            }
        } catch (err) {
            console.error("Failed to load last analysis:", err);
            setLastAnalysisDate(t('aiModal.none'));
        }
    };

    useEffect(() => {
        fetchLastAnalysisDate();
    }, [currentUser, language]);

    // Toast triggers
    const triggerToast = (msg) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Save All Preferences to Firestore
    const handleSaveSettings = async (e) => {
        if (e) e.preventDefault();
        if (!currentUser) return;

        setIsSaving(true);
        try {
            // 1. Update user main doc
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                fullName: fullName
            });

            // 2. Update profile sub-documents
            const incomeRef = doc(db, 'users', currentUser.uid, 'profile', 'income');
            await setDoc(incomeRef, {
                ...profileData?.income,
                currency: currency,
                primaryIncome: primaryIncome
            }, { merge: true });

            const prefRef = doc(db, 'users', currentUser.uid, 'profile', 'preferences');
            await setDoc(prefRef, {
                ...profileData?.preferences,
                risk: risk,
                monthlySavingsTarget: monthlySavingsTarget,
                purchaseStyle: purchaseStyle
            }, { merge: true });

            // Trigger context refetch
            if (refetch) await refetch();

            triggerToast(t('settings.saveSuccess'));
        } catch (err) {
            console.error("Save settings error:", err);
            triggerToast(language === 'tr' ? 'Ayarlar kaydedilirken hata oluştu.' : 'Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    // Soft archive all past analyses
    const handleArchiveHistory = async () => {
        if (!currentUser) return;
        setShowArchiveModal(false);

        try {
            const analysesRef = collection(db, 'users', currentUser.uid, 'ai', 'data', 'analyses');
            const q = query(analysesRef);
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                triggerToast(language === 'tr' ? 'Arşivlenecek analiz bulunamadı.' : 'No analyses found to archive.');
                return;
            }

            const batch = writeBatch(db);
            querySnapshot.forEach((doc) => {
                batch.update(doc.ref, { archived: true });
            });
            await batch.commit();

            triggerToast(language === 'tr' ? 'Tüm analiz geçmişi arşivlendi.' : 'All analysis history soft-archived.');
            fetchLastAnalysisDate();
            if (refetch) await refetch();
        } catch (error) {
            console.error("Failed to archive history:", error);
            triggerToast(language === 'tr' ? 'Geçmiş arşivlenirken hata oluştu.' : 'Error archiving history.');
        }
    };

    // Reset onboarding flow
    const handleResetOnboarding = async () => {
        if (!currentUser) return;
        setShowResetModal(false);

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                onboardingCompleted: false
            });

            if (refetch) await refetch();
            navigate('/onboarding/step1');
        } catch (err) {
            console.error("Reset onboarding error:", err);
            triggerToast(language === 'tr' ? 'Onboarding sıfırlanamadı.' : 'Failed to reset onboarding.');
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 relative">
            {/* Title Header */}
            <div className="border-b border-outline-variant/30 pb-6">
                <h1 className="font-headline-lg text-display-sm text-on-surface font-bold tracking-tight">
                    {t('nav.settings')}
                </h1>
                <p className="font-body-md text-on-surface-variant mt-1">
                    {language === 'tr' ? 'Hesap, finansal hedefler ve veri yönetim ayarlarınızı yapılandırın.' : 'Configure account, financial targets, and data management settings.'}
                </p>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: Profile Summary Card */}
                <div className="lg:col-span-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-lg space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
                    
                    <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-outline-variant/30">
                        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary relative overflow-hidden shadow-inner">
                            {currentUser?.photoURL ? (
                                <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                            )}
                        </div>
                        <div>
                            <h3 className="font-headline-sm font-bold text-on-surface">{fullName || 'SpendWise User'}</h3>
                            <p className="text-xs text-on-surface-variant">{currentUser?.email}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-label-md font-bold text-on-surface uppercase tracking-wider">{t('settings.profileSummary')}</h4>
                        
                        <div className="space-y-3 text-sm font-label-md">
                            <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                                <span className="text-on-surface-variant">{t('settings.currency')}</span>
                                <span className="font-bold text-on-surface">{currency}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                                <span className="text-on-surface-variant">{t('settings.riskTolerance')}</span>
                                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-primary/15 text-primary border border-primary/20 capitalize">
                                    {risk === 'conservative' ? t('settings.riskConservative') : risk === 'aggressive' ? t('settings.riskAggressive') : t('settings.riskBalanced')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                                <span className="text-on-surface-variant">{t('settings.monthlySavingsTarget')}</span>
                                <span className="font-bold text-on-surface">{monthlySavingsTarget ? formatCurrencyLocal(Number(monthlySavingsTarget), currency) : '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                                <span className="text-on-surface-variant">{t('settings.theme')}</span>
                                <span className="font-bold text-on-surface capitalize">{theme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                                <span className="text-on-surface-variant">{t('settings.language')}</span>
                                <span className="font-bold text-on-surface uppercase">{language}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-on-surface-variant">{t('settings.lastAnalysisDate')}</span>
                                <span className="font-semibold text-on-surface">{lastAnalysisDate || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Settings Forms */}
                <div className="lg:col-span-8 space-y-6">
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                        
                        {/* 1. Profile Section */}
                        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-lg space-y-4">
                            <h3 className="font-headline-sm font-bold text-on-surface border-b border-outline-variant/30 pb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">person_outline</span>
                                {t('settings.profile')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-label-md text-on-surface-variant">{t('settings.fullName')}</label>
                                    <input 
                                        type="text" 
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-label-md text-on-surface-variant">{t('settings.currency')}</label>
                                    <select 
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="TRY">TRY (₺)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-label-md text-on-surface-variant">{t('settings.monthlyIncome')}</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={primaryIncome}
                                            onChange={(e) => setPrimaryIncome(e.target.value)}
                                            required
                                            className="w-full bg-surface-container border border-outline-variant/50 rounded-xl pl-10 pr-4 py-3 text-on-surface focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">
                                            {currency === 'TRY' ? '₺' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Language & Theme Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Language Card */}
                            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                                <div className="mb-4">
                                    <h3 className="font-headline-sm font-bold text-on-surface flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-primary">translate</span>
                                        {t('settings.language')}
                                    </h3>
                                    <p className="text-xs text-on-surface-variant">{t('settings.switchLanguage')}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setLanguage('en')}
                                        className={`py-3 rounded-xl border font-bold text-xs uppercase transition-all ${
                                            language === 'en' 
                                            ? 'bg-primary text-white border-primary' 
                                            : 'bg-surface-container hover:bg-surface-variant text-on-surface-variant border-outline-variant/30'
                                        }`}
                                    >
                                        English
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setLanguage('tr')}
                                        className={`py-3 rounded-xl border font-bold text-xs uppercase transition-all ${
                                            language === 'tr' 
                                            ? 'bg-primary text-white border-primary' 
                                            : 'bg-surface-container hover:bg-surface-variant text-on-surface-variant border-outline-variant/30'
                                        }`}
                                    >
                                        Türkçe
                                    </button>
                                </div>
                            </div>

                            {/* Theme Card */}
                            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                                <div className="mb-4">
                                    <h3 className="font-headline-sm font-bold text-on-surface flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-primary">palette</span>
                                        {t('settings.theme')}
                                    </h3>
                                    <p className="text-xs text-on-surface-variant">{t('settings.switchTheme')}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <button 
                                        type="button"
                                        onClick={toggleTheme}
                                        className={`py-3 rounded-xl border font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${
                                            theme === 'light' 
                                            ? 'bg-primary text-white border-primary' 
                                            : 'bg-surface-container hover:bg-surface-variant text-on-surface-variant border-outline-variant/30'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-sm">light_mode</span>
                                        {t('settings.lightMode')}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={toggleTheme}
                                        className={`py-3 rounded-xl border font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${
                                            theme === 'dark' 
                                            ? 'bg-primary text-white border-primary' 
                                            : 'bg-surface-container hover:bg-surface-variant text-on-surface-variant border-outline-variant/30'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-sm">dark_mode</span>
                                        {t('settings.darkMode')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 3. Financial Preferences */}
                        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-lg space-y-4">
                            <h3 className="font-headline-sm font-bold text-on-surface border-b border-outline-variant/30 pb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">finance</span>
                                {t('settings.financialPreferences')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-label-md text-on-surface-variant">{t('settings.riskTolerance')}</label>
                                    <select 
                                        value={risk}
                                        onChange={(e) => setRisk(e.target.value)}
                                        className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                    >
                                        <option value="conservative">{t('settings.riskConservative')}</option>
                                        <option value="balanced">{t('settings.riskBalanced')}</option>
                                        <option value="aggressive">{t('settings.riskAggressive')}</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-label-md text-on-surface-variant">{t('settings.monthlySavingsTarget')}</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={monthlySavingsTarget}
                                            onChange={(e) => setMonthlySavingsTarget(e.target.value)}
                                            className="w-full bg-surface-container border border-outline-variant/50 rounded-xl pl-10 pr-4 py-3 text-on-surface focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">
                                            {currency === 'TRY' ? '₺' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-label-md text-on-surface-variant">{t('settings.purchaseStyle')}</label>
                                    <select 
                                        value={purchaseStyle}
                                        onChange={(e) => setPurchaseStyle(e.target.value)}
                                        className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                    >
                                        <option value="frugal">{t('settings.styleFrugal')}</option>
                                        <option value="balanced">{t('settings.styleBalanced')}</option>
                                        <option value="spender">{t('settings.styleSpender')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Save Action Buttons */}
                        <div className="flex justify-end gap-4 pt-4 border-t border-outline-variant/30">
                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="px-8 py-3.5 bg-primary text-white font-label-md rounded-xl hover:bg-primary-container disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        {t('settings.saving')}
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">save</span>
                                        {t('common.save')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* 4. Data Management Section */}
                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-lg space-y-4">
                        <h3 className="font-headline-sm font-bold text-on-surface border-b border-outline-variant/30 pb-3 flex items-center gap-2 text-error">
                            <span className="material-symbols-outlined text-error">shield</span>
                            {t('settings.dataManagement')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between space-y-4">
                                <div>
                                    <h4 className="font-label-lg font-bold text-on-surface">{t('settings.clearHistory')}</h4>
                                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{t('settings.clearHistoryDesc')}</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setShowArchiveModal(true)}
                                    className="w-full py-2.5 bg-error/10 hover:bg-error/20 text-error font-semibold text-xs rounded-lg transition-colors border border-error/20"
                                >
                                    {t('settings.clearHistory')}
                                </button>
                            </div>

                            <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between space-y-4">
                                <div>
                                    <h4 className="font-label-lg font-bold text-on-surface">{t('settings.resetOnboarding')}</h4>
                                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{t('settings.resetOnboardingDesc')}</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setShowResetModal(true)}
                                    className="w-full py-2.5 bg-error/10 hover:bg-error/20 text-error font-semibold text-xs rounded-lg transition-colors border border-error/20"
                                >
                                    {t('settings.resetOnboarding')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
            {showToast && (
                <div className="fixed bottom-6 right-6 z-50 bg-surface-container-high border border-primary/30 rounded-xl py-3 px-6 shadow-2xl flex items-center gap-3 text-primary animate-fade-in">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="font-label-md font-bold">{toastMessage}</span>
                </div>
            )}

            {/* Custom Onboarding Reset Confirmation Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="bg-surface-container-high border border-outline-variant/30 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-error"></div>
                        <div className="flex gap-4">
                            <span className="material-symbols-outlined text-4xl text-error">warning</span>
                            <div className="space-y-2">
                                <h3 className="font-headline-sm font-bold text-on-surface">{t('settings.resetOnboarding')}</h3>
                                <p className="font-body-sm text-on-surface-variant leading-relaxed">
                                    {t('settings.confirmReset')}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                onClick={() => setShowResetModal(false)}
                                className="px-5 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface font-label-md hover:bg-surface-variant transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button 
                                onClick={handleResetOnboarding}
                                className="px-5 py-2.5 bg-error text-white font-label-md rounded-xl hover:bg-error/80 transition-colors shadow-lg"
                            >
                                {t('settings.resetOnboarding')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Archive History Confirmation Modal */}
            {showArchiveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="bg-surface-container-high border border-outline-variant/30 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-error"></div>
                        <div className="flex gap-4">
                            <span className="material-symbols-outlined text-4xl text-error">archive</span>
                            <div className="space-y-2">
                                <h3 className="font-headline-sm font-bold text-on-surface">{t('settings.clearHistory')}</h3>
                                <p className="font-body-sm text-on-surface-variant leading-relaxed">
                                    {t('settings.confirmClearHistory')}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                onClick={() => setShowArchiveModal(false)}
                                className="px-5 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface font-label-md hover:bg-surface-variant transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button 
                                onClick={handleArchiveHistory}
                                className="px-5 py-2.5 bg-error text-white font-label-md rounded-xl hover:bg-error/80 transition-colors shadow-lg"
                            >
                                {t('settings.clearHistory')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
