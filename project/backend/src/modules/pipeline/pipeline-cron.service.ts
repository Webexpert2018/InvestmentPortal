import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PipelineService } from './pipeline.service';

@Injectable()
export class PipelineCronService {
  private readonly logger = new Logger(PipelineCronService.name);

  constructor(private readonly pipelineService: PipelineService) {}

  /**
   * Runs every day at 08:00 AM server time.
   * Finds all pipeline notes with today as the scheduled date and fires notifications.
   * Marks each fired note with reminderSentDate so it doesn't fire twice.
   */
  @Cron('0 8 * * *', { timeZone: 'Asia/Kolkata' })
  async handleScheduledNoteReminders() {

    this.logger.log('⏰ Running scheduled note reminder check...');
    try {
      await this.pipelineService.fireScheduledReminders();
      this.logger.log('✅ Scheduled note reminders processed.');
    } catch (err) {
      this.logger.error('❌ Error processing scheduled note reminders:', err);
    }
  }
}
