import cron from 'node-cron';
import Discount from '../models/Discount.js';

// Run every hour
export const startDiscountStatusUpdateCron = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running discount status update cron job...');
      await Discount.updateAllDiscountStatus();
      console.log('Discount status update completed');
    } catch (error) {
      console.error('Error updating discount statuses:', error);
    }
  });
}; 