import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export default function Settings() {
    const { language, toggleLanguage, t } = useLanguage();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="p-8 max-w-4xl mx-auto w-full">
            <h1 className="font-display-lg text-display-lg text-on-surface mb-8">{t('nav.settings')}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-card-padding flex flex-col justify-between shadow-sm">
                    <div className="mb-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                            <span className="material-symbols-outlined">translate</span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{t('settings.language')}</h3>
                        <p className="font-body-md text-on-surface-variant">{t('settings.switchLanguage')}</p>
                    </div>
                    <button 
                        onClick={toggleLanguage}
                        className="w-full py-3 bg-surface-container-high border border-outline-variant/50 rounded-lg text-primary font-label-md hover:bg-surface-variant transition-colors uppercase"
                    >
                        {language === 'en' ? 'Türkçe\'ye Geç' : 'Switch to English'}
                    </button>
                </div>
                
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-card-padding flex flex-col justify-between shadow-sm">
                    <div className="mb-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                            <span className="material-symbols-outlined">palette</span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{t('settings.theme')}</h3>
                        <p className="font-body-md text-on-surface-variant">{t('settings.switchTheme')}</p>
                    </div>
                    <button 
                        onClick={toggleTheme}
                        className="w-full py-3 bg-surface-container-high border border-outline-variant/50 rounded-lg text-primary font-label-md hover:bg-surface-variant transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                        {theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
                    </button>
                </div>
            </div>
        </div>
    );
}
