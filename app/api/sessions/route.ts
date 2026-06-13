import { type NextRequest } from 'next/server';
import { currentUserId } from '@/lib/auth';
import { buildFullMockPlan, buildSingleDomainPlan, isDomainCode } from '@/lib/domains';
import { errorResponse, json } from '@/lib/http';
import { createSession, listSessions } from '@/lib/sessions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const uid = await currentUserId();
    if (!uid) return json({ error: 'Not authenticated.', code: 'UNAUTHENTICATED' }, 401);
    return json({ sessions: await listSessions(uid) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = await currentUserId();
    if (!uid) return json({ error: 'Not authenticated.', code: 'UNAUTHENTICATED' }, 401);

    let body: { mode?: unknown; domain?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body.', code: 'BAD_REQUEST' }, 400);
    }

    if (body.mode === 'full') {
      const plan = buildFullMockPlan();
      const id = await createSession(uid, 'full', null, plan);
      console.info(
        `[sessions] Created full mock { id: '${id}', blocks: ${plan.length}, questions: ${plan.reduce((a, p) => a + p.count, 0)} }`,
      );
      return json({ id }, 201);
    }
    if (body.mode === 'domain') {
      if (!isDomainCode(body.domain)) {
        return json({ error: 'A valid domain (D1–D5) is required.', code: 'BAD_DOMAIN' }, 400);
      }
      const plan = buildSingleDomainPlan(body.domain);
      const id = await createSession(uid, 'domain', body.domain, plan);
      console.info(
        `[sessions] Created single-domain ${body.domain} { id: '${id}', blocks: ${plan.length}, questions: ${plan.reduce((a, p) => a + p.count, 0)} }`,
      );
      return json({ id }, 201);
    }
    return json({ error: "mode must be 'full' or 'domain'.", code: 'BAD_MODE' }, 400);
  } catch (err) {
    return errorResponse(err);
  }
}
