import { AREA_LIST, AREA_OUTCODES, AREA_ORDER, getPrimaryOutcodeForArea, type AreaKey } from '../lib/areas';

interface AreaLinksProps {
  areaIds?: readonly string[];
  className?: string;
}

const normaliseAreaId = (value: string): AreaKey | null => {
  return value in AREA_OUTCODES ? (value as AreaKey) : null;
};

const AreaLinks = ({ areaIds, className }: AreaLinksProps): JSX.Element => {
  const ids = areaIds && areaIds.length > 0 ? areaIds : AREA_ORDER;
  const seen = new Set<string>();
  const entries = ids
    .map((id) => normaliseAreaId(id))
    .filter((id): id is AreaKey => Boolean(id))
    .map((id) => AREA_OUTCODES[id])
    .filter((area) => {
      if (seen.has(area.id)) {
        return false;
      }
      seen.add(area.id);
      return true;
    });

  const areas = entries.length > 0 ? entries : AREA_LIST;

  const containerClass = ['area-nav', 'area-links', className].filter(Boolean).join(' ');

  return (
    <div className={containerClass} role="list">
      {areas.map((area) => {
        const outcode = getPrimaryOutcodeForArea(area.id as AreaKey) ?? area.outcodes[0];
        if (!outcode) {
          return null;
        }

        return (
          <a
            key={area.id}
            href={`/quote?outcode=${encodeURIComponent(outcode)}#calculator`}
            className="area-links__pill"
            role="listitem"
          >
            {area.label}
          </a>
        );
      })}
    </div>
  );
};

export default AreaLinks;
