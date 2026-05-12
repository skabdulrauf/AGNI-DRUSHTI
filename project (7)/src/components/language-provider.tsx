
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'kn';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.grid': 'Tactical Grid',
    'nav.report': 'Report Smoke',
    'nav.alerts': 'Live Alerts',
    'nav.about': 'About',
    'nav.ranger_login': 'Ranger Login',
    'nav.ranger_command': 'Ranger Command',
    'hero.title': 'जंगल की आँख',
    'hero.subtitle': 'Next-generation forest fire early-warning system powered by Gemini, synchronizing real-time satellite telemetry with multi-language citizen reporting.',
    'report.heading': 'Report Smoke',
    'report.subheading': 'Real-time AI verification for Indian forest residents.',
    'report.description_label': 'Incident Description',
    'report.urgency_label': 'Urgency Level',
    'report.urgency_low': 'Smoke Only',
    'report.urgency_medium': 'Likely Fire',
    'report.urgency_high': 'Active Fire',
    'report.gps_label': 'GPS Position',
    'report.gps_locked': 'LOCKED',
    'report.photo_label': 'Attach Photo',
    'report.submit': 'Initiate SITREP',
    'report.success_title': 'जंगल रक्षित!',
    'report.success_desc': 'Your GPS-tagged information has been verified by AI and routed to the nearest Forest Range Officer.',
    'assistant.name': 'AGNI TACTICAL',
    'assistant.status': 'Ready for Interdiction',
    'grid.scanning': 'Syncing...',
    'grid.sync': 'Live Link',
  },
  hi: {
    'nav.home': 'होम',
    'nav.grid': 'सामरिक ग्रिड',
    'nav.report': 'धुएं की रिपोर्ट',
    'nav.alerts': 'लाइव अलर्ट',
    'nav.about': 'परिचय',
    'nav.ranger_login': 'रेंजर लॉगिन',
    'nav.ranger_command': 'रेंजर कमांड',
    'hero.title': 'जंगल की आँख',
    'hero.subtitle': 'जेमिनी द्वारा संचालित अगली पीढ़ी की जंगल की आग की चेतावनी प्रणाली, रीयल-टाइम उपग्रह टेलीमेट्री को बहु-भाषी नागरिक रिपोर्टिंग के साथ सिंक्रनाइज़ करती है।',
    'report.heading': 'धुएं की रिपोर्ट करें',
    'report.subheading': 'भारतीय वन निवासियों के लिए रीयल-टाइम एआई सत्यापन।',
    'report.description_label': 'घटना का विवरण',
    'report.urgency_label': 'जल्दबाजी का स्तर',
    'report.urgency_low': 'केवल धुआं',
    'report.urgency_medium': 'आग की संभावना',
    'report.urgency_high': 'सक्रिय आग',
    'report.gps_label': 'जीपीएस स्थिति',
    'report.gps_locked': 'LOCKED',
    'report.photo_label': 'फोटो जोड़ें',
    'report.submit': 'सिट्रेಪ शुरू करें',
    'report.success_title': 'जंगल रक्षित!',
    'report.success_desc': 'आपकी जीपीएस-टैग की गई जानकारी एआई द्वारा सत्यापित की गई है और निकटतम वन रेंज अधिकारी को भेज दी गई है।',
    'assistant.name': 'अग्नि सामरिक',
    'assistant.status': 'हस्तक्षेप के लिए तैयार',
    'grid.scanning': 'सिंक हो रहा है...',
    'grid.sync': 'लाइव लिंक',
  },
  kn: {
    'nav.home': 'ಮನೆ',
    'nav.grid': 'ಟ್ಯಾಕ್ಟಿಕಲ್ ಗ್ರಿಡ್',
    'nav.report': 'ಹೊಗೆ ವರದಿ',
    'nav.alerts': 'ಲೈವ್ ಅಲರ್ಟ್‌ಗಳು',
    'nav.about': 'ನಮ್ಮ ಬಗ್ಗೆ',
    'nav.ranger_login': 'ರೇಂಜರ್ ಲಾಗಿನ್',
    'nav.ranger_command': 'ರೇಂಜರ್ ಕಮಾಂಡ್',
    'hero.title': 'ಜಂಗಲ್ ಕಣ್ಣು',
    'hero.subtitle': 'ಜೆಮಿನಿಯಿಂದ ನಡೆಸಲ್ಪಡುವ ಮುಂದಿನ ಪೀಳಿಗೆಯ ಅರಣ್ಯ ಬೆಂಕಿ ಮುನ್ನೆಚ್ಚರಿಕೆ ವ್ಯವಸ್ಥೆ, ನೈಜ-ಸಮಯದ ಉಪಗ್ರಹ ಟೆಲಿಮೆಟ್ರಿಯನ್ನು ಬಹು-ಭಾಷಾ ನಾಗರಿಕ ವರದಿ ಮಾಡುವಿಕೆಯೊಂದಿಗೆ ಸಿಂಕ್ರೊನೈಸ್ ಮಾಡುತ್ತದೆ.',
    'report.heading': 'ಹೊಗೆಯನ್ನು ವರದಿ ಮಾಡಿ',
    'report.subheading': 'ಭಾರತೀಯ ಅರಣ್ಯ ನಿವಾಸಿಗಳಿಗೆ ನೈಜ-ಸಮಯದ AI ಪರಿಶೀಲನೆ.',
    'report.description_label': 'ಘಟನೆಯ ವಿವರಣೆ',
    'report.urgency_label': 'ತುರ್ತು ಮಟ್ಟ',
    'report.urgency_low': 'ಕೇವಲ ಹೊಗೆ',
    'report.urgency_medium': 'ಬೆಂಕಿಯ ಸಂಭವನೀಯತೆ',
    'report.urgency_high': 'ಸಕ್ರಿಯ ಬೆಂಕಿ',
    'report.gps_label': 'ಜಿಪಿಎಸ್ ಸ್ಥಾನ',
    'report.gps_locked': 'LOCKED',
    'report.photo_label': 'ಫೋಟೋ ಲಗತ್ತಿಸಿ',
    'report.submit': 'ಸೈಟ್ರೆಪ್ ಪ್ರಾರಂಭಿಸಿ',
    'report.success_title': 'ಅರಣ್ಯ ಸಂರಕ್ಷಿತ!',
    'report.success_desc': 'ನಿಮ್ಮ ಜಿಪಿಎಸ್-ಟ್ಯಾಗ್ ಮಾಡಲಾದ ಮಾಹಿತಿಯನ್ನು AI ನಿಂದ ಪರಿಶೀಲಿಸಲಾಗಿದೆ ಮತ್ತು ಹತ್ತಿರದ ಅರಣ್ಯ ಶ್ರೇಣಿ ಅಧಿಕಾರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.',
    'assistant.name': 'ಅಗ್ನಿ ಟ್ಯಾಕ್ಟಿಕಲ್',
    'assistant.status': 'ಮಧ್ಯಸ್ಥಿಕೆಗೆ ಸಿದ್ಧವಾಗಿದೆ',
    'grid.scanning': 'ಸಿಂಕ್ ಆಗುತ್ತಿದೆ...',
    'grid.sync': 'ಲೈವ್ ಲಿಂಕ್',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('agni_lang') as Language;
    if (saved && ['en', 'hi', 'kn'].includes(saved)) {
      setLanguage(saved);
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('agni_lang', lang);
  };

  const t = (key: string) => translations[language]?.[key] || translations['en']?.[key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
