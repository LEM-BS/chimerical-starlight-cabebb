export type ServiceArea = {
  slug: string;
  name: string;
};

export type ServiceAreaGroup = {
  region: string;
  areas: ServiceArea[];
};

export const serviceAreaGroups: ServiceAreaGroup[] = [
  {
    region: 'Flintshire & Deeside',
    areas: [
      { slug: 'flintshire', name: 'Flintshire' },
      { slug: 'deeside', name: 'Deeside' },
      { slug: 'connahs-quay', name: 'Connah’s Quay' },
      { slug: 'buckley', name: 'Buckley' },
      { slug: 'hawarden', name: 'Hawarden' },
      { slug: 'ewloe', name: 'Ewloe' },
      { slug: 'broughton', name: 'Broughton' },
      { slug: 'flint', name: 'Flint' },
      { slug: 'mold', name: 'Mold' },
      { slug: 'mynydd-isa', name: 'Mynydd Isa' },
      { slug: 'new-brighton', name: 'New Brighton' },
      { slug: 'northop', name: 'Northop' },
      { slug: 'northop-hall', name: 'Northop Hall' },
      { slug: 'oakenholt', name: 'Oakenholt' },
      { slug: 'holywell', name: 'Holywell' },
      { slug: 'queensferry', name: 'Queensferry' },
      { slug: 'shotton', name: 'Shotton' },
      { slug: 'sandycroft', name: 'Sandycroft' },
      { slug: 'dobshill', name: 'Dobshill' },
      { slug: 'penyffordd', name: 'Penyffordd' },
      { slug: 'sychdyn', name: 'Sychdyn' }
    ]
  },
  {
    region: 'Chester City & Suburbs',
    areas: [
      { slug: 'chester', name: 'Chester' },
      { slug: 'boughton', name: 'Boughton' },
      { slug: 'curzon-park', name: 'Curzon Park' },
      { slug: 'handbridge', name: 'Handbridge' },
      { slug: 'hoole', name: 'Hoole' },
      { slug: 'huntington', name: 'Huntington' },
      { slug: 'newton', name: 'Newton' },
      { slug: 'saltney', name: 'Saltney' },
      { slug: 'vicars-cross', name: 'Vicars Cross' },
      { slug: 'westminster-park', name: 'Westminster Park' },
      { slug: 'guilden-sutton', name: 'Guilden Sutton' }
    ]
  },
  {
    region: 'Cheshire Villages & Rural Borders',
    areas: [
      { slug: 'cheshire', name: 'Cheshire' },
      { slug: 'aldford', name: 'Aldford' },
      { slug: 'christleton', name: 'Christleton' },
      { slug: 'eccleston', name: 'Eccleston' },
      { slug: 'farndon', name: 'Farndon' },
      { slug: 'pulford', name: 'Pulford' },
      { slug: 'saighton', name: 'Saighton' },
      { slug: 'tarporley', name: 'Tarporley' },
      { slug: 'tarvin', name: 'Tarvin' },
      { slug: 'tattenhall', name: 'Tattenhall' },
      { slug: 'waverton', name: 'Waverton' }
    ]
  },
  {
    region: 'Welsh Border & Wrexham Villages',
    areas: [
      { slug: 'bretton', name: 'Bretton' },
      { slug: 'dodleston', name: 'Dodleston' },
      { slug: 'gresford', name: 'Gresford' },
      { slug: 'higher-kinnerton', name: 'Higher Kinnerton' },
      { slug: 'lower-kinnerton', name: 'Lower Kinnerton' },
      { slug: 'marford', name: 'Marford' },
      { slug: 'rossett', name: 'Rossett' }
    ]
  }
];
