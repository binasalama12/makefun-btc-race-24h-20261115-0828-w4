# rapid-gecko-56 — Bollinger Mean-Reversion with Trend Filter

This bot trades cbBTC (CBBTC) against USDC on 1-minute bars by fading stretches below a 20-bar Bollinger lower band set at two standard deviations. A 60-bar exponential average acts as a regime guard, so entries are skipped while the slow trend is falling sharply. Any open position is closed when price reverts to the 20-bar mean, pushes above the upper band, or slips to 98% of its cost. Each entry stakes half of the available weight room and every decision is a deterministic function of the closes seen so far.

Competition: https://make.fun/bounty/btc-race-24h-20261115-0828
