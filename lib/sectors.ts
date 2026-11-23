// Which candidates count for each industry page's coverage map, and for each tab on it
export type SectorKey = "drivers" | "warehouse" | "manufacturing" | "engineering";

export const SECTORS: Record<SectorKey, { any: RegExp; types: Record<string, RegExp> }> = {
  drivers: {
    any: /driv|hgv|lgv|class ?[12]\b|\bvan\b|courier|deliver|multi[- ]?drop|7\.5/,
    types: {
      class1: /class ?1\b|c ?\+ ?e\b|\bc\/e\b|cat(egory)? ?ce\b|artic|trunk|tramp/,
      class2: /class ?2\b|\bcat(egory)? ?c\b|rigid|lgv ?2|hgv ?2/,
      c1: /7\.5|\bc1\b|removal/,
      van: /\bvan\b|multi[- ]?drop|courier|deliver|3\.5|parcel/,
      adr: /\badr\b|tanker|hiab|crane|low[- ]?loader|car transport/,
    },
  },
  warehouse: {
    any: /warehouse|picker|packer|\bpick|\bpack|forklift|\bflt\b|reach truck|counterbalance|\bvna\b|goods[- ]in|despatch|dispatch|stock|inventory|loader|fulfil|logistics/,
    types: {
      picking: /pick|pack|fulfil|e-?commerce|operative/,
      flt: /forklift|\bflt\b|reach|counterbalance|\bvna\b|bendi|flexi|\bppt\b|llop/,
      goodsin: /goods[- ]in|despatch|dispatch|loader|loading|receiv|unload/,
      stock: /stock|inventory|replen|admin|controller/,
      supervisors: /supervis|team lead|manager|shift lead/,
    },
  },
  manufacturing: {
    any: /manufactur|production|factory|machine|operator|assembl|food|process|packing|quality|\bqa\b|line lead|cnc|weld|fabricat/,
    types: {},
  },
  engineering: {
    any: /engineer|electric|mechanic|maintenance|technician|hvac|refrigerat|fire|security|gas|plumb|fitter|multi[- ]?skill/,
    types: {},
  },
};
