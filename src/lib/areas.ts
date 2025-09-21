export interface AreaConfig {
  label: string;
  outcode: string;
  aliases?: string[];
}

export interface AreaLink {
  label: string;
  outcode: string;
  href: string;
}

const AREA_CONFIG: AreaConfig[] = [
  {
    label: 'Connah’s Quay',
    outcode: 'CH5',
    aliases: [
      'Connahs Quay',
      "Connah's Quay",
      'Deeside',
      'Shotton',
      'Queensferry',
      'Hawarden',
      'Ewloe',
      'Sandycroft',
    ],
  },
  { label: 'Flint', outcode: 'CH6', aliases: ['Oakenholt', 'Bagillt'] },
  { label: 'Buckley', outcode: 'CH7', aliases: ['Drury', 'Mynydd Isa'] },
  { label: 'Mold', outcode: 'CH7', aliases: ['New Brighton', 'Sychdyn'] },
  { label: 'Broughton', outcode: 'CH4', aliases: ['Bretton'] },
  { label: 'Saltney', outcode: 'CH4' },
  { label: 'Hawarden', outcode: 'CH5', aliases: ['Mancot', 'Aston Hill'] },
  { label: 'Ewloe', outcode: 'CH5' },
  { label: 'Northop Hall', outcode: 'CH7', aliases: ['Northop Hall Village'] },
  { label: 'Northop', outcode: 'CH7', aliases: ['Sychdyn', 'New Brighton'] },
  { label: 'Oakenholt', outcode: 'CH6' },
  { label: 'Shotton', outcode: 'CH5' },
  { label: 'Queensferry', outcode: 'CH5' },
  { label: 'Tarporley', outcode: 'CW6', aliases: ['Kelsall', 'Cotebrook'] },
  { label: 'Waverton', outcode: 'CH3', aliases: ['Saighton', 'Huntington'] },
  { label: 'Hoole', outcode: 'CH2', aliases: ['Upton', 'Newton'] },
  { label: 'Boughton', outcode: 'CH3' },
  { label: 'Vicars Cross', outcode: 'CH3', aliases: ['Guilden Sutton'] },
  { label: 'Chester', outcode: 'CH1', aliases: ['Handbridge', 'Curzon Park', 'City Centre'] },
  { label: 'Higher Kinnerton', outcode: 'CH4', aliases: ['Lower Kinnerton'] },
  { label: 'Pulford', outcode: 'CH4', aliases: ['Dodleston'] },
  { label: 'Rossett', outcode: 'LL12', aliases: ['Marford', 'Gresford', 'Llay'] },
  { label: 'Tarvin', outcode: 'CH3', aliases: ['Christleton', 'Tattenhall', 'Huxley'] },
  { label: 'Aldford', outcode: 'CH3', aliases: ['Farndon'] },
  { label: 'Sandycroft', outcode: 'CH5', aliases: ['Penyffordd'] },
  { label: 'Holywell', outcode: 'CH8', aliases: ['Greenfield', 'Mostyn', 'Carmel'] },
  { label: 'Malpas', outcode: 'SY14', aliases: ['Tilston', 'Threapwood', 'Shocklach'] },
  { label: 'Whitchurch', outcode: 'SY13', aliases: ['Ash', 'Alkington'] },
  { label: 'Holt', outcode: 'LL13', aliases: ['Bangor-on-Dee'] },
  { label: 'Ruabon', outcode: 'LL14', aliases: ['Cefn Mawr', 'Rhosllanerchrugog'] },
  { label: 'Neston', outcode: 'CH64', aliases: ['Parkgate', 'Little Neston', 'Willaston'] },
  { label: 'Ellesmere Port', outcode: 'CH65', aliases: ['Whitby', 'Overpool'] },
  { label: 'Great Sutton', outcode: 'CH66', aliases: ['Little Sutton', 'Childer Thornton'] },
  { label: 'Heswall', outcode: 'CH60', aliases: ['Gayton'] },
  { label: 'Bebington', outcode: 'CH63', aliases: ['Thornton Hough', 'Clatterbridge'] },
  { label: 'Bromborough', outcode: 'CH62', aliases: ['Port Sunlight', 'Spital'] },
  { label: 'Frodsham', outcode: 'WA6', aliases: ['Helsby', 'Kingsley'] },
  { label: 'Runcorn', outcode: 'WA7', aliases: ['Sandymoor', 'Preston Brook'] },
  { label: 'Widnes', outcode: 'WA8', aliases: ['Cronton', 'Hough Green'] },
];

const normalise = (value: string) => value.trim().toLowerCase().replace(/[’']/g, '');

const areaLookup = new Map<string, AreaConfig>();
const outcodeLookup = new Map<string, string[]>();

for (const config of AREA_CONFIG) {
  const key = normalise(config.label);
  areaLookup.set(key, config);

  if (config.aliases) {
    for (const alias of config.aliases) {
      areaLookup.set(normalise(alias), config);
    }
  }

  const existing = outcodeLookup.get(config.outcode) ?? [];
  existing.push(config.label);
  outcodeLookup.set(config.outcode, existing);
}

export function getOutcodeForArea(area: string): string | undefined {
  return areaLookup.get(normalise(area))?.outcode;
}

export function findAreaConfig(area: string): AreaConfig | undefined {
  return areaLookup.get(normalise(area));
}

export function getAreasForOutcode(outcode: string): string[] {
  return [...(outcodeLookup.get(outcode.toUpperCase()) ?? [])];
}

export const AREA_LINKS: AreaLink[] = AREA_CONFIG.map((config) => ({
  label: config.label,
  outcode: config.outcode,
  href: `/quote?outcode=${encodeURIComponent(config.outcode)}#calculator`,
}));

export const AREA_OUTCODE_MAP = AREA_CONFIG.reduce<Record<string, string>>((acc, config) => {
  acc[config.label] = config.outcode;
  return acc;
}, {});
