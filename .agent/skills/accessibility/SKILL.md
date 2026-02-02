---
name: accessibility
description: Implement WCAG 2.2 compliant interfaces with mobile accessibility, inclusive design patterns, and assistive technology support. Use when auditing accessibility, implementing ARIA patterns, building for screen readers, or ensuring inclusive user experiences.
---

# Accessibility Compliance

Master accessibility implementation to create inclusive experiences that work for everyone, including users with disabilities.

## When to Use This Skill

- Implementing WCAG 2.2 Level AA or AAA compliance
- Building screen reader accessible interfaces
- Adding keyboard navigation to interactive components
- Implementing focus management and focus trapping
- Creating accessible forms with proper labeling
- Supporting reduced motion and high contrast preferences
- Building mobile accessibility features (iOS VoiceOver, Android TalkBack)
- Conducting accessibility audits and fixing violations

## Core Capabilities

### 1. WCAG 2.2 Guidelines

- **Perceivable**: Content must be presentable in different ways
- **Operable**: Interface must be navigable with keyboard and assistive tech
- **Understandable**: Content and operation must be clear
- **Robust**: Content must work with current and future assistive technologies

### 2. ARIA Patterns

- **Roles**: Define element purpose (button, dialog, navigation, tab, etc.)
- **Properties**: Describe element characteristics (aria-label, aria-describedby)
- **States**: Communicate dynamic changes (aria-expanded, aria-selected, aria-disabled)

### 3. Keyboard Navigation

```tsx
// Focus trap for modals
function Modal({ onClose, children }) {
  const modalRef = useRef(null);
  
  useEffect(() => {
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    
    first?.focus();
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
```

### 4. Screen Reader Support

```tsx
// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### 5. Color Contrast

```css
/* Minimum contrast ratios */
/* Normal text: 4.5:1 */
/* Large text (18pt+): 3:1 */
/* UI components: 3:1 */

/* Check: https://webaim.org/resources/contrastchecker/ */
```

### 6. Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
// React hook for reduced motion
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setPrefersReducedMotion(e.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
}
```

### 7. Form Accessibility

```tsx
// Accessible form pattern
<form onSubmit={handleSubmit}>
  <div>
    <label htmlFor="email">
      Email <span aria-hidden="true">*</span>
      <span className="sr-only">(required)</span>
    </label>
    <input
      id="email"
      type="email"
      aria-required="true"
      aria-invalid={errors.email ? 'true' : 'false'}
      aria-describedby={errors.email ? 'email-error' : undefined}
    />
    {errors.email && (
      <p id="email-error" role="alert">
        {errors.email}
      </p>
    )}
  </div>
</form>
```

### 8. Mobile Accessibility

- Minimum touch target size: 44x44 pixels
- Support for VoiceOver (iOS) and TalkBack (Android)
- Gesture alternatives for complex interactions
- Proper heading hierarchy for screen reader navigation

## Accessibility Checklist

### Perceivable
- [ ] All images have meaningful alt text
- [ ] Video has captions and audio descriptions
- [ ] Color is not the only way to convey information
- [ ] Text has 4.5:1 contrast ratio (3:1 for large text)
- [ ] Content can be zoomed to 200% without loss of function

### Operable
- [ ] All functionality available via keyboard
- [ ] No keyboard traps
- [ ] Skip links provided for repeated content
- [ ] Focus indicators are visible
- [ ] Sufficient time to complete tasks

### Understandable
- [ ] Language is identified in HTML
- [ ] Labels clearly identify form inputs
- [ ] Error messages are helpful and specific
- [ ] Navigation is consistent across pages
- [ ] Actions are reversible or confirmable

### Robust
- [ ] Valid HTML structure
- [ ] ARIA attributes used correctly
- [ ] Works with current assistive technologies
- [ ] Custom controls have proper semantics

## Best Practices

1. **Use Semantic HTML**: Prefer native elements over ARIA when possible
2. **Test with Real Users**: Include people with disabilities in user testing
3. **Keyboard First**: Design interactions to work without a mouse
4. **Don't Disable Focus Styles**: Style them, don't remove them
5. **Provide Text Alternatives**: All non-text content needs descriptions
6. **Support Zoom**: Content should work at 200% zoom
7. **Announce Changes**: Use live regions for dynamic content
8. **Respect Preferences**: Honor prefers-reduced-motion and prefers-contrast

## Common Issues

- **Missing alt text**: Images without descriptions
- **Poor color contrast**: Text hard to read against background
- **Keyboard traps**: Focus stuck in component
- **Missing labels**: Form inputs without associated labels
- **Auto-playing media**: Content that plays without user initiation
- **Inaccessible custom controls**: Recreating native functionality poorly
- **Missing skip links**: No way to bypass repetitive content
- **Focus order issues**: Tab order doesn't match visual order

## Testing Tools

- **Automated**: axe DevTools, WAVE, Lighthouse
- **Manual**: VoiceOver (macOS/iOS), NVDA/JAWS (Windows), TalkBack (Android)
- **Simulators**: NoCoffee (vision), Silktide (various disabilities)

## Resources

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Inclusive Components](https://inclusive-components.design/)
- [Deque University](https://dequeuniversity.com/)
