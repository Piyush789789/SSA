/**
 * Free WhatsApp messaging through "click to chat" links (https://wa.me/<number>?text=...). The link opens WhatsApp
 * (app, desktop or WhatsApp Web) with the message typed in; the sender checks it and presses Send. No API, no cost.
 */

/** Indian numbers in any common format ("+91 98765 12345", "098765 12345", "9876512345") → "919876512345". */
export const normalizePhone = (phone) => {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
};

export const whatsappLink = (phone, text) => {
  const number = normalizePhone(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(text || '')}`;
};

/** Opens WhatsApp in a new tab/window. Returns false when the number is not usable. */
export const openWhatsApp = (phone, text) => {
  const link = whatsappLink(phone, text);
  if (!link) return false;
  window.open(link, '_blank', 'noopener,noreferrer');
  return true;
};

/**
 * Everyone a message about this student can go to: the guardian on the student record, plus linked parent
 * records (when known). Numbers that appear twice are listed once.
 */
export const familyContacts = (student, parents = []) => {
  const contacts = [];
  const seen = new Set();
  const add = (name, relation, phone) => {
    const number = normalizePhone(phone);
    if (!number || seen.has(number)) return;
    seen.add(number);
    contacts.push({ name: name || 'Parent', relation, phone });
  };
  if (student?.guardian) add(student.guardian.name, student.guardian.relation || 'Guardian', student.guardian.phone);
  parents
    .filter((p) => (p.childIds || []).includes(student?.id))
    .forEach((p) => add(p.name, p.relation || 'Parent', p.phone));
  return contacts;
};

/** Ready-made messages. {name}, {class}, {roll}, {school} and {date} are filled in for each student. */
export const MESSAGE_TEMPLATES = [
  {
    id: 'update',
    label: { en: 'General update', hi: 'सामान्य सूचना' },
    text: {
      en: 'Dear Parent,\nThis is an update about {name} (Class {class}):\n\n\n— {school}',
      hi: 'आदरणीय अभिभावक,\n{name} (कक्षा {class}) के संबंध में सूचना:\n\n\n— {school}',
    },
  },
  {
    id: 'absent',
    label: { en: 'Absent today', hi: 'आज अनुपस्थित' },
    text: {
      en: 'Dear Parent,\n{name} (Class {class}) is absent from school today ({date}). Please let us know the reason.\n— {school}',
      hi: 'आदरणीय अभिभावक,\n{name} (कक्षा {class}) आज ({date}) विद्यालय में अनुपस्थित है। कृपया कारण बताएँ।\n— {school}',
    },
  },
  {
    id: 'fees',
    label: { en: 'Fee reminder', hi: 'शुल्क अनुस्मारक' },
    text: {
      en: 'Dear Parent,\nThis is a reminder that the school fee for {name} (Class {class}) is pending. Please pay at the fee office or through the school app.\n— {school}',
      hi: 'आदरणीय अभिभावक,\n{name} (कक्षा {class}) का विद्यालय शुल्क बकाया है। कृपया शुल्क कार्यालय में या स्कूल ऐप से जमा करें।\n— {school}',
    },
  },
  {
    id: 'homework',
    label: { en: 'Homework pending', hi: 'गृहकार्य बाकी' },
    text: {
      en: 'Dear Parent,\n{name} (Class {class}) has not completed the homework. Please help them finish it.\n— {school}',
      hi: 'आदरणीय अभिभावक,\n{name} (कक्षा {class}) ने गृहकार्य पूरा नहीं किया है। कृपया इसे पूरा करवाने में मदद करें।\n— {school}',
    },
  },
  {
    id: 'ptm',
    label: { en: 'PTM invitation', hi: 'अभिभावक-शिक्षक बैठक' },
    text: {
      en: 'Dear Parent,\nYou are invited to the Parent-Teacher Meeting to discuss the progress of {name} (Class {class}). Please book a slot in the school app.\n— {school}',
      hi: 'आदरणीय अभिभावक,\n{name} (कक्षा {class}) की प्रगति पर चर्चा के लिए आपको अभिभावक-शिक्षक बैठक में आमंत्रित किया जाता है। कृपया स्कूल ऐप में समय बुक करें।\n— {school}',
    },
  },
  {
    id: 'praise',
    label: { en: 'Appreciation', hi: 'प्रशंसा' },
    text: {
      en: 'Dear Parent,\nWe are happy to share that {name} (Class {class}) has done excellent work. Well done!\n— {school}',
      hi: 'आदरणीय अभिभावक,\nहमें यह बताते हुए खुशी है कि {name} (कक्षा {class}) ने बहुत अच्छा काम किया है। शाबाश!\n— {school}',
    },
  },
];

/** Fills the placeholders for one student. Unknown placeholders are left as they are. */
export const fillMessage = (text, { student, schoolName, date }) =>
  String(text || '').replace(/\{(name|class|roll|school|date)\}/g, (match, key) => {
    switch (key) {
      case 'name':
        return student?.name ?? match;
      case 'class':
        return student?.className ?? match;
      case 'roll':
        return student?.rollNumber != null ? String(student.rollNumber) : match;
      case 'school':
        return schoolName || 'School Office';
      case 'date':
        return date ?? new Date().toLocaleDateString('en-IN');
      default:
        return match;
    }
  });
