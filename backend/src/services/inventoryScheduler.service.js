/**
 * @fileoverview Inventory Analysis Scheduler
 * @created 2025-10-28
 * @file inventoryScheduler.service.js
 * @description Automatically run inventory analysis daily
 */

import cron from 'node-cron';
import aiInventoryService from './aiInventory.service.js';
import logger from '../utils/logger.js';
import { getSocketIO } from '../utils/socketIO.js';

class InventoryScheduler {
  constructor() {
    this.task = null;
  }

  /**
   * Start scheduler - runs daily at 8:00 AM
   */
  start() {
    // Cron: Chạy mỗi ngày lúc 8:00 sáng
    // Format: second minute hour day month dayOfWeek
    this.task = cron.schedule('0 0 8 * * *', async () => {
      logger.info('Running scheduled inventory analysis...');

      try {
        const analysis = await aiInventoryService.analyzeAllInventory();

        // Send alerts nếu có vấn đề
        if (analysis.totalIssues > 0) {
          const alerts = await aiInventoryService.sendInventoryAlerts(analysis);

          logger.info(`Inventory analysis complete. Found ${analysis.totalIssues} issues.`);
          logger.info(`Sent ${alerts.length} alerts.`);

          // Broadcast to admin dashboard
          const io = getSocketIO();
          if (io) {
            io.to('admin-room').emit('scheduled_inventory_alert', {
              timestamp: new Date(),
              totalIssues: analysis.totalIssues,
              criticalIssues: analysis.issues.filter(i => i.severity === 'critical').length,
              summary: analysis.aiSummary.overview,
            });
          }
        } else {
          logger.info('Inventory analysis complete. No issues found.');
        }
      } catch (error) {
        logger.error('Error in scheduled inventory analysis:', error);
      }
    });

    logger.info('Inventory scheduler started. Will run daily at 8:00 AM.');
  }

  /**
   * Stop scheduler
   */
  stop() {
    if (this.task) {
      this.task.stop();
      logger.info('Inventory scheduler stopped.');
    }
  }

  /**
   * Run immediately (for testing)
   */
  async runNow() {
    logger.info('Running inventory analysis manually...');

    try {
      const analysis = await aiInventoryService.analyzeAllInventory();

      if (analysis.totalIssues > 0) {
        await aiInventoryService.sendInventoryAlerts(analysis);
      }

      return analysis;
    } catch (error) {
      logger.error('Error running manual inventory analysis:', error);
      throw error;
    }
  }
}

export default new InventoryScheduler();
