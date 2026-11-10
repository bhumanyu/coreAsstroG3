import type { AppLanguage } from './config';

export const resources = {
  en: {
    common: {
      appName: 'CoreAstro',
      language: 'Language',
      english: 'English',
      hindi: 'हिन्दी',
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      loading: 'Loading...',
      retry: 'Retry',
      back: 'Back',
      next: 'Next',
      search: 'Search',
      noData: 'No data available',
      error: 'Something went wrong',
      generateHoroscope: 'Generate Horoscope'
    },
    navigation: {
      productViews: 'Product Views',
      researchTools: 'Research & Developer Tools',
      overview: 'Overview',
      career: 'Career',
      wealth: 'Wealth',
      dasha: 'Dasha & Timing',
      reasoning: 'Why This Result?',
      detailed: 'Detailed Analysis',
      horoscope: 'Horoscope & Charts',
      planets: 'Planets & Dignity',
      transit: 'Transit Analysis',
      divisional: 'Divisional Vargas',
      nakshatras: 'Nakshatra Explorer',
      relationships: 'Natural Relationships',
      validator: 'Golden Vector Test Suite',
      closeMenu: 'Close navigation menu',
      openMenu: 'Open navigation menu',
      descriptions: {
        overview: 'Unified life domain synthesis & key themes',
        career: 'Professional trajectory, status & vocation',
        wealth: 'Financial prosperity, assets & accumulation',
        dasha: 'Vimshottari planetary periods & activation',
        reasoning: 'Astrological reasoning trace & evidence rules',
        detailed: 'Comprehensive classical natal analysis',
        horoscope: 'Primary Rasi chart and fundamental facts',
        planets: 'Planetary positions, dignities & shadbala',
        transit: 'Gochara transits against natal positions',
        divisional: 'Harmonic divisional charts (D1, D3, D9, D10)',
        nakshatras: '27 lunar mansions & planetary padas',
        relationships: 'Planetary friendship and enmity matrix',
        validator: 'Canonical astronomical calculation verification'
      }
    },
    settings: {
      newChart: 'New Chart',
      editBirthDetails: 'Edit Birth Details & Ayanamsa'
    }
  },
  hi: {
    common: {
      appName: 'CoreAstro',
      language: 'भाषा',
      english: 'English',
      hindi: 'हिन्दी',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      close: 'बंद करें',
      loading: 'लोड हो रहा है...',
      retry: 'पुनः प्रयास करें',
      back: 'वापस',
      next: 'आगे',
      search: 'खोजें',
      noData: 'कोई डेटा उपलब्ध नहीं है',
      error: 'कुछ त्रुटि हुई है',
      generateHoroscope: 'जन्म कुंडली बनाएँ'
    },
    navigation: {
      productViews: 'विश्लेषण',
      researchTools: 'अनुसंधान और डेवलपर टूल',
      overview: 'सारांश',
      career: 'करियर',
      wealth: 'धन और संपत्ति',
      dasha: 'दशा और समय',
      reasoning: 'यह निष्कर्ष क्यों?',
      detailed: 'विस्तृत विश्लेषण',
      horoscope: 'कुंडली और चार्ट',
      planets: 'ग्रह और स्थिति',
      transit: 'गोचर विश्लेषण',
      divisional: 'वर्ग कुंडलियाँ',
      nakshatras: 'नक्षत्र परिचय',
      relationships: 'ग्रहों के प्राकृतिक संबंध',
      validator: 'गणना सत्यापन',
      closeMenu: 'नेविगेशन मेनू बंद करें',
      openMenu: 'नेविगेशन मेनू खोलें',
      descriptions: {
        overview: 'जीवन के प्रमुख क्षेत्रों का संयुक्त सारांश',
        career: 'व्यावसायिक दिशा, स्थिति और कार्यक्षेत्र',
        wealth: 'धन, संपत्ति और संचय',
        dasha: 'विंशोत्तरी ग्रह दशाएँ और सक्रियता',
        reasoning: 'ज्योतिषीय तर्क और साक्ष्य के आधार',
        detailed: 'जन्म कुंडली का विस्तृत शास्त्रीय विश्लेषण',
        horoscope: 'मुख्य राशि कुंडली और मूल विवरण',
        planets: 'ग्रहों की स्थिति, बल और षड्बल',
        transit: 'जन्म कुंडली के संदर्भ में गोचर',
        divisional: 'वर्ग कुंडलियाँ (D1, D3, D9, D10)',
        nakshatras: '27 नक्षत्र और उनके चरण',
        relationships: 'ग्रहों की मैत्री और शत्रुता',
        validator: 'खगोलीय गणनाओं का सत्यापन'
      }
    },
    settings: {
      newChart: 'नई कुंडली',
      editBirthDetails: 'जन्म विवरण और अयनांश बदलें'
    }
  }
} as const satisfies Record<AppLanguage, Record<string, Record<string, unknown>>>;
