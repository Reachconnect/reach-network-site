// Candidate guides. Facts checked against GOV.UK and HSE in November 2026.
export type Guide = {
  slug: string;
  title: string;
  summary: string;
  tag: "Drivers" | "Warehouse" | "Everyone";
  minutes: number;
  checked: string;
  sections: { h: string; p?: string[]; list?: string[] }[];
  sources: { label: string; url: string }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "driver-cpc-explained",
    title: "Driver CPC explained: the 35 hours, National vs International, and what happens if it lapses",
    summary: "What Driver CPC is, how much training you need, and how to check your hours.",
    tag: "Drivers",
    minutes: 4,
    checked: "November 2026",
    sections: [
      { h: "What is Driver CPC?", p: ["The Driver Certificate of Professional Competence (CPC) is the qualification you need to drive a lorry, bus or coach for a living. Once you have it, you get a Driver Qualification Card (DQC), which you must carry when driving professionally."] },
      { h: "How much training do you need?", p: ["You must do 35 hours of periodic training every 5 years to keep your Driver CPC. If you drive both lorries and buses, you only need to do one set of 35 hours."] },
      {
        h: "National or International Driver CPC?",
        p: ["Since the 2024 and 2025 changes there are two types."],
        list: [
          "International Driver CPC: 35 hours of International courses only. Lets you drive professionally in the UK and Europe.",
          "National Driver CPC: 35 hours of National courses, or a mix of National and International. Lets you drive professionally in the UK only.",
          "Some other courses can count, for example up to 14 hours of ADR training.",
        ],
      },
      { h: "What if my CPC has lapsed?", p: ["If you want to drive in the UK again, you may be able to take a 7-hour 'Return to Driving' course and then complete a further 28 hours within 12 months. You can only use this route once every 5 years. Driving professionally without a valid Driver CPC can mean a fine of up to £1,000."] },
      { h: "How do I check my hours?", p: ["Use the 'check your Driver CPC periodic training hours' service on GOV.UK. Bring your DQC to your registration with us so we can confirm it's in date."] },
    ],
    sources: [
      { label: "GOV.UK: Driver CPC training for qualified drivers", url: "https://www.gov.uk/driver-cpc-training" },
      { label: "GOV.UK: Driver CPC changes in 2024 and 2025", url: "https://www.gov.uk/government/publications/driver-cpc-changes-in-2024-and-2025/driver-cpc-changes-in-2024-and-2025" },
    ],
  },
  {
    slug: "digital-tachograph-card",
    title: "Digital tachograph driver cards: how to apply, costs and renewals",
    summary: "Who needs a digi card, how much it costs and how to replace one.",
    tag: "Drivers",
    minutes: 3,
    checked: "November 2026",
    sections: [
      { h: "Do I need one?", p: ["You need a digital driver tachograph card if the vehicle you drive has a digital or smart tachograph. It records your driving time, breaks and rest, so it's essential for most HGV work."] },
      { h: "How to apply", p: ["If you live in England, Scotland or Wales you can apply online on GOV.UK for your first card, a renewal or a replacement. If you're exchanging a card from the EU, EEA or Northern Ireland, you need to apply by post."] },
      { h: "How much does it cost?", list: ["£32 for your first GB driver card", "£19 to renew an expired card", "£19 to replace a lost or stolen card"] },
      { h: "How long does it last?", p: ["Driver cards are valid for 5 years. Keep an eye on the expiry date: you can't legally drive a vehicle with a digital tachograph without a valid card."] },
    ],
    sources: [{ label: "GOV.UK: Apply for a driver digital tachograph card", url: "https://www.gov.uk/apply-driver-digital-tachograph-card" }],
  },
  {
    slug: "driving-licence-categories",
    title: "HGV licence categories: C1, C, C+E and what you can drive",
    summary: "The difference between 7.5 tonne, Class 2 and Class 1 explained simply.",
    tag: "Drivers",
    minutes: 3,
    checked: "November 2026",
    sections: [
      {
        h: "The main categories",
        list: [
          "C1: vehicles between 3,500kg and 7,500kg, often called '7.5 tonne'. Drivers who passed their car test before 1 January 1997 usually already have C1.",
          "C (Class 2): rigid vehicles over 3,500kg, with a trailer up to 750kg.",
          "C+E (Class 1): category C vehicles with a trailer over 750kg, which includes articulated lorries.",
          "C1+E: C1 vehicles with a heavier trailer, with limits on the combined weight.",
        ],
      },
      { h: "What else will I need?", p: ["To drive these vehicles for a living you'll also need Driver CPC, and a digital tachograph card for vehicles with a digital tachograph. Check the categories on your licence on GOV.UK using 'View or share your driving licence information'."] },
      { h: "Moving up from Class 2 to Class 1", p: ["Many drivers start on Class 2 and add C+E later, which usually means more work and better pay. Tell us if you're thinking about it and we'll talk you through what's in demand locally."] },
    ],
    sources: [
      { label: "GOV.UK: Driving licence categories", url: "https://www.gov.uk/driving-licence-categories" },
      { label: "GOV.UK: View or share your driving licence information", url: "https://www.gov.uk/view-driving-licence" },
    ],
  },
  {
    slug: "forklift-licence-uk",
    title: "Is there such a thing as a forklift licence? FLT training explained",
    summary: "What employers actually need, accredited training and how often to refresh.",
    tag: "Warehouse",
    minutes: 3,
    checked: "November 2026",
    sections: [
      { h: "There's no 'forklift licence'", p: ["People say 'FLT licence', but the Health and Safety Executive is clear that there's no such thing as a lift-truck licence. What employers need is proof that you've been properly trained and are competent on the type of truck you'll use."] },
      { h: "What counts as proper training?", p: ["Employers follow the HSE's Approved Code of Practice for rider-operated lift trucks (L117). Most look for training from a provider accredited by one of the main bodies: AITT, ITSSAR, NPORS or RTITB. You'll get a certificate, which is good evidence of your training, even though the certificate itself isn't a legal requirement."] },
      { h: "Each truck type is different", list: ["Counterbalance", "Reach truck", "VNA (very narrow aisle)", "Bendi and articulated trucks", "Pallet trucks and order pickers"] },
      { h: "Do I need a refresher?", p: ["There's no fixed legal interval, but operators should be reassessed from time to time. Many employers ask for refresher training every 3 to 5 years, so keep your certificates together and bring them when you register with us."] },
    ],
    sources: [
      { label: "HSE: Lift-truck training", url: "https://www.hse.gov.uk/workplacetransport/lift-trucks/lift-truck-training.htm" },
      { label: "HSE: Voluntary accreditation schemes", url: "https://www.hse.gov.uk/workplacetransport/lift-trucks/accreditation.htm" },
    ],
  },
  {
    slug: "prove-right-to-work",
    title: "How to prove your right to work in the UK",
    summary: "Passports, share codes and what to bring when you register.",
    tag: "Everyone",
    minutes: 3,
    checked: "November 2026",
    sections: [
      { h: "Why we ask", p: ["By law, we must check that everyone we place has the right to work in the UK before they start. It's the same for every worker, every time."] },
      { h: "British and Irish citizens", p: ["You can usually prove your right to work with your passport, or your passport card if you're Irish. If you don't have a passport, ask us what other documents can be used."] },
      { h: "Everyone else: a share code", p: ["Most people now have an eVisa rather than a physical card. Sign in to your UK Visas and Immigration (UKVI) account and use 'Prove your right to work to an employer' on GOV.UK to get a share code. Right to work codes start with W and are valid for 90 days. Send us the code with your date of birth and we'll check it online.", "Biometric residence permits (BRPs) are no longer accepted as proof, so make sure your UKVI account is set up."] },
      { h: "What to bring when you register", list: ["Proof of right to work (passport or share code)", "Proof of address if we ask for it", "Your National Insurance number", "Any licences, CPC, digi card or FLT certificates"] },
    ],
    sources: [
      { label: "GOV.UK: Prove your right to work to an employer", url: "https://www.gov.uk/prove-right-to-work" },
      { label: "GOV.UK: Get a share code online", url: "https://www.gov.uk/prove-right-to-work/get-a-share-code-online" },
    ],
  },
];
