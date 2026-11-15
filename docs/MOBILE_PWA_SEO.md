# BPL – MOBILE, PWA & SEO ARCHITECTURE SPECIFICATION

## 1. Executive Summary & Device Strategy

The **Bairajeshwar Premier League (BPL)** architecture implements a **differentiated device strategy**:
1. **Spectators (Mobile-First)**: Optimized for smartphones (`360px` – `430px` width) with an app-like navigation bar, pull-to-refresh, minimal latency live tickers, and PWA capabilities.
2. **Scorers (Desktop & Tablet-First)**: Optimized for laptops and tablets (`1024px` – `1920px+`, landscape & portrait) with dense, high-tactility button arrays, physical keyboard shortcuts, double-click protection, and zero scrolling required to score deliveries.
3. **Super Admin (Desktop & Tablet-First)**: Multi-column management tables, drag-and-drop squad builder, and tournament settings console.

All devices consume the exact same **server-authoritative FastAPI backend**, **PostgreSQL database**, and **low-latency WebSocket channels**.

---

## 2. Spectator Mobile Experience & PWA Specification

```mermaid
flowchart TD
    subgraph MobileDevice ["Spectator Mobile Browser / PWA Client"]
        MobileHeader["Sticky Header with Live Indicator & Match Selector"]
        LiveScoreCard["High-Priority Live Score Card (Scores, CRR, RRR, Batters, Bowler)"]
        TabNavigation["Segmented Control (Live / Scorecard / Commentary / Teams)"]
        BottomNav["Thumb-Friendly Bottom Navigation (Home, Live, Matches, Table, Stats)"]
    end

    subgraph ServiceWorker ["PWA Service Worker Layer"]
        AppShellCache["Cache App Shell, CSS, Logos, Fonts (Cache-First)"]
        NetworkOnlyLive["Live Score & WebSocket Feed (Network-Only: Never Stale)"]
    end

    subgraph AuthorityBackend ["Authoritative Backend (FastAPI + WebSockets)"]
        LiveMatchState["Live Match State Hub"]
        DB[(PostgreSQL)]
    end

    MobileDevice <--> |Assets & UI Shell| AppShellCache
    MobileDevice <--> |Real-Time WebSockets (No Cache)| LiveMatchState
    LiveMatchState <--> DB
```

### 2.1 Progressive Web App (PWA) Configuration
- **Web App Manifest (`/manifest.json`)**:
  - `name`: "Bairajeshwar Premier League"
  - `short_name`: "BPL 2026"
  - `start_url`: "/"
  - `display`: "standalone"
  - `background_color`: "#06130d"
  - `theme_color`: "#047857"
  - `icons`: High-resolution 192x192 and 512x512 maskable PNG icons.
- **Service Worker Strategy**:
  - **App Shell & Static Assets**: Cache-first strategy for icons, team logos, and font files.
  - **Live Score Data & WebSockets**: **Strictly Network-Only**. Stale scores are never served from client cache. When offline, an explicit connection alert banner is displayed.
- **Installation Prompt**: Non-intrusive install banner surfaced only after a spectator engages with the live scorecard.

---

## 3. Dedicated Scorer Dashboard (Desktop & Tablet Layouts)

Scorers operate on laptops (`1366px+`) and tablets (`768px – 1024px`) outdoors or at match-control desks. The layout is structured into **six non-scrolling ergonomic zones**:

```
+----------------------------------------------------------------------------------------------------+
| ZONE 1: TOP STATUS BAR                                                                             |
| Match #M02 • Bairajeshwar Royals vs Wing-A Warriors | Innings 1 | [● LIVE SYNC ACTIVE] [Undo (Z)]   |
+----------------------------------------------------+-----------------------------------------------+
| ZONE 2: MAIN SCOREBOARD (Large High-Contrast Font)  | ZONE 3: ACTIVE PLAYERS ON CREASE              |
|                                                    | Striker: ★ Kabir Singh  28* (15b)  [4s:3 6s:2] |
|       74 / 2      (4.2 / 6 ov)                     | Non-Striker: Yash Desai 14  (9b)   [Swap (X)] |
|                                                    | --------------------------------------------- |
| CRR: 11.25    Target: 89    RRR: 9.0               | Bowler: Nikhil Rao 1.2 ov | 1/14 | Econ: 10.5  |
+----------------------------------------------------+-----------------------------------------------+
| ZONE 4: TACTILE SCORING CONTROL KEYPAD                                                             |
| [ 0 (0) ]  [ 1D (1) ]  [ 2D (2) ]  [ 4D FIXED (4) ]  [ RUNS RUN... ]  [ DIRECT OUT (W) ]           |
| [ NO-BALL +1 (N) ]     [ WIDE +1 (D) ]     [ BYE (B) ]     [ LEG BYE (L) ]     [ WICKET (K) ]      |
+----------------------------------------------------------------------------------------------------+
| ZONE 5: THIS OVER & BALL-BY-BALL STREAM             | ZONE 6: MATCH CONTROLS                       |
| Recent Balls: [ 1D ] [ 0 ] [ 4D ] [ 1nb ] [ W ]     | [ Change Bowler ]  [ Next Batter ]             |
| Commentary: "FOUR! Driven into 4D zone!"           | [ End Innings Confirmation ]                   |
+----------------------------------------------------------------------------------------------------+
```

### 3.1 Scorer Interaction & Safeguard Features
1. **Double-Click & Debounce Safeguard**: The scoring buttons disable for 350ms upon click to prevent accidental double-taps under sunlight or vibration.
2. **Hardware Keyboard Shortcuts**:
   - `0`: Dot ball
   - `1`: 1D zone
   - `2`: 2D zone
   - `4`: 4D zone (Fixed 4)
   - `N`: Line No-Ball (+1 and repeat)
   - `D`: Wide ball (+1 and repeat)
   - `W`: Direct Out (ball clears square)
   - `K`: Standard wicket modal
   - `X`: Swap strike
   - `Ctrl+Z` / `Z`: Instant Undo
3. **Immediate Visual Flash**: Active buttons provide an immediate haptic/visual scale animation (`scale(0.96)`) to confirm registration before the network round-trip.
4. **WebSocket Auto-Reconnection with Zero State Loss**: If a scorer's Wi-Fi or tablet drops connection, the client reconnects automatically, queries `GET /scoring/live/{id}` to verify state consistency, and resumes without duplicate entries.
5. **Innings/Match End Modal Confirmation**: Ending an innings requires a two-step confirmation dialog to prevent accidental early termination.

---

## 4. Super Admin Management Experience

Super Admins configure the tournament on desktop and laptop screens:
- **8-Team Squad Management**: Split view of registered residents and team rosters with quick user search by BPL ID (`BPL001`, `BPL002`).
- **Berger Round-Robin Fixture Matrix**: Overview of all 28 matches organized into 7 distinct rounds.
- **Box Cricket Regulations Console**: Single-screen configuration of overs, player count, wickets allowed, line no-ball penalties, and scoring zone values.
- **Scorer Delegation**: Assigning specific registered resident IDs to have scorer privileges.

---

## 5. SEO & Social Metadata Architecture

Public spectator pages are designed for indexability, fast initial server-render, and social sharing:
- **Robots Directives (`robots.txt`)**:
  - `Allow: /`
  - `Allow: /live/*`
  - `Allow: /matches/*`
  - `Allow: /teams/*`
  - `Allow: /points-table`
  - `Allow: /stats`
  - `Disallow: /admin/*`
  - `Disallow: /profile`
  - `Disallow: /auth/*`
- **Dynamic Sitemap (`/sitemap.xml`)**: Automated sitemap linking all 8 team pages, 28 match detail pages, and static tournament routes.
- **Open Graph & Twitter Cards**:
  - Every match URL (`/live/[id]` and `/matches/[id]`) dynamically generates an Open Graph preview:
    - `og:title`: "M02: Wing-A Warriors vs Penthouse Panthers | BPL Live Score"
    - `og:description`: "Follow real-time ball-by-ball box cricket scores from Bairajeshwar Premier League."
    - `og:image`: Dynamic preview card featuring team colors, score, and BPL banner.
- **Schema.org Structured Data**: JSON-LD `SportsEvent` schema embedded on match pages, enabling Google rich results for live scores.
