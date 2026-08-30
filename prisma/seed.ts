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

  await prisma.statistic.deleteMany({ where: { label: { in: ['Members', 'Voice', 'Partners', 'Region'] } } });
  const stats = [
    { label: 'Happy Clients', value: '10K+', description: 'Trusted across Ghana and beyond' },
    { label: 'Vehicles Managed', value: '500+', description: 'City cars to heavy fleet' },
    { label: 'Partner Companies', value: '250+', description: 'Mobility ecosystem partners' },
    { label: 'Reliable Support', value: '24/7', description: 'Always on the move with you' }
  ];
  for (const [index, item] of stats.entries()) {
    await prisma.statistic.upsert({ where: { label: item.label }, update: { ...item, displayOrder: index }, create: { ...item, displayOrder: index } });
  }

  const demoVehicles: Array<{ make: string; model: string; year: number; category: string; transmission: string; fuelType: string; seats: number; price: number; dailyRate: number; description: string; featured: boolean; image: string }> = [
    { make: 'Toyota', model: 'Hilux', year: 2022, category: 'Pickup', transmission: 'Automatic', fuelType: 'Diesel', seats: 5, price: 220000, dailyRate: 450, description: 'Rugged double-cab pickup, ideal for field operations and corporate mobility.', featured: true, image: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1200&q=80' },
    { make: 'Hyundai', model: 'Elantra', year: 2023, category: 'Sedan', transmission: 'Automatic', fuelType: 'Petrol', seats: 5, price: 145000, dailyRate: 300, description: 'Comfortable, fuel-efficient sedan perfect for ride-hailing and executive hire.', featured: true, image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=80' },
    { make: 'Kia', model: 'Sportage', year: 2021, category: 'SUV', transmission: 'Automatic', fuelType: 'Petrol', seats: 5, price: 168000, dailyRate: 350, description: 'Versatile compact SUV with modern tech and confident road presence.', featured: true, image: 'https://images.unsplash.com/photo-1519641481525-4f777bea0e59?auto=format&fit=crop&w=1200&q=80' },
    { make: 'Toyota', model: 'Hiace', year: 2020, category: 'Van', transmission: 'Manual', fuelType: 'Diesel', seats: 15, price: 195000, dailyRate: 550, description: 'High-capacity crew van built for staff transport and event shuttles.', featured: true, image: 'https://images.unsplash.com/photo-1600661653561-629509216228?auto=format&fit=crop&w=1200&q=80' }
  ];
  for (const { image, ...vehicleFields } of demoVehicles) {
    const existing = await prisma.vehicle.findFirst({ where: { make: vehicleFields.make, model: vehicleFields.model, year: vehicleFields.year } });
    if (existing) continue;
    const created = await prisma.vehicle.create({ data: { ...vehicleFields, availability: 'AVAILABLE' } });
    await prisma.vehicleImage.create({ data: { vehicleId: created.id, url: image, altText: `${vehicleFields.make} ${vehicleFields.model} (${vehicleFields.year})`, position: 0 } });
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
