import { PrismaClient, ArticleStatus, MemberStatus, PaymentStatus, PaymentType, RegistrationPaymentState, Role } from '@prisma/client';
import { hashPassword } from '../lib/password';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin@demo.mrtruthagency.com';
  const adminPassword = process.env.ADMIN_PASSWORD?.trim() || 'demo-admin-password';
  const adminName = process.env.ADMIN_NAME?.trim() || 'Demo Administrator';

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { active: true, role: Role.SUPER_ADMIN, name: adminName, passwordHash: await hashPassword(adminPassword) },
    create: { email: adminEmail, name: adminName, passwordHash: await hashPassword(adminPassword), role: Role.SUPER_ADMIN }
  });

  const membershipStart = new Date();
  membershipStart.setFullYear(membershipStart.getFullYear() - 1);
  membershipStart.setMonth(membershipStart.getMonth() + 2); // ~10 months remaining
  const membershipEnd = new Date(membershipStart);
  membershipEnd.setFullYear(membershipEnd.getFullYear() + 1);

  const demoEmail = process.env.DEMO_MEMBER_EMAIL?.trim().toLowerCase() || 'member@demo.mrtruthagency.com';
  const demoPassword = process.env.DEMO_MEMBER_PASSWORD?.trim() || 'demo-member-password';
  const demoNameParts = (process.env.DEMO_MEMBER_NAME?.trim() || 'Kwame Mensah').split(/\s+/);

  const demoMember = await prisma.member.upsert({
    where: { memberNumber: 'MRTF-900001' },
    update: {
      status: MemberStatus.APPROVED,
      email: demoEmail,
      firstName: demoNameParts[0],
      lastName: demoNameParts.slice(1).join(' ') || 'Member',
      passwordHash: await hashPassword(demoPassword),
      registrationPayment: RegistrationPaymentState.PAID,
      membershipStartDate: membershipStart,
      membershipEndDate: membershipEnd,
      emailVerified: true
    },
    create: {
      memberNumber: 'MRTF-900001',
      email: demoEmail,
      passwordHash: await hashPassword(demoPassword),
      firstName: demoNameParts[0],
      lastName: demoNameParts.slice(1).join(' ') || 'Member',
      phone: '+233 24 000 0001',
      dateOfBirth: new Date('1994-06-15'),
      gender: 'Male',
      location: 'Accra',
      platform: 'Uber / Bolt',
      yearsExperience: 5,
      vehicleInfo: 'Toyota Corolla · 2019',
      vehicleRegistration: 'GR-1234-19',
      emergencyName: 'Ama Mensah',
      emergencyPhone: '+233 24 000 0002',
      emergencyRelationship: 'Spouse',
      status: MemberStatus.APPROVED,
      emailVerified: true,
      registrationPayment: RegistrationPaymentState.PAID,
      membershipStartDate: membershipStart,
      membershipEndDate: membershipEnd
    }
  });

  await prisma.payment.upsert({
    where: { reference: 'DEMO-ANNUAL-DUES-000001' },
    update: { status: PaymentStatus.SUCCESSFUL, paidAt: membershipStart },
    create: {
      memberId: demoMember.id,
      type: PaymentType.ANNUAL_DUES,
      amount: 200,
      currency: 'GHS',
      reference: 'DEMO-ANNUAL-DUES-000001',
      provider: 'demo',
      providerTransactionId: 'demo_txn_000001',
      status: PaymentStatus.SUCCESSFUL,
      paidAt: membershipStart
    }
  });

  const category = await prisma.newsCategory.upsert({ where: { slug: 'agency-news' }, update: {}, create: { name: 'Agency News', slug: 'agency-news' } });
  await prisma.newsArticle.upsert({ where: { slug: 'mr-truth-mobility-community-update' }, update: {}, create: { title: 'Mr Truth Mobility Community Update', slug: 'mr-truth-mobility-community-update', excerpt: 'A demo article seeded for the public news experience.', content: 'This is demo content for the Mr Truth Agency news system. Replace it with approved agency communications.', coverImage: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80', status: ArticleStatus.PUBLISHED, publishedAt: new Date(), authorId: admin.id, categoryId: category.id } });

  for (const item of [{ label: 'Members', value: '5,000+', description: 'Strong and growing community' }, { label: 'Voice', value: '1', description: 'Uniting drivers' }, { label: 'Partners', value: '20+', description: 'Working together for progress' }, { label: 'Region', value: 'Greater Accra', description: 'Serving drivers across the region' }]) {
    await prisma.statistic.upsert({ where: { label: item.label }, update: item, create: item });
  }

  const defaultSettings: Record<string, string> = {
    contact_phone: '+233 24 123 4567',
    contact_email: 'info@mrtruthagency.com',
    whatsapp_number: '233241234567',
    address_locality: 'Accra, Ghana',
    announcement_enabled: 'false',
    announcement_text: ''
  };
  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.siteSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
