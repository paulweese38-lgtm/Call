import { Notifications } from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserAchievement,
  UserChallenge,
  Reward,
  Competition,
  LeaderboardEntry,
  NotificationPreference
} from '../../types/gamification';

/**
 * Gamification Notification Service
 *
 * Intelligent notification system for gamification events with
 * smart delivery timing, personalization, and engagement optimization.
 *
 * Key Features:
 * - Achievement unlocked notifications
 * - Challenge progress and completion alerts
 * - Streak preservation and celebration
 * - Ranking change notifications
 * - Reward availability alerts
 * - Competition announcements
 * - Smart delivery scheduling
 * - Notification preferences management
 * - Analytics and engagement tracking
 */

export class GamificationNotificationService {
  private notificationPreferences: Map<string, NotificationPreference> = new Map();
  private scheduledNotifications: Map<string, string[]> = new Map();
  private notificationQueue: Map<string, any[]> = new Map();
  private analyticsService: any;

  constructor(analyticsService?: any) {
    this.analyticsService = analyticsService;
    this.initializeNotificationService();
  }

  /**
   * Initialize notification service
   */
  private async initializeNotificationService(): Promise<void> {
    try {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Load notification preferences
      await this.loadNotificationPreferences();

      // Set up notification response handler
      Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse.bind(this));

      console.log('Gamification notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  /**
   * Send achievement unlocked notification
   */
  async sendAchievementUnlocked(userId: string, achievement: UserAchievement): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences.achievements) return;

      const notificationData = {
        content: {
          title: '🏆 Achievement Unlocked!',
          body: achievement.achievementName || 'New achievement unlocked',
          data: {
            type: 'achievement_unlocked',
            achievementId: achievement.achievementId,
            userId,
            points: achievement.points,
            rarity: achievement.rarity,
          },
        },
        trigger: null, // Immediate
        sound: 'achievement.wav',
        badge: 1,
      };

      // Customize notification based on rarity
      this.customizeAchievementNotification(notificationData, achievement);

      await this.sendNotification(userId, notificationData);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('achievement_notification_sent', {
          userId,
          achievementId: achievement.achievementId,
          rarity: achievement.rarity,
        });
      }
    } catch (error) {
      console.error('Failed to send achievement notification:', error);
    }
  }

  /**
   * Send challenge completed notification
   */
  async sendChallengeCompleted(userId: string, challenge: UserChallenge): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences.challenges) return;

      const difficultyEmojis = {
        easy: '⭐',
        medium: '⭐⭐',
        hard: '⭐⭐⭐',
        expert: '⭐⭐⭐⭐',
      };

      const notificationData = {
        content: {
          title: `${difficultyEmojis[challenge.challenge.difficulty]} Challenge Completed!`,
          body: `You've completed "${challenge.challenge.name}"!`,
          data: {
            type: 'challenge_completed',
            challengeId: challenge.id,
            userId,
            difficulty: challenge.challenge.difficulty,
            rewards: challenge.challenge.rewards,
          },
        },
        trigger: null,
        sound: 'challenge_complete.wav',
        badge: 1,
      };

      await this.sendNotification(userId, notificationData);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('challenge_notification_sent', {
          userId,
          challengeId: challenge.id,
          difficulty: challenge.challenge.difficulty,
        });
      }
    } catch (error) {
      console.error('Failed to send challenge notification:', error);
    }
  }

  /**
   * Send streak milestone notification
   */
  async sendStreakMilestone(userId: string, streakData: any): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences.streaks) return;

      const { currentCount, milestone, type } = streakData;

      const messages = {
        daily: ['🔥 Daily streak fire!', '🔥 Keep it going!', '🔥 On a roll!'],
        weekly: ['💪 Weekly warrior!', '💪 Consistency champion!', '💪 Unstoppable!'],
        monthly: ['👑 Monthly master!', '👑 Dedication legend!', '👑 Commitment king!'],
      };

      const messageArray = messages[type] || messages.daily;
      const randomMessage = messageArray[Math.floor(Math.random() * messageArray.length)];

      const notificationData = {
        content: {
          title: randomMessage,
          body: `${currentCount} ${type} streak! You're amazing!`,
          data: {
            type: 'streak_milestone',
            userId,
            streakCount: currentCount,
            streakType: type,
            milestone,
          },
        },
        trigger: null,
        sound: 'streak.wav',
        badge: 1,
      };

      await this.sendNotification(userId, notificationData);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('streak_notification_sent', {
          userId,
          streakCount: currentCount,
          streakType: type,
          milestone,
        });
      }
    } catch (error) {
      console.error('Failed to send streak notification:', error);
    }
  }

  /**
   * Send ranking improvement notification
   */
  async sendRankingImproved(userId: string, rankingData: any, rankChange: number): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences.leaderboards) return;

      const { leaderboardName, newRank } = rankingData;

      let title = '📈 Ranking Improved!';
      let body = `You moved up ${rankChange} positions to #${newRank} in ${leaderboardName}!`;

      // Special messages for significant improvements
      if (rankChange >= 50) {
        title = '🚀 Huge Ranking Jump!';
        body = `Incredible! You climbed ${rankChange} positions to #${newRank}!`;
      } else if (newRank <= 10) {
        title = '🏆 Top 10 Achievement!';
        body = `Amazing! You're now #${newRank} in ${leaderboardName}!`;
      } else if (newRank === 1) {
        title = '👑 You\'re #1!';
        body = `Congratulations! You've reached the top spot in ${leaderboardName}!`;
      }

      const notificationData = {
        content: {
          title,
          body,
          data: {
            type: 'ranking_improved',
            userId,
            leaderboardId: rankingData.leaderboardId,
            newRank,
            rankChange,
          },
        },
        trigger: null,
        sound: 'ranking_up.wav',
        badge: 1,
      };

      await this.sendNotification(userId, notificationData);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('ranking_notification_sent', {
          userId,
          rankChange,
          newRank,
          leaderboardId: rankingData.leaderboardId,
        });
      }
    } catch (error) {
      console.error('Failed to send ranking notification:', error);
    }
  }

  /**
   * Send reward availability notification
   */
  async sendNewRewardAvailability(userId: string, rewards: Reward[]): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences.rewards) return;

      const rewardCount = rewards.length;
      const topReward = rewards[0]; // Most valuable/newest

      const notificationData = {
        content: {
          title: '🎁 New Rewards Available!',
          body: `You have ${rewardCount} new reward${rewardCount > 1 ? 's' : ''} to claim!`,
          data: {
            type: 'new_rewards',
            userId,
            rewardCount,
            topRewardId: topReward.id,
            rewardIds: rewards.map(r => r.id),
          },
        },
        trigger: null,
        sound: 'reward.wav',
        badge: 1,
      };

      await this.sendNotification(userId, notificationData);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('reward_notification_sent', {
          userId,
          rewardCount,
          topRewardId: topReward.id,
        });
      }
    } catch (error) {
      console.error('Failed to send reward notification:', error);
    }
  }

  /**
   * Send competition announced notification
   */
  async sendCompetitionAnnounced(competition: Competition): Promise<void> {
    try {
      const notificationData = {
        content: {
          title: '🏅 New Competition!',
          body: `"${competition.name}" is starting! Join now and compete for amazing prizes!`,
          data: {
            type: 'competition_announced',
            competitionId: competition.id,
            competitionName: competition.name,
            startDate: competition.startDate,
            endDate: competition.endDate,
          },
        },
        trigger: null,
        sound: 'competition.wav',
        badge: 1,
      };

      // This would send to all eligible users
      // For now, just log the notification
      console.log('Competition announced:', competition.name);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('competition_announcement_sent', {
          competitionId: competition.id,
          competitionName: competition.name,
        });
      }
    } catch (error) {
      console.error('Failed to send competition notification:', error);
    }
  }

  /**
   * Send competition joined notification
   */
  async sendCompetitionJoined(userId: string, competition: Competition): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences.competitions) return;

      const notificationData = {
        content: {
          title: '✅ Competition Joined!',
          body: `You've successfully joined "${competition.name}". Good luck!`,
          data: {
            type: 'competition_joined',
            userId,
            competitionId: competition.id,
            competitionName: competition.name,
          },
        },
        trigger: null,
        sound: 'success.wav',
        badge: 1,
      };

      await this.sendNotification(userId, notificationData);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('competition_joined_notification_sent', {
          userId,
          competitionId: competition.id,
        });
      }
    } catch (error) {
      console.error('Failed to send competition joined notification:', error);
    }
  }

  /**
   * Send level up notification
   */
  async sendLevelUp(userId: string, newLevel: number, rewards?: any[]): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences.levelUps) return;

      const notificationData = {
        content: {
          title: '⬆️ Level Up!',
          body: `Congratulations! You've reached level ${newLevel}!`,
          data: {
            type: 'level_up',
            userId,
            newLevel,
            rewards: rewards || [],
          },
        },
        trigger: null,
        sound: 'level_up.wav',
        badge: 1,
      };

      await this.sendNotification(userId, notificationData);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('level_up_notification_sent', {
          userId,
          newLevel,
          rewardsCount: rewards?.length || 0,
        });
      }
    } catch (error) {
      console.error('Failed to send level up notification:', error);
    }
  }

  /**
   * Send points awarded notification
   */
  async sendPointsAwarded(userId: string, points: number, newBalance: number): Promise<void> {
    try {
      // Only send notification for significant point gains
      if (points < 50) return;

      const preferences = await this.getUserPreferences(userId);
      if (!preferences.points) return;

      const notificationData = {
        content: {
          title: '+💰 Points Earned!',
          body: `You earned ${points} points! Total: ${newBalance}`,
          data: {
            type: 'points_awarded',
            userId,
            pointsAwarded: points,
            newBalance,
          },
        },
        trigger: null,
        sound: 'coins.wav',
        badge: 1,
      };

      await this.sendNotification(userId, notificationData);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('points_notification_sent', {
          userId,
          pointsAwarded: points,
          newBalance,
        });
      }
    } catch (error) {
      console.error('Failed to send points notification:', error);
    }
  }

  /**
   * Send streak preservation reminder
   */
  async sendStreakPreservationReminder(userId: string, streakData: any): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences.streakPreservation) return;

      const { currentStreak, hoursUntilReset, streakType } = streakData;

      let urgency = 'reminder';
      if (hoursUntilReset <= 2) urgency = 'urgent';
      if (hoursUntilReset <= 6) urgency = 'warning';

      const messages = {
        reminder: '🔥 Keep your streak going!',
        warning: '⚠️ Your streak is at risk!',
        urgent: '🚨 Your streak will end soon!',
      };

      const notificationData = {
        content: {
          title: messages[urgency],
          body: `${currentStreak} ${streakType} streak ends in ${Math.ceil(hoursUntilReset)} hours!`,
          data: {
            type: 'streak_preservation',
            userId,
            currentStreak,
            hoursUntilReset,
            streakType,
            urgency,
          },
        },
        trigger: null,
        sound: urgency === 'urgent' ? 'alert.wav' : 'reminder.wav',
        badge: 1,
      };

      await this.sendNotification(userId, notificationData);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('streak_preservation_notification_sent', {
          userId,
          currentStreak,
          hoursUntilReset,
          urgency,
        });
      }
    } catch (error) {
      console.error('Failed to send streak preservation reminder:', error);
    }
  }

  /**
   * Schedule daily challenge reminder
   */
  async scheduleDailyChallengeReminder(userId: string): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences.dailyReminders) return;

      // Schedule for 9 AM local time
      const now = new Date();
      const reminderTime = new Date(now);
      reminderTime.setHours(9, 0, 0, 0);

      // If it's already past 9 AM, schedule for tomorrow
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      const notificationData = {
        content: {
          title: '🎯 Daily Challenges Ready!',
          body: 'Your new daily challenges are waiting. Complete them to maintain your streak!',
          data: {
            type: 'daily_challenges_reminder',
            userId,
          },
        },
        trigger: reminderTime,
        sound: 'daily.wav',
        badge: 1,
      };

      await this.scheduleNotification(userId, 'daily_challenges', notificationData);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('daily_challenge_reminder_scheduled', {
          userId,
          scheduledTime: reminderTime,
        });
      }
    } catch (error) {
      console.error('Failed to schedule daily challenge reminder:', error);
    }
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreference>): Promise<void> {
    try {
      const currentPreferences = await this.getUserPreferences(userId);
      const updatedPreferences = { ...currentPreferences, ...preferences };

      this.notificationPreferences.set(userId, updatedPreferences);
      await this.saveNotificationPreferences(userId, updatedPreferences);

      // Reschedule daily reminders if needed
      if (preferences.dailyReminders !== undefined) {
        if (preferences.dailyReminders) {
          await this.scheduleDailyChallengeReminder(userId);
        } else {
          await this.cancelScheduledNotification(userId, 'daily_challenges');
        }
      }

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('notification_preferences_updated', {
          userId,
          updatedPreferences: Object.keys(preferences),
        });
      }
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  }

  /**
   * Send notification
   */
  private async sendNotification(userId: string, notificationData: any): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);

      // Check if notifications are enabled
      if (!preferences.enabled) {
        return;
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        await this.queueNotification(userId, notificationData);
        return;
      }

      // Send immediate notification
      await Notifications.scheduleNotificationAsync({
        content: notificationData.content,
        trigger: notificationData.trigger,
        sound: notificationData.sound,
        badge: notificationData.badge,
      });

      console.log(`Notification sent to user ${userId}:`, notificationData.content.title);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Schedule notification
   */
  private async scheduleNotification(userId: string, category: string, notificationData: any): Promise<void> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: notificationData.content,
        trigger: {
          date: notificationData.trigger,
        },
        sound: notificationData.sound,
        badge: notificationData.badge,
      });

      // Track scheduled notification
      const userScheduledNotifications = this.scheduledNotifications.get(userId) || [];
      userScheduledNotifications.push(identifier);
      this.scheduledNotifications.set(userId, userScheduledNotifications);

      console.log(`Notification scheduled for user ${userId}:`, category);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  /**
   * Cancel scheduled notification
   */
  private async cancelScheduledNotification(userId: string, category: string): Promise<void> {
    try {
      const userScheduledNotifications = this.scheduledNotifications.get(userId) || [];

      for (const identifier of userScheduledNotifications) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      }

      this.scheduledNotifications.set(userId, []);
      console.log(`Scheduled notifications cancelled for user ${userId}:`, category);
    } catch (error) {
      console.error('Failed to cancel scheduled notification:', error);
    }
  }

  /**
   * Queue notification for later delivery
   */
  private async queueNotification(userId: string, notificationData: any): Promise<void> {
    try {
      const userQueue = this.notificationQueue.get(userId) || [];
      userQueue.push({
        ...notificationData,
        queuedAt: new Date(),
      });
      this.notificationQueue.set(userId, userQueue);

      console.log(`Notification queued for user ${userId}:`, notificationData.content.title);
    } catch (error) {
      console.error('Failed to queue notification:', error);
    }
  }

  /**
   * Process queued notifications
   */
  async processQueuedNotifications(userId: string): Promise<void> {
    try {
      const userQueue = this.notificationQueue.get(userId) || [];

      for (const notification of userQueue) {
        await this.sendNotification(userId, notification);
      }

      this.notificationQueue.set(userId, []);
      console.log(`Processed ${userQueue.length} queued notifications for user ${userId}`);
    } catch (error) {
      console.error('Failed to process queued notifications:', error);
    }
  }

  /**
   * Handle notification response
   */
  private async handleNotificationResponse(response: any): Promise<void> {
    try {
      const { notification } = response;
      const data = notification.request.content.data;

      if (!data || !data.userId) return;

      // Track notification interaction
      if (this.analyticsService) {
        this.analyticsService.trackEvent('notification_interaction', {
          userId: data.userId,
          notificationType: data.type,
          action: response.actionIdentifier,
        });
      }

      // Handle specific notification types
      switch (data.type) {
        case 'achievement_unlocked':
          await this.handleAchievementNotificationResponse(data);
          break;
        case 'challenge_completed':
          await this.handleChallengeNotificationResponse(data);
          break;
        case 'reward_available':
          await this.handleRewardNotificationResponse(data);
          break;
        case 'competition_announced':
          await this.handleCompetitionNotificationResponse(data);
          break;
      }
    } catch (error) {
      console.error('Failed to handle notification response:', error);
    }
  }

  /**
   * Handle achievement notification response
   */
  private async handleAchievementNotificationResponse(data: any): Promise<void> {
    // This would navigate to achievement details or celebration screen
    console.log('Achievement notification tapped:', data.achievementId);
  }

  /**
   * Handle challenge notification response
   */
  private async handleChallengeNotificationResponse(data: any): Promise<void> {
    // This would navigate to challenge details
    console.log('Challenge notification tapped:', data.challengeId);
  }

  /**
   * Handle reward notification response
   */
  private async handleRewardNotificationResponse(data: any): Promise<void> {
    // This would navigate to rewards screen
    console.log('Reward notification tapped:', data.rewardId);
  }

  /**
   * Handle competition notification response
   */
  private async handleCompetitionNotificationResponse(data: any): Promise<void> {
    // This would navigate to competition details
    console.log('Competition notification tapped:', data.competitionId);
  }

  /**
   * Customize achievement notification based on rarity
   */
  private customizeAchievementNotification(notificationData: any, achievement: UserAchievement): void {
    switch (achievement.rarity) {
      case 'legendary':
        notificationData.content.title = '👑 LEGENDARY ACHIEVEMENT! 👑';
        notificationData.content.body = achievement.achievementName + ' - You\'re truly exceptional!';
        break;
      case 'epic':
        notificationData.content.title = '💎 EPIC ACHIEVEMENT! 💎';
        notificationData.content.body = achievement.achievementName + ' - Incredible work!';
        break;
      case 'rare':
        notificationData.content.title = '✨ RARE ACHIEVEMENT! ✨';
        notificationData.content.body = achievement.achievementName + ' - Outstanding!';
        break;
    }
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(preferences: NotificationPreference): boolean {
    if (!preferences.quietHoursEnabled) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const { quietHoursStart, quietHoursEnd } = preferences;

    if (quietHoursStart <= quietHoursEnd) {
      // Simple case: e.g., 10 PM to 6 AM next day
      return currentHour >= quietHoursStart || currentHour < quietHoursEnd;
    } else {
      // Complex case: e.g., 10 PM to 6 AM same day (wrap around)
      return currentHour >= quietHoursStart && currentHour < quietHoursEnd;
    }
  }

  /**
   * Get user notification preferences
   */
  private async getUserPreferences(userId: string): Promise<NotificationPreference> {
    let preferences = this.notificationPreferences.get(userId);

    if (!preferences) {
      preferences = await this.loadUserPreferences(userId);
      this.notificationPreferences.set(userId, preferences);
    }

    return preferences;
  }

  /**
   * Load user notification preferences
   */
  private async loadUserPreferences(userId: string): Promise<NotificationPreference> {
    try {
      const stored = await AsyncStorage.getItem(`notification_preferences_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }

    // Return default preferences
    return {
      enabled: true,
      achievements: true,
      challenges: true,
      streaks: true,
      levelUps: true,
      points: true,
      rewards: true,
      competitions: true,
      leaderboards: true,
      dailyReminders: true,
      streakPreservation: true,
      quietHoursEnabled: false,
      quietHoursStart: 22,
      quietHoursEnd: 7,
    };
  }

  /**
   * Load all notification preferences
   */
  private async loadNotificationPreferences(): Promise<void> {
    try {
      // This would load preferences for multiple users if needed
      console.log('Notification preferences loaded');
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  /**
   * Save notification preferences
   */
  private async saveNotificationPreferences(userId: string, preferences: NotificationPreference): Promise<void> {
    try {
      await AsyncStorage.setItem(`notification_preferences_${userId}`, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  /**
   * Get notification analytics
   */
  async getNotificationAnalytics(userId: string): Promise<any> {
    try {
      // This would return analytics about notification engagement
      return {
        totalNotifications: 0,
        openedNotifications: 0,
        clickThroughRate: 0,
        preferredNotificationTypes: [],
        optimalSendTimes: [],
        lastEngagement: null,
      };
    } catch (error) {
      console.error('Failed to get notification analytics:', error);
      return {};
    }
  }

  /**
   * Send personalized engagement notification
   */
  async sendEngagementNotification(userId: string, reason: string, message: string): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences.enabled) return;

      const notificationData = {
        content: {
          title: '💡 We Miss You!',
          body: message,
          data: {
            type: 'engagement',
            userId,
            reason,
          },
        },
        trigger: null,
        sound: 'gentle.wav',
        badge: 1,
      };

      await this.sendNotification(userId, notificationData);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('engagement_notification_sent', {
          userId,
          reason,
        });
      }
    } catch (error) {
      console.error('Failed to send engagement notification:', error);
    }
  }
}