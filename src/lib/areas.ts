export interface AreaInfo {
  id: string;
  label: string;
  county: string;
  outcodes: string[];
  aliases?: string[];
  feeBand?: 'low' | 'standard' | 'premium';
}

export const AREA_OUTCODES = {
  // Flintshire & Deeside
  deeside: {
    id: 'deeside',
    label: 'Deeside',
    county: 'Flintshire',
    outcodes: ['CH5', 'CH6'],
    aliases: ['Connah’s Quay', 'Shotton', 'Queensferry'],
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
  northop: {
    id: 'northop',
    label: 'Northop',
    county: 'Flintshire',
    outcodes: ['CH7'],
  },
  northopHall: {
    id: 'northopHall',
    label: 'Northop Hall',
    county: 'Flintshire',
    outcodes: ['CH7'],
  },
  oakenholt: {
    id: 'oakenholt',
    label: 'Oakenholt',
    county: 'Flintshire',
    outcodes: ['CH6'],
  },

  // Chester & Cheshire West
  chester: {
    id: 'chester',
    label: 'Chester',
    county: 'Cheshire West and Chester',
    outcodes: ['CH1', 'CH2', 'CH3', 'CH4'],
  },
  hoole: {
    id: 'hoole',
    label: 'Hoole',
    county: 'Cheshire West and Chester',
    outcodes: ['CH2'],
  },
  boughton: {
    id: 'boughton',
    label: 'Boughton',
    county: 'Cheshire West and Chester',
    outcodes: ['CH3'],
  },
  vicarsCross: {
    id: 'vicarsCross',
    label: 'Vicars Cross',
    county: 'Cheshire West and Chester',
    outcodes: ['CH3'],
  },
  waverton: {
    id: 'waverton',
    label: 'Waverton',
    county: 'Cheshire West and Chester',
    outcodes: ['CH3'],
  },
  tarporley: {
    id: 'tarporley',
    label: 'Tarporley',
    county: 'Cheshire West and Chester',
    outcodes: ['CW6'],
  },
  ellesmerePort: {
    id: 'ellesmerePort',
    label: 'Ellesmere Port',
    county: 'Cheshire West and Chester',
    outcodes: ['CH65', 'CH66'],
  },
  frodsham: {
    id: 'frodsham',
    label: 'Frodsham',
    county: 'Cheshire West and Chester',
    outcodes: ['WA6'],
  },
  helsby: {
    id: 'helsby',
    label: 'Helsby',
    county: 'Cheshire West and Chester',
    outcodes: ['WA6'],
  },
  winsford: {
    id: 'winsford',
    label: 'Winsford',
    county: 'Cheshire West and Chester',
    outcodes: ['CW7'],
  },
  northwich: {
    id: 'northwich',
    label: 'Northwich',
    county: 'Cheshire West and Chester',
    outcodes: ['CW8', 'CW9'],
  },
  malpas: {
    id: 'malpas',
    label: 'Malpas',
    county: 'Cheshire West and Chester',
    outcodes: ['SY14'],
  },
  kelsall: {
    id: 'kelsall',
    label: 'Kelsall',
    county: 'Cheshire West and Chester',
    outcodes: ['CW6'],
  },
  tarvin: {
    id: 'tarvin',
    label: 'Tarvin',
    county: 'Cheshire West and Chester',
    outcodes: ['CH3'],
  },

  // Cheshire East
  nantwich: {
    id: 'nantwich',
    label: 'Nantwich',
    county: 'Cheshire East',
    outcodes: ['CW5'],
  },
  crewe: {
    id: 'crewe',
    label: 'Crewe',
    county: 'Cheshire East',
    outcodes: ['CW1', 'CW2'],
  },
  sandbach: {
    id: 'sandbach',
    label: 'Sandbach',
    county: 'Cheshire East',
    outcodes: ['CW11'],
  },
  alsager: {
    id: 'alsager',
    label: 'Alsager',
    county: 'Cheshire East',
    outcodes: ['ST7'],
  },
  macclesfield: {
    id: 'macclesfield',
    label: 'Macclesfield',
    county: 'Cheshire East',
    outcodes: ['SK10', 'SK11'],
  },

  // Wrexham & North East Wales
  wrexham: {
    id: 'wrexham',
    label: 'Wrexham',
    county: 'Wrexham',
    outcodes: ['LL11', 'LL12', 'LL13'],
  },
  chirk: {
    id: 'chirk',
    label: 'Chirk',
    county: 'Wrexham',
    outcodes: ['LL14'],
  },
  ruabon: {
    id: 'ruabon',
    label: 'Ruabon',
    county: 'Wrexham',
    outcodes: ['LL14'],
  },
  llangollen: {
    id: 'llangollen',
    label: 'Llangollen & Dee Valley',
    county: 'Denbighshire',
    outcodes: ['LL20'],
  },

  // Wirral
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

  // Border/Other
  ellesmere: {
    id: 'ellesmere',
    label: 'Ellesmere',
    county: 'Shropshire',
    outcodes: ['SY12'],
  },
} as const satisfies Record<string, AreaInfo>;

export type AreaKey = keyof typeof AREA_OUTCODES;

export const AREA_ORDER: AreaKey[] = [
  // Core Flintshire & Deeside
  'flint', 'buckley', 'mold', 'deeside', 'hawarden', 'ewloe', 'northop', 'northopHall', 'oakenholt', 'broughton', 'saltney',
  // Chester & Cheshire West
  'chester', 'hoole', 'boughton', 'vicarsCross', 'waverton', 'tarporley', 'kelsall', 'tarvin',
  'ellesmerePort', 'frodsham', 'helsby', 'winsford', 'northwich', 'malpas',
  // Cheshire East
  'nantwich', 'crewe', 'sandbach', 'alsager', 'macclesfield',
  // Wrexham & North East Wales
  'wrexham', 'chirk', 'ruabon', 'llangollen',
  // Wirral
  'heswall', 'wirral',
  // Border/Other
  'ellesmere',
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
  const normalised = normaliseOutcode(outcode);
  const match = normalised.match(/^([A-Z]{1,2}\\d[A-Z\\d]?)(\\d[A-Z]{2})$/);
  const outwardCode = match ? match[1] : normalised;
  return OUTCODE_LOOKUP.get(outwardCode) ?? [];
};

export const getPrimaryOutcodeForArea = (areaId: AreaKey): string | undefined => {
  const area = AREA_OUTCODES[areaId];
  return area?.outcodes[0];
};