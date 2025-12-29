# Doctrine Appendix: Cinematic Arcade Flight Model (LCARS-Compatible)

## 0. Reference Inspiration (Non-Binding)

This doctrine is **behaviorally inspired** by the following public reference:

- *KidsCanCode — Arcade-Style Spaceship (Godot 3.x)*
  https://kidscancode.org/godot_recipes/3.x/3d/spaceship/

This reference is used **only** to validate:
- Player mental models of arcade spaceflight
- Input smoothing and control "feel"
- Axis coupling patterns common in cinematic space combat

It is **not** a dependency.
It is **not** an implementation target.
It introduces **no engine-specific constructs**.

All Godot-specific APIs, nodes, transforms, and physics behaviors are
explicitly out of scope.

---

## 1. Intent

This doctrine defines a **cinematic, arcade-style spaceflight model** intended to
support exploration, travel, and combat in a massively multiplayer environment.

The model prioritizes:
- Player readability
- Control stability (especially on mobile)
- Tunable "ship feel"
- Clean surfacing through a 2D LCARS cockpit UI

This is not a Newtonian simulator. Physical accuracy is subordinate to
clarity, consistency, and player agency.

---

## 2. Core Principles

### P1 — Forward-Vector Locomotion
Inspired by arcade dogfighting conventions (as demonstrated in the
KidsCanCode reference), ship translation is always aligned to the ship's
forward vector.

Velocity is derived from heading and throttle state, preserving a simple
mental model and a stable UI representation.

---

### P2 — Three-Axis Attitude Control
Ship attitude is controlled via three axes:
- Pitch
- Roll
- Yaw

Each axis has an independent handling speed defining responsiveness.
This mirrors common cinematic spaceflight control schemas.

---

### P3 — Smooth Throttle (No Binary Acceleration)
As demonstrated in the reference implementation, throttle changes are
interpolated over time rather than applied as stepwise changes.

Throttle is expressed as a normalized value (0.0–1.0).

---

### P4 — Input Response Smoothing ("Inertia")
Axis inputs are smoothed using an input response constant
(conceptually similar to interpolation/lerp in the reference).

This creates controlled inertia ("floatiness") without requiring
true Newtonian simulation.

---

### P5 — Optional Axis Coupling Mode (Roll → Yaw)
Consistent with the reference's guidance on control simplification,
an optional axis-coupling mode may derive yaw from roll input.

This mode exists primarily for:
- Mobile usability
- Reduced cognitive load
- Accessibility

Yaw authority must be intentionally reduced relative to roll.

---

### P6 — Ship Identity via Handling Profiles
As implied by the tunable constants in the reference,
each ship class exposes a **Handling Profile** that defines its flight feel.

Handling Profiles are data-driven and tunable without UI changes.

---

## 3. Canonical Handling Profile

A Handling Profile MUST include:

- maxSpeed
- acceleration
- pitchSpeed
- rollSpeed
- yawSpeed
- inputResponse
- axisCouplingMode (none | roll_to_yaw)

These values define ship identity, progression, and balance.

---

## 4. Mechanics-to-UI Contract (LCARS Surfaces)

### 4.1 Always Visible (Persistent HUD)

- Throttle / forward speed indicator
- Heading / attitude summary (abstracted)
- Active Handling Profile identifier

These must remain visible across navigation and mode changes.

---

### 4.2 Contextual (Flight Panel)

- Pitch / Roll / Yaw activity meters
- Input Response ("Inertia") gauge
- Axis Coupling mode indicator (toggle only if permitted)

---

## 5. Non-Goals

- No Godot APIs, nodes, or physics bodies
- No direct port of reference code
- No 3D rendering requirement
- No engine-specific assumptions

This doctrine specifies **behavioral semantics and UI-visible state only**.

---

## 6. Acceptance Criteria

This doctrine is satisfied when:

1. Flight behavior matches cinematic arcade expectations.
2. Control smoothing is perceptible and tunable.
3. Ship feel changes require no UI changes.
4. The UI remains stable regardless of backend simulation strategy.
