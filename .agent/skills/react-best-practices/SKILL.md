---
name: vercel-react-best-practices
description: React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel React Best Practices

Comprehensive performance optimization guide for React and Next.js applications, maintained by Vercel. Contains 57 rules across 8 categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:
- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size or load times

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Patterns | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

## Quick Reference

### 1. Eliminating Waterfalls (CRITICAL)

- `async-parallel` - Use Promise.all for independent fetches
- `async-preload-data` - Start fetches before they're needed
- `async-dedupe-requests` - Don't repeat identical fetches

### 2. Bundle Size Optimization (CRITICAL)

- `bundle-barrel-imports` - Import directly from modules, not barrels
- `bundle-dynamic-import` - Lazy load below-the-fold components
- `bundle-minimize-client` - Keep client bundle small
- `bundle-analyze-regularly` - Use bundle analyzer tooling
- `bundle-tree-shake` - Ensure code is tree-shakeable
- `bundle-use-client-boundary` - Push "use client" to leaf nodes
- `bundle-nextjs-image` - Use next/image for optimization
- `bundle-avoid-lodash-full` - Import specific lodash functions

### 3. Server-Side Performance (HIGH)

- `server-cache-fetches` - Cache repeated fetches
- `server-revalidate-smart` - Use appropriate cache times
- `server-streaming` - Stream long-running responses
- `server-edge-when-possible` - Prefer edge functions

### 4. Client-Side Data Fetching (MEDIUM-HIGH)

- `client-prefetch-links` - Prefetch on hover/visibility
- `client-keep-stale` - Show stale data while revalidating
- `client-cache-key-stable` - Use stable cache keys
- `client-abort-requests` - Cancel abandoned requests
- `client-optimistic-ui` - Update UI before server confirms

### 5. Re-render Optimization (MEDIUM)

- `rerender-stable-keys` - Use stable, meaningful keys
- `rerender-avoid-inline-objects` - Lift objects out of render
- `rerender-split-state` - Separate state by change frequency
- `rerender-context-split` - Split context by data type
- `rerender-move-state-down` - Colocate state with usage
- `rerender-children-pattern` - Accept children to avoid re-render
- `rerender-avoid-effect-state` - Don't sync props to state
- `rerender-memo-lists` - Memoize list item components
- `rerender-ref-callbacks` - Prefer ref callbacks over useEffect

### 6. Rendering Patterns (MEDIUM)

- `rendering-server-first` - Default to server components
- `rendering-suspense-boundary` - Wrap slow components
- `rendering-parallel-routes` - Use parallel routes for segments
- `rendering-intercept-modals` - Use intercepting routes for modals
- `rendering-activity-toggle` - Use Activity component for show/hide
- `rendering-conditional-render` - Use ternary, not && for conditionals
- `rendering-usetransition-loading` - Prefer useTransition for loading state

### 7. JavaScript Performance (LOW-MEDIUM)

- `js-batch-dom-css` - Group CSS changes via classes or cssText
- `js-index-maps` - Build Map for repeated lookups
- `js-cache-property-access` - Cache object properties in loops
- `js-cache-function-results` - Cache function results in module-level Map
- `js-cache-storage` - Cache localStorage/sessionStorage reads
- `js-combine-iterations` - Combine multiple filter/map into one loop
- `js-length-check-first` - Check array length before expensive comparison
- `js-early-exit` - Return early from functions
- `js-hoist-regexp` - Hoist RegExp creation outside loops
- `js-min-max-loop` - Use loop for min/max instead of sort
- `js-set-map-lookups` - Use Set/Map for O(1) lookups
- `js-tosorted-immutable` - Use toSorted() for immutability

### 8. Advanced Patterns (LOW)

- `advanced-event-handler-refs` - Store event handlers in refs
- `advanced-init-once` - Initialize app once per app load
- `advanced-use-latest` - useLatest for stable callback refs

## Code Examples

### async-parallel
```typescript
// ❌ Bad: Sequential fetches
const users = await getUsers();
const posts = await getPosts();

// ✅ Good: Parallel fetches
const [users, posts] = await Promise.all([
  getUsers(),
  getPosts()
]);
```

### bundle-barrel-imports
```typescript
// ❌ Bad: Barrel import
import { Button } from '@/components';

// ✅ Good: Direct import
import { Button } from '@/components/ui/button';
```

### rerender-stable-keys
```tsx
// ❌ Bad: Index as key
{items.map((item, i) => <Item key={i} {...item} />)}

// ✅ Good: Stable ID as key
{items.map(item => <Item key={item.id} {...item} />)}
```

### rendering-suspense-boundary
```tsx
// ❌ Bad: Block entire page
export default async function Page() {
  const data = await slowFetch();
  return <Component data={data} />;
}

// ✅ Good: Streaming with Suspense
export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <AsyncComponent />
    </Suspense>
  );
}
```

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
