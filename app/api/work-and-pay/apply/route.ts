import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { generateApplicationNumber } from '@/lib/work-pay';
import { getPortalMember } from '@/lib/members-auth';
import { rateLimit, requestAddress } from '@/lib/rate-limit';

const ghanaCardRegex = /^GHC-?\d{9}-?\d$/;

const schema = z.object({
  fullName: z.string().trim().min(3, 'Full name must be at least 3 characters'),
  phone: z.string().trim().min(7, 'Valid phone number is required'),
  email: z.string().trim().email('Valid email address is required'),
  ghanaCardNumber: z.string().trim().refine((val) => ghanaCardRegex.test(val), {
    message: 'Ghana Card number must match format GHC-123456789-0'
  }),
  driverLicenseNumber: z.string().trim().min(4, 'Valid driver license number is required'),
  driverLicenseClass: z.string().trim().min(1, 'License class is required'),
  driverLicenseExpiry: z.string().optional(),
  yearsExperience: z.coerce.number().int().min(1, 'Experience must be at least 1 year'),
  commercialHistory: z.string().optional(),
  rideHailingPlatforms: z.string().optional(),
  preferredVehicleType: z.string().trim().min(2, 'Vehicle preference is required'),
  operatingRegion: z.string().trim().min(2, 'Operating region is required'),
  programType: z.string().optional().default('WORK_PAY'),
  vehicleId: z.string().optional().nullable(),
  guarantor1Name: z.string().trim().min(2, 'Guarantor 1 name is required'),
  guarantor1Phone: z.string().trim().min(7, 'Guarantor 1 phone is required'),
  guarantor1Occupation: z.string().trim().min(2, 'Guarantor 1 occupation is required'),
  guarantor1Address: z.string().trim().min(3, 'Guarantor 1 address is required'),
  guarantor1GhanaCard: z.string().trim().min(5, 'Guarantor 1 Ghana Card is required'),
  guarantor2Name: z.string().trim().min(2, 'Guarantor 2 name is required'),
  guarantor2Phone: z.string().trim().min(7, 'Guarantor 2 phone is required'),
  guarantor2Occupation: z.string().trim().min(2, 'Guarantor 2 occupation is required'),
  guarantor2Address: z.string().trim().min(3, 'Guarantor 2 address is required'),
  guarantor2GhanaCard: z.string().trim().min(5, 'Guarantor 2 Ghana Card is required'),
  driverLicenseFrontUrl: z.string().optional(),
  driverLicenseBackUrl: z.string().optional(),
  ghanaCardFrontUrl: z.string().optional(),
  proofOfResidenceUrl: z.string().optional(),
  utilityBillUrl: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`wp-apply:${requestAddress(request)}`, 10);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many applications submitted. Please try again shortly.' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ error: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Validation error' }, { status: 400 });
    }

    const data = parsed.data;
    const portal = await getPortalMember();
    const appNumber = generateApplicationNumber();

    const application = await (db as any).workPayApplication.create({
      data: {
        applicationNumber: appNumber,
        memberId: portal?.id || null,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email.toLowerCase(),
        ghanaCardNumber: data.ghanaCardNumber.toUpperCase(),
        driverLicenseNumber: data.driverLicenseNumber.toUpperCase(),
        driverLicenseClass: data.driverLicenseClass,
        driverLicenseExpiry: data.driverLicenseExpiry ? new Date(data.driverLicenseExpiry) : null,
        yearsExperience: data.yearsExperience,
        commercialHistory: data.commercialHistory || null,
        rideHailingPlatforms: data.rideHailingPlatforms || null,
        preferredVehicleType: data.preferredVehicleType,
        operatingRegion: data.operatingRegion,
        programType: data.programType || 'WORK_PAY',
        vehicleId: data.vehicleId || null,
        guarantor1Name: data.guarantor1Name,
        guarantor1Phone: data.guarantor1Phone,
        guarantor1Occupation: data.guarantor1Occupation,
        guarantor1Address: data.guarantor1Address,
        guarantor1GhanaCard: data.guarantor1GhanaCard.toUpperCase(),
        guarantor2Name: data.guarantor2Name,
        guarantor2Phone: data.guarantor2Phone,
        guarantor2Occupation: data.guarantor2Occupation,
        guarantor2Address: data.guarantor2Address,
        guarantor2GhanaCard: data.guarantor2GhanaCard.toUpperCase(),
        driverLicenseFrontUrl: data.driverLicenseFrontUrl || null,
        driverLicenseBackUrl: data.driverLicenseBackUrl || null,
        ghanaCardFrontUrl: data.ghanaCardFrontUrl || null,
        proofOfResidenceUrl: data.proofOfResidenceUrl || null,
        utilityBillUrl: data.utilityBillUrl || null,
        status: 'SUBMITTED'
      }
    });

    return NextResponse.json({
      success: true,
      applicationNumber: appNumber,
      id: application.id
    }, { status: 201 });
  } catch (err: any) {
    console.error('Work & Pay application error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit application.' }, { status: 500 });
  }
}
