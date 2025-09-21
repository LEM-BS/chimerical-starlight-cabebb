import { useMemo } from 'react';

import { AREA_LINKS, findAreaConfig, type AreaLink as AreaLinkConfig } from '../lib/areas';

interface AreaLinksProps {
  areas?: string[];
  className?: string;
}

const normalise = (value: string) => value.trim().toLowerCase();

const buildLinks = (areas?: string[]): AreaLinkConfig[] => {
  if (!areas || areas.length === 0) {
    return AREA_LINKS;
  }

  const seen = new Set<string>();
  const resolved: AreaLinkConfig[] = [];

  for (const area of areas) {
    const config = findAreaConfig(area);
    if (!config) continue;

    const link = AREA_LINKS.find(
      (entry) => entry.outcode === config.outcode && normalise(entry.label) === normalise(config.label),
    );

    if (link && !seen.has(link.label)) {
      resolved.push(link);
      seen.add(link.label);
    }
  }

  if (resolved.length === 0) {
    return AREA_LINKS;
  }

  return resolved;
};

const AreaLinks = ({ areas, className }: AreaLinksProps) => {
  const links = useMemo(() => buildLinks(areas), [areas]);
  const navClass = ['area-links', className].filter(Boolean).join(' ');

  return (
    <nav aria-label="Survey area shortcuts" className={navClass}>
      <ul className="area-links__list">
        {links.map((link) => (
          <li className="area-links__item" key={`${link.label}-${link.outcode}`}>
            <a className="area-links__pill" data-outcode={link.outcode} href={link.href}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default AreaLinks;
