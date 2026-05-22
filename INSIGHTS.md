# INSIGHTS — Three Things Learned About LILA BLACK

---

## Insight 1: AmbroseValley Dominates — GrandRift Is Nearly Abandoned

### What caught my eye
When looking at match distribution across maps, the imbalance was extreme. AmbroseValley accounts for the vast majority of all matches while GrandRift is almost never played.

### Supporting Evidence
| Map | Matches | Share |
|-----|---------|-------|
| AmbroseValley | 566 | **71.1%** |
| Lockdown | 171 | 21.5% |
| GrandRift | 59 | **7.4%** |

GrandRift has ~10× fewer matches than AmbroseValley and ~3× fewer than Lockdown despite being one of only 3 maps in rotation.

### Actionable Items
- **Investigate why players avoid GrandRift** — survey data, session length, early-exit rates
- **Metric to watch**: Match selection rate per map; avg session length per map
- **Actions**: Reduce GrandRift's rotation weight temporarily; redesign the map's opening flow or landmark density to make it more discoverable and rewarding early on

### Why a Level Designer Should Care
If most players never meaningfully experience GrandRift, any design work on it has near-zero impact on the player base. Either the map needs a rework to earn its rotation slot, or it should be replaced with a new one.

---

## Insight 2: Loot Is the Dominant Activity — Combat Is Rare

### What caught my eye
The event breakdown shows an overwhelming skew toward looting over combat. Players are spending most of their time collecting items, not fighting.

### Supporting Evidence
| Event | Count | Share of non-movement events |
|-------|-------|------------------------------|
| Loot | 12,885 | **83.3%** |
| BotKill | 2,415 | 15.6% |
| BotKilled | 700 | 4.5% |
| KilledByStorm | 39 | 0.25% |
| Kill (human vs human) | 3 | **0.019%** |
| Killed (human vs human) | 3 | **0.019%** |

Human-vs-human kills are almost non-existent (only 3 recorded across 5 days and 796 matches). The game is effectively a PvE loot-run against bots, not a PvP experience.

### Actionable Items
- **Metric to watch**: Human-vs-human kill rate per match; avg player encounters per match
- **Actions**:
  - Increase human player density per lobby to drive more PvP encounters
  - Create loot-scarce zones that force player movement into contested areas
  - Add high-value extraction points that multiple players are incentivised to contest simultaneously
  - Review spawn placement — if human players are too spread out, they never meet

### Why a Level Designer Should Care
The map layout directly controls whether players encounter each other. If extraction routes and loot zones are too distributed, players can complete a full match without ever seeing another human. Funnelling players through shared chokepoints is a design lever to increase PvP tension.

---

## Insight 3: Storm Deaths Are Extremely Rare — The Storm Isn't a Real Threat

### What caught my eye
With 39 storm deaths across 796 matches (5 days of data), the storm is killing fewer than 0.05 players per match on average. For a game where the storm is supposed to be a core mechanic that forces movement, this is a red flag.

### Supporting Evidence
- **39 KilledByStorm events** across **796 matches** = **0.049 storm deaths per match**
- **2,418 total kill events** vs **39 storm deaths** = storm accounts for only **1.6%** of all deaths
- Storm heatmap shows deaths concentrated in just a few edge-of-map positions, meaning most players are extracting comfortably before the storm arrives

### Actionable Items
- **Metric to watch**: Storm death rate per match; avg distance from storm boundary at extraction time; % of players who extract vs die to storm
- **Actions**:
  - Increase storm speed or reduce its warning time to create more urgency
  - Shorten the extraction window so players cannot loot freely and still escape comfortably
  - Place high-value loot in areas the storm reaches first, forcing a risk/reward tradeoff
  - Add a heatmap view of storm death positions to identify which map areas players feel "safe" in for too long

### Why a Level Designer Should Care
If the storm isn't killing anyone, it's not shaping player behaviour. The entire "extract before the storm" tension — which is core to the extraction shooter fantasy — is absent from the experience. Map layout, extraction point placement, and loot density all interact with storm timing. Fixing storm threat means rethinking how the map channels players through time.
