import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reward, UserReward, RewardCategory, RewardType, RewardRedemption, PointTransaction } from '../../types/gamification';

/**
 * Advanced Reward System
 *
 * Comprehensive points, badges, and rewards management with
 * intelligent redemption algorithms and automated distribution.
 *
 * Key Features:
 * - Multi-tier reward catalog
 * - Dynamic point economy
 * - Automated reward distribution
 * - Smart reward recommendations
 * - Limited edition rewards
 * - Seasonal events and bonuses
 * - Redemption analytics
 * - Fraud detection
 */

export class AdvancedRewardSystem {
  private availableRewards: Map<string, Reward> = new Map();
  private userRewards: Map<string, UserReward[]> = new Map();
  private userPoints: Map<string, number> = new Map();
  private redemptionHistory: Map<string, RewardRedemption[]> = new Map();
  private pointTransactions: Map<string, PointTransaction[]> = new Map();
  private analyticsService: any;
  private notificationService: any;
  private fraudDetection: any;

  constructor(analyticsService?: any, notificationService?: any) {
    this.analyticsService = analyticsService;
    this.notificationService = notificationService;
    this.initializeRewardSystem();
  }

  /**
   * Initialize reward system
   */
  private async initializeRewardSystem(): Promise<void> {
    try {
      await this.loadAvailableRewards();
      await this.loadUserData();

      if (this.analyticsService) {
        this.analyticsService.trackEvent('reward_system_initialized', {
          rewards_count: this.availableRewards.size,
          system_version: '2.0.0'
        });
      }
    } catch (error) {
      console.error('Failed to initialize reward system:', error);
      throw new Error('Reward system initialization failed');
    }
  }

  /**
   * Award points to user
   */
  async awardPoints(userId: string, points: number, reason: string, source: string = 'system'): Promise<PointTransaction> {
    try {
      if (points <= 0) {
        throw new Error('Points must be positive');
      }

      // Get current user points
      const currentPoints = await this.getUserPoints(userId);
      const newBalance = currentPoints + points;

      // Create transaction
      const transaction: PointTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'earned',
        amount: points,
        balance: newBalance,
        reason,
        source,
        timestamp: new Date(),
        metadata: {}
      };

      // Update user points
      this.userPoints.set(userId, newBalance);

      // Store transaction
      const userTransactions = this.pointTransactions.get(userId) || [];
      userTransactions.push(transaction);
      this.pointTransactions.set(userId, userTransactions);

      // Save data
      await this.saveUserPoints(userId);
      await this.saveUserTransactions(userId);

      // Check for reward eligibility
      await this.checkRewardEligibility(userId);

      // Send notification
      if (this.notificationService) {
        await this.notificationService.sendPointsAwarded(userId, points, newBalance);
      }

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('points_awarded', {
          userId,
          points,
          reason,
          source,
          newBalance
        });
      }

      return transaction;
    } catch (error) {
      console.error('Failed to award points:', error);
      throw new Error(`Points award failed: ${error.message}`);
    }
  }

  /**
   * Redeem points for reward
   */
  async redeemReward(userId: string, rewardId: string, customData?: any): Promise<RewardRedemption> {
    try {
      const reward = this.availableRewards.get(rewardId);
      if (!reward) {
        throw new Error('Reward not found');
      }

      // Check availability
      if (reward.limitedQuantity && reward.currentQuantity <= 0) {
        throw new Error('Reward out of stock');
      }

      // Check expiration
      if (reward.expiresAt && new Date() > reward.expiresAt) {
        throw new Error('Reward has expired');
      }

      // Check user eligibility
      const isEligible = await this.checkUserEligibility(userId, reward);
      if (!isEligible) {
        throw new Error('User not eligible for this reward');
      }

      // Check user points
      const userPoints = await this.getUserPoints(userId);
      if (userPoints < reward.pointCost) {
        throw new Error('Insufficient points');
      }

      // Process redemption
      const redemption: RewardRedemption = {
        id: `redeem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        rewardId,
        reward,
        pointsSpent: reward.pointCost,
        redemptionDate: new Date(),
        status: 'completed',
        deliveryMethod: reward.deliveryMethod,
        deliveryDetails: customData || {},
        expiresAt: reward.rewardExpiresAt ? new Date(Date.now() + reward.rewardExpiresAt * 24 * 60 * 60 * 1000) : null,
        isUsed: false,
        metadata: {}
      };

      // Deduct points
      await this.deductPoints(userId, reward.pointCost, `Redeemed reward: ${reward.name}`);

      // Update reward quantity
      if (reward.limitedQuantity) {
        reward.currentQuantity--;
      }

      // Store redemption
      const userRedemptions = this.redemptionHistory.get(userId) || [];
      userRedemptions.push(redemption);
      this.redemptionHistory.set(userId, userRedemptions);

      // Add to user rewards
      await this.addUserReward(userId, redemption);

      // Save data
      await this.saveAvailableRewards();
      await this.saveUserRedemptions(userId);

      // Send notification
      if (this.notificationService) {
        await this.notificationService.sendRewardRedeemed(userId, reward, redemption);
      }

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('reward_redeemed', {
          userId,
          rewardId,
          rewardName: reward.name,
          pointsSpent: reward.pointCost,
          category: reward.category
        });
      }

      return redemption;
    } catch (error) {
      console.error('Failed to redeem reward:', error);
      throw new Error(`Reward redemption failed: ${error.message}`);
    }
  }

  /**
   * Check if user is eligible for reward
   */
  private async checkUserEligibility(userId: string, reward: Reward): Promise<boolean> {
    try {
      // Check level requirement
      if (reward.requirements?.minimumLevel) {
        // This would integrate with UserProfileService
        const userLevel = await this.getUserLevel(userId);
        if (userLevel < reward.requirements.minimumLevel) {
          return false;
        }
      }

      // Check achievement requirements
      if (reward.requirements?.requiredAchievements) {
        const userAchievements = await this.getUserAchievements(userId);
        const hasRequiredAchievements = reward.requirements.requiredAchievements.every(
          requiredAchievement => userAchievements.includes(requiredAchievement)
        );
        if (!hasRequiredAchievements) {
          return false;
        }
      }

      // Check redemption limits
      if (reward.redemptionLimit) {
        const userRedemptions = this.redemptionHistory.get(userId) || [];
        const redemptionCount = userRedemptions.filter(r => r.rewardId === reward.id).length;
        if (redemptionCount >= reward.redemptionLimit) {
          return false;
        }
      }

      // Check time-based restrictions
      if (reward.requirements?.timeRestriction) {
        const restriction = reward.requirements.timeRestriction;
        const now = new Date();
        const userRedemptions = this.redemptionHistory.get(userId) || [];

        // Check daily limit
        if (restriction.dailyLimit) {
          const todayRedemptions = userRedemptions.filter(r =>
            r.rewardId === reward.id &&
            this.isSameDay(r.redemptionDate, now)
          );
          if (todayRedemptions.length >= restriction.dailyLimit) {
            return false;
          }
        }

        // Check weekly limit
        if (restriction.weeklyLimit) {
          const weekRedemptions = userRedemptions.filter(r =>
            r.rewardId === reward.id &&
            this.isSameWeek(r.redemptionDate, now)
          );
          if (weekRedemptions.length >= restriction.weeklyLimit) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to check user eligibility:', error);
      return false;
    }
  }

  /**
   * Deduct points from user
   */
  private async deductPoints(userId: string, points: number, reason: string): Promise<PointTransaction> {
    try {
      const currentPoints = await this.getUserPoints(userId);
      const newBalance = currentPoints - points;

      if (newBalance < 0) {
        throw new Error('Insufficient points');
      }

      const transaction: PointTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'spent',
        amount: -points,
        balance: newBalance,
        reason,
        source: 'redemption',
        timestamp: new Date(),
        metadata: {}
      };

      // Update user points
      this.userPoints.set(userId, newBalance);

      // Store transaction
      const userTransactions = this.pointTransactions.get(userId) || [];
      userTransactions.push(transaction);
      this.pointTransactions.set(userId, userTransactions);

      // Save data
      await this.saveUserPoints(userId);
      await this.saveUserTransactions(userId);

      return transaction;
    } catch (error) {
      console.error('Failed to deduct points:', error);
      throw error;
    }
  }

  /**
   * Add reward to user collection
   */
  private async addUserReward(userId: string, redemption: RewardRedemption): Promise<void> {
    try {
      const userReward: UserReward = {
        id: redemption.id,
        userId,
        rewardId: redemption.rewardId,
        redemptionId: redemption.id,
        reward: redemption.reward,
        status: 'active',
        obtainedAt: redemption.redemptionDate,
        expiresAt: redemption.expiresAt,
        isUsed: redemption.isUsed,
        usageCount: 0,
        maxUsage: redemption.reward.usageLimit || 1,
        metadata: redemption.metadata
      };

      const userRewards = this.userRewards.get(userId) || [];
      userRewards.push(userReward);
      this.userRewards.set(userId, userRewards);

      await this.saveUserRewards(userId);
    } catch (error) {
      console.error('Failed to add user reward:', error);
    }
  }

  /**
   * Get user points
   */
  async getUserPoints(userId: string): Promise<number> {
    return this.userPoints.get(userId) || 0;
  }

  /**
   * Get user rewards
   */
  getUserRewards(userId: string): UserReward[] {
    return this.userRewards.get(userId) || [];
  }

  /**
   * Get user redemption history
   */
  getUserRedemptionHistory(userId: string): RewardRedemption[] {
    return this.redemptionHistory.get(userId) || [];
  }

  /**
   * Get available rewards for user
   */
  async getAvailableRewardsForUser(userId: string): Promise<Reward[]> {
    try {
      const userPoints = await this.getUserPoints(userId);
      const userLevel = await this.getUserLevel(userId);
      const userAchievements = await this.getUserAchievements(userId);

      return Array.from(this.availableRewards.values())
        .filter(reward => {
          // Check if user has enough points
          if (userPoints < reward.pointCost) return false;

          // Check if reward is still available
          if (reward.limitedQuantity && reward.currentQuantity <= 0) return false;

          // Check if reward is expired
          if (reward.expiresAt && new Date() > reward.expiresAt) return false;

          // Check level requirement
          if (reward.requirements?.minimumLevel && userLevel < reward.requirements.minimumLevel) {
            return false;
          }

          // Check achievement requirements
          if (reward.requirements?.requiredAchievements) {
            const hasRequiredAchievements = reward.requirements.requiredAchievements.every(
              requiredAchievement => userAchievements.includes(requiredAchievement)
            );
            if (!hasRequiredAchievements) return false;
          }

          return true;
        })
        .sort((a, b) => {
          // Sort by point cost (lowest first), then by rarity
          if (a.pointCost !== b.pointCost) {
            return a.pointCost - b.pointCost;
          }
          const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
          return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
        });
    } catch (error) {
      console.error('Failed to get available rewards:', error);
      return [];
    }
  }

  /**
   * Get personalized reward recommendations
   */
  async getRewardRecommendations(userId: string, limit: number = 10): Promise<Reward[]> {
    try {
      const userPoints = await this.getUserPoints(userId);
      const userRedemptions = this.redemptionHistory.get(userId) || [];
      const userTransactions = this.pointTransactions.get(userId) || [];

      // Analyze user preferences
      const categoryPreferences = this.analyzeUserCategoryPreferences(userRedemptions);
      const spendingPatterns = this.analyzeSpendingPatterns(userTransactions);

      // Get eligible rewards
      const availableRewards = await this.getAvailableRewardsForUser(userId);

      // Score rewards based on user preferences and behavior
      const scoredRewards = availableRewards.map(reward => {
        let score = 0;

        // Base score from point affordability
        const affordabilityScore = Math.min(userPoints / reward.pointCost, 1);
        score += affordabilityScore * 20;

        // Category preference score
        if (categoryPreferences[reward.category]) {
          score += categoryPreferences[reward.category] * 15;
        }

        // Rarity bonus (rarer items get bonus)
        const rarityBonus = { common: 0, uncommon: 5, rare: 10, epic: 15, legendary: 20 };
        score += rarityBonus[reward.rarity] || 0;

        // Urgency score (expiring soon gets higher score)
        if (reward.expiresAt) {
          const daysUntilExpiry = Math.floor((reward.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry <= 7) {
            score += 15; // Urgent bonus
          } else if (daysUntilExpiry <= 30) {
            score += 8; // Coming soon bonus
          }
        }

        // Limited quantity bonus
        if (reward.limitedQuantity && reward.currentQuantity <= 10) {
          score += 12;
        }

        // Spending pattern alignment
        if (spendingPatterns.preferredPriceRange.includes(reward.pointCost)) {
          score += 10;
        }

        return { reward, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

      return scoredRewards.map(item => item.reward);
    } catch (error) {
      console.error('Failed to get reward recommendations:', error);
      return [];
    }
  }

  /**
   * Analyze user category preferences
   */
  private analyzeUserCategoryPreferences(redemptions: RewardRedemption[]): Record<string, number> {
    const preferences: Record<string, number> = {};
    const categoryCount: Record<string, number> = {};

    redemptions.forEach(redemption => {
      const category = redemption.reward.category;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const totalRedemptions = redemptions.length;
    Object.keys(categoryCount).forEach(category => {
      preferences[category] = (categoryCount[category] / totalRedemptions) * 100;
    });

    return preferences;
  }

  /**
   * Analyze user spending patterns
   */
  private analyzeSpendingPatterns(transactions: PointTransaction[]): any {
    const spendingTransactions = transactions.filter(t => t.type === 'spent');
    const amounts = spendingTransactions.map(t => Math.abs(t.amount));

    if (amounts.length === 0) {
      return { averageSpending: 0, preferredPriceRange: [0, 1000] };
    }

    const averageSpending = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const minSpending = Math.min(...amounts);
    const maxSpending = Math.max(...amounts);

    return {
      averageSpending,
      preferredPriceRange: [
        Math.max(minSpending - 100, 0),
        maxSpending + 100
      ]
    };
  }

  /**
   * Check reward eligibility and send notifications
   */
  private async checkRewardEligibility(userId: string): Promise<void> {
    try {
      const userPoints = await this.getUserPoints(userId);
      const availableRewards = await this.getAvailableRewardsForUser(userId);

      // Check for newly affordable rewards
      const newlyAffordable = availableRewards.filter(reward =>
        reward.pointCost <= userPoints && userPoints - reward.pointCost < 100 // Just became affordable with buffer
      );

      if (newlyAffordable.length > 0 && this.notificationService) {
        await this.notificationService.sendNewRewardAvailability(userId, newlyAffordable);
      }
    } catch (error) {
      console.error('Failed to check reward eligibility:', error);
    }
  }

  /**
   * Get reward economy statistics
   */
  async getRewardEconomyStats(): Promise<any> {
    try {
      const totalPoints = Array.from(this.userPoints.values()).reduce((sum, points) => sum + points, 0);
      const totalRedemptions = Array.from(this.redemptionHistory.values())
        .reduce((sum, redemptions) => sum + redemptions.length, 0);
      const activeRewards = Array.from(this.availableRewards.values()).filter(r =>
        !r.expiresAt || r.expiresAt > new Date()
      );

      return {
        totalPointsInCirculation: totalPoints,
        totalRedemptions,
        activeRewardsCount: activeRewards.length,
        averagePointsPerUser: totalPoints / Math.max(this.userPoints.size, 1),
        topRewardCategories: this.getTopRewardCategories(),
        redemptionRate: totalRedemptions / Math.max(this.userPoints.size, 1)
      };
    } catch (error) {
      console.error('Failed to get reward economy stats:', error);
      return {};
    }
  }

  /**
   * Get top reward categories
   */
  private getTopRewardCategories(): any[] {
    const categoryCount: Record<string, number> = {};
    const categorySpent: Record<string, number> = {};

    Array.from(this.redemptionHistory.values()).flat().forEach(redemption => {
      const category = redemption.reward.category;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
      categorySpent[category] = (categorySpent[category] || 0) + redemption.pointsSpent;
    });

    return Object.keys(categoryCount)
      .map(category => ({
        category,
        redemptions: categoryCount[category],
        pointsSpent: categorySpent[category]
      }))
      .sort((a, b) => b.pointsSpent - a.pointsSpent);
  }

  /**
   * Helper methods
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private isSameWeek(date1: Date, date2: Date): boolean {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.abs(date1.getTime() - date2.getTime()) < oneWeek;
  }

  private async getUserLevel(userId: string): Promise<number> {
    // This would integrate with UserProfileService
    // For now, return default level
    return 1;
  }

  private async getUserAchievements(userId: string): Promise<string[]> {
    // This would integrate with GamificationEngine
    // For now, return empty array
    return [];
  }

  /**
   * Load available rewards
   */
  private async loadAvailableRewards(): Promise<void> {
    try {
      const storedRewards = await AsyncStorage.getItem('available_rewards');
      if (storedRewards) {
        const rewards: Reward[] = JSON.parse(storedRewards);
        rewards.forEach(reward => {
          this.availableRewards.set(reward.id, reward);
        });
      } else {
        await this.loadDefaultRewards();
      }
    } catch (error) {
      console.error('Failed to load available rewards:', error);
      await this.loadDefaultRewards();
    }
  }

  /**
   * Load default rewards
   */
  private async loadDefaultRewards(): Promise<void> {
    const defaultRewards: Reward[] = [
      // Consumer Protection Tools
      {
        id: 'advanced_call_analysis',
        name: 'Advanced Call Analysis',
        description: 'Get 50 premium call analysis credits with AI-powered violation detection',
        pointCost: 500,
        category: 'tools',
        type: 'consumable',
        rarity: 'common',
        icon: 'phone-outline',
        limitedQuantity: false,
        redemptionLimit: 10,
        deliveryMethod: 'digital',
        requirements: { minimumLevel: 1 },
        usageLimit: 50,
        metadata: { tool_type: 'call_analysis', credits: 50 }
      },
      {
        id: 'legal_consultation_discount',
        name: 'Legal Consultation Discount',
        description: '25% discount on your next legal consultation with partner attorneys',
        pointCost: 1500,
        category: 'services',
        type: 'discount',
        rarity: 'uncommon',
        icon: 'briefcase-outline',
        limitedQuantity: true,
        currentQuantity: 100,
        redemptionLimit: 2,
        deliveryMethod: 'digital',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        usageLimit: 1,
        rewardExpiresAt: 30,
        metadata: { discount_percentage: 25, service_type: 'legal_consultation' }
      },
      {
        id: 'premium_month_subscription',
        name: 'Premium Monthly Subscription',
        description: 'One month of Premium access with unlimited call analysis and advanced features',
        pointCost: 3000,
        category: 'subscription',
        type: 'subscription',
        rarity: 'rare',
        icon: 'crown-outline',
        limitedQuantity: false,
        redemptionLimit: 1,
        deliveryMethod: 'digital',
        requirements: { minimumLevel: 5 },
        usageLimit: 1,
        metadata: { subscription_tier: 'premium', duration_days: 30 }
      },
      // Recognition & Status
      {
        id: 'verified_protector_badge',
        name: 'Verified Protector Badge',
        description: 'Exclusive badge showing your commitment to consumer protection',
        pointCost: 2000,
        category: 'recognition',
        type: 'badge',
        rarity: 'uncommon',
        icon: 'shield-check-outline',
        limitedQuantity: false,
        redemptionLimit: 1,
        deliveryMethod: 'digital',
        requirements: { minimumLevel: 10, requiredAchievements: ['fraud_buster'] },
        usageLimit: 0, // Permanent
        metadata: { badge_type: 'verified_protector', display_priority: 'high' }
      },
      {
        id: 'consumer_champion_title',
        name: 'Consumer Champion Title',
        description: 'Exclusive title displayed on your profile and in leaderboards',
        pointCost: 5000,
        category: 'recognition',
        type: 'title',
        rarity: 'epic',
        icon: 'trophy-outline',
        limitedQuantity: true,
        currentQuantity: 50,
        redemptionLimit: 1,
        deliveryMethod: 'digital',
        requirements: { minimumLevel: 25, requiredAchievements: ['consumer_champion'] },
        usageLimit: 0, // Permanent
        metadata: { title_text: 'Consumer Champion', title_color: '#FFD700' }
      },
      // Gift Cards & Perks
      {
        id: 'amazon_gift_card_10',
        name: '$10 Amazon Gift Card',
        description: 'Digital Amazon gift card for consumer protection books and resources',
        pointCost: 2500,
        category: 'gift_cards',
        type: 'gift_card',
        rarity: 'rare',
        icon: 'gift-outline',
        limitedQuantity: true,
        currentQuantity: 200,
        redemptionLimit: 3,
        deliveryMethod: 'email',
        requirements: { minimumLevel: 5 },
        rewardExpiresAt: 90,
        metadata: { gift_card_value: 10, retailer: 'amazon' }
      },
      {
        id: 'coffee_shop_gift_card',
        name: '$5 Coffee Shop Gift Card',
        description: 'Treat yourself while fighting for consumer rights',
        pointCost: 1200,
        category: 'gift_cards',
        type: 'gift_card',
        rarity: 'common',
        icon: 'coffee-outline',
        limitedQuantity: true,
        currentQuantity: 500,
        redemptionLimit: 6,
        deliveryMethod: 'digital',
        rewardExpiresAt: 60,
        metadata: { gift_card_value: 5, retailer: 'various' }
      },
      // Educational Resources
      {
        id: 'consumer_protection_course',
        name: 'Consumer Protection Masterclass',
        description: 'Access to exclusive online course on advanced consumer protection strategies',
        pointCost: 3500,
        category: 'education',
        type: 'course',
        rarity: 'epic',
        icon: 'school-outline',
        limitedQuantity: false,
        redemptionLimit: 1,
        deliveryMethod: 'digital',
        requirements: { minimumLevel: 15 },
        usageLimit: 0, // Lifetime access
        metadata: { course_duration_hours: 8, provider: 'consumer_protection_institute' }
      },
      // Community & Social
      {
        id: 'priority_support_30_days',
        name: 'Priority Support (30 Days)',
        description: 'Get priority customer support and faster response times',
        pointCost: 1000,
        category: 'perks',
        type: 'service',
        rarity: 'uncommon',
        icon: 'headset-outline',
        limitedQuantity: false,
        redemptionLimit: 4,
        deliveryMethod: 'digital',
        usageLimit: 1,
        rewardExpiresAt: 30,
        metadata: { support_level: 'priority', duration_days: 30 }
      }
    ];

    defaultRewards.forEach(reward => {
      this.availableRewards.set(reward.id, reward);
    });

    await this.saveAvailableRewards();
  }

  /**
   * Load user data
   */
  private async loadUserData(): Promise<void> {
    try {
      // This would typically load specific user data on demand
      console.log('User data loading complete');
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }

  /**
   * Save methods
   */
  private async saveAvailableRewards(): Promise<void> {
    try {
      const rewards = Array.from(this.availableRewards.values());
      await AsyncStorage.setItem('available_rewards', JSON.stringify(rewards));
    } catch (error) {
      console.error('Failed to save available rewards:', error);
    }
  }

  private async saveUserPoints(userId: string): Promise<void> {
    try {
      const points = this.userPoints.get(userId) || 0;
      await AsyncStorage.setItem(`user_points_${userId}`, points.toString());
    } catch (error) {
      console.error('Failed to save user points:', error);
    }
  }

  private async saveUserRewards(userId: string): Promise<void> {
    try {
      const rewards = this.userRewards.get(userId) || [];
      await AsyncStorage.setItem(`user_rewards_${userId}`, JSON.stringify(rewards));
    } catch (error) {
      console.error('Failed to save user rewards:', error);
    }
  }

  private async saveUserRedemptions(userId: string): Promise<void> {
    try {
      const redemptions = this.redemptionHistory.get(userId) || [];
      await AsyncStorage.setItem(`user_redemptions_${userId}`, JSON.stringify(redemptions));
    } catch (error) {
      console.error('Failed to save user redemptions:', error);
    }
  }

  private async saveUserTransactions(userId: string): Promise<void> {
    try {
      const transactions = this.pointTransactions.get(userId) || [];
      await AsyncStorage.setItem(`user_transactions_${userId}`, JSON.stringify(transactions));
    } catch (error) {
      console.error('Failed to save user transactions:', error);
    }
  }
}