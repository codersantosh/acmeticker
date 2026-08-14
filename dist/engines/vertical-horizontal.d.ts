import type { TickerHost } from '../types';
import type { TickerEngine } from './index';
export declare class VerticalHorizontalEngine implements TickerEngine {
    private readonly host;
    private readonly horizontal;
    private intervalID;
    private rafID;
    private stepCount;
    private completedCycles;
    constructor(host: TickerHost);
    init(): void;
    prev(): void;
    next(): void;
    pause(): void;
    resume(): void;
    destroy(): void;
    private arm;
    private clearInterval;
    private tick;
    private navigate;
    private rotate;
    private settle;
    private styleProp;
    private visibleHeight;
    private animate;
    private complete;
}
