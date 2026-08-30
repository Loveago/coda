import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.newsArticle.findMany();
  let fixed = 0;
  for (const a of articles) {
    let changed = false;
    const data: Record<string, string> = {};
    if (a.title && a.title.includes('GACODA')) { data.title = a.title.replace(/GACODA/g, 'Mr Truth Agency'); changed = true; }
    if (a.excerpt && a.excerpt.includes('GACODA')) { data.excerpt = a.excerpt.replace(/GACODA/g, 'Mr Truth Agency'); changed = true; }
    if (a.content && a.content.includes('GACODA')) { data.content = a.content.replace(/GACODA/g, 'Mr Truth Agency'); changed = true; }
    if (changed) { await prisma.newsArticle.update({ where: { id: a.id }, data }); fixed++; }
  }
  console.log('Articles updated:', fixed);

  const settings = await prisma.siteSetting.findMany();
  for (const s of settings) {
    if (s.value && s.value.includes('GACODA')) {
      await prisma.siteSetting.update({ where: { id: s.id }, data: { value: s.value.replace(/GACODA/g, 'Mr Truth Agency') } });
      console.log('Setting updated:', s.key);
    }
  }

  const members = await prisma.member.findMany();
  for (const m of members) {
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(m)) {
      if (typeof v === 'string' && v.includes('GACODA')) { data[k] = v.replace(/GACODA/g, 'Mr Truth'); }
    }
    if (Object.keys(data).length) {
      await prisma.member.update({ where: { id: m.id }, data });
      console.log('Member updated:', m.memberNumber, 'fields:', Object.keys(data).join(','));
    }
  }

  const resources = await prisma.resource.findMany();
  for (const r of resources) {
    const data: Record<string, string> = {};
    if (r.title && r.title.includes('GACODA')) { data.title = r.title.replace(/GACODA/g, 'Mr Truth Agency'); }
    if (r.description && r.description.includes('GACODA')) { data.description = r.description.replace(/GACODA/g, 'Mr Truth Agency'); }
    if (Object.keys(data).length) {
      await prisma.resource.update({ where: { id: r.id }, data });
      console.log('Resource updated:', r.id);
    }
  }

  const gallery = await prisma.galleryItem.findMany();
  for (const g of gallery) {
    const data: Record<string, string> = {};
    if (g.title && g.title.includes('GACODA')) { data.title = g.title.replace(/GACODA/g, 'Mr Truth Agency'); }
    if (g.caption && g.caption.includes('GACODA')) { data.caption = g.caption.replace(/GACODA/g, 'Mr Truth Agency'); }
    if (Object.keys(data).length) {
      await prisma.galleryItem.update({ where: { id: g.id }, data });
      console.log('Gallery updated:', g.id);
    }
  }
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
