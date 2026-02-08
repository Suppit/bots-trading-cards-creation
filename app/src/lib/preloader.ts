import { createLogger } from './logger';
import { SERIES, FONTS } from './layout-constants';

const log = createLogger('Preloader');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PreloadProgress {
  loaded: number;
  total: number;
  /** 0–1 fraction */
  percent: number;
  currentAsset: string;
}

export type ProgressCallback = (progress: PreloadProgress) => void;

export interface PreloadResult {
  frames: Map<string, HTMLImageElement>;
  fontsReady: boolean;
  totalTimeMs: number;
}

// ---------------------------------------------------------------------------
// Image preloader
// ---------------------------------------------------------------------------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// ---------------------------------------------------------------------------
// Font preloader
// ---------------------------------------------------------------------------

async function loadFonts(): Promise<boolean> {
  const fontPromises = FONTS.files.map(async (fontFile) => {
    const face = new FontFace(
      FONTS.family,
      `url(${fontFile.path}) format('opentype')`,
      { weight: fontFile.weight, style: fontFile.style },
    );

    const loaded = await face.load();
    document.fonts.add(loaded);

    log.info(`Loaded font: ${FONTS.family} ${fontFile.weight} ${fontFile.style}`, {
      path: fontFile.path,
    });

    return loaded;
  });

  await Promise.all(fontPromises);

  // Wait for all fonts to be ready in the document
  await document.fonts.ready;
  return true;
}

// ---------------------------------------------------------------------------
// Main preloader
// ---------------------------------------------------------------------------

/**
 * Preloads all card frames and fonts.
 * Calls `onProgress` after each asset finishes loading.
 * Returns cached image elements and font-ready status.
 */
export async function preloadAssets(
  onProgress?: ProgressCallback,
): Promise<PreloadResult> {
  const startTime = performance.now();
  log.info('Asset preloading started');

  // Build the list of assets to track progress
  const frameEntries = SERIES.map((s) => ({ id: s.id, path: s.framePath }));
  const totalAssets = frameEntries.length + 1 /* fonts */;
  let loaded = 0;

  function reportProgress(assetName: string) {
    loaded++;
    const progress: PreloadProgress = {
      loaded,
      total: totalAssets,
      percent: loaded / totalAssets,
      currentAsset: assetName,
    };
    onProgress?.(progress);
    log.info(`Loaded asset ${loaded}/${totalAssets}: ${assetName}`, {
      percent: Math.round(progress.percent * 100),
    });
  }

  // Load fonts first (needed for canvas text measurement later)
  let fontsReady = false;
  try {
    fontsReady = await loadFonts();
    reportProgress('Aileron fonts');
  } catch (err) {
    log.error('Font loading failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    reportProgress('Aileron fonts (failed)');
  }

  // Load all frame images in parallel
  const frames = new Map<string, HTMLImageElement>();
  const imagePromises: Promise<void>[] = [];

  for (const entry of frameEntries) {
    imagePromises.push(
      loadImage(entry.path)
        .then((img) => {
          frames.set(entry.id, img);
          reportProgress(entry.id);
        })
        .catch((err) => {
          log.error(`Failed to load frame: ${entry.id}`, {
            path: entry.path,
            error: err instanceof Error ? err.message : String(err),
          });
          reportProgress(`${entry.id} (failed)`);
        }),
    );
  }

  await Promise.all(imagePromises);

  const totalTimeMs = Math.round(performance.now() - startTime);
  log.info('Asset preloading complete', {
    totalTimeMs,
    framesLoaded: frames.size,
    fontsReady,
  });

  return { frames, fontsReady, totalTimeMs };
}
