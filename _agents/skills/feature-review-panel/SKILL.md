---
name: feature-review-panel
description: >-
  Convenes the 5-expert Cross-Functional Review Panel (Child Psychologist, Game Economy
  Designer, Weary Parent, Staff UX Designer, and Senior Staff Engineer) to rigorously
  review and pressure-test a proposed feature, PRD, or UI change in the optimal sequence.
  Use whenever the user asks to review a proposal, evaluate a feature, run a multi-perspective
  review, or pressure-test changes for edge cases, child delight, family friction, and technical debt.
disable-model-invocation: false
user-invocable: true
---

# Feature Review Panel: 5-Perspective Cross-Functional Review

When evaluating any proposed feature, UI enhancement, gamification mechanic, or architectural change for the **Kepler Pokémon Chart**, convene the specialized **5-Perspective Review Panel**.

This review process follows a strict, sequential pipeline to eliminate wasteful engineering rework, protect child motivation, ensure real-world family harmony, and ruthlessly eliminate technical debt.

---

## 1. The Optimal Review Sequence (The Funnel of Certainty)

Reviews must **always** execute in this exact 5-stage sequence:

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │  Stage 1: Child Development & Play Psychologist (Human Foundation)     │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  Stage 2: Game Economy & Habit Loop Designer (Incentive Foundation)    │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  Stage 3: Family Operations / Weary Parent (Household Reality Check)   │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  Stage 4: Senior Staff UX Designer (Sensory & Layout Architecture)     │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  Stage 5: Senior Staff Engineer & Chaos Architect (Technical Gate)     │
  └────────────────────────────────────────────────────────────────────────┘
```

### Why Senior Staff Engineering is Positioned LAST:
1. **Eliminating Requirement Churn**: Engineering effort is wasted if an engineer designs complex state machines for a feature that the Child Psychologist rejects as emotionally harmful, or that the Parent rejects as a bedtime nightmare.
2. **Defensive Testing of the Final, Stabilized Design**: Engineering must evaluate the *actual* final interaction, layout, and copy—not a moving target.
3. **Complexity & Tech Debt Gatekeeper**: Positioned at the exit gate, the Senior Staff Engineer acts as the ultimate filter against over-engineering, asking: *"Can this finalized user experience be delivered in 20 lines of clean vanilla code rather than introducing an elaborate new abstraction?"*
4. **No Unvetted Downstream Tweaks**: Because Eng is last, technical safeguards (e.g., event throttling, null guards, offline fallbacks) solve concrete edge cases without causing unexpected ripples back into user-facing UX.

---

## 2. Reviewer Personas & Evaluation Rubrics

---

### Stage 1: Child Development & Play Psychologist (Kepler & Lyra's Advocate)
*   **Target Persona**: Kepler (7yo primary user) and Lyra (younger sibling).
*   **Core Responsibilities**:
    - **Cognitive Load & Scan Time**: Can a 7yo understand what to do in $\le 3\text{ seconds}$ without adult text explanation?
    - **Emotional Safety & Frustration Resilience**: Is failure or locked content punitive or encouraging? Does an incomplete task trigger tears, or motivate trying again tomorrow?
    - **Intrinsic vs. Extrinsic Motivation**: Does this foster genuine pride in learning (Math, Reading, Piano, Writing, Chinese), or does it create transactional, dopamine-seeking behavior?
    - **Sibling Dynamics**: Does this feature create unfair envy or conflict between Kepler and Lyra?
*   **Gate Verdict**: **Pass** (Developmentally positive) or **Red-Flag** (Overwhelming, addictive, or emotionally punitive).

---

### Stage 2: Game Economy & Habit Loop Designer (The Incentive Architect)
*   **Target Systems**: Daily Chore Grid, Star Vault (⭐), Badges (🏆), Partner XP & Levels, Mega Milestones.
*   **Core Responsibilities**:
    - **Chore Cannibalization**: Does this feature give dopamine or XP so easily that the child stops prioritizing the core 5 daily chores?
    - **Economy Inflation / Deflation**: Does it accelerate leveling unnaturally (e.g., reaching Level 10 Primal Kyogre in 2 weeks instead of 2 months)?
    - **Long-Term Habit Retention**: Will Kepler still care about this mechanic in 6 weeks, or does it burn out after 3 days?
    - **Authentic Ludonarrative Consistency**: Does this respect Pokémon canon (types, soundscapes, evolutions, authentic lore) that kids take seriously?
*   **Gate Verdict**: **Pass** (Balanced progression) or **Red-Flag** (Economic imbalance or habit cannibalization).

---

### Stage 3: Family Operations / "Weary Parent" (Household Reality Check)
*   **Target Stakeholder**: crsjain (Parent administrator, nightly chore verifier).
*   **Core Responsibilities**:
    - **Bedtime & Screentime Friction**: Will this trigger negotiations, stall tactics, or tantrums at 8:30 PM? (*"Dad, let me do this one more thing!"*)
    - **Parent Administrative Overhead**: Does this require tedious parent setup, manual resets, or daily micro-management?
    - **Verification & Honesty**: Can the parent easily verify that the chore was genuinely completed before rewards are unlocked?
    - **Parent Override Authority**: Can the parent pause, reset, or override the feature if the child misbehaves or has a disrupted day?
*   **Gate Verdict**: **Pass** (Parent-friendly) or **Red-Flag** (High friction or operational burden).

---

### Stage 4: Senior Staff UX Designer (Sensory & Layout Architecture)
*   **Target Standards**: [`_agents/rules/ux-guidelines.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/rules/ux-guidelines.md).
*   **Core Responsibilities**:
    - **Strict UX Guidelines Compliance**:
      - Rule 4 & 8: Zero inline `style="..."` attributes; all dimensions and responsive heights in `style.css`.
      - Rule 5: Transparent scrollbar tracks on rounded containers (`.modal-content`).
      - Rule 10 & 11: Tonal matching microcopy (`"Awesome! 🌟"`) and zero orphan emojis.
      - Rule 12: Standardized spacing rhythm (pure flex `gap: 12px`, zero mixed margins, `0 4px 0` shadow compensation).
      - Rule 13.C: Strict Zero Horizontal Scroll policy on desktop/tablet ($\ge 768\text{px}$) and sandboxed scrolling on mobile.
      - Rule 17: Spatial separation of Parent Domain (bottom dock) vs. Child Domain (top mini-HUD).
    - **Tactile Ergonomics**: Minimum $42\text{px} - 48\text{px}$ touch targets, active tap depression states (`transform: translateY(2px)`).
    - **Visual Hierarchy & Contrast**: WCAG 2.1 AAA contrast ratios on colorful elemental/Pikachu yellow backgrounds.
*   **Gate Verdict**: **Pass** (UX Guidelines 100% compliant) or **Red-Flag** (Layout risk, contrast failure, or inline style violation).

---

### Stage 5: Senior Staff Engineer & Chaos Architect (Technical Gatekeeper & Tech Debt Killer)
*   **Target Systems**: `state.js` (Schema V18+), `app.js`, `style.css`, `service-worker.js`, `tests.js`, `run_headless_tests.js`.
*   **Core Responsibilities**:
    1. **Tech Debt & Complexity Control (Occam's Razor)**:
       - **Over-Engineering Radar**: Is this solving a 10-line UI need with an unnecessary 200-line framework or redundant state machine?
       - **Schema Bloat**: Does this inject unnecessary fields into `state.js` that require migration scripts, when derived data or DOM attributes would suffice?
       - **Architectural Isolation**: Does this change pollute global namespaces or touch high-risk grid rendering paths without need?
    2. **Gaps & Edge Case Modeling**:
       - **Branching / Null Evolution Hazards**: Are choice evolutions (`nextStage.id === 'choice'`), terminal forms (`nextStage === null`), or unmapped IDs handled without crashing?
       - **The Toddler / Rapid-Spam Test**: What happens when a child mashes buttons 20 times in 2 seconds? Are CSS animations re-triggered via `void el.offsetWidth`? Are particles cleaned up via `animationend`? Is audio oscillator output throttled?
       - **State Synchronization & Stale UI**: If a Firebase sync or profile switch occurs while the UI is open, does the view update or freeze?
       - **Modal Stacking & Key Trapping**: Does `Escape` dismiss the topmost overlay cleanly without accidentally triggering Parent Exception Mode in the background?
       - **PWA & Offline Resilience**: Are all required assets cached by `service-worker.js`? Does the feature function with zero network connectivity?
    3. **Automated Regression & Testability**:
       - Can this feature be 100% deterministically verified in `run_headless_tests.js` via CDP in under 2 seconds?
       - Exactly what assertions belong in the new automated test case in `tests.js`?
*   **Gate Verdict**: **Pass** (Architecturally hardened, zero tech debt) or **Red-Flag** (Complexity hazard, unhandled race conditions, or headless test risk).

---

## 3. Standard Review Output Template

When executing this skill, output the review using this structured synthesis:

```markdown
# 🏛️ Feature Review Panel: [Feature Name]

## 🚦 Final Executive Verdict: [APPROVED | APPROVED WITH MITIGATIONS | REVISION REQUIRED]

---

### Stage 1: 🧸 Child Development & Play Psychologist
- **Cognitive & Scan Friction**: [Findings]
- **Emotional Safety & Motivation**: [Findings]
- **Verdict**: [PASS / CONCERN]

### Stage 2: 🎮 Game Economy & Habit Loop Designer
- **Chore Priority Integrity**: [Does this distract from core 5 chores?]
- **Currency & Progression Balance**: [Star/XP/Badge impact]
- **Verdict**: [PASS / CONCERN]

### Stage 3: 🏡 Family Operations / "Weary Parent"
- **Bedtime & Screentime Impact**: [Friction check]
- **Parent Burden & Overrides**: [Configuration overhead]
- **Verdict**: [PASS / CONCERN]

### Stage 4: 🎨 Senior Staff UX Designer
- **UX Guidelines Compliance**: [Audit against Rules 4, 5, 8, 10, 11, 12, 13.C, 17]
- **Tactile Ergonomics & Contrast**: [Touch targets and contrast]
- **Verdict**: [PASS / CONCERN]

### Stage 5: 🛠️ Senior Staff Engineer & Chaos Architect
- **Tech Debt & Complexity Audit**: [Occam's razor check, schema minimalization]
- **Gaps & Edge Cases Caught**: [Null guards, spam flood, race conditions, offline PWA]
- **Automated Regression Test Plan**: [Specific CDP assertions for tests.js]
- **Verdict**: [PASS / CONCERN]

---

## 🛡️ Consolidated Action & Implementation Checklist
1. [Action 1: Design adjustment from Stage 1/2/3]
2. [Action 2: Styling constraint from Stage 4]
3. [Action 3: Defensive technical mitigation from Stage 5]
```
