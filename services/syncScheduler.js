const cron = require('node-cron');
const User = require('../models/User');
const SyncJob = require('../models/SyncJob');
const logger = require('../config/logger');
const DataSyncService = require('./dataSyncService');

class SyncScheduler {
  constructor() {
    this.jobs = new Map();
    this.dataSyncService = new DataSyncService();
  }

  // Run every hour at minute 0
  startAutoSync() {
    logger.info('Starting automatic sync scheduler');
    
    cron.schedule('0 * * * *', async () => {
      logger.info('Running scheduled sync for all users');
      await this.syncAllUsers();
    });

    // Also run on startup (after 10 seconds)
    setTimeout(() => this.syncAllUsers(), 10000);
  }

  // Sync last 3 months for a new user
  async sync3MonthsForNewUser(userId) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    logger.info(`Starting 3-month initial sync for new user`, { userId });
    return await this.manualSync(userId, startDate, endDate);
  }

  async syncAllUsers() {
    try {
      const users = await User.find({ isActive: true });
      logger.info(`Found ${users.length} active users to sync`);

      for (const user of users) {
        // For regular sync, only sync last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        await this.syncUserWithDateRange(user, startDate, endDate);
      }
    } catch (error) {
      logger.error('Error in syncAllUsers', { error: error.message });
    }
  }

  async syncUserWithDateRange(user, startDate, endDate) {
    const jobId = `sync_${user._id}_${Date.now()}`;
    
    try {
      logger.info(`Starting sync for user ${user.email}`, { 
        userId: user._id,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      const syncJob = new SyncJob({
        userId: user._id,
        jobId,
        status: 'running',
        startedAt: new Date()
      });
      await syncJob.save();

      const result = await this.dataSyncService.syncUserData(user, startDate, endDate);

      syncJob.status = 'completed';
      syncJob.completedAt = new Date();
      syncJob.recordsSynced = result.recordsSynced;
      syncJob.errors = result.errors;
      await syncJob.save();

      // Update user's lastSyncAt
      user.lastSyncAt = new Date();
      await user.save();

      logger.success(`Sync completed for user ${user.email}`, { 
        userId: user._id, 
        recordsSynced: result.recordsSynced 
      });

    } catch (error) {
      logger.error(`Sync failed for user ${user.email}`, { 
        userId: user._id, 
        error: error.message,
        stack: error.stack
      });

      await SyncJob.findOneAndUpdate(
        { jobId },
        { 
          status: 'failed', 
          completedAt: new Date(),
          errors: [error.message]
        }
      );
    }
  }

  async syncUser(user) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    
    return await this.syncUserWithDateRange(user, startDate, endDate);
  }

  async manualSync(userId, startDate, endDate) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await this.dataSyncService.syncUserData(user, startDate, endDate);
  }
}

module.exports = new SyncScheduler();
