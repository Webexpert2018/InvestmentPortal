import * as bcrypt from 'bcrypt';

async function run() {
  const password = 'Admin123!';
  const hash = await bcrypt.hash(password, 10);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
}
run();
