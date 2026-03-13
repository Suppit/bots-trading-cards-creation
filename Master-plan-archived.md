# BOTS Trading Card Creator - Implementation Plan

## Tech Stack Recommendation
- **Frontend:** React/Next.js (mobile-first PWA)
- **Image Processing:** Canvas API + backend stylization service
- **State Management:** React Context or Zustand
- **Styling:** Tailwind CSS

---

## Phase 1: Project Setup & Foundation

### 1.1 Initialize Project
- Set up Next.js project with TypeScript
- Configure Tailwind CSS for mobile-first design
- Set up ESLint, Prettier
- Create folder structure: `/components`, `/pages`, `/hooks`, `/utils`, `/assets`

### 1.2 Logging Infrastructure
- Implement console logging wrapper with levels: `[DEBUG]`, `[INFO]`, `[WARN]`, `[ERROR]`
- Add request/response interceptors for API calls
- Set up error boundary component for React errors

**Testing Checkpoint:**
```
- Verify dev server starts without errors
- Check console shows structured log output
- Confirm hot reload works
```

---

## Phase 2: Asset Preparation & Preloading

### 2.1 Prepare Card Frame Assets
- Create/obtain 5 card frame images (Series 1-4 + Specialty)
- Define layout constants (text zones, portrait mask position)
- Set up font loading

### 2.2 Asset Preloader Service
- Build preloader that fetches all frames on app init
- Show loading progress on start screen
- Cache assets in memory

**Testing Checkpoint:**
```
- Console log each asset load: "[INFO] Loaded frame: series-1.png"
- Log total load time
- Test on throttled network (3G) - verify graceful handling
- Check memory usage in DevTools
```

---

## Phase 3: Start Screen (Entry Point)

### 3.1 Build Start Screen Component
- Full-screen mobile layout
- "Start" button as primary CTA
- Preload status indicator (subtle)

**Testing Checkpoint:**
```
- Log "[INFO] Start screen mounted"
- Log "[INFO] User tapped Start" on button press
- Verify touch targets are 44px+ for mobile
- Test on iOS Safari and Chrome Android
```

---

## Phase 4: Photo Capture & Crop

### 4.1 Camera/Gallery Access
- Implement file input with `capture="user"` for selfie
- Fallback to gallery selection
- Handle permission denied gracefully

### 4.2 Crop Interface (114:97 Aspect Ratio)
- Use library like `react-image-crop` or custom Canvas implementation
- Lock aspect ratio to 114:97
- Pan/zoom gestures for mobile
- "Use Photo" confirmation button

**Testing Checkpoint:**
```
- Log "[INFO] Camera permission: granted/denied"
- Log "[INFO] Image selected: {width}x{height}, {size}KB"
- Log "[INFO] Crop applied: {x}, {y}, {scale}"
- Log "[ERROR] ..." for any image load failures
- Test with various image sizes (tiny, huge, portrait, landscape)
- Verify crop preview matches final output
```

---

## Phase 5: Image Stylization Service

### 5.1 Backend API Setup
- Create `/api/stylize` endpoint
- Accept cropped image (base64 or multipart)
- Return stylized image
- Implement timeout handling (30s max)

### 5.2 Client Integration
- Fire stylization request immediately after crop confirmed
- Store promise for later resolution
- Handle errors with retry option

**Testing Checkpoint:**
```
- Server log: "[INFO] Stylization request received: {requestId}"
- Server log: "[INFO] Stylization complete: {requestId}, {processingTime}ms"
- Server log: "[ERROR] Stylization failed: {requestId}, {error}"
- Client log: "[INFO] Stylization started"
- Client log: "[INFO] Stylization complete" or "[ERROR] Stylization failed"
- Test timeout scenario
- Test network disconnect during processing
```

---

## Phase 6: Text Entry Form

### 6.1 Build Form Component
- Four fields: Title, Tagline, Fun Fact, Pro Tip
- Character limit validation with counters
- Required field indicators
- Keyboard-friendly mobile UX

### 6.2 Validation Logic
- Real-time character counting
- Prevent submission until valid
- Show stylization progress indicator

**Testing Checkpoint:**
```
- Log "[INFO] Form field changed: {field}, length: {n}/{max}"
- Log "[WARN] Validation failed: {field} - {reason}"
- Log "[INFO] Form submitted successfully"
- Test with emoji input, special characters
- Test paste of long text
- Verify form doesn't jump on keyboard open (mobile)
```

---

## Phase 7: Card Reveal & Rendering

### 7.1 Card Composer Component
- Canvas-based rendering
- Layer order: frame → stylized portrait → text overlays
- Use predefined text zones from layout constants

### 7.2 Reveal Animation
- Wait for both stylization + form completion
- Animate card appearance (fade/scale)

**Testing Checkpoint:**
```
- Log "[INFO] Card composition started"
- Log "[INFO] Layer rendered: {layerName}"
- Log "[INFO] Card composition complete: {totalRenderTime}ms"
- Log "[ERROR] Canvas rendering failed: {error}"
- Visual QA: text positioning, portrait mask alignment
- Test with longest possible text entries
- Test with minimum text entries
```

---

## Phase 8: Series Swipe

### 8.1 Swipe Gesture Handler
- Implement horizontal swipe detection
- Preload adjacent frames for smooth transitions
- Dot indicators for current series

### 8.2 Frame Swap Logic
- Only swap frame layer, keep portrait + text
- Instant re-render on swipe

**Testing Checkpoint:**
```
- Log "[INFO] Series changed: {from} → {to}"
- Log render time for frame swap (should be <16ms for 60fps)
- Test rapid swiping
- Test swipe at edges (first/last series)
- Verify no image reprocessing occurs
```

---

## Phase 9: Export & Share

### 9.1 Download Functionality
- Export canvas to PNG blob
- Trigger download with filename: `bots-card-{timestamp}.png`

### 9.2 Native Share
- Detect Web Share API support
- Fallback to download-only on unsupported browsers

**Testing Checkpoint:**
```
- Log "[INFO] Export initiated: {format}"
- Log "[INFO] Export complete: {fileSize}KB"
- Log "[INFO] Share API: supported/unsupported"
- Log "[INFO] Share completed" or "[INFO] Share cancelled"
- Test downloaded image opens correctly
- Test share to various apps (Messages, Instagram, etc.)
- Verify image quality is acceptable
```

---

## Phase 10: Error Handling & Edge Cases

### 10.1 Global Error States
- Network failure recovery UI
- Stylization failure retry flow
- Session timeout handling

### 10.2 Browser Compatibility
- Test and polyfill for Safari, Chrome, Firefox mobile
- Handle iOS Safari quirks (camera, canvas)

**Testing Checkpoint:**
```
- Log all caught exceptions with stack traces
- Test airplane mode at each step
- Test browser back button behavior
- Test app switch and return (mobile)
- Memory leak check with DevTools over extended use
```

---

## Phase 11: Performance Optimization

### 11.1 Optimizations
- Lazy load non-critical assets
- Compress frame images (WebP with PNG fallback)
- Debounce form validation

### 11.2 Metrics
- Log Core Web Vitals (LCP, FID, CLS)
- Track user flow completion rate

**Testing Checkpoint:**
```
- Lighthouse audit: target 90+ mobile score
- Log "[PERF] LCP: {time}ms"
- Log "[PERF] Total flow time: {time}s"
- Test on low-end device (older iPhone/Android)
```

---

## Logging Summary Table

| Event | Level | Example Output |
|-------|-------|----------------|
| Screen mount | INFO | `[INFO] Screen: PhotoCapture mounted` |
| User action | INFO | `[INFO] Action: Start button tapped` |
| API request | INFO | `[INFO] API: POST /stylize started` |
| API response | INFO | `[INFO] API: /stylize 200 OK (2340ms)` |
| Validation fail | WARN | `[WARN] Validation: Title exceeds 20 chars` |
| Caught error | ERROR | `[ERROR] Canvas: Failed to draw image - {stack}` |
| Uncaught error | ERROR | `[ERROR] Uncaught: {message} - {stack}` |
| Performance | DEBUG | `[DEBUG] Perf: Frame swap render 8ms` |

---

## Suggested Build Order

1. Phases 1-2 (Foundation + Assets)
2. Phases 3-4 (Start + Photo) → **First testable flow**
3. Phase 6 (Text Entry) → **Can test form in isolation**
4. Phase 5 (Stylization) → **Integrate API**
5. Phase 7 (Card Reveal) → **Core feature complete**
6. Phase 8 (Series Swipe) → **Full card experience**
7. Phase 9 (Export) → **MVP complete**
8. Phases 10-11 (Polish)
