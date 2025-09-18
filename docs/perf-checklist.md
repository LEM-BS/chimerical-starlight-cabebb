# Performance Checklist

- Preconnect to every third-party origin that serves render-blocking assets (fonts, analytics, CMP, icons) before requesting them.
- Preload the primary stylesheet and font stylesheet so layout and text rendering begin immediately.
- Add intrinsic `width` and `height` (or an equivalent aspect ratio) to above-the-fold imagery and logos, and promote LCP candidates with `fetchpriority="high"`.
- Keep decorative or third-party widgets (e.g., TrustIndex) deferred with `requestIdleCallback`/`setTimeout` and only load them when matching markup exists.
- Verify CSS keeps resized logos at their intended display dimensions after intrinsic sizing updates.
- Re-run Lighthouse or Web Vitals tooling after changes to confirm LCP, CLS, and TTI trends.
