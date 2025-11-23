import AsyncStorage from '@react-native-async-storage/async-storage';
import { Challenge, UserChallenge, ChallengeProgress, ChallengeReward, ChallengeTemplate } from '../../types/gamification';

/**
 * Advanced Challenge System
 *
 * Dynamic daily, weekly, and seasonal challenges with adaptive difficulty,
 * personalized recommendations, and collaborative community challenges.
 *
 * Key Features:
 * - Personalized daily and weekly challenges
 * - Seasonal special events
 * - Collaborative community challenges
 * - Adaptive difficulty algorithms
 * - Challenge streak tracking
 * - Multi-step challenge progression
 * - Special bonus challenges
 * - Social challenge sharing
 * - Challenge analytics and insights
 */

export class AdvancedChallengeSystem {
  private availableChallenges: Map<string, Challenge> = new Map();
  private userChallenges: Map<string, UserChallenge[]> = new Map();
  private challengeTemplates: Map<string, ChallengeTemplate> = new Map();
  private challengeHistory: Map<string, ChallengeProgress[]> = new Map();
  private activeEvents: Map<string, any> = new Map();
  private analyticsService: any;
  private notificationService: any;
  private gamificationEngine: any;

  constructor(gamificationEngine?: any, analyticsService?: any, notificationService?: any) {
    this.gamificationEngine = gamificationEngine;
    this.analyticsService = analyticsService;
    this.notificationService = notificationService;
    this.initializeChallengeSystem();
  }

  /**
   * Initialize challenge system
   */
  private async initializeChallengeSystem(): Promise<void> {
    try {
      await this.loadChallengeTemplates();
      await this.loadAvailableChallenges();
      await this.loadActiveEvents();

      // Start challenge generation scheduler
      this.startChallengeScheduler();

      if (this.analyticsService) {
        this.analyticsService.trackEvent('challenge_system_initialized', {
          templates_count: this.challengeTemplates.length,
          active_challenges: this.availableChallenges.size,
          system_version: '2.0.0'
        });
      }
    } catch (error) {
      console.error('Failed to initialize challenge system:', error);
      throw new Error('Challenge system initialization failed');
    }
  }

  /**
   * Get user's current challenges
   */
  async getUserChallenges(userId: string): Promise<UserChallenge[]> {
    const userChallenges = this.userChallenges.get(userId) || [];

    // Refresh challenges if needed
    await this.refreshUserChallenges(userId);

    return userChallenges;
  }

  /**
   * Generate personalized challenges for user
   */
  async generateUserChallenges(userId: string): Promise<UserChallenge[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      const userStats = await this.getUserStats(userId);
      const preferences = await this.getUserChallengePreferences(userId);

      const challenges: UserChallenge[] = [];

      // Generate daily challenges
      const dailyChallenges = await this.generateDailyChallenges(userId, userProfile, userStats, preferences);
      challenges.push(...dailyChallenges);

      // Generate weekly challenges
      const weeklyChallenges = await this.generateWeeklyChallenges(userId, userProfile, userStats, preferences);
      challenges.push(...weeklyChallenges);

      // Generate seasonal challenges if available
      const seasonalChallenges = await this.generateSeasonalChallenges(userId, userProfile, userStats);
      challenges.push(...seasonalChallenges);

      // Generate special event challenges
      const eventChallenges = await this.generateEventChallenges(userId, userProfile, userStats);
      challenges.push(...eventChallenges);

      // Save challenges
      this.userChallenges.set(userId, challenges);
      await this.saveUserChallenges(userId);

      return challenges;
    } catch (error) {
      console.error('Failed to generate user challenges:', error);
      throw new Error(`Challenge generation failed: ${error.message}`);
    }
  }

  /**
   * Generate daily challenges
   */
  private async generateDailyChallenges(
    userId: string,
    userProfile: any,
    userStats: any,
    preferences: any
  ): Promise<UserChallenge[]> {
    const dailyTemplates = Array.from(this.challengeTemplates.values())
      .filter(template => template.frequency === 'daily');

    const challenges: UserChallenge[] = [];
    const challengeCount = this.getDailyChallengeCount(userProfile.level);

    // Select challenges based on user level and preferences
    const selectedTemplates = this.selectChallengeTemplates(
      dailyTemplates,
      challengeCount,
      userProfile,
      userStats,
      preferences
    );

    for (const template of selectedTemplates) {
      const challenge = await this.createChallengeFromTemplate(userId, template, 'daily');
      challenges.push(challenge);
    }

    return challenges;
  }

  /**
   * Generate weekly challenges
   */
  private async generateWeeklyChallenges(
    userId: string,
    userProfile: any,
    userStats: any,
    preferences: any
  ): Promise<UserChallenge[]> {
    const weeklyTemplates = Array.from(this.challengeTemplates.values())
      .filter(template => template.frequency === 'weekly');

    const challenges: UserChallenge[] = [];
    const challengeCount = this.getWeeklyChallengeCount(userProfile.level);

    // Select challenges based on user level and preferences
    const selectedTemplates = this.selectChallengeTemplates(
      weeklyTemplates,
      challengeCount,
      userProfile,
      userStats,
      preferences
    );

    for (const template of selectedTemplates) {
      const challenge = await this.createChallengeFromTemplate(userId, template, 'weekly');
      challenges.push(challenge);
    }

    return challenges;
  }

  /**
   * Generate seasonal challenges
   */
  private async generateSeasonalChallenges(
    userId: string,
    userProfile: any,
    userStats: any
  ): Promise<UserChallenge[]> {
    const seasonalTemplates = Array.from(this.challengeTemplates.values())
      .filter(template => template.frequency === 'seasonal');

    const challenges: UserChallenge[] = [];

    // Check current season
    const currentSeason = this.getCurrentSeason();
    const activeEvents = Array.from(this.activeEvents.values())
      .filter(event => event.season === currentSeason);

    for (const event of activeEvents) {
      const eventChallenges = seasonalTemplates.filter(template =>
        template.eventId === event.id
      );

      for (const template of eventChallenges) {
        const challenge = await this.createChallengeFromTemplate(userId, template, 'seasonal');
        challenge.eventId = event.id;
        challenges.push(challenge);
      }
    }

    return challenges;
  }

  /**
   * Generate event challenges
   */
  private async generateEventChallenges(
    userId: string,
    userProfile: any,
    userStats: any
  ): Promise<UserChallenge[]> {
    const challenges: UserChallenge[] = [];
    const activeEvents = Array.from(this.activeEvents.values())
      .filter(event => event.isActive && new Date() >= event.startDate && new Date() <= event.endDate);

    for (const event of activeEvents) {
      const eventChallenges = event.challenges || [];

      for (const eventChallenge of eventChallenges) {
        const challenge: UserChallenge = {
          id: `event_${userId}_${event.id}_${Date.now()}`,
          userId,
          templateId: eventChallenge.id,
          challenge: {
            id: eventChallenge.id,
            name: eventChallenge.name,
            description: eventChallenge.description,
            type: eventChallenge.type,
            difficulty: eventChallenge.difficulty,
            requirements: eventChallenge.requirements,
            rewards: eventChallenge.rewards,
            timeLimit: eventChallenge.timeLimit,
            icon: eventChallenge.icon,
            category: eventChallenge.category,
            tags: eventChallenge.tags,
            isHidden: eventChallenge.isHidden,
            metadata: {
              eventId: event.id,
              eventName: event.name,
              specialRewards: event.specialRewards
            }
          },
          status: 'active',
          progress: {
            current: 0,
            target: eventChallenge.requirements.target,
            percentageCompleted: 0,
            lastUpdated: new Date()
          },
          startedAt: new Date(),
          completedAt: null,
          rewardsClaimed: false,
          attempts: 1,
          bestScore: 0,
          metadata: {
            eventType: 'special_event',
            priority: 'high'
          }
        };

        challenges.push(challenge);
      }
    }

    return challenges;
  }

  /**
   * Update challenge progress
   */
  async updateChallengeProgress(
    userId: string,
    event: string,
    progressData: any
  ): Promise<UserChallenge[]> {
    try {
      const userChallenges = this.userChallenges.get(userId) || [];
      const updatedChallenges: UserChallenge[] = [];
      const completedChallenges: UserChallenge[] = [];

      for (const challenge of userChallenges) {
        if (challenge.status !== 'active') continue;

        const isRelevant = await this.isChallengeRelevant(challenge, event, progressData);
        if (!isRelevant) continue;

        // Update progress
        const previousProgress = challenge.progress.current;
        const newProgress = await this.calculateChallengeProgress(challenge, event, progressData);

        challenge.progress.current = Math.min(newProgress, challenge.progress.target);
        challenge.progress.percentageCompleted = Math.min(
          (challenge.progress.current / challenge.progress.target) * 100,
          100
        );
        challenge.progress.lastUpdated = new Date();

        // Check if completed
        if (challenge.progress.current >= challenge.progress.target && challenge.status === 'active') {
          challenge.status = 'completed';
          challenge.completedAt = new Date();
          completedChallenges.push(challenge);

          // Send completion notification
          if (this.notificationService) {
            await this.notificationService.sendChallengeCompleted(userId, challenge);
          }

          // Award rewards
          await this.awardChallengeRewards(userId, challenge);

          // Track analytics
          if (this.analyticsService) {
            this.analyticsService.trackEvent('challenge_completed', {
              userId,
              challengeId: challenge.id,
              challengeName: challenge.challenge.name,
              difficulty: challenge.challenge.difficulty,
              completionTime: challenge.completedAt.getTime() - challenge.startedAt.getTime()
            });
          }
        }

        // Update best score
        if (newProgress > challenge.bestScore) {
          challenge.bestScore = newProgress;
        }

        updatedChallenges.push(challenge);
      }

      // Save updated challenges
      if (updatedChallenges.length > 0) {
        await this.saveUserChallenges(userId);
      }

      return completedChallenges;
    } catch (error) {
      console.error('Failed to update challenge progress:', error);
      throw new Error(`Challenge progress update failed: ${error.message}`);
    }
  }

  /**
   * Check if challenge is relevant to event
   */
  private async isChallengeRelevant(challenge: UserChallenge, event: string, progressData: any): Promise<boolean> {
    const { requirements } = challenge.challenge;

    // Check event type
    if (requirements.eventType && requirements.eventType !== event) {
      return false;
    }

    // Check specific conditions
    if (requirements.conditions) {
      return this.evaluateConditions(requirements.conditions, progressData);
    }

    return true;
  }

  /**
   * Calculate challenge progress
   */
  private async calculateChallengeProgress(challenge: UserChallenge, event: string, progressData: any): Promise<number> {
    const { requirements } = challenge.challenge;
    const currentProgress = challenge.progress.current;

    switch (requirements.type) {
      case 'count':
        return currentProgress + 1;

      case 'sum':
        return currentProgress + (progressData.value || 1);

      case 'cumulative':
        return this.calculateCumulativeProgress(challenge, progressData);

      case 'consecutive':
        return this.calculateConsecutiveProgress(challenge, event);

      case 'unique':
        return this.calculateUniqueProgress(challenge, progressData);

      case 'time_based':
        return this.calculateTimeBasedProgress(challenge, progressData);

      default:
        return currentProgress + 1;
    }
  }

  /**
   * Calculate cumulative progress
   */
  private calculateCumulativeProgress(challenge: UserChallenge, progressData: any): number {
    // This would track cumulative values over time
    // For now, treat as simple increment
    return challenge.progress.current + (progressData.value || 1);
  }

  /**
   * Calculate consecutive progress
   */
  private calculateConsecutiveProgress(challenge: UserChallenge, event: string): number {
    // This would track consecutive days/events
    // For now, treat as simple increment
    return challenge.progress.current + 1;
  }

  /**
   * Calculate unique progress
   */
  private calculateUniqueProgress(challenge: UserChallenge, progressData: any): number {
    // This would track unique items/entities
    // For now, treat as simple increment
    return challenge.progress.current + 1;
  }

  /**
   * Calculate time-based progress
   */
  private calculateTimeBasedProgress(challenge: UserChallenge, progressData: any): number {
    // This would track time-based achievements
    // For now, treat as simple increment
    return challenge.progress.current + 1;
  }

  /**
   * Award challenge rewards
   */
  private async awardChallengeRewards(userId: string, challenge: UserChallenge): Promise<void> {
    try {
      const rewards = challenge.challenge.rewards;

      for (const reward of rewards) {
        switch (reward.type) {
          case 'points':
            if (this.gamificationEngine) {
              await this.gamificationEngine.awardPoints(
                userId,
                reward.amount,
                `Challenge completed: ${challenge.challenge.name}`,
                'challenge'
              );
            }
            break;

          case 'achievement':
            if (this.gamificationEngine) {
              await this.gamificationEngine.processGameEvent(userId, {
                type: 'challenge_completed',
                value: challenge.challenge.id,
                metadata: {
                  challengeName: challenge.challenge.name,
                  difficulty: challenge.challenge.difficulty
                }
              });
            }
            break;

          case 'badge':
            // Award badge through UserProfileService
            break;

          case 'reward_item':
            // Award item through RewardSystem
            break;
        }
      }
    } catch (error) {
      console.error('Failed to award challenge rewards:', error);
    }
  }

  /**
   * Claim challenge rewards
   */
  async claimChallengeRewards(userId: string, challengeId: string): Promise<boolean> {
    try {
      const userChallenges = this.userChallenges.get(userId) || [];
      const challenge = userChallenges.find(c => c.id === challengeId);

      if (!challenge || challenge.status !== 'completed' || challenge.rewardsClaimed) {
        return false;
      }

      // Mark rewards as claimed
      challenge.rewardsClaimed = true;
      await this.saveUserChallenges(userId);

      // Send notification
      if (this.notificationService) {
        await this.notificationService.sendChallengeRewardsClaimed(userId, challenge);
      }

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('challenge_rewards_claimed', {
          userId,
          challengeId,
          challengeName: challenge.challenge.name
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to claim challenge rewards:', error);
      return false;
    }
  }

  /**
   * Get challenge recommendations for user
   */
  async getChallengeRecommendations(userId: string): Promise<ChallengeTemplate[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      const userStats = await this.getUserStats(userId);
      const completedChallenges = await this.getCompletedChallenges(userId);

      // Analyze user preferences
      const preferences = this.analyzeChallengePreferences(completedChallenges);

      // Get suitable templates
      const allTemplates = Array.from(this.challengeTemplates.values());
      const suitableTemplates = allTemplates.filter(template => {
        // Check level requirement
        if (template.requirements?.minimumLevel && userProfile.level < template.requirements.minimumLevel) {
          return false;
        }

        // Check if user hasn't completed similar challenges recently
        const recentlyCompleted = completedChallenges.filter(c =>
          c.challenge.category === template.category &&
          c.completedAt &&
          (Date.now() - c.completedAt.getTime()) < 7 * 24 * 60 * 60 * 1000 // 7 days
        );

        return recentlyCompleted.length < 2;
      });

      // Score and rank templates
      const scoredTemplates = suitableTemplates.map(template => {
        let score = 0;

        // Category preference score
        if (preferences[template.category]) {
          score += preferences[template.category] * 20;
        }

        // Difficulty appropriateness
        const difficultyScore = this.calculateDifficultyScore(template.difficulty, userProfile.level);
        score += difficultyScore * 15;

        // Completion bonus
        if (template.rewards.some(r => r.type === 'achievement')) {
          score += 10;
        }

        return { template, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.template);

      return scoredTemplates;
    } catch (error) {
      console.error('Failed to get challenge recommendations:', error);
      return [];
    }
  }

  /**
   * Create collaborative community challenge
   */
  async createCommunityChallenge(
    name: string,
    description: string,
    targetValue: number,
    deadline: Date,
    rewards: ChallengeReward[]
  ): Promise<Challenge> {
    try {
      const challenge: Challenge = {
        id: `community_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        type: 'community',
        difficulty: 'medium',
        requirements: {
          type: 'community',
          target: targetValue,
          eventType: 'community_progress'
        },
        rewards,
        timeLimit: {
          type: 'deadline',
          value: deadline
        },
        icon: 'account-group',
        category: 'community',
        tags: ['community', 'collaborative'],
        isHidden: false,
        metadata: {
          currentProgress: 0,
          participantCount: 0,
          isCollaborative: true
        }
      };

      this.availableChallenges.set(challenge.id, challenge);
      await this.saveAvailableChallenges();

      // Announce community challenge
      if (this.notificationService) {
        await this.notificationService.sendCommunityChallengeAnnounced(challenge);
      }

      return challenge;
    } catch (error) {
      console.error('Failed to create community challenge:', error);
      throw new Error(`Community challenge creation failed: ${error.message}`);
    }
  }

  /**
   * Update community challenge progress
   */
  async updateCommunityChallengeProgress(challengeId: string, contribution: number, userId?: string): Promise<void> {
    try {
      const challenge = this.availableChallenges.get(challengeId);
      if (!challenge || challenge.type !== 'community') {
        throw new Error('Community challenge not found');
      }

      challenge.metadata.currentProgress = (challenge.metadata.currentProgress || 0) + contribution;

      // Update participant count if user provided
      if (userId && !challenge.metadata.participants?.includes(userId)) {
        challenge.metadata.participants = challenge.metadata.participants || [];
        challenge.metadata.participants.push(userId);
        challenge.metadata.participantCount = challenge.metadata.participants.length;
      }

      await this.saveAvailableChallenges();

      // Check if challenge is completed
      if (challenge.metadata.currentProgress >= challenge.requirements.target) {
        await this.completeCommunityChallenge(challenge);
      }

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('community_challenge_progress', {
          challengeId,
          contribution,
          currentProgress: challenge.metadata.currentProgress,
          target: challenge.requirements.target,
          participantCount: challenge.metadata.participantCount
        });
      }
    } catch (error) {
      console.error('Failed to update community challenge progress:', error);
    }
  }

  /**
   * Complete community challenge
   */
  private async completeCommunityChallenge(challenge: Challenge): Promise<void> {
    try {
      // Award rewards to all participants
      const participants = challenge.metadata.participants || [];

      for (const participantId of participants) {
        await this.awardChallengeRewards(participantId, {
          id: challenge.id,
          challenge,
          status: 'completed',
          progress: {
            current: challenge.metadata.currentProgress,
            target: challenge.requirements.target,
            percentageCompleted: 100,
            lastUpdated: new Date()
          },
          startedAt: new Date(),
          completedAt: new Date(),
          rewardsClaimed: false,
          attempts: 1,
          bestScore: challenge.metadata.currentProgress,
          metadata: {}
        });
      }

      // Send celebration notification
      if (this.notificationService) {
        await this.notificationService.sendCommunityChallengeCompleted(challenge);
      }

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('community_challenge_completed', {
          challengeId: challenge.id,
          participantCount: participants.length,
          finalProgress: challenge.metadata.currentProgress
        });
      }
    } catch (error) {
      console.error('Failed to complete community challenge:', error);
    }
  }

  /**
   * Helper methods
   */
  private getDailyChallengeCount(userLevel: number): number {
    if (userLevel <= 5) return 2;
    if (userLevel <= 10) return 3;
    if (userLevel <= 25) return 4;
    return 5;
  }

  private getWeeklyChallengeCount(userLevel: number): number {
    if (userLevel <= 5) return 1;
    if (userLevel <= 10) return 2;
    if (userLevel <= 25) return 3;
    return 4;
  }

  private selectChallengeTemplates(
    templates: ChallengeTemplate[],
    count: number,
    userProfile: any,
    userStats: any,
    preferences: any
  ): ChallengeTemplate[] {
    // Filter suitable templates
    const suitableTemplates = templates.filter(template => {
      if (template.requirements?.minimumLevel && userProfile.level < template.requirements.minimumLevel) {
        return false;
      }
      return true;
    });

    // Score templates
    const scoredTemplates = suitableTemplates.map(template => {
      let score = Math.random() * 10; // Base randomness

      // Category preference
      if (preferences.favoriteCategories?.includes(template.category)) {
        score += 20;
      }

      // Difficulty appropriateness
      score += this.calculateDifficultyScore(template.difficulty, userProfile.level) * 10;

      return { template, score };
    });

    // Sort and select top templates
    scoredTemplates.sort((a, b) => b.score - a.score);
    return scoredTemplates.slice(0, count).map(item => item.template);
  }

  private calculateDifficultyScore(difficulty: string, userLevel: number): number {
    const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2, expert: 3 };
    const multiplier = difficultyMultiplier[difficulty] || 1;

    // Adjust based on user level
    if (userLevel <= 10 && difficulty === 'easy') return 1;
    if (userLevel <= 25 && difficulty === 'medium') return 1;
    if (userLevel <= 50 && difficulty === 'hard') return 1;
    if (userLevel > 50 && difficulty === 'expert') return 1;

    return Math.max(0, 1 - Math.abs(userLevel / 50 - multiplier) * 0.5);
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private evaluateConditions(conditions: any, progressData: any): boolean {
    // This would evaluate complex conditions
    // For now, return true
    return true;
  }

  private analyzeChallengePreferences(completedChallenges: UserChallenge[]): any {
    const preferences: any = {
      favoriteCategories: {},
      averageDifficulty: 'medium'
    };

    completedChallenges.forEach(challenge => {
      const category = challenge.challenge.category;
      preferences.favoriteCategories[category] = (preferences.favoriteCategories[category] || 0) + 1;
    });

    return preferences;
  }

  private async refreshUserChallenges(userId: string): Promise<void> {
    const userChallenges = this.userChallenges.get(userId) || [];
    const now = new Date();

    // Check if daily challenges need refresh
    const hasDailyChallenges = userChallenges.some(c => c.challenge.metadata?.frequency === 'daily');
    const lastDailyRefresh = await this.getLastRefreshTime(userId, 'daily');

    if (!hasDailyChallenges || this.shouldRefresh('daily', lastDailyRefresh, now)) {
      await this.generateDailyChallenges(userId, await this.getUserProfile(userId), await this.getUserStats(userId), {});
      await this.setLastRefreshTime(userId, 'daily', now);
    }

    // Check if weekly challenges need refresh
    const hasWeeklyChallenges = userChallenges.some(c => c.challenge.metadata?.frequency === 'weekly');
    const lastWeeklyRefresh = await this.getLastRefreshTime(userId, 'weekly');

    if (!hasWeeklyChallenges || this.shouldRefresh('weekly', lastWeeklyRefresh, now)) {
      await this.generateWeeklyChallenges(userId, await this.getUserProfile(userId), await this.getUserStats(userId), {});
      await this.setLastRefreshTime(userId, 'weekly', now);
    }
  }

  private shouldRefresh(frequency: string, lastRefresh: Date | null, now: Date): boolean {
    if (!lastRefresh) return true;

    const hoursDiff = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);

    if (frequency === 'daily') return hoursDiff >= 24;
    if (frequency === 'weekly') return hoursDiff >= 168; // 7 days

    return false;
  }

  private async createChallengeFromTemplate(
    userId: string,
    template: ChallengeTemplate,
    frequency: string
  ): Promise<UserChallenge> {
    return {
      id: `${userId}_${template.id}_${Date.now()}`,
      userId,
      templateId: template.id,
      challenge: {
        id: template.id,
        name: template.name,
        description: template.description,
        type: template.type,
        difficulty: template.difficulty,
        requirements: template.requirements,
        rewards: template.rewards,
        timeLimit: template.timeLimit,
        icon: template.icon,
        category: template.category,
        tags: template.tags,
        isHidden: template.isHidden,
        metadata: {
          ...template.metadata,
          frequency,
          generatedAt: new Date()
        }
      },
      status: 'active',
      progress: {
        current: 0,
        target: template.requirements.target,
        percentageCompleted: 0,
        lastUpdated: new Date()
      },
      startedAt: new Date(),
      completedAt: null,
      rewardsClaimed: false,
      attempts: 1,
      bestScore: 0,
      metadata: {}
    };
  }

  private startChallengeScheduler(): void {
    // Refresh daily challenges at midnight
    setInterval(async () => {
      await this.refreshAllDailyChallenges();
    }, 24 * 60 * 60 * 1000);

    // Refresh weekly challenges on Monday
    setInterval(async () => {
      const now = new Date();
      if (now.getDay() === 1 && now.getHours() === 0) {
        await this.refreshAllWeeklyChallenges();
      }
    }, 60 * 60 * 1000);
  }

  private async refreshAllDailyChallenges(): Promise<void> {
    console.log('Refreshing all daily challenges');
    // Implementation would refresh daily challenges for all active users
  }

  private async refreshAllWeeklyChallenges(): Promise<void> {
    console.log('Refreshing all weekly challenges');
    // Implementation would refresh weekly challenges for all active users
  }

  // Mock implementations
  private async getUserProfile(userId: string): Promise<any> {
    return { level: 1, displayName: `User ${userId.slice(-6)}` };
  }

  private async getUserStats(userId: string): Promise<any> {
    return { callsAnalyzed: 0, achievements: 0 };
  }

  private async getUserChallengePreferences(userId: string): Promise<any> {
    return { favoriteCategories: [] };
  }

  private async getCompletedChallenges(userId: string): Promise<UserChallenge[]> {
    const userChallenges = this.userChallenges.get(userId) || [];
    return userChallenges.filter(c => c.status === 'completed');
  }

  private async getLastRefreshTime(userId: string, frequency: string): Promise<Date | null> {
    try {
      const stored = await AsyncStorage.getItem(`challenge_refresh_${userId}_${frequency}`);
      return stored ? new Date(stored) : null;
    } catch (error) {
      return null;
    }
  }

  private async setLastRefreshTime(userId: string, frequency: string, time: Date): Promise<void> {
    try {
      await AsyncStorage.setItem(`challenge_refresh_${userId}_${frequency}`, time.toISOString());
    } catch (error) {
      console.error('Failed to save refresh time:', error);
    }
  }

  /**
   * Save methods
   */
  private async saveUserChallenges(userId: string): Promise<void> {
    try {
      const challenges = this.userChallenges.get(userId) || [];
      await AsyncStorage.setItem(`user_challenges_${userId}`, JSON.stringify(challenges));
    } catch (error) {
      console.error('Failed to save user challenges:', error);
    }
  }

  private async saveAvailableChallenges(): Promise<void> {
    try {
      const challenges = Array.from(this.availableChallenges.values());
      await AsyncStorage.setItem('available_challenges', JSON.stringify(challenges));
    } catch (error) {
      console.error('Failed to save available challenges:', error);
    }
  }

  /**
   * Load challenge templates
   */
  private async loadChallengeTemplates(): Promise<void> {
    try {
      const storedTemplates = await AsyncStorage.getItem('challenge_templates');
      if (storedTemplates) {
        const templates: ChallengeTemplate[] = JSON.parse(storedTemplates);
        templates.forEach(template => {
          this.challengeTemplates.set(template.id, template);
        });
      } else {
        await this.loadDefaultChallengeTemplates();
      }
    } catch (error) {
      console.error('Failed to load challenge templates:', error);
      await this.loadDefaultChallengeTemplates();
    }
  }

  /**
   * Load default challenge templates
   */
  private async loadDefaultChallengeTemplates(): Promise<void> {
    const defaultTemplates: ChallengeTemplate[] = [
      // Daily Consumer Protection Challenges
      {
        id: 'daily_call_analyzer',
        name: 'Daily Call Analyzer',
        description: 'Analyze 3 phone calls for potential consumer protection violations',
        type: 'daily',
        difficulty: 'easy',
        frequency: 'daily',
        requirements: {
          type: 'count',
          target: 3,
          eventType: 'call_analyzed'
        },
        rewards: [
          { type: 'points', amount: 50, description: '50 points' },
          { type: 'achievement', description: 'Call Analyst badge progress' }
        ],
        timeLimit: {
          type: 'daily',
          value: 1
        },
        icon: 'phone-outline',
        category: 'consumer_protection',
        tags: ['calls', 'analysis', 'daily'],
        isHidden: false,
        metadata: {
          category: 'consumer_protection',
          difficulty_rating: 1,
          avg_completion_time: 15
        }
      },
      {
        id: 'daily_violation_hunter',
        name: 'Daily Violation Hunter',
        description: 'Identify 2 consumer protection violations in analyzed calls',
        type: 'daily',
        difficulty: 'medium',
        frequency: 'daily',
        requirements: {
          type: 'count',
          target: 2,
          eventType: 'violation_detected'
        },
        rewards: [
          { type: 'points', amount: 75, description: '75 points' },
          { type: 'achievement', description: 'Violation Hunter progress' }
        ],
        timeLimit: {
          type: 'daily',
          value: 1
        },
        icon: 'shield-search',
        category: 'consumer_protection',
        tags: ['violations', 'detection', 'daily'],
        isHidden: false,
        metadata: {
          category: 'consumer_protection',
          difficulty_rating: 2,
          avg_completion_time: 20
        }
      },
      // Weekly Consumer Protection Challenges
      {
        id: 'weekly_consumer_researcher',
        name: 'Weekly Consumer Researcher',
        description: 'Use the legal research system 10 times to understand your rights',
        type: 'weekly',
        difficulty: 'medium',
        frequency: 'weekly',
        requirements: {
          type: 'count',
          target: 10,
          eventType: 'legal_research'
        },
        rewards: [
          { type: 'points', amount: 200, description: '200 points' },
          { type: 'badge', description: 'Legal Researcher badge' }
        ],
        timeLimit: {
          type: 'weekly',
          value: 1
        },
        icon: 'book-open-page-variant',
        category: 'education',
        tags: ['research', 'legal', 'education'],
        isHidden: false,
        metadata: {
          category: 'education',
          difficulty_rating: 2,
          avg_completion_time: 45
        }
      },
      {
        id: 'weekly_deadline_tracker',
        name: 'Weekly Deadline Tracker',
        description: 'Track and meet 5 legal deadlines without missing any',
        type: 'weekly',
        difficulty: 'hard',
        frequency: 'weekly',
        requirements: {
          type: 'count',
          target: 5,
          eventType: 'deadline_met'
        },
        rewards: [
          { type: 'points', amount: 300, description: '300 points' },
          { type: 'achievement', description: 'Deadline Master progress' }
        ],
        timeLimit: {
          type: 'weekly',
          value: 1
        },
        icon: 'calendar-check',
        category: 'legal_tools',
        tags: ['deadlines', 'organization', 'weekly'],
        isHidden: false,
        metadata: {
          category: 'legal_tools',
          difficulty_rating: 3,
          avg_completion_time: 60
        }
      },
      // Seasonal Special Challenges
      {
        id: 'seasonal_tax_protection',
        name: 'Tax Season Protector',
        description: 'Help 10 users identify and report tax-related consumer fraud',
        type: 'seasonal',
        difficulty: 'expert',
        frequency: 'seasonal',
        requirements: {
          type: 'count',
          target: 10,
          eventType: 'tax_fraud_helped'
        },
        rewards: [
          { type: 'points', amount: 1000, description: '1000 points' },
          { type: 'badge', description: 'Tax Protector badge' },
          { type: 'reward_item', description: 'Legal consultation discount' }
        ],
        timeLimit: {
          type: 'seasonal',
          value: 1
        },
        icon: 'file-document-outline',
        category: 'seasonal',
        tags: ['tax', 'fraud', 'seasonal'],
        isHidden: false,
        metadata: {
          category: 'seasonal',
          difficulty_rating: 4,
          avg_completion_time: 120,
          season: 'spring'
        }
      },
      // Community Challenges
      {
        id: 'community_protector',
        name: 'Community Protector',
        description: 'Work together to analyze 1000 calls for consumer protection violations',
        type: 'community',
        difficulty: 'medium',
        frequency: 'community',
        requirements: {
          type: 'community',
          target: 1000,
          eventType: 'call_analyzed'
        },
        rewards: [
          { type: 'points', amount: 500, description: '500 points for all participants' },
          { type: 'badge', description: 'Community Protector badge' }
        ],
        timeLimit: {
          type: 'deadline',
          value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
        },
        icon: 'account-group',
        category: 'community',
        tags: ['community', 'collaborative', 'social'],
        isHidden: false,
        metadata: {
          category: 'community',
          difficulty_rating: 2,
          avg_completion_time: 0,
          isCollaborative: true
        }
      }
    ];

    defaultTemplates.forEach(template => {
      this.challengeTemplates.set(template.id, template);
    });

    await this.saveChallengeTemplates();
  }

  private async saveChallengeTemplates(): Promise<void> {
    try {
      const templates = Array.from(this.challengeTemplates.values());
      await AsyncStorage.setItem('challenge_templates', JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save challenge templates:', error);
    }
  }

  /**
   * Load available challenges
   */
  private async loadAvailableChallenges(): Promise<void> {
    try {
      const storedChallenges = await AsyncStorage.getItem('available_challenges');
      if (storedChallenges) {
        const challenges: Challenge[] = JSON.parse(storedChallenges);
        challenges.forEach(challenge => {
          this.availableChallenges.set(challenge.id, challenge);
        });
      }
    } catch (error) {
      console.error('Failed to load available challenges:', error);
    }
  }

  /**
   * Load active events
   */
  private async loadActiveEvents(): Promise<void> {
    try {
      const storedEvents = await AsyncStorage.getItem('active_events');
      if (storedEvents) {
        const events: any[] = JSON.parse(storedEvents);
        events.forEach(event => {
          this.activeEvents.set(event.id, event);
        });
      }
    } catch (error) {
      console.error('Failed to load active events:', error);
    }
  }
}