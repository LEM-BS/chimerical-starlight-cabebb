export type AreaLink = {
  /**
   * Short identifier used for anchor IDs and legacy URL lookups.
   */
  slug: string;
  /**
   * Optional override for anchor IDs. Defaults to the slug when omitted.
   */
  anchor?: string;
  name: string;
  /**
   * SEO-friendly permalink (without the `.html` suffix).
   */
  permalink: string;
};

const createAreaEntry = (slug: string, name: string, anchor?: string): AreaLink => ({
  slug,
  anchor,
  name,
  permalink: `/${slug}-damp-surveys`,
});

const areaEntries: AreaLink[] = [
  createAreaEntry('alderley-edge', 'Alderley Edge'),
  createAreaEntry('aldford', 'Aldford'),
  createAreaEntry('boughton', 'Boughton'),
  createAreaEntry('bretton', 'Bretton'),
  createAreaEntry('broughton', 'Broughton'),
  createAreaEntry('buckley', 'Buckley'),
  createAreaEntry('cheshire', 'Cheshire'),
  createAreaEntry('chester', 'Chester'),
  createAreaEntry('city-centre', 'Chester City Centre'),
  createAreaEntry('christleton', 'Christleton'),
  createAreaEntry('churton', 'Churton'),
  createAreaEntry('connahs-quay', 'Connah’s Quay'),
  createAreaEntry('curzon-park', 'Curzon Park'),
  createAreaEntry('deeside', 'Deeside'),
  createAreaEntry('dobshill', 'Dobshill'),
  createAreaEntry('dodleston', 'Dodleston'),
  createAreaEntry('eccleston', 'Eccleston'),
  createAreaEntry('ewloe', 'Ewloe'),
  createAreaEntry('farndon', 'Farndon'),
  createAreaEntry('flint', 'Flint'),
  createAreaEntry('flintshire', 'Flintshire'),
  createAreaEntry('gresford', 'Gresford'),
  createAreaEntry('guilden-sutton', 'Guilden Sutton'),
  createAreaEntry('handbridge', 'Handbridge'),
  createAreaEntry('hawarden', 'Hawarden'),
  createAreaEntry('helsby', 'Helsby'),
  createAreaEntry('higher-kinnerton', 'Higher Kinnerton'),
  createAreaEntry('holywell', 'Holywell'),
  createAreaEntry('hoole', 'Hoole'),
  createAreaEntry('huntington', 'Huntington'),
  createAreaEntry('kelsall', 'Kelsall'),
  createAreaEntry('knutsford', 'Knutsford'),
  createAreaEntry('lower-kinnerton', 'Lower Kinnerton'),
  createAreaEntry('malpas', 'Malpas'),
  createAreaEntry('marford', 'Marford'),
  createAreaEntry('mold', 'Mold'),
  createAreaEntry('mollington', 'Mollington'),
  createAreaEntry('mynydd-isa', 'Mynydd Isa'),
  createAreaEntry('neston-parkgate', 'Neston & Parkgate'),
  createAreaEntry('new-brighton', 'New Brighton'),
  createAreaEntry('newton', 'Newton'),
  createAreaEntry('north-west-of-england', 'North West of England'),
  createAreaEntry('northop', 'Northop'),
  createAreaEntry('northop-hall', 'Northop Hall'),
  createAreaEntry('oakenholt', 'Oakenholt'),
  createAreaEntry('penyffordd', 'Penyffordd'),
  createAreaEntry('prestbury', 'Prestbury'),
  createAreaEntry('pulford', 'Pulford'),
  createAreaEntry('queens-park', 'Queen’s Park'),
  createAreaEntry('queensferry', 'Queensferry'),
  createAreaEntry('rossett', 'Rossett'),
  createAreaEntry('saighton', 'Saighton'),
  createAreaEntry('saltney', 'Saltney'),
  createAreaEntry('sandycroft', 'Sandycroft'),
  createAreaEntry('saughall', 'Saughall'),
  createAreaEntry('shotton', 'Shotton'),
  createAreaEntry('sychdyn', 'Sychdyn'),
  createAreaEntry('tarporley', 'Tarporley'),
  createAreaEntry('tarvin', 'Tarvin'),
  createAreaEntry('tattenhall', 'Tattenhall'),
  createAreaEntry('tilston', 'Tilston'),
  createAreaEntry('upton', 'Upton'),
  createAreaEntry('vicars-cross', 'Vicars Cross'),
  createAreaEntry('waverton', 'Waverton'),
  createAreaEntry('westminster-park', 'Westminster Park'),
  createAreaEntry('wilmslow', 'Wilmslow'),
];

const areaLookup = new Map(areaEntries.map((area) => [area.slug, area]));

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

export const areaSelectorSlugs = [
  'connahs-quay',
  'buckley',
  'hawarden',
  'ewloe',
  'deeside',
  'broughton',
  'flintshire',
  'chester',
  'cheshire',
  'northop',
  'northop-hall',
  'mold',
  'north-west-of-england',
];

export const getAreaBySlug = (slug: string) => areaLookup.get(slug);

export const getAreaPermalink = (slug: string) => {
  const area = areaLookup.get(slug);
  if (!area) {
    return `/${slug}`;
  }

  return area.permalink;
};

export const getAreaAnchor = (slug: string) => areaLookup.get(slug)?.anchor ?? slug;

export const buildAreaOptions = (slugs: string[]) =>
  slugs
    .map((slug) => {
      const area = areaLookup.get(slug);
      if (!area) {
        return undefined;
      }

      return {
        slug,
        name: area.name,
        anchor: area.anchor ?? area.slug,
        permalink: getAreaPermalink(slug),
      };
    })
    .filter((option): option is { slug: string; name: string; anchor: string; permalink: string } =>
      Boolean(option),
    );

export const areaSelectorOptions = buildAreaOptions(areaSelectorSlugs);
