import React, { createContext, useContext, useEffect } from 'react';
import { Language, translations, TranslationStructure } from '../i18n/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
    t: TranslationStructure;
}

const defaultContext: LanguageContextType = {
    language: 'en',
    setLanguage: () => {},
    toggleLanguage: () => {},
    t: translations.en,
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        document.documentElement.lang = 'en';
        try {
            localStorage.removeItem('novonex_language');
        } catch (_) {}
    }, []);

    return (
        <LanguageContext.Provider value={defaultContext}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);

