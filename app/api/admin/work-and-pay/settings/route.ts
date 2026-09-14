import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';

const SETTINGS_KEY = 'work_pay_program_settings';

const DEFAULT_WP_SETTINGS = {
  defaultDurationWeeks: 104,
  defaultGracePeriodDays: 3,
  defaultLatePenaltyFee: 50,
  defaultDepositPct: 5,
  paystackFeePolicy: 'AGENCY_ABSORBS', // 'AGENCY_ABSORBS' or 'DRIVER_PAYS'
  minimumCommercialExperienceYears: 2
};

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const record = await db.siteSetting.findUnique({
      where: { key: SETTINGS_KEY }
    });

    const settings = record ? JSON.parse(record.value) : DEFAULT_WP_SETTINGS;
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const updated = {
      defaultDurationWeeks: Number(body.defaultDurationWeeks || 104),
      defaultGracePeriodDays: Number(body.defaultGracePeriodDays ?? 3),
      defaultLatePenaltyFee: Number(body.defaultLatePenaltyFee ?? 50),
      defaultDepositPct: Number(body.defaultDepositPct ?? 5),
      paystackFeePolicy: body.paystackFeePolicy || 'AGENCY_ABSORBS',
      minimumCommercialExperienceYears: Number(body.minimumCommercialExperienceYears ?? 2)
    };

    await db.siteSetting.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: JSON.stringify(updated)
      },
      update: {
        value: JSON.stringify(updated)
      }
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save settings.' }, { status: 500 });
  }
}
