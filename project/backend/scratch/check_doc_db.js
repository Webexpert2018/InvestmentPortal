const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDocs() {
  try {
    const docs = await prisma.document.findMany({
      orderBy: { created_at: 'desc' },
      take: 5
    });
    console.log('Last 5 Documents:');
    docs.forEach(d => {
      console.log(`- ID: ${d.id}`);
      console.log(`  Name: ${d.file_name}`);
      console.log(`  URL: ${d.file_url}`);
      console.log(`  Type: ${d.document_type}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocs();
