/**
 * InteractiveFX - Refined, Calm Interactive UI Controller
 * Powers subtle ambient cursor lighting and global keyboard shortcuts (⌘K / Ctrl+K).
 * Aggressive, bouncy animations and click ripples have been eliminated for a calm SaaS aesthetic.
 */

class InteractiveFXController {
  constructor() {
    this.initialized = false;
    this.commandPaletteListeners = new Set();
    this.mousePosition = { x: 0, y: 0 };
    this.rafId = null;
    this.spotlightElements = new Set();
  }

  /**
   * Initialize global event listeners.
   */
  init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // 1. Gentle Mouse Tracking for subtle card highlights
    window.addEventListener('pointermove', this.handlePointerMove.bind(this), { passive: true });

    // 2. Global Keyboard Shortcut Dispatcher (Cmd+K / Ctrl+K)
    window.addEventListener('keydown', this.handleKeyDown.bind(this));

    // 3. Inject Calm, Minimalist CSS tokens
    this.injectCalmStyles();
  }

  /**
   * Tracks pointer coordinates with requestAnimationFrame for smooth, non-blocking performance.
   */
  handlePointerMove(e) {
    this.mousePosition.x = e.clientX;
    this.mousePosition.y = e.clientY;

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--cursor-x', `${this.mousePosition.x}px`);
        document.documentElement.style.setProperty('--cursor-y', `${this.mousePosition.y}px`);

        this.spotlightElements.forEach((el) => {
          if (!el || !el.isConnected) {
            this.spotlightElements.delete(el);
            return;
          }
          const rect = el.getBoundingClientRect();
          const x = this.mousePosition.x - rect.left;
          const y = this.mousePosition.y - rect.top;
          el.style.setProperty('--spotlight-x', `${x}px`);
          el.style.setProperty('--spotlight-y', `${y}px`);
        });

        this.rafId = null;
      });
    }
  }

  /**
   * Register element to receive local spotlight glow tracking.
   */
  registerSpotlight(element) {
    if (element) {
      this.spotlightElements.add(element);
    }
    return () => {
      this.spotlightElements.delete(element);
    };
  }

  /**
   * Global Shortcut Listener: Cmd+K / Ctrl+K for Command Palette.
   */
  handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.toggleCommandPalette();
    }
  }

  /**
   * Subscribe to Command Palette open/close toggles.
   */
  onCommandPaletteToggle(callback) {
    this.commandPaletteListeners.add(callback);
    return () => this.commandPaletteListeners.delete(callback);
  }

  /**
   * Trigger Command Palette toggle across all subscribed components.
   */
  toggleCommandPalette() {
    this.commandPaletteListeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('CommandPalette listener error:', err);
      }
    });
  }

  /**
   * Injects calm, subtle styles without aggressive loops or flashy keyframes.
   */
  injectCalmStyles() {
    // Spotlight and circular hover effects have been disabled per design requirements
  }
}

export const interactiveFX = new InteractiveFXController();

// Auto-initialize when imported on client
if (typeof window !== 'undefined') {
  interactiveFX.init();
}
