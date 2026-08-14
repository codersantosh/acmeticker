import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { AcmeTicker } from 'acmeticker';
import type { AcmeTickerControls, AcmeTickerOptions } from 'acmeticker';

const HEADLINES = [
  'الأسواق العالمية تسجل مكاسب ملحوظة مع تراجع معدلات التضخم',
  'المدينة تطلق أسطول الحافلات الكهربائية مع رحلات مجانية للشهر الأول',
  'علماء يبتكرون تقنية جديدة لاستعادة وحماية الشعب المرجانية',
  'المباراة النهائية تمتد إلى الأشواط الإضافية وسط منافسة محتدمة',
  'استقرار أسعار العقارات مع انخفاض الفائدة للشهر الثالث على التوالي',
  'افتتاح مقهى جديد يقدم ورش عمل أسبوعية لعشاق القهوة',
  'دراسة حديثة تؤكد فوائد المشي الصباحي لتعزيز الذاكرة والنشاط',
  'تدشين رحلات طيران مباشرة جديدة بين المدينتين الساحليتين',
];

const EN_HEADLINES = [
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
  headlines?: string[];
}

function TickerSection({ title, label, options, pauseOnly = false, headlines = HEADLINES }: TickerSectionProps) {
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
            {headlines.map((headline) => (
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

function RtlDemo() {
  return (
    <div className="at-ctnr" id="at-demos">
      <TickerSection
        title="شريط الأخبار العمودي"
        label="أخبار عاجلة"
        options={{ type: 'vertical', direction: 'up', speed: 600 }}
      />
      <TickerSection
        title="شريط الأخبار الأفقي"
        label="أخبار"
        options={{ type: 'horizontal', direction: 'right', speed: 600 }}
      />
      <TickerSection
        title="شريط متحرك (ماركي)"
        label="عاجل"
        options={{ type: 'marquee', direction: 'left', speed: 0.05 }}
        pauseOnly
      />
      <TickerSection
        title="شريط الآلة الكاتبة"
        label="موجز الأخبار"
        options={{ type: 'typewriter', speed: 50 }}
      />
      <TickerSection
        title="شريط أفقي (تعطيل RTL)"
        label="Horizontal News"
        options={{ type: 'horizontal', direction: 'right', rtl: false, speed: 600 }}
        headlines={EN_HEADLINES}
      />
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <RtlDemo />
    </StrictMode>,
  );
}

export {};
