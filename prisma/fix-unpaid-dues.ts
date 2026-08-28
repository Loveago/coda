/**
 * One-off repair for the "annual dues auto-paid on approval" bug.
 *
 * The old approval flow granted every newly approved member a free membership
 * year (membershipStartDate/EndDate = now + 1 year) even though they had never
 * paid annual dues. This script clears that phantom period for any APPROVED
 * member who has no successful ANNUAL_DUES payment, so their dashboard correctly
 * shows "DUES UNPAID" until they actually pay.
 *
 * Safe to re-run. Members who genuinely paid annual dues are never touched.
 *
 * Usage:  npx tsx prisma/fix-unpaid-dues.ts
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const approved = await db.member.findMany({
    where: { status: 'APPROVED', membershipEndDate: { not: null } },
    select: { id: true, memberNumber: true, firstName: true, lastName: true, membershipEndDate: true }
  });

  let repaired = 0;
  for (const member of approved) {
    const paidDues = await db.payment.count({
      where: { memberId: member.id, type: 'ANNUAL_DUES', status: 'SUCCESSFUL' }
    });
    if (paidDues > 0) continue;

    await db.member.update({
      where: { id: member.id },
      data: { membershipStartDate: null, membershipEndDate: null }
    });
    repaired += 1;
    console.log(`Cleared unpaid dues period for ${member.memberNumber} (${member.firstName} ${member.lastName})`);
  }

  console.log(`\nDone. ${approved.length} approved member(s) checked, ${repaired} corrected.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
