// Website details that switch sections on. Anything left empty stays hidden on the site.
// Only ever add real reviews, real numbers and real case studies here.

export const SITE = {
  // Google review link, from your Google Business Profile ("Ask for reviews")
  googleReviewUrl: "https://www.google.com/search?q=Reach+Network+Recruitment#lrd=0x34b35e88b4463b7:0x109c40c2bb3e95b9,3,,,,",
  // WhatsApp number in international format without + or spaces, e.g. "447700900123"
  whatsapp: "",
  // Referral bonus shown on the refer-a-friend page, e.g. "£100". Leave empty to say "a thank-you bonus".
  referralBonus: "",
  // Hours a referred friend must work before the bonus is paid, e.g. 100
  referralHours: 0,
  accreditations: {
    companyNumber: "15935163", // Companies House number
    icoNumber: "", // ICO registration number
    recMember: false, // Recruitment & Employment Confederation member
    insured: false, // Employer's liability and public liability insurance in place
  },
};

export type Review = { name: string; role: string; company?: string; text: string; stars: 1 | 2 | 3 | 4 | 5; source?: "Google" | "Direct" };
export const REVIEWS: Review[] = [];

export type CaseStudy = { slug: string; title: string; sector: string; place: string; challenge: string; what: string; result: string; stat?: string; statLabel?: string };
export const CASE_STUDIES: CaseStudy[] = [];
