import cron from 'node-cron';
import Discount from '../models/Discount.js';
import UserDiscount from '../models/UserDiscount.js';
import Order from '../models/Order.js';
import { updateFlashSaleStatuses } from '../services/flashSale.service.js';
import EmailService from '../services/email.service.js';
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
        logger.info(
          `Flash sale status update completed: ${result.upcomingToActive} upcoming->active, ${result.activeToEnded} active->ended`
        );
      }
    } catch (error) {
      logger.error('Error updating flash sale statuses:', error);
    }
  });
};

// Run daily at midnight to auto-complete delivered orders
export const startAutoCompleteOrdersCron = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('Running auto-complete orders cron job...');
      
      // Find orders that are delivered_pending_confirmation and past their auto-complete due date
      const ordersToComplete = await Order.find({
        status: 'delivered_pending_confirmation',
        autoCompleteDueAt: { $lte: new Date() },
        customerConfirmedAt: null,
      }).populate('user', 'email fullName');

      let completedCount = 0;

      for (const order of ordersToComplete) {
        try {
          // Update order status to completed
          order.status = 'completed';
          order.completedAt = new Date();
          await order.save();

          // Send email notification to customer
          if (order.user && order.user.email) {
            await EmailService.sendOrderAutoCompletedEmail(order.user.email, {
              customerName: order.user.fullName,
              orderNumber: order.orderNumber,
              completedDate: new Date().toLocaleDateString('vi-VN'),
            });
          }

          completedCount++;
          logger.info(`Order ${order.orderNumber} auto-completed`);
        } catch (error) {
          logger.error(`Error auto-completing order ${order._id}:`, error);
        }
      }

      logger.info(`Auto-complete orders cron job completed: ${completedCount} orders completed`);
    } catch (error) {
      logger.error('Error in auto-complete orders cron job:', error);
    }
  });
};

// ✅ Run every hour to update expired user discounts
export const startUserDiscountExpireCheckCron = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running user discount expire check cron job...');
      const now = new Date();
      
      // Find all saved user discounts with expired discount dates
      const expiredUserDiscounts = await UserDiscount.find({
        status: 'saved',
      }).populate('discount');

      let expiredCount = 0;

      for (const userDiscount of expiredUserDiscounts) {
        // Skip if discount is not populated or already expired
        if (!userDiscount.discount) continue;

        // Check if discount has expired
        if (userDiscount.discount.endDate < now) {
          userDiscount.status = 'expired';
          await userDiscount.save();
          expiredCount++;
          logger.info(`UserDiscount ${userDiscount._id} marked as expired (code: ${userDiscount.discount.code})`);
        }
      }

      logger.info(`User discount expire check completed: ${expiredCount} vouchers expired`);
    } catch (error) {
      logger.error('Error in user discount expire check cron job:', error);
    }
  });
};
