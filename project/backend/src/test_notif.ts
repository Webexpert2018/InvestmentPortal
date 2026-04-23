
import { db } from './config/database';
import { NotificationsService } from './modules/notifications/notifications.service';

async function testNotification() {
  const ns = new NotificationsService();
  try {
    console.log('🚀 Creating test notification...');
    const result = await ns.createNotification({
      targetRole: 'executive_admin',
      title: 'TEST LINK NOTIFICATION',
      type: 'test',
      link: '/dashboard/test-link-works'
    });
    console.log('✅ Created:', result);
    
    const check = await db.query('SELECT link FROM notifications WHERE id = $1', [result[0].id]);
    console.log('📊 Link in DB:', check.rows[0].link);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testNotification();
