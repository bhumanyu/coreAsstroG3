import type { UserFacingCopyProvider } from './userFacingInterpretation';

const hindiUserFacingCopy: UserFacingCopyProvider = {
  labels: Object.freeze({
    STRONGLY_SUPPORTED: 'अत्यंत सहायक संकेत',
    SUPPORTED: 'सहायक संकेत',
    CONDITIONALLY_SUPPORTED: 'शर्तों के साथ सहायक संकेत',
    MIXED: 'सहायक और चुनौतीपूर्ण संकेतों का मिश्रण',
    CHALLENGED: 'चुनौतीपूर्ण संकेत',
    LIMITED: 'सीमित संकेत',
    VERY_STRONG: 'बहुत मजबूत आधारभूत संकेत',
    STRONG: 'मजबूत आधारभूत संकेत',
    MODERATE: 'मध्यम आधारभूत संकेत',
    WEAK: 'सीमित आधारभूत संकेत',
    VERY_WEAK: 'बहुत सीमित आधारभूत संकेत',
    HIGH: 'साक्ष्य पर उच्च विश्वास',
    MEDIUM: 'साक्ष्य पर मध्यम विश्वास',
    LOW: 'साक्ष्य पर सीमित विश्वास',
    SUPPORT: 'सहायक',
    CHALLENGE: 'चुनौतीपूर्ण',
    NEUTRAL: 'तटस्थ',
    UNDETERMINED: 'अभी निर्धारित नहीं',
    AVAILABLE: 'उपलब्ध',
    UNAVAILABLE: 'इस विश्लेषण के लिए उपलब्ध नहीं',
    CONDITIONAL: 'शर्तों के साथ उपलब्ध',
    PARTIAL: 'आंशिक रूप से उपलब्ध',
    INSUFFICIENT: 'पर्याप्त जानकारी नहीं',
    INSUFFICIENT_DATA: 'आकलन के लिए पर्याप्त जानकारी नहीं',
    BLOCKED: 'आवश्यक पूर्वशर्त पूरी न होने से आकलन नहीं किया गया',
    NOT_APPLICABLE: 'इस विश्लेषण पर लागू नहीं',
    NOT_ASSESSED: 'आकलन नहीं किया गया',
    NOT_PROVIDED: 'प्रदान नहीं किया गया',
    COMPLETE: 'पूर्ण',
    READY: 'तैयार',
    ERROR: 'पूरा नहीं हो सका',
    IDLE: 'शुरू नहीं हुआ',
    LOADING: 'जारी है',
    ACTIVATES: 'यह अवधि संबंधित कुंडली संकेतों को सक्रिय करती है',
    PARTIALLY_ACTIVATES: 'यह अवधि कुछ संबंधित कुंडली संकेतों को सक्रिय करती है',
    DOES_NOT_ACTIVATE: 'यह अवधि इन संकेतों को स्पष्ट रूप से सक्रिय नहीं करती',
    CHALLENGES: 'यह अवधि इन संकेतों पर चुनौतीपूर्ण प्रभाव डालती है',
    STRONGLY_SUPPORTS: 'यह अवधि इन संकेतों को प्रबल समर्थन देती है',
    SUPPORTS: 'यह अवधि इन संकेतों को समर्थन देती है',
    CONTRADICTS: 'यह अवधि इन संकेतों से विरोध दर्शाती है',
    UNKNOWN: 'उपलब्ध जानकारी से प्रभाव निर्धारित नहीं हो सका',
    TRIGGER: 'गोचर सक्रियता का संकेत है',
    MODIFIER: 'गोचर मूल संकेतों में बदलाव ला सकते हैं',
    NO_MATERIAL_TRIGGER: 'कोई महत्वपूर्ण गोचर सक्रियता नहीं मिली',
    PAST: 'बीती हुई अवधि',
    CURRENT: 'वर्तमान अवधि',
    FUTURE: 'आगामी अवधि',
    ACTIVE: 'वर्तमान में सक्रिय',
    PARTIALLY_ACTIVE: 'आंशिक रूप से सक्रिय',
    NOT_ACTIVE: 'कोई स्पष्ट सक्रियता नहीं मिली',
    CONFIRMS: 'विभागीय कुंडली जन्मकुंडली के संकेत का समर्थन करती है',
    PARTIALLY_CONFIRMS: 'विभागीय कुंडली आंशिक समर्थन देती है',
    MODIFIES: 'विभागीय कुंडली संकेत के संभावित रूप को बदलती है',
    CONFLICTS: 'विभागीय कुंडली में परस्पर विरोधी संकेत हैं',
    PRIMARY: 'मुख्य कारक',
    SUPPORTING: 'सहायक कारक',
    CHALLENGING: 'चुनौतीपूर्ण कारक',
    REFINEMENT: 'सूक्ष्मता बताने वाला कारक',
    CONFLICTING: 'विरोधी कारक',
    NONE: 'कोई नहीं मिला',
    MINIMAL: 'न्यूनतम',
    MILD: 'हल्का',
    CRITICAL: 'गंभीर'
  }),
  assessmentLabels: Object.freeze({ MIXED: 'मिश्रित संकेत' }),
  explanations: Object.freeze({
    MIXED: 'उपलब्ध संकेत एक से अधिक दिशाओं की ओर इशारा करते हैं। कुछ कारक समर्थन देते हैं, जबकि अन्य चुनौतियां दर्शाते हैं; इसे पूरी तरह अनुकूल या प्रतिकूल परिणाम नहीं मानना चाहिए।',
    NEUTRAL: 'उपलब्ध साक्ष्य से स्पष्ट सहायक या चुनौतीपूर्ण प्रभाव नहीं दिखता। तटस्थ होने का अर्थ यह नहीं कि प्रगति असंभव है।',
    NOT_ACTIVE: 'चुनी गई अवधि में संबंधित संकेतों की स्पष्ट सक्रियता नहीं दिखती। यह समय से जुड़ा अवलोकन है, जन्मकुंडली की क्षमता पर नकारात्मक निर्णय नहीं।',
    UNAVAILABLE: 'उपलब्ध और सत्यापित जानकारी से इस भाग का आकलन नहीं हो सका। इसकी अनुपस्थिति को परिणाम के विरुद्ध साक्ष्य नहीं मानना चाहिए।',
    INSUFFICIENT_DATA: 'इस आकलन के लिए पर्याप्त सत्यापित जानकारी नहीं है। अनुपलब्ध जानकारी से अनुकूल या प्रतिकूल निष्कर्ष नहीं निकाला जाता।',
    BLOCKED: 'आवश्यक पूर्वशर्त या सत्यापन पूरा न होने के कारण यह आकलन रोका गया है।',
    PARTIAL: 'इस आकलन का केवल एक भाग पूरा हो सका। अनुपलब्ध भाग को नकारात्मक साक्ष्य नहीं माना जाता।',
    HIGH: 'इस आकलन के लिए उपलब्ध साक्ष्य अपेक्षाकृत पूर्ण हैं। विश्वास का स्तर साक्ष्य की पूर्णता बताता है, ज्योतिषीय संकेतों की शक्ति नहीं।',
    MEDIUM: 'उपलब्ध साक्ष्य मध्यम विश्वास का आधार देते हैं। विश्वास का स्तर ज्योतिषीय संकेतों की शक्ति से अलग है।',
    LOW: 'महत्वपूर्ण साक्ष्य अनुपलब्ध या अधूरे हैं, इसलिए इस व्याख्या को सावधानी से लें। कम विश्वास का अर्थ कमजोर ज्योतिषीय संकेत नहीं है।',
    STRONG: 'जन्मकुंडली के मूल संकेत प्रबल हैं। यह आधार का वर्णन है, वर्तमान समय या किसी घटना की निश्चितता का नहीं।',
    SUPPORT: 'इस आकलन में सहायक संकेत मौजूद हैं।',
    CHALLENGE: 'इस आकलन में चुनौतीपूर्ण संकेत मौजूद हैं।',
    ACTIVE: 'चुनी गई अवधि समय-आकलन में सक्रिय है।',
    PARTIALLY_ACTIVE: 'चुनी गई अवधि समय-आकलन में आंशिक रूप से सक्रिय है।',
    CHALLENGED: 'चुनी गई अवधि में चुनौतीपूर्ण समय-संकेत हैं।',
    UNKNOWN: 'उपलब्ध जानकारी से समय का प्रभाव निर्धारित नहीं हो सका।'
  }),
  outcomes: Object.freeze({
    STRONGLY_SUPPORTED: 'बहुत सहायक करियर संकेत',
    SUPPORTED: 'सहायक संकेत',
    CONDITIONALLY_SUPPORTED: 'शर्तों के साथ सहायक संकेत',
    MIXED: 'मिश्रित संकेत',
    CHALLENGED: 'चुनौतीपूर्ण संकेत',
    VERY_STRONG: 'बहुत मजबूत संकेत',
    STRONG: 'मजबूत संकेत',
    MODERATE: 'मध्यम संकेत',
    INSUFFICIENT_DATA: 'आकलन के लिए पर्याप्त जानकारी नहीं',
    LIMITED: 'सीमित संकेत',
    UNAVAILABLE: 'आकलन संभव नहीं',
    SUPPORT: 'सहायक संकेत',
    CHALLENGE: 'चुनौतीपूर्ण संकेत',
    NEUTRAL: 'तटस्थ संकेत',
    CONDITIONAL: 'शर्तों के साथ संकेत',
    PARTIAL: 'आंशिक आकलन',
    AVAILABLE: 'उपलब्ध',
    UNDETERMINED: 'अभी निर्धारित नहीं'
  }),
  directionLabels: Object.freeze({
    SUPPORT: 'सहायक संकेत',
    CHALLENGE: 'चुनौतीपूर्ण संकेत',
    MIXED: 'मिश्रित संकेत',
    NEUTRAL: 'तटस्थ संकेत',
    INSUFFICIENT_DATA: 'पर्याप्त जानकारी नहीं',
    CONDITIONAL: 'शर्तों के साथ संकेत',
    UNAVAILABLE: 'उपलब्ध नहीं'
  }),
  confidenceLabels: Object.freeze({
    HIGH: 'उच्च विश्वास',
    MEDIUM: 'मध्यम विश्वास',
    LOW: 'सीमित विश्वास'
  }),
  confidenceUnavailable: 'विश्वास का स्तर उपलब्ध नहीं',
  strengthLabels: Object.freeze({
    VERY_STRONG: 'बहुत मजबूत आधार',
    STRONG: 'मजबूत आधार',
    MODERATE: 'मध्यम आधार',
    WEAK: 'सीमित आधार',
    VERY_WEAK: 'बहुत सीमित आधार',
    MIXED: 'मिश्रित आधार',
    UNDETERMINED: 'आकलन नहीं किया गया'
  }),
  foundationUnavailable: 'आधार का आकलन नहीं हुआ',
  wealthFoundationLabels: Object.freeze({
    VERY_STRONG: 'बहुत मजबूत आधार',
    STRONG: 'मजबूत आधार',
    MODERATE: 'मध्यम आधार',
    MIXED: 'मिश्रित आधार',
    CHALLENGED: 'चुनौतीपूर्ण आधार',
    INSUFFICIENT_DATA: 'आधार का आकलन नहीं हुआ'
  }),
  detailLabels: Object.freeze({
    'FINAL OUTCOME': 'अंतिम निष्कर्ष',
    'INTEGRATED DIRECTION': 'समेकित दिशा',
    'INTEGRATED STRENGTH': 'समेकित शक्ति',
    ACCUMULATION: 'संचय',
    GAINS: 'लाभ',
    FORTUNE: 'भाग्य',
    SPECULATION: 'सट्टा-संबंधी संकेत'
  }),
  titles: Object.freeze({
    FOUNDATION: 'आधार',
    'DASHA SUPPORT': 'दशा का समर्थन',
    TIMING: 'समय',
    'EVIDENCE CONFIDENCE': 'साक्ष्य पर विश्वास',
    'MORE ASSESSMENT DETAIL': 'आकलन का अधिक विवरण',
    'ADDITIONAL ASSESSMENT': 'अतिरिक्त आकलन'
  }),
  notAssessed: 'आकलन नहीं किया गया',
  notAvailable: 'उपलब्ध नहीं',
  notAssessedExplanation: 'उपलब्ध संरचित जानकारी से इस आयाम का आकलन नहीं हुआ।',
  genericExplanation: 'यह वर्णनात्मक आकलन है, निश्चित परिणाम की गारंटी नहीं।',
  mixedFoundationLabel: (strengthLabel) => `${strengthLabel} के साथ मिश्रित संकेत`,
  mixedFoundationExplanation: (strengthLabel) =>
    `${strengthLabel} के साथ सहायक और चुनौतीपूर्ण, दोनों कारक मौजूद हैं। मजबूत आधार अनुकूल परिणाम की गारंटी नहीं देता।`,
  combinedFoundationLabel: (strengthLabel, directionLabel) =>
    `${strengthLabel} के साथ ${directionLabel}`,
  combinedFoundationExplanation: (strengthLabel, direction) => {
    if (direction === 'SUPPORT') {
      return `${strengthLabel} और सहायक कारक जन्मकुंडली के आधार का वर्णन करते हैं; इनमें से कोई भी किसी परिणाम की गारंटी नहीं देता।`;
    }
    if (direction === 'CHALLENGE') {
      return `${strengthLabel} के साथ चुनौतीपूर्ण कारक भी हैं; इससे अनुकूल परिणाम असंभव सिद्ध नहीं होता।`;
    }
    if (direction === 'NEUTRAL') {
      return `${strengthLabel} के साथ तटस्थ संकेत हैं; स्पष्ट सहायक या चुनौतीपूर्ण दिशा स्थापित नहीं होती।`;
    }
    return `${strengthLabel} के साथ शर्तों वाले संकेत हैं; यह निश्चित परिणाम की गारंटी नहीं।`;
  },
  foundationDirectionExplanation: (direction) => {
    if (direction === 'SUPPORT') {
      return 'संरचित जन्मकुंडली आकलन में सहायक संकेत हैं; यह निश्चित परिणाम की भविष्यवाणी नहीं है।';
    }
    if (direction === 'CHALLENGE') {
      return 'संरचित जन्मकुंडली आकलन में चुनौतीपूर्ण संकेत हैं; इससे परिणाम असंभव सिद्ध नहीं होता।';
    }
    if (direction === 'NEUTRAL') {
      return 'उपलब्ध साक्ष्य से स्पष्ट सहायक या चुनौतीपूर्ण प्रभाव नहीं दिखता।';
    }
    return 'संरचित जन्मकुंडली आकलन शर्तों पर आधारित है और निश्चित परिणाम की गारंटी नहीं देता।';
  },
  foundationStrengthExplanation: (strength) =>
    `यह ${strength.toLowerCase()} मूल कुंडली संकेत का वर्णन है, वर्तमान समय या घटना की निश्चितता का नहीं।`,
  conditionalSupportLabel: 'शर्तों के साथ समर्थन',
  conditionalSupportExplanation: 'उपलब्ध अवधि-संकेत शर्तों पर आधारित हैं; इन्हें निश्चित परिणाम न मानें।',
  timingExplanation: 'यह समय से जुड़ा अवलोकन है और मूल कुंडली आकलन को नहीं बदलता।',
  confidenceExplanation: 'विश्वास का स्तर साक्ष्य की पूर्णता बताता है, ज्योतिषीय शक्ति नहीं।',
  combinedDimensionLabel: (careerLabel, wealthLabel) =>
    `करियर: ${careerLabel}; धन: ${wealthLabel}`,
  combinedDimensionExplanation: (careerExplanation, wealthExplanation) =>
    `करियर: ${careerExplanation} धन: ${wealthExplanation}`,
  domainDetailLabel: (domain, label) =>
    `${domain === 'career' ? 'करियर' : 'धन'} — ${label}`,
  periodSupportExplanation: 'यह अवधि के समर्थन का वर्णन है, मूल कुंडली आधार का नहीं।',
  domainOutcome: (outcome, domain) =>
    `${domain === 'career' ? 'करियर' : 'धन'} का आकलन: ${outcome}`,
  combinedSummary: (careerOutcome, wealthOutcome) =>
    `${careerOutcome}; ${wealthOutcome}।`,
  wealthFoundationExplanation: (status) => {
    if (status === 'MIXED') {
      return 'धन के आधार में सहायक और चुनौतीपूर्ण, दोनों कारक मौजूद हैं; परिणाम पूरी तरह अनुकूल या प्रतिकूल नहीं है।';
    }
    if (status === 'CHALLENGED') {
      return 'संरचित धन-आधार आकलन में चुनौतीपूर्ण संकेत हैं; इसका अर्थ यह नहीं कि वित्तीय परिणाम असंभव हैं।';
    }
    if (status === 'INSUFFICIENT_DATA') {
      return 'धन के आधार का आकलन करने के लिए पर्याप्त सत्यापित जानकारी नहीं है।';
    }
    return 'यह जन्मकुंडली के धन-आधार का वर्णन है, निश्चित वित्तीय परिणाम की गारंटी नहीं।';
  },
  additionalDetailLabel: (index) => `अतिरिक्त आकलन (${index})`,
  evidenceRoleLabels: Object.freeze({
    PRIMARY: 'मुख्य कारक',
    SUPPORTING: 'सहायक साक्ष्य',
    CHALLENGING: 'चुनौतीपूर्ण साक्ष्य',
    MODIFIER: 'बदलावकारी कारक',
    REFINEMENT: 'सूक्ष्मता बताने वाला कारक',
    CONFLICTING: 'विरोधी साक्ष्य',
    NEUTRAL: 'तटस्थ साक्ष्य'
  }),
  evidenceDirectionLabels: Object.freeze({
    SUPPORT: 'सहायक',
    CHALLENGE: 'चुनौतीपूर्ण',
    NEUTRAL: 'तटस्थ',
    MIXED: 'मिश्रित',
    UNAVAILABLE: 'आकलन नहीं हुआ'
  }),
  evidenceSourceLabels: Object.freeze({
    C4_STRUCTURAL_REASONING: 'कुंडली का संरचनात्मक विश्लेषण',
    D1: 'जन्मकुंडली (D1)',
    D2: 'धन विभागीय कुंडली (D2)',
    D10: 'करियर विभागीय कुंडली (D10)',
    DASHA: 'ग्रह अवधि का विश्लेषण',
    TRANSIT: 'गोचर विश्लेषण'
  }),
  unknownEvidenceRoleLabel: 'साक्ष्य कारक',
  unknownEvidenceDirectionLabel: 'दिशा का आकलन नहीं हुआ',
  unknownEvidenceSourceLabel: 'कुंडली विश्लेषण',
  evidenceHousePairTitle: (firstHouse, secondHouse) =>
    `${firstHouse}वें और ${secondHouse}वें भाव का संबंध`,
  evidenceHouseTitle: (house, sourceType) =>
    sourceType?.toUpperCase() === 'STRENGTH'
      ? `${house}वें भाव की शक्ति`
      : `${house}वें भाव का विश्लेषण`,
  evidencePlanetTitle: (planet, house) =>
    house === undefined ? `${planet} का कुंडली विश्लेषण` : `${house}वें भाव में ${planet}`,
  evidenceSummary: (roleLabel, directionLabel) =>
    `${roleLabel}: ${directionLabel}।`
};

export const HINDI_USER_FACING_COPY: UserFacingCopyProvider = Object.freeze(hindiUserFacingCopy);
