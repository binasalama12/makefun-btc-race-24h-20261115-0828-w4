// rapid-gecko-56: Bollinger mean-reversion guarded by a slow trend filter.
//
// Idea in one breath: cbBTC wobbling far below its own recent average tends
// to snap back toward that average, so we buy the stretch — but only when
// the slower trend is not collapsing underneath us. Everything is rebuilt
// bar by bar from closes alone (volume is always null in this replay).

import { runBars } from './vendor/makefun-bars.ts';

const TICKER = 'CBBTC';

// Band geometry: middle = plain average of the last MID_LEN closes,
// half-width = BAND_K times the population deviation of that same window.
const MID_LEN = 20;
const BAND_K = 2.0;

// Slow exponential average used purely as a regime guard, never as a signal.
const TREND_LEN = 60;
const TREND_LAG = 10; // compare today's trend value with the one this many bars back
const TREND_FLOOR = 0.999; // tolerate a dip of at most 0.1% over the lag window

// Position handling.
const ROOM_SHARE = 2n; // stake = weightRoom / ROOM_SHARE, i.e. one half
const STOP_KEEP = 98n; // bail once the position is worth <= 98/100 of its cost
const STOP_BASE = 100n;
const SLIP_CAP_BPS = 100;

// Rolling close history in plain dollars (float64, so runs repeat exactly).
const closesTrail: number[] = [];
let trendEma: number | null = null;
const trendTrail: number[] = [];

function noteClose(px: number): void {
  closesTrail.push(px);
  const alpha = 2 / (TREND_LEN + 1);
  trendEma = trendEma === null ? px : trendEma + alpha * (px - trendEma);
  trendTrail.push(trendEma);
  if (trendTrail.length > TREND_LAG + 4) trendTrail.shift();
}

interface BandSnapshot {
  mid: number;
  upper: number;
  lower: number;
}

function currentBands(): BandSnapshot | null {
  if (closesTrail.length < MID_LEN) return null;
  const win = closesTrail.slice(closesTrail.length - MID_LEN);
  let acc = 0;
  for (const v of win) acc += v;
  const mid = acc / MID_LEN;
  let sq = 0;
  for (const v of win) sq += (v - mid) * (v - mid);
  const dev = Math.sqrt(sq / MID_LEN);
  return { mid, upper: mid + BAND_K * dev, lower: mid - BAND_K * dev };
}

function trendIsCalm(): boolean {
  if (trendTrail.length <= TREND_LAG) return false;
  const now = trendTrail[trendTrail.length - 1]!;
  const then = trendTrail[trendTrail.length - 1 - TREND_LAG]!;
  return now >= then * TREND_FLOOR;
}

await runBars({
  onBatch(state, batch) {
    // Fold this batch's CBBTC bar into the history first; a batch without
    // one leaves every indicator untouched and earns no decision.
    let px: number | null = null;
    for (const bar of batch.bars) {
      if (bar.symbol !== TICKER) continue;
      const meta = state.symbols.get(TICKER);
      const scale = meta === undefined ? 5 : meta.price_scale;
      px = Number(bar.c) / 10 ** scale;
      noteClose(px);
    }
    if (px === null || state.warmingUp) return [];

    const held = state.positions.get(TICKER);

    // --- exits are re-evaluated on every fresh bar while we hold ---
    if (held !== undefined && held.qty > 0n) {
      const bands = currentBands();
      const worthNow = state.value(TICKER, held.qty);
      const hitStop = worthNow * STOP_BASE <= held.cost * STOP_KEEP;
      const backToMiddle = bands !== null && px >= bands.mid;
      const stretchedUp = bands !== null && px > bands.upper;
      if (hitStop || backToMiddle || stretchedUp) {
        return [{ side: 'sell', symbol: TICKER, qty: held.qty, max_slippage_bps: SLIP_CAP_BPS }];
      }
      return [];
    }

    // --- entry: stretched below the lower band, trend not falling hard ---
    if (closesTrail.length < TREND_LEN) return [];
    const bands = currentBands();
    if (bands === null) return [];
    if (px >= bands.lower) return [];
    if (!trendIsCalm()) return [];

    const room = state.weightRoom(TICKER);
    const stake = room / ROOM_SHARE;
    const minTicket = BigInt(state.hello.fees.min_notional_quote_units);
    if (stake < minTicket || stake > state.cash) return [];
    return [{ side: 'buy', symbol: TICKER, notional_quote_units: stake, max_slippage_bps: SLIP_CAP_BPS }];
  },
});
