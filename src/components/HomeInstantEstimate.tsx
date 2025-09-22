import type { ReactElement } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

import QuoteCalculator from './QuoteCalculator';

const HomeInstantEstimate = (): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const baseId = useId();

  const panelId = `${baseId}-panel`;
  const toggleId = `${baseId}-toggle`;

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    if (isOpen) {
      panel.removeAttribute('inert');
    } else {
      panel.setAttribute('inert', '');
    }
  }, [isOpen]);

  const handleToggle = (): void => {
    if (!isOpen && !hasOpened) {
      setHasOpened(true);
    }

    setIsOpen((previous) => !previous);
  };

  const shouldRenderCalculator = hasOpened || isOpen;

  return (
    <div className={`instant-estimate field full${isOpen ? ' instant-estimate--open' : ''}`}>
      <button
        id={toggleId}
        type="button"
        className="instant-estimate__toggle"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={handleToggle}
      >
        <span className="instant-estimate__label">Get instant estimate</span>
        <span className="instant-estimate__indicator" aria-hidden="true">
          <svg className="instant-estimate__icon" viewBox="0 0 20 20" focusable="false" aria-hidden="true">
            <path d="M5 7.5 10 12l5-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
          </svg>
        </span>
      </button>
      <div
        ref={panelRef}
        className="instant-estimate__panel"
        role="region"
        id={panelId}
        aria-labelledby={toggleId}
        aria-hidden={!isOpen}
        data-state={isOpen ? 'open' : 'closed'}
      >
        {shouldRenderCalculator ? <QuoteCalculator /> : null}
      </div>
    </div>
  );
};

export default HomeInstantEstimate;
