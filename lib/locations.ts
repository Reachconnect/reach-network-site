// Towns we have local pages for, and the sector wording used on them
export type Town = { slug: string; name: string; county: string; lat: number; lng: number; postcodes: string[] };

export const TOWNS: Town[] = [
  { slug: "birmingham", name: "Birmingham", county: "West Midlands", lat: 52.4862, lng: -1.8904, postcodes: ["B"] },
  { slug: "bromsgrove", name: "Bromsgrove", county: "Worcestershire", lat: 52.3355, lng: -2.059, postcodes: ["B"] },
  { slug: "redditch", name: "Redditch", county: "Worcestershire", lat: 52.3093, lng: -1.9409, postcodes: ["B"] },
  { slug: "worcester", name: "Worcester", county: "Worcestershire", lat: 52.192, lng: -2.22, postcodes: ["WR"] },
  { slug: "kidderminster", name: "Kidderminster", county: "Worcestershire", lat: 52.3885, lng: -2.2497, postcodes: ["DY"] },
  { slug: "droitwich", name: "Droitwich", county: "Worcestershire", lat: 52.2667, lng: -2.15, postcodes: ["WR"] },
  { slug: "solihull", name: "Solihull", county: "West Midlands", lat: 52.4118, lng: -1.7776, postcodes: ["B"] },
  { slug: "coventry", name: "Coventry", county: "West Midlands", lat: 52.4068, lng: -1.5197, postcodes: ["CV"] },
  { slug: "wolverhampton", name: "Wolverhampton", county: "West Midlands", lat: 52.5862, lng: -2.1288, postcodes: ["WV"] },
  { slug: "dudley", name: "Dudley", county: "West Midlands", lat: 52.5123, lng: -2.0811, postcodes: ["DY"] },
  { slug: "walsall", name: "Walsall", county: "West Midlands", lat: 52.5862, lng: -1.9829, postcodes: ["WS"] },
  { slug: "west-bromwich", name: "West Bromwich", county: "West Midlands", lat: 52.5187, lng: -1.9945, postcodes: ["B"] },
  { slug: "tamworth", name: "Tamworth", county: "Staffordshire", lat: 52.6338, lng: -1.6955, postcodes: ["B"] },
  { slug: "burton-upon-trent", name: "Burton upon Trent", county: "Staffordshire", lat: 52.8019, lng: -1.6367, postcodes: ["DE"] },
  { slug: "stoke-on-trent", name: "Stoke-on-Trent", county: "Staffordshire", lat: 53.0027, lng: -2.1794, postcodes: ["ST"] },
  { slug: "telford", name: "Telford", county: "Shropshire", lat: 52.6766, lng: -2.4469, postcodes: ["TF"] },
  { slug: "nuneaton", name: "Nuneaton", county: "Warwickshire", lat: 52.5233, lng: -1.4683, postcodes: ["CV"] },
  { slug: "rugby", name: "Rugby", county: "Warwickshire", lat: 52.3709, lng: -1.2615, postcodes: ["CV"] },
  { slug: "leicester", name: "Leicester", county: "Leicestershire", lat: 52.6369, lng: -1.1398, postcodes: ["LE"] },
  { slug: "derby", name: "Derby", county: "Derbyshire", lat: 52.9225, lng: -1.4746, postcodes: ["DE"] },
  { slug: "nottingham", name: "Nottingham", county: "Nottinghamshire", lat: 52.9548, lng: -1.1581, postcodes: ["NG"] },
  { slug: "northampton", name: "Northampton", county: "Northamptonshire", lat: 52.2405, lng: -0.9027, postcodes: ["NN"] },
];

export type SectorPage = {
  key: "drivers" | "warehouse" | "manufacturing" | "engineering";
  slug: string;
  noun: string; // "Driver recruitment"
  people: string; // "drivers"
  headline: (town: string) => string;
  roles: string[];
  checks: string[];
  img: string;
  industryHref: string;
  jobRe: RegExp;
};

export const SECTOR_PAGES: SectorPage[] = [
  {
    key: "drivers",
    slug: "drivers",
    noun: "Driver recruitment",
    people: "drivers",
    headline: (t) => `HGV and van drivers in ${t}`,
    roles: ["Class 1 (C+E) drivers", "Class 2 (C) drivers", "7.5 tonne (C1) drivers", "Van and multi-drop drivers", "ADR drivers", "Shunters and driver's mates"],
    checks: ["Licence categories and points checked with the DVLA", "Driver CPC and digital tachograph card confirmed", "ID and right to work", "Work history reviewed"],
    img: "/industries/industry-driving.png",
    industryHref: "/industries/drivers",
    jobRe: /driv|hgv|class|lgv|van|c\+e|7\.5/i,
  },
  {
    key: "warehouse",
    slug: "warehouse-staff",
    noun: "Warehouse recruitment",
    people: "warehouse staff",
    headline: (t) => `Warehouse staff in ${t}`,
    roles: ["Warehouse operatives", "Pickers and packers", "Reach and counterbalance FLT drivers", "VNA and bendi drivers", "Goods in and dispatch", "Team leaders and supervisors"],
    checks: ["FLT training certificates checked", "ID and right to work", "Work history reviewed", "Site induction and PPE briefing"],
    img: "/industries/industry-warehousing.png",
    industryHref: "/industries/warehouse",
    jobRe: /warehouse|pick|pack|flt|fork|reach|dispatch|goods in/i,
  },
  {
    key: "manufacturing",
    slug: "manufacturing-staff",
    noun: "Manufacturing recruitment",
    people: "production staff",
    headline: (t) => `Production and manufacturing staff in ${t}`,
    roles: ["Production operatives", "Food production operatives", "Machine operators", "Assembly workers", "Quality inspectors", "Line leaders"],
    checks: ["ID and right to work", "Work history reviewed", "Food hygiene and site rules briefed where needed", "Site induction and PPE briefing"],
    img: "/industries/industry-manufacturing.png",
    industryHref: "/industries/manufacturing",
    jobRe: /production|manufactur|machine|assembly|food|operative|quality/i,
  },
  {
    key: "engineering",
    slug: "engineers",
    noun: "Engineering recruitment",
    people: "engineers",
    headline: (t) => `Maintenance and multi-skilled engineers in ${t}`,
    roles: ["Maintenance engineers", "Multi-skilled engineers", "Electrical engineers", "Mechanical fitters", "CNC setters and programmers", "Shift engineers"],
    checks: ["Qualifications and tickets checked", "Technical experience reviewed", "ID and right to work", "References where the role needs them"],
    img: "/industries/industry-engineering.png",
    industryHref: "/industries/engineering",
    jobRe: /engineer|maintenance|electric|mechanic|fitter|cnc|technician/i,
  },
];

export const OFFICE = { lat: 52.3355, lng: -2.059 };

export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearbyTowns(t: Town, n = 5) {
  return TOWNS.filter((x) => x.slug !== t.slug)
    .map((x) => ({ ...x, miles: milesBetween(t, x) }))
    .sort((a, b) => a.miles - b.miles)
    .slice(0, n);
}
