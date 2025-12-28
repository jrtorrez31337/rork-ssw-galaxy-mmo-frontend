# SPACE MECHANICS DOCTRINE: PHYSICS & INTERACTION AUTHORITY

**Classification:** Systems Law
**Version:** 1.0
**Status:** Canonical
**Prerequisite:** UI/UX Doctrine v1.0

---

## Preamble: The Feel We Are Chasing

The Millennium Falcon drops out of hyperspace. The cockpit viewport fills with an asteroid field that shouldn't be there. Alderaan is gone. In that moment, the player understands:

- Where they are (the Alderaan system, coordinates known)
- What has changed (planet destroyed, debris field present)
- What threatens them (TIE fighters inbound, asteroids immediate)
- What choices exist (fight, flee, hide in the field)

This is the experience we encode into systems. Not the graphics. The *information state* that creates drama.

The game asks: **What do you know, and what will you do about it?**

---

## 1. EXPLORATION MODEL

### 1.1 Spatial Abstraction: The Three Scales

Space is incomprehensibly vast. We compress it into three human-readable scales:

#### GALAXY SCALE (Strategic)

The galaxy is a collection of **Systems** organized into **Sectors**.

```
GALAXY
└── Sector (named region, e.g., "Outer Rim")
    └── System (star + orbital bodies, e.g., "Tatooine System")
        └── Points of Interest (stations, planets, anomalies)
```

**Representation:** 2D star map. Systems are nodes. Sectors are regions with borders. Hyperspace lanes connect systems (more on this in Travel).

**Player Knowledge:** Players see only systems they have visited or purchased charts for. Unexplored sectors show as "unmapped" with vague density indicators (sparse, moderate, dense).

**Scale Feel:** Looking at a star map on the bridge. Planning expeditions. Strategic decisions about where to go next.

---

#### SYSTEM SCALE (Operational)

A single star system contains:

- The primary star (center, impassable gravity well)
- Orbital bodies (planets, moons, stations)
- Asteroid fields (navigable hazards)
- Points of interest (derelicts, anomalies, hidden caches)
- Other ships (NPCs, players)

**Representation:** 2D orbital view. The star is center. Bodies are positioned by orbital distance and current angle. Ships are icons with vector indicators.

**Distance Unit:** Light-seconds (ls). Typical system radius: 50-200 ls from star to outer edge.

**Player Knowledge:** Sensors reveal the system progressively. Close objects are detailed. Distant objects are contacts (unknown until approached or scanned).

**Scale Feel:** The viewscreen showing local space. Tactical awareness. "What's out there?"

---

#### LOCAL SCALE (Tactical)

The immediate vicinity of the player's ship:

- Weapons range (typically 1-10 ls)
- Docking range (0.1 ls)
- Collision range (0.01 ls)
- Other ships in engagement envelope

**Representation:** The same 2D view as System Scale, but zoomed. Grid overlay optional. Ship icons show facing, velocity vector, and status.

**Distance Unit:** Light-seconds, displayed to decimal precision (e.g., "2.4 ls").

**Player Knowledge:** Full sensor detail on anything in local range. You see what's shooting at you.

**Scale Feel:** The targeting computer. Moment-to-moment combat. "Lock S-foils in attack position."

---

### 1.2 Discovery Mechanics

#### The Fog of Space

Unexplored space is not "black fog" that lifts when you visit. It is **unknown probability space**. The player knows *something* is there, but not *what*.

**Unmapped System:**
- Visible on galaxy map if within sensor range of mapped system
- Shows: spectral class of star (color), estimated body count (±30%)
- Hidden: actual contents, hazards, faction presence, resources

**Mapped System (visited or charted):**
- Shows: all major bodies, known stations, established lanes
- Updates: player's last visit timestamp
- Hidden: new developments since last visit, hidden locations not yet discovered

**Sensor Contacts:**
- Distant objects appear as "contacts" with uncertainty
- Contact types: unknown, ship-class, structure-class, anomaly-class
- Resolution requires: closer approach OR active scan (costs energy, reveals your position)

---

#### Discovery Triggers

Players discover new information through:

| Method | Reveals | Cost/Risk |
|--------|---------|-----------|
| Approaching | Visual detail, basic scan data | Time, fuel, exposure |
| Passive Scan | Contact type, approximate size | None (always running) |
| Active Scan | Full detail, cargo, weapons | Energy, reveals your position |
| Data Purchase | System charts, POI locations | Credits |
| Mission Intel | Specific coordinates, hidden sites | Mission commitment |
| Exploration Probe | Remote scan, delayed return | Probe cost, time delay |

---

#### The Sensor Model

Sensors are not magic. They are bounded by physics (simplified for gameplay).

**Passive Sensors:** Always on. Detect emissions (engine heat, communications, weapons fire). Range: system-wide but resolution degrades with distance.

**Active Sensors:** Emit energy pulses. Return detailed data on contacts. Range: 20-50 ls depending on equipment. Cost: energy from ship reactor. Side effect: any ship in range knows you pinged.

**Sensor Resolution Degradation:**

| Distance | Passive Detail | Active Detail |
|----------|----------------|---------------|
| < 5 ls | Ship class, vector | Full loadout, cargo, hull status |
| 5-20 ls | Contact type, size | Ship class, vector, shields |
| 20-50 ls | Contact exists | Contact type, size |
| > 50 ls | Nothing | Contact exists (if active scan) |

**Design Principle:** Information has cost. Free information is low-resolution. High-resolution information requires energy expenditure and risk exposure.

---

### 1.3 Knowledge Persistence

What the player learns is permanently recorded in their ship's computer:

- **Star Charts:** Systems visited, bodies catalogued, stations known
- **Contact Database:** Ships encountered, faction affiliations noted
- **Event Log:** Combat engagements, discoveries, anomalies logged

This data is:
- **Personal:** Other players don't see your discoveries
- **Tradeable:** Charts can be copied and sold
- **Perishable:** Station states change; old intel may be wrong

**Feel:** You are building a personal map of the galaxy. Your knowledge is valuable. Sharing it is a choice.

---

## 2. TRAVEL MODEL

### 2.1 The Two Speeds

#### Sublight (In-System Movement)

Movement within a star system at speeds below light.

**Speed Range:** 0.001c to 0.1c (c = speed of light)
- Combat speed: 0.001c-0.01c (maneuverable)
- Cruise speed: 0.01c-0.05c (efficient)
- Flank speed: 0.05c-0.1c (fuel-hungry, hard to stop)

**Representation:** Ships have velocity vectors displayed as lines extending from ship icon. Length = speed. Direction = heading.

**Physics Model (Simplified):**
- Ships have thrust (acceleration capability)
- Ships have mass (affects acceleration)
- Velocity changes require fuel burn
- No friction in space—you coast at current velocity until you thrust
- Stopping requires thrust opposite to motion ("burn and flip")

**Travel Time Examples:**
- Station to nearby planet (10 ls): 2-5 minutes at cruise
- Across system (100 ls): 15-30 minutes at cruise
- Emergency burn across system: 5-10 minutes (high fuel cost)

**Design Principle:** In-system travel takes real time. Not loading screens—you are flying through space. Things can happen en route.

---

#### Hyperspace (Inter-System Movement)

Movement between star systems through an alternate dimension where normal physics don't apply.

**Requirements:**
- Hyperspace-capable drive
- Calculated route (takes time, can be pre-computed)
- Clear gravity well (cannot jump too close to large masses)
- Sufficient fuel

**The Jump Process:**
1. **Route Calculation:** 10-60 seconds based on distance and computer quality
2. **Gravity Clearance:** Ship must be > 10 ls from any planet/star
3. **Spool Up:** Drive charges for 5-10 seconds (interruptible by damage)
4. **Transition:** Ship enters hyperspace (cannot be intercepted)
5. **In Transit:** Ship is unreachable, player sees "in hyperspace" state
6. **Arrival:** Ship drops out at destination system's edge

**Travel Time:**
- Short jumps (adjacent systems): 30 seconds - 2 minutes
- Medium jumps (same sector): 2-5 minutes
- Long jumps (cross-sector): 5-15 minutes
- Extreme range: May require multiple waypoints

**Hyperspace Lanes:**
Pre-calculated safe routes between major systems. Using lanes:
- Faster calculation (near-instant)
- Lower fuel cost
- Predictable arrival points (can be ambushed)

Off-lane jumps:
- Longer calculation
- Higher fuel cost
- Arrival point less predictable (safer from ambush)

**Design Principle:** Hyperspace is an escape, a commitment, and a transition. Jumping away saves you—but you're gone. Arriving somewhere takes you somewhere else—but you might land in trouble.

---

### 2.2 Transition States

Travel is not instant. The in-between moments create tension.

#### Pre-Jump (Vulnerable)

- Route calculating: progress bar visible
- Drive spooling: progress bar visible
- Ship cannot warp, shields up, weapons offline
- Taking damage can interrupt calculation/spool
- Player decision: abort jump and fight, or commit?

**Feel:** Han Solo shouting at the hyperdrive while TIEs close in. Will it light up in time?

#### In-Hyperspace (Safe but Committed)

- Ship cannot interact with normal space
- No combat possible
- Player can: manage ship systems, review intel, plan next moves
- Random events possible: drive fluctuation (early dropout), interdictor fields (forced dropout)

**Feel:** The blue tunnel. A moment to breathe. Or dread what's waiting.

#### Post-Jump (Vulnerable)

- Ship arrives at system edge
- Brief sensor recalibration (2-3 seconds of reduced awareness)
- Drive cooldown before next jump possible (30-60 seconds)
- Unknown system = unknown threats

**Feel:** "Chewie, take the professor in the back and plug him into the hyperdrive." Arrival is relief and tension.

---

### 2.3 Fuel as Narrative Constraint

Fuel is not infinite. Every movement costs fuel.

**Fuel Costs:**
- Sublight cruise: minimal
- Sublight burn (fast): moderate
- Combat maneuvering: moderate
- Hyperspace jump: high (scales with distance)

**Fuel Acquisition:**
- Stations: purchase at market rate
- Fuel scooping: harvest from gas giants (takes time, requires equipment)
- Derelicts: salvage fuel from wrecks
- Transfer: other players can transfer fuel

**Running Empty:**
- No hyperspace possible
- Sublight limited to minimal thruster
- Distress beacon option (reveals position, calls for help)
- Tow services exist (costly)

**Design Principle:** Fuel creates planning. Long expeditions require supply consideration. Running out is not death—it's drama.

---

### 2.4 Time, Risk, and Decision

Every travel decision is a tradeoff:

| Factor | Safe Choice | Risky Choice |
|--------|-------------|--------------|
| Speed | Cruise speed | Flank speed (more fuel) |
| Route | Hyperspace lane | Off-lane jump (less predictable) |
| Timing | Jump immediately | Stay and engage (might not escape) |
| Range | Multiple short jumps | One long jump (committed further) |
| Fuel | Keep reserves | Burn it all (might strand yourself) |

**Design Principle:** Travel is not just A-to-B. It's a series of decisions with consequences.

---

## 3. COMBAT MODEL

### 3.1 Combat Philosophy

Combat is **tactical, not twitch**. The player who reads the situation correctly wins. The player with faster reflexes has no inherent advantage.

**Core Loop:**
1. Detect threat (sensors)
2. Assess situation (range, numbers, capabilities)
3. Choose engagement (fight, flee, negotiate)
4. If fighting: position, manage systems, fire, adapt
5. Resolve (victory, retreat, destruction)

**Time Scale:** Combat rounds are 3-5 seconds of game time. Plenty of time to read, decide, act. Not bullet-hell.

---

### 3.2 Engagement Rules

#### Engagement Initiation

Combat begins when:
- Any ship fires weapons at another
- Any ship deploys hostile countermeasures (mines, interdiction)
- Player accepts a duel/engagement prompt

**Aggressor Flag:** The first ship to fire is flagged aggressor. This affects:
- Faction reputation
- Station defense response
- Legal status in controlled space

**Safe Zones:**
- Within 5 ls of stations: firing triggers station defense turrets
- Within controlled space: aggression spawns system authority response
- Uncontrolled space: no rules, no response

---

#### Engagement Ranges

| Range | Name | Combat Characteristics |
|-------|------|------------------------|
| > 10 ls | Beyond | No weapons can reach. Maneuvering only. |
| 5-10 ls | Long | Heavy weapons (missiles, torpedoes). Easy to evade. |
| 2-5 ls | Medium | All weapons effective. Standard combat range. |
| 0.5-2 ls | Close | Energy weapons optimal. Hard to miss. |
| < 0.5 ls | Point Blank | Maximum damage. Collision risk. |

**Range Dynamics:** Ships close or extend range by applying thrust. Closing on a fleeing target requires either more thrust or cutting off their vector.

---

#### Escape Rules

A player can always attempt to flee:

**Sublight Escape:**
- Break to flank speed
- Extend range beyond weapons
- Once > 15 ls from all hostiles, engagement ends
- Requires: more speed than pursuers, or enough head start

**Hyperspace Escape:**
- Must reach > 10 ls from any gravity well
- Must survive calculation + spool time
- Taking damage may interrupt
- Once in hyperspace: untouchable

**Design Principle:** Escape is always possible but never free. Getting away requires distance, time, and luck.

---

### 3.3 Positioning Abstractions

Full 3D positioning is unnecessary. We abstract to meaningful tactical states:

#### Facing

Ships have a **facing direction** (where the bow points). This affects:
- Weapons arcs (most weapons fire forward)
- Shield distribution (can reinforce facing)
- Engine vulnerability (rear is often weaker)

**Representation:** Ship icons show facing as a wedge or arrow.

#### Relative Position

Instead of XYZ coordinates, combat uses **relative bearing**:
- Target is at your 12 o'clock (directly ahead)
- Target is at your 6 o'clock (directly behind)
- Target is at your 3 o'clock (to your right)

**Representation:** Targeting display shows bearing numerically (e.g., "bearing 045") or as a simple diagram.

#### Closing Rate

Are you getting closer or farther from your target?
- **Closing:** Range decreasing
- **Extending:** Range increasing
- **Holding:** Range stable (parallel courses)

**Representation:** Range displayed with trend arrow (↓ closing, ↑ extending, → holding)

---

### 3.4 Energy & Systems

Ships have finite energy to allocate:

#### Reactor Output

Every ship has a **reactor capacity** (total energy per round).

Energy must be distributed to:
- **Weapons:** Powers weapon systems, enables firing
- **Shields:** Powers defensive screens, enables regeneration
- **Engines:** Powers thrust, enables maneuvering
- **Systems:** Powers sensors, life support, computing (usually baseline)

**Distribution Interface:** Player allocates percentages. Example:
- Balanced: 25% each
- Attack: 40% weapons, 20% shields, 30% engines, 10% systems
- Evasion: 10% weapons, 20% shields, 60% engines, 10% systems
- Defense: 20% weapons, 50% shields, 20% engines, 10% systems

**Impact of Allocation:**
- Low weapons = slower fire rate, reduced damage
- Low shields = slower regen, weaker resistance
- Low engines = slower acceleration, wider turning
- Low systems = reduced sensor range, slower calculations

---

#### Weapon Systems

Weapons have characteristics:

| Property | Description |
|----------|-------------|
| Damage Type | Energy (shields first), Kinetic (hull damage), Explosive (area) |
| Range | Optimal engagement distance |
| Fire Rate | Shots per round (energy cost each) |
| Accuracy | Hit chance, degrades with range and target speed |
| Arc | Firing cone (forward, turret, broadside) |

**Weapon Categories:**
- **Energy Weapons:** Fast fire rate, good vs shields, short range
- **Kinetic Weapons:** Slow fire rate, good vs hull, medium range
- **Missiles:** High damage, long range, can be shot down or evaded
- **Torpedoes:** Very high damage, slow, best vs large/slow targets

---

#### Damage & Systems Damage

**Hull Points:** Total structural integrity. Zero = destroyed.

**Shield Points:** Regenerating buffer. Must be depleted before hull damage.

**Systems Damage:** Individual systems can be damaged:
- Weapons damaged: reduced fire rate, chance to malfunction
- Engines damaged: reduced thrust, maneuverability
- Shields damaged: reduced capacity, slower regen
- Reactor damaged: reduced total energy output
- Sensors damaged: reduced range, accuracy

**Critical Hits:** Chance for weapon hits to directly damage systems (bypass hull).

**Repair:**
- Emergency repair during combat (costs time, energy)
- Full repair at stations (costs credits, time)

---

#### Cooldowns

Certain actions have cooldowns:

| Action | Typical Cooldown | Effect |
|--------|------------------|--------|
| Hyperspace Jump | 30-60s after arrival | Prevents instant escape chains |
| Emergency Repair | 30s per system | Limits mid-combat recovery |
| Active Scan | 15s | Prevents spam-scanning |
| Special Abilities | Varies | Ship-specific powers |

**Design Principle:** Cooldowns prevent degenerate strategies and create rhythm. They should be visible and predictable.

---

### 3.5 Combat Information Requirements

The following information MUST be immediately visible during combat:

**Own Ship:**
- Hull integrity (percentage + bar)
- Shield integrity (percentage + bar)
- Energy distribution (current allocation)
- Speed and heading (vector indicator)
- Weapon status (loaded, cooling, damaged)

**Target:**
- Range and closing rate
- Bearing (relative position)
- Hull integrity (percentage)
- Shield integrity (percentage)
- Velocity vector (is target fleeing?)
- Threat level (based on weapons/class)

**Tactical:**
- All hostile contacts (icons + range)
- All friendly contacts (icons + range)
- Escape vector (direction to safe hyperspace range)
- Engagement timer (how long combat has lasted)

**Alerts:**
- Incoming missile warnings
- System damage notifications
- Critical hull/shield warnings
- Hyperspace drive status

---

## 4. MENTAL MODEL EXPLANATION

### How a Player Thinks About Space

**Space is a map, not a void.**

The player thinks: "I am in the Kyros System, at the inner asteroid belt, 15 light-seconds from Kyros Station."

They do not think in XYZ coordinates. They think in **named places** and **relative distances**.

When they want to go somewhere:
1. Is it in this system? → Sublight travel. Point at it and burn.
2. Is it in another system? → Hyperspace. Open map, plot course, jump.

The unknown is not empty—it's full of possibility. Unmapped systems might contain riches or death. The player thinks: "I could be the first to chart that system."

---

### How a Player Thinks About Travel

**Travel is commitment.**

The player thinks: "If I jump to Veran System, I'm committed. I won't be able to help the convoy here if it gets attacked."

Hyperspace is not a teleport. It is a *decision with consequences*. You leave one situation to enter another.

The player calculates:
- Do I have enough fuel?
- How long will it take?
- What's waiting on the other end?
- Can I afford to be offline during transit?

**Fuel is freedom.**

The player with fuel has options. The player without fuel has desperation. They think: "I need to refuel before I take on that mission—if I run out in hostile space, I'm dead."

---

### How a Player Thinks About Combat

**Combat is a puzzle, not a reflex test.**

The player thinks: "Two hostiles, both frigates. I'm in a fast corvette. I can't outgun them, but I can outrun them. If I extend to 10 ls and pick one off with missiles while they chase..."

They read the situation:
- Numbers (how many enemies?)
- Types (what are they flying?)
- Positioning (can I get behind them?)
- Resources (do I have missiles left? Enough shields?)

Then they choose:
- Fight (commit to engagement)
- Flee (burn out, jump away)
- Maneuver (change the terms of the fight)
- Negotiate (hail, offer surrender, bluff)

**Energy management is strategy.**

The player thinks: "I'm taking too much damage. Shift power to shields and extend range. When shields stabilize, go back to balanced and reengage."

Power allocation is their moment-to-moment tool for adapting.

**Damage is attrition.**

The player thinks: "My weapons are at 70% effectiveness from that hit. I can keep fighting, but I'm degraded. Should I repair now or press the attack?"

Systems damage creates ongoing decisions, not instant failure.

---

### The Core Fantasy

The player is a **starship captain**. They are not an omniscient god—they know only what their sensors tell them. They are not infinitely powerful—their ship has limits. They are not immortal—combat has real risk.

But within those constraints, they have **agency**. They choose where to go, what to fight, when to run. Their knowledge, preparation, and decisions determine success.

**The fantasy is competence.** The player who masters the systems *feels* like a skilled captain. They read the battle correctly. They planned their fuel. They knew when to fight and when to flee.

That is the experience we create.

---

## 5. MECHANICS-TO-UI CONTRACT

### What Data the UI Must Show

This section is authoritative. All listed data MUST be surfaced to the player through UI elements.

---

#### Always Visible (Header Bar / Persistent)

| Data Point | Format | Update Frequency |
|------------|--------|------------------|
| Hull Integrity | Percentage + bar | Real-time |
| Shield Integrity | Percentage + bar | Real-time |
| Current Location | System name : Sector name | On change |
| Alert Status | GREEN/YELLOW/RED indicator | On change |
| Fuel Level | Percentage + bar | On change |

---

#### Visible in Navigation Context (NAV Mode)

| Data Point | Format | Update Frequency |
|------------|--------|------------------|
| Current velocity | Speed value + vector indicator | Real-time |
| Selected destination | Name + distance | On selection |
| Time to destination | Minutes:seconds | Real-time (if moving) |
| Fuel cost to destination | Percentage of tank | On selection |
| Gravity well distance | Light-seconds to nearest | Real-time |
| Hyperspace status | Ready / Calculating / Spooling / Cooldown | Real-time |

---

#### Visible in Tactical Context (TAC Mode)

| Data Point | Format | Update Frequency |
|------------|--------|------------------|
| Target selection | Highlighted icon + info panel | On selection |
| Target range | Light-seconds with trend arrow | Real-time |
| Target bearing | Clock position or degrees | Real-time |
| Target hull/shields | Percentage bars | Real-time |
| Target velocity | Speed + vector | Real-time |
| All contacts | Icons on viewport with type indicator | Real-time |
| Weapon status | Per-weapon: ready/cooling/damaged | Real-time |
| Energy allocation | Visual distribution display | Real-time |
| Incoming threats | Missile/torpedo warnings | On detection |

---

#### Visible in Operations Context (OPS Mode)

| Data Point | Format | Update Frequency |
|------------|--------|------------------|
| Cargo capacity | Used/total with item list | On change |
| Active missions | List with status indicators | On change |
| Station services | Available/unavailable per station | On dock/selection |
| Resource indicators | Mining: type, yield, time | During operation |
| Trade data | Prices, quantities, trends | On request/dock |

---

#### Visible in Engineering Context (ENG Mode)

| Data Point | Format | Update Frequency |
|------------|--------|------------------|
| System status | Per-system health percentage | Real-time |
| Damage report | List of damaged systems + severity | On damage |
| Repair queue | Active repairs with progress | Real-time |
| Module loadout | Equipped modules per slot | On change |
| Reactor output | Current capacity (affected by damage) | Real-time |

---

### What Data Must Be Hidden

Hidden data creates fog of war, discovery, and tension. This data is NOT shown to players:

| Hidden Data | Why Hidden |
|-------------|------------|
| Exact contents of unvisited systems | Discovery reward |
| Other players' cargo (until scanned) | Privacy, piracy risk |
| NPC ship detailed loadout (until scanned or engaged) | Tactical uncertainty |
| Exact hyperspace arrival point of others | Prevents perfect interception |
| Enemy energy allocation | Tactical reading skill |
| Hidden POIs until discovered | Exploration reward |
| True faction standings (NPC) | Diplomacy is imperfect information |
| Random event seeds | No metagaming |

---

### What States Must Be Immediately Visible

These states require **instant** recognition (< 1 second to perceive):

| State | Visual Requirement |
|-------|-------------------|
| Under attack | Red alert cascade + attacker highlight |
| Hull critical (< 25%) | Pulsing hull indicator + audio warning |
| Shields down (0%) | Distinct shield-down indicator |
| In hyperspace | Unmistakable viewport change + transit indicator |
| Docked | Clear docked state indicator |
| Target locked on you | Warning indicator (someone is aiming) |
| Weapon ready to fire | Clear ready state on weapon |
| System damaged | Damage indicator on affected system |
| Fuel critical (< 10%) | Pulsing fuel indicator + warning |
| Communications incoming | Badge/flash on COM rail |

---

### State Transition Visibility

When state changes, the UI must clearly indicate the transition:

| Transition | Requirement |
|------------|-------------|
| Entering combat | Alert cascade, mode auto-switch, audio cue |
| Leaving combat | Alert downgrade, notification, cooldown display |
| Jump initiated | Progress indicators (calc, spool), viewport prep |
| Jump complete | Arrival notification, sensor sweep animation |
| Docking | Docking sequence indicator, service menu ready |
| Undocking | Departure animation, space mode restoration |
| Taking damage | Flash on damaged system, hull/shield update |
| Destroying target | Target removal, loot indication if applicable |

---

### Data Refresh Rates

| Category | Minimum Refresh | Notes |
|----------|-----------------|-------|
| Combat data | 250ms | Must feel real-time |
| Navigation data | 500ms | Position updates |
| Status bars | 500ms | Hull, shields, fuel |
| Contact list | 1000ms | New/removed contacts |
| Non-combat panels | 2000ms | Markets, missions |
| Galaxy map | On open/action | Not real-time |

---

### Contract Summary

**The UI promises to show:**
- Everything needed to survive (threats, status, resources)
- Everything needed to navigate (position, destination, fuel)
- Everything needed to fight (target data, weapons, energy)

**The UI promises to hide:**
- Information you haven't earned (unexplored space)
- Information you haven't paid for (unscanned details)
- Information that would remove tension (enemy internals)

**The UI promises to alert:**
- Immediately for threats (< 250ms latency)
- Prominently for status changes (visual + optional audio)
- Persistently for ongoing states (continuous indication)

---

**END OF DOCTRINE**

*This document is authoritative. Mechanics implementations must honor these contracts.*
