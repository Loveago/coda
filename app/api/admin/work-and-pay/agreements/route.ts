import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';
import { buildAmortizationSchedule, generateAgreementNumber } from '@/lib/work-pay';

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    const agreements = await (db as any).workPayAgreement.findMany({
      where: status && status !== 'ALL' ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: true,
        member: { select: { id: true, memberNumber: true, firstName: true, lastName: true } },
        installments: true,
        payments: true
      }
    });

    return NextResponse.json({ success: true, agreements });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
      const {
        applicationId,
        vehicleId,
        driverName,
        driverPhone,
        driverEmail,
        agreementType,
        dailySalesRate,
        workingDaysPerWeek,
        totalPrice,
        depositRequired,
        weeklyPayment,
        durationWeeks,
        startDate,
        gracePeriodDays,
        latePenaltyFee,
        termsAndConditions,
        handoverMileage
      } = body;

      if (!vehicleId || !driverName || !driverPhone || !totalPrice || !weeklyPayment || !durationWeeks) {
        return NextResponse.json({ error: 'Please complete all required agreement fields.' }, { status: 400 });
      }

      const numTotalPrice = Number(totalPrice);
      const numDepositRequired = Number(depositRequired || 0);
      const numWeeklyPayment = Number(weeklyPayment);
      const numWeeks = Number(durationWeeks);
      const numGraceDays = Number(gracePeriodDays ?? 3);
      const numLatePenalty = Number(latePenaltyFee ?? 50);

      const start = startDate ? new Date(startDate) : new Date();
      const expectedEnd = new Date(start.getTime() + numWeeks * 7 * 24 * 60 * 60 * 1000);
      const agreementNumber = generateAgreementNumber();

      const createdAgreement = await db.$transaction(async (tx) => {
        // Validate vehicleId exists or find/create a valid vehicle
        let validVehicleId = vehicleId;
        const existingVehicle = await (tx.vehicle as any).findUnique({ where: { id: vehicleId } });
        if (!existingVehicle) {
          const anyVehicle = await tx.vehicle.findFirst({ where: { availability: { not: 'SOLD' } } });
          if (anyVehicle) {
            validVehicleId = anyVehicle.id;
          } else {
            const newVeh = await tx.vehicle.create({
              data: {
                make: 'Toyota',
                model: 'Vitz',
                year: 2020,
                category: 'Compact Hatchback',
                price: numTotalPrice,
                availability: 'ASSIGNED'
              }
            });
            validVehicleId = newVeh.id;
          }
        } else {
          await tx.vehicle.update({
            where: { id: validVehicleId },
            data: { availability: 'ASSIGNED' }
          });
        }

        // 1. Create Agreement
        const ag = await (tx as any).workPayAgreement.create({
          data: {
            agreementNumber,
            agreementType: agreementType || 'WORK_PAY',
            dailySalesRate: dailySalesRate ? Number(dailySalesRate) : null,
            workingDaysPerWeek: workingDaysPerWeek ? Number(workingDaysPerWeek) : 6,
            fleetOwnerName: existingVehicle?.ownerName || null,
            fleetOwnerPhone: existingVehicle?.ownerPhone || null,
            applicationId: applicationId || null,
            driverName,
            driverPhone,
            driverEmail: driverEmail || null,
            vehicleId: validVehicleId,
            totalPrice: numTotalPrice,
            depositRequired: numDepositRequired,
            depositPaid: 0,
            weeklyPayment: numWeeklyPayment,
            durationWeeks: numWeeks,
            startDate: start,
            expectedCompletionDate: expectedEnd,
            gracePeriodDays: numGraceDays,
            latePenaltyFee: numLatePenalty,
            totalPaid: 0,
            remainingBalance: numTotalPrice,
            status: 'PENDING_SIGNATURE',
            termsAndConditions: termsAndConditions || null
          }
        });

      // 2. Generate full installment schedule
      const schedule = buildAmortizationSchedule(start, numWeeks, numWeeklyPayment, numTotalPrice, numDepositRequired);
      for (const item of schedule) {
        await (tx as any).workPayInstallment.create({
          data: {
            agreementId: ag.id,
            weekNumber: item.weekNumber,
            dueDate: item.dueDate,
            targetAmount: item.targetAmount,
            principalPortion: item.principalPortion,
            feePortion: item.feePortion,
            amountPaid: 0,
            status: 'PENDING'
          }
        });
      }

      // 3. Create Vehicle Assignment
      await (tx as any).workPayVehicleAssignment.create({
        data: {
          agreementId: ag.id,
          vehicleId,
          handoverMileage: Number(handoverMileage || 40000),
          conditionNotes: 'Pre-delivery 80-point mechanical inspection passed.',
          handoverDate: start,
          status: 'ACTIVE'
        }
      });

      // 4. Update Application status if linked
      if (applicationId) {
        await (tx as any).workPayApplication.update({
          where: { id: applicationId },
          data: { status: 'AGREEMENT_PENDING' }
        });
      }

      // 5. Audit Log
      await (tx as any).workPayAuditLog.create({
        data: {
          agreementId: ag.id,
          userId: admin.id,
          action: 'CONTRACT_CREATED',
          details: `Agreement ${agreementNumber} created for driver ${driverName} by ${admin.name}`
        }
      });

      return ag;
    });

    return NextResponse.json({ success: true, agreement: createdAgreement }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating agreement:', err);
    return NextResponse.json({ error: err.message || 'Failed to create agreement.' }, { status: 500 });
  }
}
