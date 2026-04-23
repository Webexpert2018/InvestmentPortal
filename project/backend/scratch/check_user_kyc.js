const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserDocs() {
  const email = 'pakofa3393@hacknapp.com';
  try {
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found.`);
      return;
    }
    
    console.log(`✅ Found User: ${user.id} (${user.full_name})`);
    
    const docs = await prisma.document.findMany({
      where: { owner_id: user.id }
    });
    
    console.log(`Found ${docs.length} documents in the database:`);
    docs.forEach(d => {
      console.log(`- Name: ${d.file_name}`);
      console.log(`  Type: ${d.document_type}`);
      console.log(`  URL: ${d.file_url}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserDocs();
