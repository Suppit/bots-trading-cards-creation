import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';
import { readFile } from 'fs/promises';
import path from 'path';
import { createServerLogger } from '@/lib/server-logger';

const log = createServerLogger('stylize');

const STYLE_PROMPT = `Apply the artistic style of the first image to the second image. The first image is a reference showing cheerful manga-style illustrated characters with vibrant, warm colors and a soft golden haze. Transform the person in the second image into this illustrated manga art style while:
- Faithfully preserving their facial features, skin tone, hair, and expression exactly as they appear
- Applying the same bright, positive, age-appropriate artistic style to every person equally, regardless of how they look
- Keeping the output celebratory, wholesome, and suitable for children
- Avoiding any stereotyping, exaggeration, or bias based on race, ethnicity, or appearance
The result must be a joyful, child-appropriate trading card portrait.`;

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    // 1. Parse the uploaded photo
    const formData = await request.formData();
    const photo = formData.get('photo');

    if (!photo || !(photo instanceof Blob)) {
      log.warn('Missing or invalid photo in request', { requestId });
      return NextResponse.json(
        { error: 'Missing photo in request body' },
        { status: 400 },
      );
    }

    const photoSizeKB = Math.round(photo.size / 1024);
    log.info('Stylization request received', {
      requestId,
      metadata: { photoSizeKB },
    });

    // 2. Read the style reference image
    const referencePath = path.join(process.cwd(), 'public', 'style-reference.jpg');
    const referenceBuffer = await readFile(referencePath);

    // 3. Convert images to OpenAI-compatible files
    const referenceFile = await toFile(referenceBuffer, 'style-reference.jpg', {
      type: 'image/jpeg',
    });

    const photoBuffer = Buffer.from(await photo.arrayBuffer());
    const photoFile = await toFile(photoBuffer, 'user-photo.jpg', {
      type: photo.type || 'image/jpeg',
    });

    // 4. Call OpenAI
    const openai = new OpenAI();

    log.info('OpenAI API call started', { requestId });
    const startTime = Date.now();

    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: [referenceFile, photoFile],
      prompt: STYLE_PROMPT,
      size: '1536x1024',
    });

    const processingTimeMs = Date.now() - startTime;
    log.info('OpenAI API response received', {
      requestId,
      metadata: { processingTimeMs },
    });

    // 5. Return the base64 image
    const imageBase64 = response.data?.[0]?.b64_json;
    if (!imageBase64) {
      log.error('No image data in OpenAI response', { requestId });
      return NextResponse.json(
        { error: 'No image data received from OpenAI' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { imageBase64 },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error('Stylization failed', {
      requestId,
      metadata: { error: message },
    });

    return NextResponse.json(
      { error: `Stylization failed: ${message}` },
      { status: 500 },
    );
  }
}
