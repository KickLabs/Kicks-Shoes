import cron from 'node-cron';
import Discount from '../models/Discount.js';
import { updateFlashSaleStatuses } from '../services/flashSale.service.js';
import logger from './logger.js';

// Run every hour
export const startDiscountStatusUpdateCron = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running discount status update cron job...');
      await Discount.updateAllDiscountStatus();
      logger.info('Discount status update completed');
    } catch (error) {
      logger.error('Error updating discount statuses:', error);
    }
  });
};

// Run every minute to check flash sale status
export const startFlashSaleStatusUpdateCron = () => {
  cron.schedule('* * * * *', async () => {
    try {
      logger.info('Running flash sale status update cron job...');
      const result = await updateFlashSaleStatuses();
      
      if (result.upcomingToActive > 0 || result.activeToEnded > 0) {
        logger.info(`Flash sale status update completed: ${result.upcomingToActive} upcoming->active, ${result.activeToEnded} active->ended`);
      }
    } catch (error) {
      logger.error('Error updating flash sale statuses:', error);
    }
  });
}; 