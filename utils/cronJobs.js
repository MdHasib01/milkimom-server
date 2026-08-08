import cron from 'node-cron';
import { incrementMotherCountRandomly } from '../controllers/statsController.js';
import { pushPendingSteadfastEntries, syncSteadfastStatuses } from './steadfast.js';
import { reportDeliveredPurchase } from '../controllers/orderController.js';

/**
 * Initializes all cron jobs in the system.
 * Jobs:
 *  - Increments mother count every day at 12:00 AM midnight (0 0 * * *),
 *    range 200 to 500 randomly.
 *  - Steadfast hourly sync: first auto-enters any Confirmed/Shipped order
 *    that has no consignment yet (retries earlier failures — no manual send
 *    exists), then pulls delivery statuses; orders the courier reports
 *    delivered/cancelled are updated automatically, and deliveries are
 *    reported to the Meta Conversions API exactly like a manual update.
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

  // Steadfast hourly sync — entry catch-up first, then delivery statuses.
  // Both workers are no-ops while the integration is disabled in Settings.
  cron.schedule('0 * * * *', async () => {
    try {
      const { attempted, created } = await pushPendingSteadfastEntries();
      if (attempted > 0) {
        console.log(`[Cron] Steadfast entry catch-up: ${created}/${attempted} pending order(s) entered.`);
      }
    } catch (error) {
      console.error('[Cron Error] Steadfast entry catch-up failed:', error);
    }

    try {
      const { synced, updated } = await syncSteadfastStatuses(async (order) => {
        if (!order.metaPurchaseSentAt && order.source !== 'admin') {
          await reportDeliveredPurchase(order);
        }
      });
      if (synced > 0) {
        console.log(`[Cron] Steadfast sync: checked ${synced} order(s), ${updated} status change(s).`);
      }
    } catch (error) {
      console.error('[Cron Error] Steadfast status sync failed:', error);
    }
  });

  console.log('[Cron] Steadfast entry catch-up + status sync scheduled (hourly).');
};
