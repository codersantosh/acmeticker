import { AcmeTicker } from './AcmeTicker';
import { DEFAULTS, type AcmeTickerOptions } from './types';

type EachCallback = (this: HTMLElement, index: number, element: HTMLElement) => void;

interface JQueryLike {
  fn: Record<string, unknown>;
  each(callback: EachCallback): unknown;
}

type PublicMethod =
  | 'play'
  | 'pause'
  | 'toggle'
  | 'next'
  | 'prev'
  | 'update'
  | 'destroy';

const instances = new WeakMap<HTMLElement, AcmeTicker>();

export function registerJqueryShim(jQuery: unknown): void {
  if (!jQuery || typeof (jQuery as JQueryLike).fn === 'undefined') {
    return;
  }
  const jq = jQuery as JQueryLike;
  const plugin = function (
    this: unknown,
    methodOrOptions?: Partial<AcmeTickerOptions> | PublicMethod,
    ...args: unknown[]
  ): unknown {
    const collection = this as JQueryLike;
    if (typeof collection.each !== 'function') {
      return undefined;
    }
    return collection.each(function (this: HTMLElement) {
      if (typeof methodOrOptions === 'string') {
        const instance = instances.get(this);
        if (instance) {
          const method = (
            instance as unknown as Record<PublicMethod, (...m: unknown[]) => void>
          )[methodOrOptions as PublicMethod];
          if (typeof method === 'function') {
            method.apply(instance, args);
          }
          if (methodOrOptions === 'destroy') {
            instances.delete(this);
          }
        }
        return;
      }
      instances.set(this, new AcmeTicker(this, methodOrOptions));
    });
  };
  Object.assign(plugin, { defaults: { ...DEFAULTS } });
  jq.fn.AcmeTicker = plugin;
}
