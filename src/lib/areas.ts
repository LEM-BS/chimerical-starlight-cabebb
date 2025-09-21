export interface AreaInfo {
  id: string;
  label: string;
  county: string;
  outcodes: string[];
  aliases?: string[];
}

export const AREA_OUTCODES = {
  deeside: {
    id: 'deeside',
    label: 'Deeside',
    county: 'Flintshire',
    outcodes: ['CH5', 'CH6'],
    aliases: ['Connah\u2019s Quay', 'Shotton', 'Queensferry'],
  },
  flint: {
    id: 'flint',
    label: 'Flint',
    county: 'Flintshire',
    outcodes: ['CH6'],
  },
  buckley: {
    id: 'buckley',
    label: 'Buckley',
    county: 'Flintshire',
    outcodes: ['CH7'],
  },
  mold: {
    id: 'mold',
    label: 'Mold',
    county: 'Flintshire',
    outcodes: ['CH7'],
  },
  'connahs-quay': {
    id: 'connahs-quay',
    label: 'Connah\u2019s Quay',
    county: 'Flintshire',
    outcodes: ['CH5'],
  },
  broughton: {
    id: 'broughton',
    label: 'Broughton',
    county: 'Flintshire',
    outcodes: ['CH4'],
  },
  saltney: {
    id: 'saltney',
    label: 'Saltney',
    county: 'Flintshire',
    outcodes: ['CH4'],
  },
  hawarden: {
    id: 'hawarden',
    label: 'Hawarden',
    county: 'Flintshire',
    outcodes: ['CH5'],
  },
  ewloe: {
    id: 'ewloe',
    label: 'Ewloe',
    county: 'Flintshire',
    outcodes: ['CH5'],
  },
  'northop-hall': {
    id: 'northop-hall',
    label: 'Northop Hall',
    county: 'Flintshire',
    outcodes: ['CH7'],
  },
  northop: {
    id: 'northop',
    label: 'Northop',
    county: 'Flintshire',
    outcodes: ['CH7'],
  },
  oakenholt: {
    id: 'oakenholt',
    label: 'Oakenholt',
    county: 'Flintshire',
    outcodes: ['CH6'],
  },
  shotton: {
    id: 'shotton',
    label: 'Shotton',
    county: 'Flintshire',
    outcodes: ['CH5'],
  },
  queensferry: {
    id: 'queensferry',
    label: 'Queensferry',
    county: 'Flintshire',
    outcodes: ['CH5'],
  },
  tarporley: {
    id: 'tarporley',
    label: 'Tarporley',
    county: 'Cheshire',
    outcodes: ['CW6'],
  },
  waverton: {
    id: 'waverton',
    label: 'Waverton',
    county: 'Cheshire',
    outcodes: ['CH3'],
  },
  hoole: {
    id: 'hoole',
    label: 'Hoole',
    county: 'Cheshire',
    outcodes: ['CH2'],
  },
  boughton: {
    id: 'boughton',
    label: 'Boughton',
    county: 'Cheshire',
    outcodes: ['CH3'],
  },
  'vicars-cross': {
    id: 'vicars-cross',
    label: 'Vicars Cross',
    county: 'Cheshire',
    outcodes: ['CH3'],
  },
  chester: {
    id: 'chester',
    label: 'Chester',
    county: 'Cheshire',
    outcodes: ['CH1', 'CH2', 'CH3', 'CH4'],
  },
  'ellesmere-port': {
    id: 'ellesmere-port',
    label: 'Ellesmere Port',
    county: 'Cheshire',
    outcodes: ['CH65', 'CH66'],
  },
  heswall: {
    id: 'heswall',
    label: 'Heswall & Neston',
    county: 'Wirral',
    outcodes: ['CH60', 'CH61', 'CH64'],
  },
  wirral: {
    id: 'wirral',
    label: 'West Wirral',
    county: 'Wirral',
    outcodes: ['CH46', 'CH47', 'CH48'],
  },
  wrexham: {
    id: 'wrexham',
    label: 'Wrexham',
    county: 'Wrexham',
    outcodes: ['LL11', 'LL12', 'LL13'],
  },
  llangollen: {
    id: 'llangollen',
    label: 'Llangollen & Dee Valley',
    county: 'Denbighshire',
    outcodes: ['LL20'],
  },
} as const satisfies Record<string, AreaInfo>;

export type AreaKey = keyof typeof AREA_OUTCODES;

export const AREA_ORDER: AreaKey[] = [
  'flint',
  'buckley',
  'mold',
  'connahs-quay',
  'shotton',
  'queensferry',
  'hawarden',
  'ewloe',
  'northop',
  'northop-hall',
  'oakenholt',
  'broughton',
  'saltney',
  'deeside',
  'chester',
  'hoole',
  'boughton',
  'vicars-cross',
  'waverton',
  'tarporley',
  'ellesmere-port',
  'heswall',
  'wirral',
  'wrexham',
  'llangollen',
] as AreaKey[];

export const AREA_LIST: AreaInfo[] = AREA_ORDER.map((key) => AREA_OUTCODES[key]);

export interface AreaSuggestion {
  id: string;
  areaId: AreaKey;
  label: string;
  outcode: string;
}

export const normaliseOutcode = (value: string): string => value.trim().toUpperCase().replace(/\s+/g, '');

export const AREA_SUGGESTIONS: AreaSuggestion[] = AREA_LIST.flatMap((area) =>
  area.outcodes.map((outcode) => ({
    id: `${area.id}-${outcode}`,
    areaId: area.id as AreaKey,
    label: `${area.label} (${outcode})`,
    outcode: normaliseOutcode(outcode),
  })),
).sort((a, b) => a.label.localeCompare(b.label, 'en-GB'));

type OutcodeMap = Map<string, AreaInfo[]>;

const buildOutcodeMap = (): OutcodeMap => {
  const map: OutcodeMap = new Map();

  for (const area of AREA_LIST) {
    for (const raw of area.outcodes) {
      const outcode = normaliseOutcode(raw);
      const existing = map.get(outcode);
      if (existing) {
        existing.push(area);
      } else {
        map.set(outcode, [area]);
      }
    }
  }

  return map;
};

export const OUTCODE_LOOKUP: OutcodeMap = buildOutcodeMap();

export const getAreasForOutcode = (outcode: string): AreaInfo[] => {
  if (!outcode) {
    return [];
  }

  return OUTCODE_LOOKUP.get(normaliseOutcode(outcode)) ?? [];
};

export const getPrimaryOutcodeForArea = (areaId: AreaKey): string | undefined => {
  const area = AREA_OUTCODES[areaId];
  return area?.outcodes[0];
};
