import { useTranslation } from 'react-i18next';

type Language = 'zh' | 'en' | 'system';

const LANGUAGE_KEY = 'opencode-language';

export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLanguage: Language =
    localStorage.getItem(LANGUAGE_KEY) === null
      ? 'system'
      : (i18n.language as 'zh' | 'en');

  const setLanguage = (lang: Language) => {
    if (lang === 'system') {
      localStorage.removeItem(LANGUAGE_KEY);
      const systemLang = navigator.language.startsWith('zh') ? 'zh' : 'en';
      i18n.changeLanguage(systemLang);
    } else {
      localStorage.setItem(LANGUAGE_KEY, lang);
      i18n.changeLanguage(lang);
    }
  };

  return { currentLanguage, setLanguage };
}