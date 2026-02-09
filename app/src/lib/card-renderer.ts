import { createLogger } from './logger';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  PORTRAIT,
  TEXT_ZONES,
} from './layout-constants';
import type { CardFormData } from '@/contexts/AppContext';

const log = createLogger('CardRenderer');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface CardRenderInput {
  frame: HTMLImageElement;
  portrait: Blob;
  formData: CardFormData;
}

/**
 * Composites a finished trading card on an off-screen canvas.
 * Layer order: portrait → frame → text overlays.
 */
export async function renderCard(
  input: CardRenderInput,
): Promise<HTMLCanvasElement> {
  const startTime = performance.now();
  log.info('Card composition started', {
    hasFrame: !!input.frame,
    portraitSizeKB: Math.round(input.portrait.size / 1024),
  });

  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas 2d context');

  // 1. Draw portrait behind the frame
  const portraitImg = await loadBlobAsImage(input.portrait);
  ctx.drawImage(
    portraitImg,
    PORTRAIT.x,
    PORTRAIT.y,
    PORTRAIT.width,
    PORTRAIT.height,
  );
  log.info('Layer rendered: portrait');

  // 2. Draw frame overlay (transparent window lets portrait show through)
  ctx.drawImage(input.frame, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  log.info('Layer rendered: frame');

  // 3. Title — white, bold italic on the black diagonal banner
  const tz = TEXT_ZONES.title;
  ctx.font = `${tz.fontStyle} ${tz.fontWeight} ${tz.fontSize}px Aileron`;
  ctx.fillStyle = tz.color;
  ctx.textBaseline = 'top';
  ctx.fillText(input.formData.title, tz.x, tz.y, tz.maxWidth);
  log.info('Layer rendered: title');

  // 4. Tagline — silver bar behind text, then bold small-caps
  const tagZone = TEXT_ZONES.tagline;
  const tagTextWidth = measureSmallCapsWidth(
    ctx,
    input.formData.tagline,
    tagZone.fontSize,
    tagZone.fontWeight,
  );

  // Draw tagline bar at native size, positioned so its right edge
  // aligns with the text end + padding. Clip the left side at bar.x.
  const bar = tagZone.bar;
  const taglineBarImg = await loadUrlImage(bar.path);
  const barRight = Math.min(tagZone.x + tagTextWidth + bar.padding, bar.maxRight);
  const barLeft = barRight - taglineBarImg.width;
  const barY = tagZone.y + (tagZone.fontSize - bar.height) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(bar.x, barY, barRight - bar.x, bar.height);
  ctx.clip();
  ctx.drawImage(taglineBarImg, barLeft, barY);
  ctx.restore();
  log.info('Layer rendered: tagline bar', { barLeft, barRight });

  drawSmallCaps(
    ctx,
    input.formData.tagline,
    tagZone.x,
    tagZone.y,
    tagZone.fontSize,
    tagZone.fontWeight,
    tagZone.color,
    tagZone.maxWidth,
  );
  log.info('Layer rendered: tagline');

  // 5. Fun Fact — bold label + regular body, word-wrapped
  drawLabeledField(ctx, TEXT_ZONES.funFact, input.formData.funFact);
  log.info('Layer rendered: funFact');

  // 6. Pro Tip — bold label + regular body, word-wrapped
  drawLabeledField(ctx, TEXT_ZONES.proTip, input.formData.proTip);
  log.info('Layer rendered: proTip');

  const totalRenderTimeMs = Math.round(performance.now() - startTime);
  log.info('Card composition complete', { totalRenderTimeMs });

  return canvas;
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/**
 * Draws text in a small-caps style. The first character of each word is drawn
 * at the full font size; remaining characters are drawn uppercase at ~75% size.
 */
function drawSmallCaps(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fontWeight: string,
  color: string,
  maxWidth: number,
): void {
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';

  const fullFont = `${fontWeight} ${fontSize}px Aileron`;
  const smallFont = `${fontWeight} ${Math.round(fontSize * 0.75)}px Aileron`;

  let cursorX = x;
  const words = text.split(' ');

  for (let w = 0; w < words.length; w++) {
    if (w > 0) {
      // Draw space
      ctx.font = fullFont;
      cursorX += ctx.measureText(' ').width;
    }

    const word = words[w];
    for (let i = 0; i < word.length; i++) {
      const char = i === 0 ? word[i].toUpperCase() : word[i].toUpperCase();
      const isFirstChar = i === 0;

      ctx.font = isFirstChar ? fullFont : smallFont;
      const charY = isFirstChar ? y : y + fontSize * 0.25; // baseline-align small chars

      if (cursorX - x > maxWidth) break;

      ctx.fillText(char, cursorX, charY);
      cursorX += ctx.measureText(char).width;
    }
  }
}

/**
 * Draws a labeled text field ("Fun Fact:" / "Pro Tip:") with the label in bold
 * and body in regular weight, with automatic word wrapping.
 */
interface LabeledZone {
  x: number;
  y: number;
  maxWidth: number;
  fontSize: number;
  labelFontWeight: string;
  bodyFontWeight: string;
  color: string;
  lineHeight: number;
  label: string;
}

function drawLabeledField(
  ctx: CanvasRenderingContext2D,
  zone: LabeledZone,
  bodyText: string,
): void {
  const { x, y, maxWidth, fontSize, color, lineHeight, label } = zone;
  const lineHeightPx = fontSize * lineHeight;

  ctx.fillStyle = color;
  ctx.textBaseline = 'top';

  // Build the full text: "Fun Fact: <body text>"
  const fullText = `${label} ${bodyText}`;

  // Wrap the combined text
  const lines = wrapText(ctx, fullText, maxWidth, fontSize, zone.labelFontWeight);

  for (let i = 0; i < lines.length; i++) {
    const lineY = y + i * lineHeightPx;
    const line = lines[i];

    // Check if this line starts with (or contains) the label
    if (i === 0 && line.startsWith(label)) {
      // Draw label portion in bold small-caps
      drawSmallCaps(
        ctx,
        label,
        x,
        lineY,
        fontSize,
        zone.labelFontWeight,
        color,
        maxWidth,
      );

      // Measure label width to position body text
      ctx.font = `${zone.labelFontWeight} ${fontSize}px Aileron`;
      // Measure the small-caps label width approximately
      const labelWidth = measureSmallCapsWidth(ctx, label, fontSize, zone.labelFontWeight);

      // Draw remainder in regular weight
      const remainder = line.slice(label.length);
      ctx.font = `${zone.bodyFontWeight} ${fontSize}px Aileron`;
      ctx.fillText(remainder, x + labelWidth, lineY, maxWidth - labelWidth);
    } else {
      // Subsequent lines are all body text (regular weight)
      ctx.font = `${zone.bodyFontWeight} ${fontSize}px Aileron`;
      ctx.fillText(line, x, lineY, maxWidth);
    }
  }
}

/**
 * Measures the width of small-caps text (first char of each word at full size,
 * rest at 75% size).
 */
function measureSmallCapsWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  fontWeight: string,
): number {
  const fullFont = `${fontWeight} ${fontSize}px Aileron`;
  const smallFont = `${fontWeight} ${Math.round(fontSize * 0.75)}px Aileron`;

  let width = 0;
  const words = text.split(' ');

  for (let w = 0; w < words.length; w++) {
    if (w > 0) {
      ctx.font = fullFont;
      width += ctx.measureText(' ').width;
    }
    const word = words[w];
    for (let i = 0; i < word.length; i++) {
      const char = word[i].toUpperCase();
      ctx.font = i === 0 ? fullFont : smallFont;
      width += ctx.measureText(char).width;
    }
  }
  return width;
}

/**
 * Word-wraps text to fit within maxWidth. Returns an array of line strings.
 * Uses the label font weight for the first line (to account for bold label),
 * and switches to body font for measurement on subsequent content.
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
  fontWeight: string,
): string[] {
  ctx.font = `${fontWeight} ${fontSize}px Aileron`;

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Image loading
// ---------------------------------------------------------------------------

/**
 * Loads an image from a URL path (e.g. '/Tagline-Bar.png').
 */
function loadUrlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Converts a Blob into an HTMLImageElement, resolving when loaded.
 */
function loadBlobAsImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load portrait image'));
    };
    img.src = url;
  });
}
