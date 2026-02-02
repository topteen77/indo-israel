import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../locales/en/translation.json';
import heTranslations from '../locales/he/translation.json';
import hiTranslations from '../locales/hi/translation.json';
import paTranslations from '../locales/pa/translation.json';

// Get saved language preference or default to English
const getInitialLanguage = () => {
  if (typeof window !== 'undefined') {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && ['en', 'he', 'hi', 'pa'].includes(savedLang)) {
      return savedLang;
    }
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      he: {
        translation: heTranslations,
      },
      hi: {
        translation: hiTranslations,
      },
      pa: {
        translation: paTranslations,
      },
    },
    lng: getInitialLanguage(), // default language or saved preference
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

// Set document direction based on initial language
if (typeof window !== 'undefined') {
  const initialLang = getInitialLanguage();
  if (initialLang === 'he') {
    document.documentElement.dir = 'rtl';
  } else {
    document.documentElement.dir = 'ltr';
  }
}

export default i18n;
