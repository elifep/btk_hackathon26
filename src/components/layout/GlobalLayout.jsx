import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export default function GlobalLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    
    async function handleLogout() {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    }
    
    // Hide footer on dashboard-like pages later, but show on landing/auth
    const hideFooter = location.pathname.includes('/dashboard') || location.pathname.includes('/explorer');

    return (
        <div className="min-h-screen flex flex-col bg-background text-on-surface font-body-lg antialiased">
            {/* Top Navigation Bar */}
            <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <div className="flex justify-between items-center max-w-7xl mx-auto px-container-margin h-20">
                    <Link to="/" className="text-headline-md font-headline-md font-bold text-primary">
                        SpendWise AI
                    </Link>
                    <div className="hidden md:flex items-center space-x-gutter font-body-lg text-body-lg">
                        <Link to="/explorer" className="text-on-surface-variant hover:text-on-surface transition-colors hover:bg-white/5 duration-300 px-4 py-2 rounded-lg">{t('nav.explorer')}</Link>
                        <Link to="/analysis" className="text-on-surface-variant hover:text-on-surface transition-colors hover:bg-white/5 duration-300 px-4 py-2 rounded-lg">{t('nav.analysis')}</Link>
                        <Link to="/dashboard" className="text-on-surface-variant hover:text-on-surface transition-colors hover:bg-white/5 duration-300 px-4 py-2 rounded-lg">{t('nav.dashboard')}</Link>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-gutter">
                        {/* Language Switcher */}
                        <button 
                            onClick={() => setLanguage(language === 'en' ? 'tr' : 'en')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:text-on-surface text-sm font-label-md shadow-sm transition-all"
                            title={language === 'en' ? 'Switch to Turkish' : 'İngilizceye Geç'}
                        >
                            <span className="material-symbols-outlined text-sm">language</span>
                            <span>{language === 'en' ? 'TR' : 'EN'}</span>
                        </button>
                        
                        {/* Theme Toggle */}
                        <button 
                            onClick={toggleTheme}
                            className="p-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:text-on-surface shadow-sm transition-all mr-1 md:mr-2"
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>

                        {currentUser ? (
                            <button onClick={handleLogout} className="font-label-md text-label-md text-primary bg-transparent hover:bg-white/5 transition-all duration-300 px-4 py-2 rounded-lg active:scale-95 duration-200">
                                {t('nav.logout')}
                            </button>
                        ) : (
                            <Link to="/login" className="font-label-md text-label-md text-primary bg-transparent hover:bg-white/5 transition-all duration-300 px-4 py-2 rounded-lg active:scale-95 duration-200">
                                {language === 'tr' ? 'Giriş Yap' : 'Sign In'}
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Bottom Navigation Bar (Mobile Only) */}
            <nav className="fixed bottom-0 w-full z-50 rounded-t-xl bg-surface-container-low/80 backdrop-blur-lg border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:hidden">
                <div className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe">
                    <Link to="/" className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-variant/20 active:scale-90 transition-transform rounded-xl">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>home</span>
                        <span className="font-label-sm text-label-sm mt-1">{language === 'tr' ? 'Ana Sayfa' : 'Home'}</span>
                    </Link>
                    <Link to="/explorer" className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-variant/20 active:scale-90 transition-transform rounded-xl">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
                        <span className="font-label-sm text-label-sm mt-1">{t('nav.explorer')}</span>
                    </Link>
                    <Link to="/analysis" className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-variant/20 active:scale-90 transition-transform rounded-xl">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>analytics</span>
                        <span className="font-label-sm text-label-sm mt-1">{t('nav.analysis')}</span>
                    </Link>
                    <Link to="/dashboard" className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-variant/20 active:scale-90 transition-transform rounded-xl">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>person</span>
                        <span className="font-label-sm text-label-sm mt-1">{language === 'tr' ? 'Profil' : 'Profile'}</span>
                    </Link>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 pt-24 md:pt-32 pb-section-gap flex flex-col">
                <Outlet />
            </main>

            {/* Footer */}
            {!hideFooter && (
                <footer className="w-full py-section-gap border-t border-surface-variant bg-background pb-24 md:pb-section-gap">
                    <div className="max-w-7xl mx-auto px-container-margin flex flex-col md:flex-row justify-between items-center gap-gutter">
                        <div className="font-headline-sm text-on-surface font-bold text-lg mb-4 md:mb-0">
                            SpendWise AI
                        </div>
                        <div className="flex flex-wrap justify-center gap-6 font-label-sm text-label-sm">
                            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">{language === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}</a>
                            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">{language === 'tr' ? 'Kullanım Koşulları' : 'Terms of Service'}</a>
                            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">{language === 'tr' ? 'Güvenlik' : 'Security'}</a>
                            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">API Documentation</a>
                        </div>
                        <div className="text-on-surface-variant font-label-sm text-label-sm mt-4 md:mt-0">
                            © 2024 SpendWise AI. Obsidian Intelligence for your finances.
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
}
