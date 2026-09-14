import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { getFeeSettings, getFeeSettingHistory, updateFeeSetting } from '@/lib/fees';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await getFeeSettings();
  const history = await getFeeSettingHistory();

  return NextResponse.json({
    settings,
    history
  });
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const {
      registrationFeeEnabled,
      registrationFeeAmount, // in GHS
      registrationGracePeriod,
      annualDuesEnabled,
      annualDuesAmount, // in GHS
      annualDuesGracePeriod,
      note
    } = body;

    // Update Registration Fee
    if (registrationFeeAmount !== undefined || registrationFeeEnabled !== undefined) {
      const pesewas = Math.round(Number(registrationFeeAmount ?? 20) * 100);
      await updateFeeSetting(
        'REGISTRATION_FEE',
        {
          amount: pesewas,
          enabled: Boolean(registrationFeeEnabled),
          gracePeriodDays: Number(registrationGracePeriod ?? 0),
          currency: 'GHS'
        },
        admin.name || admin.email,
        note || 'Updated registration fee settings'
      );
    }

    // Update Annual Dues
    if (annualDuesAmount !== undefined || annualDuesEnabled !== undefined) {
      const pesewas = Math.round(Number(annualDuesAmount ?? 200) * 100);
      await updateFeeSetting(
        'ANNUAL_DUES',
        {
          amount: pesewas,
          enabled: Boolean(annualDuesEnabled),
          gracePeriodDays: Number(annualDuesGracePeriod ?? 30),
          currency: 'GHS'
        },
        admin.name || admin.email,
        note || 'Updated annual dues settings'
      );
    }

    const updatedSettings = await getFeeSettings();
    const updatedHistory = await getFeeSettingHistory();

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      history: updatedHistory
    });
  } catch (err: any) {
    console.error('Error updating fee settings:', err);
    return NextResponse.json({ error: err.message || 'Failed to update fee settings' }, { status: 500 });
  }
}
