const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInvestorDocs() {
  const investorId = '613c7f84-9c36-4f13-af86-8ebadb472b75';
  try {
    const docs = await prisma.document.findMany({
      where: { owner_id: investorId }
    });
    console.log(`Found ${docs.length} documents for investor ${investorId}:`);
    docs.forEach(d => {
      console.log(`- ID: ${d.id}`);
      console.log(`  Name: ${d.file_name}`);
      console.log(`  URL: ${d.file_url}`);
      console.log('---');
    });
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkInvestorDocs();
