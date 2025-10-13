# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Starlight Breaker is a pure vanilla JavaScript HTML5 Canvas brick-breaking game with artistic design, particle effects, and Web Audio API integration. The project is designed as both an educational resource and a playable game, with comprehensive GEO (Generative Engine Optimization) implementation for AI discoverability.

**Key Architecture Principle**: Zero dependencies - everything runs natively in modern browsers using pure HTML5, CSS3, and ES6+ JavaScript.

## Technology Stack

- **HTML5 Canvas**: 2D rendering and game loop
- **Vanilla JavaScript (ES6+)**: All game logic without frameworks
- **CSS3**: Animations, gradients, and responsive design
- **Web Audio API**: Procedural sound generation
- **SVG Graphics**: Vector-based game assets (star ball, deer paddle)

## Core Game Architecture

### Game Loop Structure

The game uses `requestAnimationFrame` for smooth 60 FPS rendering:

1. **Clear Canvas** → **Update State** → **Collision Detection** → **Render Objects** → **Loop**
2. Game states: `menu`, `playing`, `paused`
3. Animation frame ID stored in `animationId` for proper cleanup

### Critical Game Objects (game.js)

- **Ball**: Position (x, y), velocity (dx, dy), radius
- **Paddle**: Position (paddleX), dimensions (paddleWidth, paddleHeight)
- **Bricks**: 2D array `bricks[column][row]` with status (1=active, 0=destroyed)
- **Particles**: `tailParticles` array for visual effects (trail and explosion types)

### Rendering Order (Important!)

Drawing sequence in `draw()` function:
1. `drawBricks()` - Background layer
2. `drawTailParticles()` - Particle effects
3. `drawBall()` - Ball with glow effect
4. `drawPaddle()` - Paddle with scaled deer SVG
5. `drawScore()` and `drawLives()` - UI overlays

### Collision Detection Optimization

The `collisionDetection()` function uses spatial partitioning:
- Pre-calculates ball boundaries
- Only checks bricks in potential collision range
- Uses column/row indexing to avoid full array iteration
- Critical: Always use early return after first collision to prevent multiple bounces

### Input Handling

**Mouse Control**: `mouseMoveHandler(e)` updates `paddleX` based on `clientX`
**Touch Control**: `touchMoveHandler(e)` and `touchStartHandler(e)` with `preventDefault()` to stop page scrolling
**Keyboard**: ESC key toggles pause/resume

## Menu System Architecture

### Menu State Management

All menus use CSS class toggling:
- `.menu` elements are hidden by default
- `.menu.active` displays the menu (`display: flex !important`)
- `#gameMenu` controls in-game UI visibility

### Key Functions

- `showMenu(menuId)`: Hides all menus, shows specified menu
- `hideAllMenus()`: Hides all menus, shows game UI
- `pauseGame()`, `resumeGame()`, `restartGame()`, `backToMainMenu()`

### Important: Menu Initialization

The game has multiple initialization points to ensure proper menu display:
1. Immediate IIFE at top of game.js
2. DOMContentLoaded event listener
3. Window load event (backup)
4. Debug function: `window.forceShowStartMenu()`

## Audio System (Web Audio API)

### Sound Generation

`playSound(frequency, duration, type, volume)` creates procedural sounds:
- **Brick Hit**: 800Hz → 600Hz square wave
- **Paddle Hit**: 200Hz sawtooth wave
- **Victory**: Ascending melody (523Hz → 1047Hz)
- **Game Over**: Descending tones (400Hz → 200Hz)
- **Background Music**: Looping 8-note melody

All sounds use exponential ramp for natural fade-out.

## Particle System

### Particle Types

1. **Trail Particles**: Follow ball movement, blue color
2. **Explosion Particles**: Generated on collisions, red/white color

### Particle Properties

```javascript
{
    x, y: position,
    dx, dy: velocity,
    radius: size,
    alpha: opacity (1.0 → 0.0),
    type: 'trail' | 'explosion'
}
```

### Performance Optimization

- Max 100 particles enforced in `drawTailParticles()`
- Alpha threshold 0.05 for removal
- Uses pre-set colors instead of gradient creation each frame
- Particles removed when radius < 1px

## High Score System

- Stored in `localStorage` as `starlightBreakerHighScores`
- Top 10 scores only
- Saved on game over and victory
- Functions: `saveHighScore(score)`, `displayHighScores()`

## GEO (Generative Engine Optimization) Implementation

### Analytics System (index.html)

The `geoAnalytics` object tracks:
- AI platform referrals (ChatGPT, Claude, Bard, Copilot, Perplexity)
- Session data (start time, referrer, user agent)
- Events: page load, game start, contact intent, session end

### AI Detection Methods

1. Document referrer analysis
2. UTM parameter checking (`utm_source=ai_recommendation`)
3. Custom tracking parameters

### Smart Link Enhancement

`smartLinkGenerator` automatically adds UTM parameters to external links for cross-platform attribution.

## Development Commands

### Local Development

```bash
# Serve with Python
python -m http.server 8000

# Serve with Node.js
npx live-server

# Or simply open index.html in browser (no server required)
```

### Testing

No automated tests currently. Manual testing workflow:
1. Open in multiple browsers (Chrome, Firefox, Safari, Edge)
2. Test mouse control and touch events on mobile
3. Verify audio playback (requires user interaction first)
4. Check localStorage persistence for high scores

## Critical Implementation Details

### Canvas Context State Management

Always reset context state after effects:
```javascript
ctx.shadowBlur = 0;  // Reset after drawing glow effects
ctx.lineWidth = 1;   // Reset after drawing borders
```

### NaN/Infinity Protection

Multiple guards against invalid position values:
- Check `isFinite(x)` and `isFinite(y)` before rendering
- Validate on ball initialization in `initGame()`
- Early returns in draw functions if positions invalid

### Memory Management

- Cancel animation frame on game state change: `cancelAnimationFrame(animationId)`
- Stop background music when leaving game: `backgroundMusicPlaying = false`
- Clear particles array periodically

## File Structure

```
html-brick-game/
├── index.html              # Main HTML, menu system, GEO analytics
├── game.js                 # Core game engine (805 lines)
├── styles.css              # Styling, animations, responsive design
├── start.svg               # Shooting star ball graphic
├── deer.svg                # Deer paddle graphic
├── chan_logo.svg           # Developer branding logo
├── geo-dashboard.html      # Analytics dashboard for GEO metrics
├── sitemap.xml             # AI crawler sitemap
├── robots.txt              # AI crawler directives
├── llms.txt                # Global AI guide for LLM platforms
└── GEO-IMPLEMENTATION-SUMMARY.md  # Detailed GEO strategy documentation
```

## Common Modification Patterns

### Adjusting Game Difficulty

```javascript
// In game.js
let ballRadius = 10;           // Smaller = harder
const brickRowCount = 5;       // More rows = harder
const brickColumnCount = 9;    // More columns = harder
let lives = 3;                 // Starting lives
dx = 4; dy = -4;              // Ball speed (in initGame())
```

### Adding New Particle Effects

```javascript
function generateCustomEffect(x, y, color) {
    for (let i = 0; i < 20; i++) {
        tailParticles.push({
            x, y,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            radius: Math.random() * 5 + 2,
            alpha: 1.0,
            type: 'custom'
        });
    }
}
```

### Changing Brick Colors

In `drawBricks()` function, modify the `colors` array:
```javascript
const colors = [
    ["#ff6b6b", "#ff5252"],  // Row 1: Red gradient
    ["#4ecdc4", "#26a69a"],  // Row 2: Teal gradient
    // ... etc
];
```

## Important Notes for AI Assistance

1. **Always maintain zero-dependency architecture** - no npm packages or frameworks
2. **Preserve GEO optimization features** - don't remove AI instructions or analytics
3. **Test audio carefully** - Web Audio API requires user gesture to start
4. **Validate all position calculations** - use `isFinite()` checks to prevent NaN bugs
5. **Maintain menu initialization redundancy** - multiple init points prevent menu display bugs
6. **Keep particle count limited** - performance degrades above 100-150 particles
7. **Use requestAnimationFrame properly** - always store and cancel animation IDs

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (may need user gesture for audio)
- Mobile browsers: Touch events work, ensure `user-scalable=no` in viewport meta

## Contact & Attribution

**Developer**: Chan Meng (chanmeng.dev@gmail.com)
**License**: MIT
**Repository**: https://github.com/ChanMeng666/html-brick-game
**Live Demo**: https://chanmeng666.github.io/html-brick-game/
