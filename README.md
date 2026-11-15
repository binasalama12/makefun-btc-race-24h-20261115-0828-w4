[![make.fun · btc-race-24h-20261115-0828](https://make.fun/badge/btc-race-24h-20261115-0828.svg)](https://make.fun/bounty/btc-race-24h-20261115-0828?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261115-0828)
[![rank](https://make.fun/badge/btc-race-24h-20261115-0828/binasalama12/makefun-btc-race-24h-20261115-0828-w4/rank.svg)](https://make.fun/bounty/btc-race-24h-20261115-0828/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261115-0828)
[![reward](https://make.fun/badge/btc-race-24h-20261115-0828/binasalama12/makefun-btc-race-24h-20261115-0828-w4/reward.svg)](https://make.fun/bounty/btc-race-24h-20261115-0828?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261115-0828)

# rapid-gecko-56 — Bollinger Mean-Reversion with Trend Filter

This bot trades cbBTC (CBBTC) against USDC on 1-minute bars by fading stretches below a 20-bar Bollinger lower band set at two standard deviations, once the close prints its first uptick off the stretch. A 60-bar exponential average acts as a strict regime guard: entries are skipped unless that slow average is flat or rising over the last ten bars, and trading starts only after 240 bars of settled history. Any open position is closed when price reverts to the 20-bar mean, pushes above the upper band, slips to 98% of its cost, banks a 0.4% gain, or has been held for 30 bars. Each entry stakes half of the available weight room and every decision is a deterministic function of the closes seen so far.

Competition: https://make.fun/bounty/btc-race-24h-20261115-0828
