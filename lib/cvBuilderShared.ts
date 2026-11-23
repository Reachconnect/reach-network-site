// Free CV builder: types and lists shared with the page (no PDF code here)

export type CvJobIn = { title: string; employer: string; location?: string; start: string; end: string; current?: boolean; notes?: string };
export type CvEduIn = { qualification: string; place?: string; year?: string };
export type CvInput = {
  name: string;
  email: string;
  phone: string;
  town: string;
  postcode?: string;
  target: string; // the job they want
  sector?: string;
  about?: string; // a few words about themselves
  jobs: CvJobIn[];
  tickets: string[]; // licences, cards, tickets
  education: CvEduIn[];
  extras?: string; // anything else: skills, languages, availability
};

export type CvJob = { title: string; employer: string; location?: string; dates: string; bullets: string[] };
export type Cv = {
  name: string;
  email: string;
  phone: string;
  town: string;
  headline: string;
  summary: string;
  experience: CvJob[];
  qualifications: string[];
  skills: string[];
  education: string[];
  extras: string[];
};

export const TICKETS: { group: string; items: string[] }[] = [
  { group: "Driving", items: ["Full UK car licence", "Class 1 (C+E)", "Class 2 (C)", "7.5 tonne (C1)", "Driver CPC", "Digital tachograph card", "ADR", "HIAB", "Moffett"] },
  { group: "Warehouse", items: ["Counterbalance FLT", "Reach truck", "VNA", "Bendi", "Order picker", "Powered pallet truck", "Warehouse management systems", "RF scanner"] },
  { group: "Manufacturing and engineering", items: ["Food hygiene", "HACCP", "CNC", "Welding", "IOSH", "SSSTS", "18th Edition", "IPAF", "PASMA", "CSCS card", "First aid"] },
];

