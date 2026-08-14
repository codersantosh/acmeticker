import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { AcmeTicker } from 'acmeticker';
import type { AcmeTickerControls, AcmeTickerOptions } from 'acmeticker';

const HEADLINES = [
  'Global markets rally as inflation cools faster than expected',
  'City launches electric bus fleet with free rides for the first month',
  'Scientists reveal a new coral reef restoration technique',
  'Season finale heads to extra time with the title still undecided',
  'Home prices steady as mortgage rates ease for the third straight month',
  'New downtown coffee roaster opens with weekend barista workshops',
  'Study links morning walks to sharper memory in older adults',
  'Airline adds direct summer flights between the two coastal cities',
];

interface TickerSectionProps {
  title: string;
  label: string;
  options: Partial<AcmeTickerOptions>;
  pauseOnly?: boolean;
}

function TickerSection({ title, label, options, pauseOnly = false }: TickerSectionProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const controls: AcmeTickerControls = pauseOnly
      ? { toggle: toggleRef.current }
      : { prev: prevRef.current, next: nextRef.current, toggle: toggleRef.current };
    const ticker = new AcmeTicker(listEl, { ...options, controls });
    toggleRef.current?.classList.toggle('is-paused', ticker.paused);

    const onToggle = (e: Event): void => {
      const detail = (e as CustomEvent).detail as { ticker: HTMLElement; paused: boolean };
      if (detail.ticker === listEl) {
        toggleRef.current?.classList.toggle('is-paused', detail.paused);
      }
    };
    document.addEventListener('acmeTickerToggle', onToggle);

    return () => {
      ticker.destroy();
      document.removeEventListener('acmeTickerToggle', onToggle);
    };
  }, [options, pauseOnly]);

  return (
    <section>
      <h2 className="at-m">{title}</h2>
      <div className="at-ticker at-flx at-pos at-h at-bdr at-bg-cl at-m at-box-szg">
        <div className="at-ticker-label at-bg-cl at-cl at-p at-flx-srnk-0">{label}</div>
        <div className="at-ticker-box at-h at-ovf at-p at-flx-grw-1 at-box-szg">
          <ul ref={listRef} className="my-news-ticker">
            {HEADLINES.map((headline) => (
              <li key={headline}>
                <a href="#">{headline}</a>
              </li>
            ))}
          </ul>
        </div>
        <div className={`at-ticker-controls at-ticker-controls-${options.type} at-pos at-flx at-h`}>
          {!pauseOnly && (
            <button ref={prevRef} aria-label="Previous" className="at-ticker-arrow at-ticker-prev at-w at-h at-bdr at-bg-cl at-cur at-p at-pos at-box-szg" />
            )}
          <button ref={toggleRef} aria-label="Toggle playback" className="at-ticker-pause at-w at-h at-bdr at-bg-cl at-cur at-p at-pos at-box-szg" />
          {!pauseOnly && (
            <button ref={nextRef} aria-label="Next" className="at-ticker-arrow at-ticker-next at-w at-h at-bdr at-bg-cl at-cur at-p at-pos at-box-szg" />
          )}
        </div>
      </div>
    </section>
  );
}

function TickerDemo() {
  return (
    <div className="at-ctnr" id="at-demos">
      <TickerSection
        title="Vertical Ticker"
        label="Vertical News"
        options={{ type: 'vertical', direction: 'up', speed: 600 }}
      />
      <TickerSection
        title="Horizontal Ticker"
        label="Horizontal News"
        options={{ type: 'horizontal', direction: 'right', speed: 600 }}
      />
      <TickerSection
        title="Marquee"
        label="Marquee"
        options={{ type: 'marquee', direction: 'left', speed: 0.05 }}
        pauseOnly
      />
      <TickerSection
        title="Typewriter"
        label="Typewriter News"
        options={{ type: 'typewriter', speed: 50 }}
      />
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <TickerDemo />
    </StrictMode>,
  );
}

export {};
