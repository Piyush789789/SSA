import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * A small homemade i18n. Keys are the English UI text itself (so a missing translation simply shows
 * English, and shared components can translate the strings they are given): `t('Save')` -> 'सहेजें'.
 * `en` only holds the few keys whose English differs from the key; `hi` holds the Hindi text.
 * Server data (names, notices, titles) is never passed through t() on purpose, or is left untranslated
 * because it has no dictionary entry.
 */
const en = {};

const hi = {
  // ---- tabs & navigation
  Home: 'होम',
  Dashboard: 'डैशबोर्ड',
  Attendance: 'उपस्थिति',
  Results: 'परिणाम',
  Fees: 'शुल्क',
  More: 'और',
  Marks: 'अंक',
  Homework: 'गृहकार्य',
  Students: 'विद्यार्थी',
  Student: 'विद्यार्थी',
  Exams: 'परीक्षाएँ',

  // ---- screen titles and More-menu items
  'Submit homework': 'गृहकार्य जमा करें',
  Leave: 'अवकाश',
  'Apply for leave': 'अवकाश के लिए आवेदन',
  'Admit card': 'प्रवेश पत्र',
  'Holidays & events': 'छुट्टियाँ और कार्यक्रम',
  Timetable: 'समय सारणी',
  'My timetable': 'मेरी समय सारणी',
  'Study materials': 'अध्ययन सामग्री',
  Notices: 'सूचनाएँ',
  Messages: 'संदेश',
  'New message': 'नया संदेश',
  'Deposit fee': 'शुल्क जमा करें',
  'Pay online': 'ऑनलाइन भुगतान',
  'Report card': 'रिपोर्ट कार्ड',
  Certificates: 'प्रमाण पत्र',
  Notifications: 'अधिसूचनाएँ',
  'My profile': 'मेरी प्रोफ़ाइल',
  'Change password': 'पासवर्ड बदलें',
  'My bus': 'मेरी बस',
  Library: 'पुस्तकालय',
  'ID card': 'पहचान पत्र',
  Gallery: 'फ़ोटो गैलरी',
  Album: 'एल्बम',
  Health: 'स्वास्थ्य',
  'Book PTM': 'अभिभावक-शिक्षक बैठक बुक करें',
  PTM: 'अभिभावक-शिक्षक बैठक',
  'PTM overview': 'अभिभावक-शिक्षक बैठकें',
  'Enter marks': 'अंक दर्ज करें',
  'New homework': 'नया गृहकार्य',
  Submissions: 'जमा किए गए कार्य',
  'My attendance': 'मेरी उपस्थिति',
  'My leave': 'मेरा अवकाश',
  'Student leave requests': 'विद्यार्थियों के अवकाश आवेदन',
  'Post a notice': 'सूचना जारी करें',
  'Report card notes': 'रिपोर्ट कार्ड टिप्पणियाँ',
  'Students needing attention': 'ध्यान देने योग्य विद्यार्थी',
  'Sick-room visit': 'चिकित्सा कक्ष विज़िट',
  'Record sick-room visit': 'चिकित्सा कक्ष विज़िट दर्ज करें',
  'Collect payment': 'भुगतान प्राप्त करें',
  'Attendance today': 'आज की उपस्थिति',
  'Staff attendance': 'कर्मचारी उपस्थिति',
  'Leave requests': 'अवकाश आवेदन',
  Substitutions: 'स्थानापन्न शिक्षक',
  Admissions: 'प्रवेश',
  'Admission enquiries': 'प्रवेश पूछताछ',
  'Library loans': 'जारी पुस्तकें',

  // ---- dashboard headings
  'Today’s schedule': 'आज की समय सारणी',
  'Today’s attendance': 'आज की उपस्थिति',
  'Marks to enter': 'दर्ज करने हेतु अंक',
  'Upcoming exams': 'आगामी परीक्षाएँ',
  'Low attendance (below 75%)': 'कम उपस्थिति (75% से कम)',
  'Homework due': 'जमा करने योग्य गृहकार्य',
  'Recent results': 'हाल के परिणाम',
  'Latest notices': 'नवीनतम सूचनाएँ',
  'Fees pending': 'बकाया शुल्क',
  'Deposits to verify': 'सत्यापन हेतु जमा राशि',
  'Unpaid fees': 'बकाया शुल्क',
  'My attendance today': 'आज मेरी उपस्थिति',
  Teachers: 'शिक्षक',
  Classes: 'कक्षाएँ',
  'Collected today': 'आज प्राप्त राशि',
  'Collected (year)': 'प्राप्त राशि (वर्ष)',
  'Collected this year': 'इस वर्ष प्राप्त राशि',
  Pending: 'बकाया',
  Overdue: 'अतिदेय',
  Present: 'उपस्थित',
  Absent: 'अनुपस्थित',
  Late: 'विलंब से',
  'On leave': 'अवकाश पर',
  Hello: 'नमस्ते',
  Today: 'आज',
  Monday: 'सोमवार',
  Tuesday: 'मंगलवार',
  Wednesday: 'बुधवार',
  Thursday: 'गुरुवार',
  Friday: 'शुक्रवार',
  Saturday: 'शनिवार',
  Sunday: 'रविवार',
  'Something went wrong.': 'कुछ गड़बड़ हो गई।',
  Language: 'भाषा',

  // ---- common buttons
  Save: 'सहेजें',
  Cancel: 'रद्द करें',
  Submit: 'जमा करें',
  Apply: 'आवेदन करें',
  Approve: 'स्वीकृत करें',
  Reject: 'अस्वीकार करें',
  Back: 'वापस',
  Print: 'प्रिंट करें',
  Logout: 'लॉग आउट',
  'Sign out': 'लॉग आउट करें',
  'Do you want to sign out of this app?': 'क्या आप इस ऐप से लॉग आउट करना चाहते हैं?',
  Email: 'ईमेल',
  Role: 'भूमिका',
  Phone: 'फ़ोन',
  Children: 'बच्चे',
  Class: 'कक्षा',
  'Roll number': 'रोल नंबर',
  'Date of birth': 'जन्म तिथि',
  'Blood group': 'रक्त समूह',
  Guardian: 'अभिभावक',
  'Guardian phone': 'अभिभावक का फ़ोन',
  'Student ID': 'विद्यार्थी आईडी',
  'Teacher ID': 'शिक्षक आईडी',
  Subjects: 'विषय',
  Qualification: 'योग्यता',
  'Try again': 'फिर से प्रयास करें',
  Delete: 'हटाएँ',
  Search: 'खोजें',
  Book: 'बुक करें',
  Call: 'कॉल करें',
  Return: 'वापसी दर्ज करें',
  Renew: 'नवीनीकरण करें',
  Close: 'बंद करें',
  Edit: 'संपादित करें',
  Send: 'भेजें',
  Withdraw: 'आवेदन वापस लें',
  Camera: 'कैमरा',
  'Add photos': 'फ़ोटो जोड़ें',
  'Change status': 'स्थिति बदलें',
  'Check in': 'चेक इन करें',
  'Check out': 'चेक आउट करें',
  'Mark all read': 'सभी को पढ़ा हुआ चिह्नित करें',
  'Submit homework again': 'गृहकार्य फिर से जमा करें',
  'Submit again': 'फिर से जमा करें',
  'Assign homework': 'गृहकार्य दें',
  'Save attendance': 'उपस्थिति सहेजें',
  'Send fee reminders now': 'अभी शुल्क अनुस्मारक भेजें',
  'Remind overdue': 'अतिदेय पुस्तकों का अनुस्मारक भेजें',
  'Create album': 'एल्बम बनाएँ',
  'New album': 'नया एल्बम',
  'Delete album': 'एल्बम हटाएँ',
  'Create slots': 'स्लॉट बनाएँ',
  'Cancel booking': 'बुकिंग रद्द करें',
  'Delete slot': 'स्लॉट हटाएँ',
  'Save health record': 'स्वास्थ्य विवरण सहेजें',
  'Record visit': 'विज़िट दर्ज करें',
  'View all': 'सभी देखें',

  // ---- section titles and labels on the new screens
  'My loans': 'मेरी पुस्तकें',
  Catalogue: 'पुस्तक सूची',
  'My bookings': 'मेरी बुकिंग',
  'Free slots': 'खाली स्लॉट',
  'Bookings by date': 'तारीख़ अनुसार बुकिंग',
  'Health record': 'स्वास्थ्य विवरण',
  'Sick-room visits': 'चिकित्सा कक्ष विज़िट',
  'Emergency contact': 'आपातकालीन संपर्क',
  Allergies: 'एलर्जी',
  Medications: 'दवाइयाँ',
  Conditions: 'स्वास्थ्य समस्याएँ',
  Stops: 'स्टॉप',
  Driver: 'चालक',
  Attendant: 'परिचारक',
  'Bus route': 'बस मार्ग',
  Open: 'जारी',
  Returned: 'लौटाई गई',
  Booked: 'बुक',
  Free: 'खाली',
  'Upcoming slots': 'आगामी स्लॉट',
  'Front side': 'सामने का भाग',
  'Back side': 'पीछे का भाग',
  'Bus crew': 'बस कर्मचारी',
  Contact: 'संपर्क',
  'My stop': 'मेरा स्टॉप',
  'Monthly fee': 'मासिक शुल्क',
  Vehicle: 'वाहन',
  Height: 'लंबाई',
  Weight: 'वज़न',
  'Vision (L / R)': 'दृष्टि (बायाँ / दायाँ)',
  'Family doctor': 'पारिवारिक डॉक्टर',
  'Last check-up': 'पिछली जाँच',
  'Emergency contact name': 'आपातकालीन संपर्क का नाम',
  'Emergency contact phone': 'आपातकालीन संपर्क फ़ोन',
  'Other details are updated by the school.': 'अन्य विवरण विद्यालय द्वारा अपडेट किए जाते हैं।',
  'Sent home': 'घर भेजा गया',
  Complaint: 'शिकायत',
  'Action taken (optional)': 'की गई कार्रवाई (वैकल्पिक)',
  Title: 'शीर्षक',
  Date: 'तारीख़',
  From: 'से',
  To: 'तक',
  'Event date': 'कार्यक्रम की तारीख़',
  'Description (optional)': 'विवरण (वैकल्पिक)',
  'Location (optional)': 'स्थान (वैकल्पिक)',
  'Minutes per meeting': 'प्रति बैठक मिनट',
  'Note for the teacher (optional)': 'शिक्षक के लिए टिप्पणी (वैकल्पिक)',
  Notes: 'टिप्पणियाँ',
  'Follow-up date': 'फ़ॉलो-अप तारीख़',
  'New enquiries': 'नई पूछताछ',
  'Follow-ups due': 'बाकी फ़ॉलो-अप',
  'New this month': 'इस महीने नई',
  'Admitted this month': 'इस महीने प्रवेश',
  New: 'नई',
  Contacted: 'संपर्क किया',
  Visited: 'विद्यालय देखा',
  Applied: 'आवेदन किया',
  Admitted: 'प्रवेश हुआ',
  Closed: 'बंद',
  All: 'सभी',
};

const DICTIONARIES = { en, hi };
export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
];
const STORAGE_KEY = 'ssa_language';

let currentLanguage = 'en';

/** Translates `key` (the English text) into `language` (default: the current app language). */
export function t(key, language = currentLanguage) {
  if (typeof key !== 'string') return key;
  return DICTIONARIES[language]?.[key] ?? en[key] ?? key;
}

const LanguageContext = createContext({ language: 'en', setLanguage: () => {}, t: (key) => t(key, 'en') });

/** Holds the chosen language (saved on the device) for the whole app. Placed at the root by createRootLayout. */
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((saved) => {
        if (!cancelled && saved && DICTIONARIES[saved]) {
          currentLanguage = saved;
          setLanguageState(saved);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((next) => {
    if (!DICTIONARIES[next]) return;
    currentLanguage = next;
    setLanguageState(next);
    SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(() => ({ language, setLanguage, t: (key) => t(key, language) }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** { language, setLanguage, t } */
export function useLanguage() {
  return useContext(LanguageContext);
}

/** The translate function for the current language; components using it re-render when it changes. */
export function useT() {
  return useContext(LanguageContext).t;
}
