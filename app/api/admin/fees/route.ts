import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getFees, setFee } from '@/lib/fees';

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 });
  const fees = await getFees();
  const history = await db.feeSettingHistory.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
  return NextResponse.json({ fees, history });
}

const schema = z.object({
  registrationFeeAmount: z.coerce.number().int().min(0).max(100000000),
  registrationFeeEnabled: z.boolean(),
  annualDuesAmount: z.coerce.number().int().min(0).max(100000000),
  workApplicationFeeAmount: z.coerce.number().int().min(0).max(100000000),
  workApplicationFeeEnabled: z.boolean(),
  note: z.string().max(300).optional()
});

export async function PATCH(request: Request) {
  const user = await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
  if (!user) return NextResponse.json({ error: 'Administrator permission required.' }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Enter valid fee amounts in pesewas (GHS × 100).' }, { status: 400 });
  const data = parsed.data;

  await setFee('registration_fee', data.registrationFeeAmount, data.registrationFeeEnabled, user.name, data.note);
  await setFee('annual_dues', data.annualDuesAmount, true, user.name, data.note);
  await setFee('work_application_fee', data.workApplicationFeeAmount, data.workApplicationFeeEnabled, user.name, data.note);
  await db.auditLog.create({ data: { userId: user.id, action: 'UPDATE', entity: 'fees', metadata: { registrationFeeAmount: data.registrationFeeAmount, registrationFeeEnabled: data.registrationFeeEnabled, annualDuesAmount: data.annualDuesAmount, workApplicationFeeAmount: data.workApplicationFeeAmount, workApplicationFeeEnabled: data.workApplicationFeeEnabled } } });

  return NextResponse.json({ success: true, fees: await getFees() });
}
