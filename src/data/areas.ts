export type AreaLink = {
  slug: string;
  name: string;
};

const areaEntries: AreaLink[] = [
  { slug: 'aldford', name: 'Aldford' },
  { slug: 'boughton', name: 'Boughton' },
  { slug: 'bretton', name: 'Bretton' },
  { slug: 'broughton', name: 'Broughton' },
  { slug: 'buckley', name: 'Buckley' },
  { slug: 'cheshire', name: 'Cheshire' },
  { slug: 'chester', name: 'Chester' },
  { slug: 'christleton', name: 'Christleton' },
  { slug: 'connahs-quay', name: 'Connah’s Quay' },
  { slug: 'curzon-park', name: 'Curzon Park' },
  { slug: 'deeside', name: 'Deeside' },
  { slug: 'dobshill', name: 'Dobshill' },
  { slug: 'dodleston', name: 'Dodleston' },
  { slug: 'eccleston', name: 'Eccleston' },
  { slug: 'ewloe', name: 'Ewloe' },
  { slug: 'farndon', name: 'Farndon' },
  { slug: 'flint', name: 'Flint' },
  { slug: 'flintshire', name: 'Flintshire' },
  { slug: 'gresford', name: 'Gresford' },
  { slug: 'guilden-sutton', name: 'Guilden Sutton' },
  { slug: 'handbridge', name: 'Handbridge' },
  { slug: 'hawarden', name: 'Hawarden' },
  { slug: 'helsby', name: 'Helsby' },
  { slug: 'higher-kinnerton', name: 'Higher Kinnerton' },
  { slug: 'holywell', name: 'Holywell' },
  { slug: 'hoole', name: 'Hoole' },
  { slug: 'huntington', name: 'Huntington' },
  { slug: 'lower-kinnerton', name: 'Lower Kinnerton' },
  { slug: 'marford', name: 'Marford' },
  { slug: 'mold', name: 'Mold' },
  { slug: 'mynydd-isa', name: 'Mynydd Isa' },
  { slug: 'new-brighton', name: 'New Brighton' },
  { slug: 'newton', name: 'Newton' },
  { slug: 'north-west-of-england', name: 'North West of England' },
  { slug: 'northop', name: 'Northop' },
  { slug: 'northop-hall', name: 'Northop Hall' },
  { slug: 'oakenholt', name: 'Oakenholt' },
  { slug: 'penyffordd', name: 'Penyffordd' },
  { slug: 'pulford', name: 'Pulford' },
  { slug: 'queensferry', name: 'Queensferry' },
  { slug: 'rossett', name: 'Rossett' },
  { slug: 'saighton', name: 'Saighton' },
  { slug: 'saltney', name: 'Saltney' },
  { slug: 'sandycroft', name: 'Sandycroft' },
  { slug: 'shotton', name: 'Shotton' },
  { slug: 'sychdyn', name: 'Sychdyn' },
  { slug: 'tarporley', name: 'Tarporley' },
  { slug: 'tarvin', name: 'Tarvin' },
  { slug: 'tattenhall', name: 'Tattenhall' },
  { slug: 'vicars-cross', name: 'Vicars Cross' },
  { slug: 'waverton', name: 'Waverton' },
  { slug: 'westminster-park', name: 'Westminster Park' },
];

export const areaPages = areaEntries;

export const featuredAreas = [
  'chester',
  'deeside',
  'mold',
  'connahs-quay',
  'buckley',
  'flint',
  'hawarden',
  'queensferry',
];

export const getAreaUrl = (slug: string) => `/${slug}.html`;
