import { registerJqueryShim } from './jquery-adapter';

declare global {
  interface Window {
    jQuery?: unknown;
  }
}

if (typeof window !== 'undefined' && window.jQuery) {
  registerJqueryShim(window.jQuery);
}

export { AcmeTicker } from './AcmeTicker';
export { DEFAULTS } from './types';
export { registerJqueryShim } from './jquery-adapter';
export type {
  AcmeTickerControls,
  AcmeTickerOptions,
  ControlTarget,
  TickerDirection,
  TickerHost,
  TickerType,
} from './types';
