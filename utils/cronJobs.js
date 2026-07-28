import cron from 'node-cron';
import { incrementMotherCountRandomly } from '../controllers/statsController.js';

/**
 * Initializes all cron jobs in the system.
 * Job: Increments mother count every day at 12:00 AM midnight (0 0 * * *)
 * Range: 200 to 500 randomly.
 */
export const initCronJobs = () => {
  console.log('[Cron] Initializing daily 12:00 AM mother count increment job...');

  // Schedule for 12:00 AM (Midnight) every day
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running daily 12:00 AM mother count update...');
    try {
      await incrementMotherCountRandomly();
    } catch (error) {
      console.error('[Cron Error] Failed to update mother count:', error);
    }
  });

  console.log('[Cron] Daily 12:00 AM job scheduled successfully.');
};
