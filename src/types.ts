export type TickerType = 'vertical' | 'horizontal' | 'marquee' | 'typewriter';

export type TickerDirection = 'up' | 'down' | 'left' | 'right';

export type ControlTarget =
  | string
  | HTMLElement
  | NodeListOf<HTMLElement>
  | Array<HTMLElement>
  | null
  | undefined;

export interface AcmeTickerControls {
  prev?: ControlTarget;
  next?: ControlTarget;
  toggle?: ControlTarget;
}

export interface AcmeTickerOptions {
  type: TickerType;
  autoplay: number;
  speed: number;
  direction: TickerDirection;
  pauseOnFocus: boolean;
  pauseOnHover: boolean;
  controls: AcmeTickerControls;
}

export const DEFAULTS: AcmeTickerOptions = {
  type: 'horizontal',
  autoplay: 2000,
  speed: 50,
  direction: 'up',
  pauseOnFocus: true,
  pauseOnHover: true,
  controls: {
    prev: '',
    next: '',
    toggle: '',
  },
};

export interface TickerHost {
  readonly element: HTMLElement;
  readonly wrap: HTMLElement;
  readonly options: AcmeTickerOptions;
  readonly paused: boolean;
  emitToggle(paused: boolean): void;
  emitCycle(count: number): void;
}
