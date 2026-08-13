import type { AcmeTickerOptions, TickerHost } from '../types';
import { MarqueeEngine } from './marquee';
import { TypewriterEngine } from './typewriter';
import { VerticalHorizontalEngine } from './vertical-horizontal';

export interface TickerEngine {
  init(): void;
  prev(): void;
  next(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
}

export function createEngine(type: AcmeTickerOptions['type'], host: TickerHost): TickerEngine {
  switch (type) {
    case 'vertical':
    case 'horizontal':
      return new VerticalHorizontalEngine(host);
    case 'marquee':
      return new MarqueeEngine(host);
    case 'typewriter':
      return new TypewriterEngine(host);
  }
}
