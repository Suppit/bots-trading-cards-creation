import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerLogger } from '@/lib/server-logger';

const log = createServerLogger('submit-card');

// ---------------------------------------------------------------------------
// Card submission route — emails the card to the admin for review.
//
// Setup (2 minutes):
//   1. Sign up free at https://resend.com
//   2. Go to API Keys → Create API Key → copy it
//   3. Add to .env.local:
//        RESEND_API_KEY=re_xxxxxxxxxxxx
//        REVIEW_EMAIL=your@email.com   ← where review emails get sent
//
// Until these are set the button shows the toast but skips the email.
// ---------------------------------------------------------------------------

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const REVIEW_EMAIL = process.env.REVIEW_EMAIL;

const isConfigured = Boolean(RESEND_API_KEY && REVIEW_EMAIL);

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);

  if (!isConfigured) {
    log.warn('Email not configured — skipping card submission', { requestId });
    return NextResponse.json(
      { ok: true, skipped: true, reason: 'Email credentials not configured' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const formData = await request.formData();
    const card = formData.get('card');

    if (!card || !(card instanceof Blob)) {
      log.warn('Missing card image in submit-card request', { requestId });
      return NextResponse.json({ error: 'Missing card image' }, { status: 400 });
    }

    const cardSizeKB = Math.round(card.size / 1024);
    log.info('Card submission received', { requestId, metadata: { cardSizeKB } });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bots-card-${timestamp}.png`;

    const cardBuffer = Buffer.from(await card.arrayBuffer());

    const resend = new Resend(RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: 'BOTS Cards <onboarding@resend.dev>',
      to: REVIEW_EMAIL!,
      subject: '🃏 New BOTS Card submitted for review',
      html: `
        <p>A new BOTS Trading Card has been submitted for your review.</p>
        <p>The card is attached as a PNG. Download it and decide whether to add it to the home page.</p>
        <p><em>Submitted at ${new Date().toLocaleString()}</em></p>
      `,
      attachments: [
        {
          filename,
          content: cardBuffer,
        },
      ],
    });

    if (error) {
      throw new Error(error.message);
    }

    log.info('Card emailed for review', { requestId, metadata: { filename, to: REVIEW_EMAIL } });

    return NextResponse.json(
      { ok: true },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error('Card submission failed', { requestId, metadata: { error: message } });
    return NextResponse.json(
      { error: `Submission failed: ${message}` },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
