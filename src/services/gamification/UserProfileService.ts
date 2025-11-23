import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserStats, UserPreferences, UserLevel, TitleReward } from '../../types/gamification';

/**
 * User Profile Service for Gamification
 *
 * Comprehensive user profile management with levels, titles,
 * preferences, and advanced gamification features.
 *
 * Key Features:
 * - Dynamic level progression system
 * - Customizable user titles and badges
 * - Personal achievement showcases
 * - Social profile customization
 * - Privacy controls
 * - Preference management
 * - Activity tracking
 * - Performance analytics
 */

export class UserProfileService {
  private userProfiles: Map<string, UserProfile> = new Map();
  private userStats: Map<string, UserStats> = new Map();
  private userPreferences: Map<string, UserPreferences> = new Map();
  private levelSystem: UserLevel[] = [];
  private availableTitles: TitleReward[] = [];
  private analyticsService: any;

  constructor(analyticsService?: any) {
    this.analyticsService = analyticsService;
    this.initializeService();
  }

  /**
   * Initialize user profile service
   */
  private async initializeService(): Promise<void> {
    try {
      await this.loadLevelSystem();
      await this.loadAvailableTitles();
      await this.loadUserProfiles();

      if (this.analyticsService) {
        this.analyticsService.trackEvent('user_profile_service_initialized', {
          levels_count: this.levelSystem.length,
          titles_count: this.availableTitles.length
        });
      }
    } catch (error) {
      console.error('Failed to initialize user profile service:', error);
      throw new Error('User profile service initialization failed');
    }
  }

  /**
   * Get or create user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = await this.createUserProfile(userId);
      this.userProfiles.set(userId, profile);
    }

    return profile;
  }

  /**
   * Create new user profile
   */
  private async createUserProfile(userId: string): Promise<UserProfile> {
    const now = new Date();

    const profile: UserProfile = {
      id: userId,
      username: `user_${userId.slice(-6)}`,
      displayName: `User ${userId.slice(-6)}`,
      avatar: null,
      level: 1,
      experience: 0,
      totalPoints: 0,
      currentTitle: null,
      unlockedTitles: [],
      badges: [],
      achievements: [],
      stats: {
        callsAnalyzed: 0,
        violationsDetected: 0,
        disputesResolved: 0,
        usersHelped: 0,
        tipsShared: 0,
        loginStreak: 0,
        longestStreak: 0,
        totalLogins: 0
      },
      preferences: {
        privacy: {
          profileVisibility: 'public',
          achievementsVisibility: 'public',
          statsVisibility: 'public',
          activityFeed: true,
          allowFriendRequests: true
        },
        notifications: {
          achievements: true,
          streaks: true,
          levelUps: true,
          challenges: true,
          leaderboards: true
        },
        appearance: {
          theme: 'light',
          avatarFrame: null,
          profileBackground: null
        }
      },
      joinDate: now,
      lastActiveDate: now,
      profileCompletion: 0,
      isVerified: false,
      socialLinks: {},
      bio: ''
    };

    await this.saveUserProfile(userId, profile);
    return profile;
  }

  /**
   * Update user experience and handle level progression
   */
  async updateExperience(userId: string, experienceGained: number): Promise<{ levelUp: boolean; newLevel?: number; rewards?: any[] }> {
    try {
      const profile = await this.getUserProfile(userId);
      const previousLevel = profile.level;

      profile.experience += experienceGained;
      profile.totalPoints += experienceGained; // 1 XP = 1 point for simplicity
      profile.lastActiveDate = new Date();

      // Check for level up
      const newLevel = this.calculateLevel(profile.experience);
      profile.level = newLevel;

      const levelUp = newLevel > previousLevel;
      let rewards: any[] = [];

      if (levelUp) {
        rewards = await this.handleLevelUp(userId, previousLevel, newLevel);
      }

      // Update profile completion
      profile.profileCompletion = await this.calculateProfileCompletion(userId);

      await this.saveUserProfile(userId, profile);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('experience_updated', {
          userId,
          experienceGained,
          previousLevel,
          newLevel,
          levelUp
        });
      }

      return { levelUp, newLevel, rewards };
    } catch (error) {
      console.error('Failed to update experience:', error);
      throw new Error(`Experience update failed: ${error.message}`);
    }
  }

  /**
   * Calculate level based on experience
   */
  private calculateLevel(experience: number): number {
    for (let i = this.levelSystem.length - 1; i >= 0; i--) {
      if (experience >= this.levelSystem[i].requiredExperience) {
        return this.levelSystem[i].level;
      }
    }
    return 1;
  }

  /**
   * Handle level up rewards and notifications
   */
  private async handleLevelUp(userId: string, previousLevel: number, newLevel: number): Promise<any[]> {
    const rewards: any[] = [];
    const profile = await this.getUserProfile(userId);

    // Check for unlocked titles
    for (const title of this.availableTitles) {
      if (title.requirement.type === 'level' && title.requirement.value <= newLevel) {
        if (!profile.unlockedTitles.includes(title.id)) {
          profile.unlockedTitles.push(title.id);
          rewards.push({ type: 'title', title });
        }
      }
    }

    // Check for level-specific rewards
    const levelRewards = this.getLevelRewards(newLevel);
    rewards.push(...levelRewards);

    // Send notification (this would integrate with notification service)
    console.log(`User ${userId} leveled up to ${newLevel}!`);

    await this.saveUserProfile(userId, profile);
    return rewards;
  }

  /**
   * Get rewards for reaching a specific level
   */
  private getLevelRewards(level: number): any[] {
    const rewards: any[] = [];

    // Define milestone rewards
    const milestoneRewards = {
      5: { type: 'badge', name: 'Rising Star', description: 'Reached level 5' },
      10: { type: 'badge', name: 'Consumer Protector', description: 'Reached level 10' },
      25: { type: 'badge', name: 'Expert Analyst', description: 'Reached level 25' },
      50: { type: 'badge', name: 'Master Defender', description: 'Reached level 50' },
      100: { type: 'badge', name: 'Legend Protector', description: 'Reached level 100' }
    };

    if (milestoneRewards[level]) {
      rewards.push(milestoneRewards[level]);
    }

    // Add points reward
    rewards.push({ type: 'points', amount: level * 10 });

    return rewards;
  }

  /**
   * Update user statistics
   */
  async updateUserStats(userId: string, statsUpdate: Partial<UserStats>): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);

      // Update stats with increment logic
      Object.keys(statsUpdate).forEach(key => {
        const currentValue = profile.stats[key] || 0;
        const updateValue = statsUpdate[key];

        if (typeof updateValue === 'number' && updateValue > 0) {
          profile.stats[key] = currentValue + updateValue;
        } else {
          profile.stats[key] = updateValue;
        }
      });

      profile.lastActiveDate = new Date();

      await this.saveUserProfile(userId, profile);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('user_stats_updated', {
          userId,
          updatedStats: Object.keys(statsUpdate)
        });
      }
    } catch (error) {
      console.error('Failed to update user stats:', error);
      throw new Error(`Stats update failed: ${error.message}`);
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferencesUpdate: Partial<UserPreferences>): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);

      // Deep merge preferences
      profile.preferences = this.mergeDeep(profile.preferences, preferencesUpdate);

      await this.saveUserProfile(userId, profile);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('user_preferences_updated', {
          userId,
          updatedPreferences: Object.keys(preferencesUpdate)
        });
      }
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw new Error(`Preferences update failed: ${error.message}`);
    }
  }

  /**
   * Set user title
   */
  async setUserTitle(userId: string, titleId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);

      if (!profile.unlockedTitles.includes(titleId)) {
        return false; // Title not unlocked
      }

      profile.currentTitle = titleId;
      await this.saveUserProfile(userId, profile);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('user_title_changed', {
          userId,
          titleId
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to set user title:', error);
      return false;
    }
  }

  /**
   * Add badge to user profile
   */
  async addBadge(userId: string, badge: any): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);

      // Check if badge already exists
      if (profile.badges.some(b => b.id === badge.id)) {
        return;
      }

      badge.unlockedAt = new Date();
      profile.badges.push(badge);

      await this.saveUserProfile(userId, profile);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('badge_unlocked', {
          userId,
          badgeId: badge.id,
          badgeName: badge.name
        });
      }
    } catch (error) {
      console.error('Failed to add badge:', error);
      throw new Error(`Badge addition failed: ${error.message}`);
    }
  }

  /**
   * Update user profile information
   */
  async updateProfileInfo(userId: string, profileUpdate: {
    displayName?: string;
    avatar?: string;
    bio?: string;
    socialLinks?: any;
  }): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);

      Object.assign(profile, profileUpdate);
      profile.profileCompletion = await this.calculateProfileCompletion(userId);

      await this.saveUserProfile(userId, profile);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('profile_info_updated', {
          userId,
          updatedFields: Object.keys(profileUpdate)
        });
      }
    } catch (error) {
      console.error('Failed to update profile info:', error);
      throw new Error(`Profile info update failed: ${error.message}`);
    }
  }

  /**
   * Calculate profile completion percentage
   */
  private async calculateProfileCompletion(userId: string): Promise<number> {
    const profile = await this.getUserProfile(userId);
    let completion = 0;
    const totalFields = 8;

    // Check various profile fields
    if (profile.displayName && profile.displayName !== `User ${userId.slice(-6)}`) completion += 1;
    if (profile.avatar) completion += 1;
    if (profile.bio && profile.bio.length > 10) completion += 1;
    if (Object.keys(profile.socialLinks).length > 0) completion += 1;
    if (profile.currentTitle) completion += 1;
    if (profile.stats.callsAnalyzed > 0) completion += 1;
    if (profile.achievements.length > 0) completion += 1;
    if (profile.badges.length > 0) completion += 1;

    return Math.round((completion / totalFields) * 100);
  }

  /**
   * Get user leaderboard position
   */
  async getUserLeaderboardPosition(userId: string, leaderboardType: 'points' | 'level' | 'achievements' = 'points'): Promise<number> {
    try {
      const allProfiles = Array.from(this.userProfiles.values());
      const profile = await this.getUserProfile(userId);

      let sortKey: string;
      let sortValue: number;

      switch (leaderboardType) {
        case 'level':
          sortKey = 'level';
          sortValue = profile.level;
          break;
        case 'achievements':
          sortKey = 'achievements';
          sortValue = profile.achievements.length;
          break;
        default:
          sortKey = 'totalPoints';
          sortValue = profile.totalPoints;
      }

      // Sort profiles by the selected metric
      const sortedProfiles = allProfiles.sort((a, b) => {
        const aValue = sortKey === 'achievements' ? a.achievements.length : a[sortKey];
        const bValue = sortKey === 'achievements' ? b.achievements.length : b[sortKey];
        return bValue - aValue;
      });

      // Find user's position
      const userIndex = sortedProfiles.findIndex(p => p.id === userId);
      return userIndex >= 0 ? userIndex + 1 : -1;
    } catch (error) {
      console.error('Failed to get leaderboard position:', error);
      return -1;
    }
  }

  /**
   * Get user ranking tier
   */
  getUserRankingTier(level: number): { tier: string; rank: string; color: string; nextLevel: number } {
    const tiers = [
      { tier: 'Bronze', levels: [1, 9], rank: 'Novice Protector', color: '#CD7F32', nextLevel: 10 },
      { tier: 'Silver', levels: [10, 24], rank: 'Apprentice Defender', color: '#C0C0C0', nextLevel: 25 },
      { tier: 'Gold', levels: [25, 49], rank: 'Expert Guardian', color: '#FFD700', nextLevel: 50 },
      { tier: 'Platinum', levels: [50, 99], rank: 'Master Protector', color: '#E5E4E2', nextLevel: 100 },
      { tier: 'Diamond', levels: [100, 199], rank: 'Elite Defender', color: '#B9F2FF', nextLevel: 200 },
      { tier: 'Master', levels: [200, 499], rank: 'Legendary Guardian', color: '#9D4EDD', nextLevel: 500 },
      { tier: 'Grandmaster', levels: [500, Infinity], rank: 'Mythic Protector', color: '#FF6B6B', nextLevel: null }
    ];

    for (const tier of tiers) {
      if (level >= tier.levels[0] && level <= tier.levels[1]) {
        return tier;
      }
    }

    return tiers[0]; // Default to Bronze
  }

  /**
   * Get top users for leaderboard
   */
  async getTopUsers(limit: number = 50, metric: 'points' | 'level' | 'achievements' = 'points'): Promise<any[]> {
    try {
      const allProfiles = Array.from(this.userProfiles.values());

      let sortKey: string;
      switch (metric) {
        case 'level':
          sortKey = 'level';
          break;
        case 'achievements':
          sortKey = 'achievements';
          break;
        default:
          sortKey = 'totalPoints';
      }

      const sortedProfiles = allProfiles
        .sort((a, b) => {
          const aValue = sortKey === 'achievements' ? a.achievements.length : a[sortKey];
          const bValue = sortKey === 'achievements' ? b.achievements.length : b[sortKey];
          return bValue - aValue;
        })
        .slice(0, limit)
        .map((profile, index) => ({
          ...profile,
          rank: index + 1,
          tier: this.getUserRankingTier(profile.level)
        }));

      return sortedProfiles;
    } catch (error) {
      console.error('Failed to get top users:', error);
      return [];
    }
  }

  /**
   * Deep merge objects
   */
  private mergeDeep(target: any, source: any): any {
    const output = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.mergeDeep(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }

    return output;
  }

  /**
   * Check if value is an object
   */
  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Load level system configuration
   */
  private async loadLevelSystem(): Promise<void> {
    try {
      const storedLevels = await AsyncStorage.getItem('user_level_system');
      if (storedLevels) {
        this.levelSystem = JSON.parse(storedLevels);
      } else {
        this.levelSystem = this.generateLevelSystem();
        await this.saveLevelSystem();
      }
    } catch (error) {
      console.error('Failed to load level system:', error);
      this.levelSystem = this.generateLevelSystem();
    }
  }

  /**
   * Generate default level system
   */
  private generateLevelSystem(): UserLevel[] {
    const levels: UserLevel[] = [];
    let requiredXP = 0;

    for (let level = 1; level <= 500; level++) {
      if (level === 1) {
        requiredXP = 0;
      } else if (level <= 10) {
        requiredXP += 100; // Early levels: 100 XP each
      } else if (level <= 25) {
        requiredXP += 150; // Early-mid levels: 150 XP each
      } else if (level <= 50) {
        requiredXP += 200; // Mid levels: 200 XP each
      } else if (level <= 100) {
        requiredXP += 300; // Mid-high levels: 300 XP each
      } else if (level <= 200) {
        requiredXP += 500; // High levels: 500 XP each
      } else {
        requiredXP += 1000; // Master levels: 1000 XP each
      }

      levels.push({
        level,
        requiredExperience: requiredXP,
        title: this.getLevelTitle(level),
        rewards: this.getLevelRewardsForLevel(level),
        benefits: this.getLevelBenefits(level)
      });
    }

    return levels;
  }

  /**
   * Get title for level
   */
  private getLevelTitle(level: number): string {
    const titles = [
      'Novice Protector',
      'Apprentice Defender',
      'Rising Guardian',
      'Skilled Protector',
      'Expert Defender',
      'Master Guardian',
      'Elite Protector',
      'Legendary Defender',
      'Mythic Guardian',
      'Ultimate Protector'
    ];

    const titleIndex = Math.min(Math.floor((level - 1) / 50), titles.length - 1);
    return titles[titleIndex];
  }

  /**
   * Get rewards for specific level
   */
  private getLevelRewardsForLevel(level: number): any[] {
    const rewards: any[] = [];

    // Base points reward
    rewards.push({ type: 'points', amount: level * 10 });

    // Special milestone rewards
    if ([10, 25, 50, 100, 200, 500].includes(level)) {
      rewards.push({
        type: 'title',
        titleId: `level_${level}`,
        title: `${this.getLevelTitle(level)}`
      });
    }

    return rewards;
  }

  /**
   * Get benefits for level
   */
  private getLevelBenefits(level: number): string[] {
    const benefits: string[] = [];

    if (level >= 5) benefits.push('Unlimited call analysis');
    if (level >= 10) benefits.push('Advanced violation detection');
    if (level >= 25) benefits.push('Legal research access');
    if (level >= 50) benefits.push('Priority support');
    if (level >= 100) benefits.push('Exclusive content access');
    if (level >= 200) benefits.push('Beta features access');
    if (level >= 500) benefits.push('VIP community access');

    return benefits;
  }

  /**
   * Load available titles
   */
  private async loadAvailableTitles(): Promise<void> {
    try {
      const storedTitles = await AsyncStorage.getItem('available_titles');
      if (storedTitles) {
        this.availableTitles = JSON.parse(storedTitles);
      } else {
        this.availableTitles = this.generateDefaultTitles();
        await this.saveAvailableTitles();
      }
    } catch (error) {
      console.error('Failed to load available titles:', error);
      this.availableTitles = this.generateDefaultTitles();
    }
  }

  /**
   * Generate default titles
   */
  private generateDefaultTitles(): TitleReward[] {
    return [
      // Level-based titles
      {
        id: 'level_10',
        name: 'Apprentice Defender',
        description: 'Reached level 10',
        requirement: { type: 'level', value: 10 },
        rarity: 'common',
        icon: 'shield-outline',
        color: '#C0C0C0'
      },
      {
        id: 'level_25',
        name: 'Expert Guardian',
        description: 'Reached level 25',
        requirement: { type: 'level', value: 25 },
        rarity: 'uncommon',
        icon: 'shield-check',
        color: '#FFD700'
      },
      {
        id: 'level_50',
        name: 'Master Protector',
        description: 'Reached level 50',
        requirement: { type: 'level', value: 50 },
        rarity: 'rare',
        icon: 'shield-star',
        color: '#9D4EDD'
      },
      // Achievement-based titles
      {
        id: 'fraud_buster',
        name: 'Fraud Buster',
        description: 'Identified 10 fraudulent calls',
        requirement: { type: 'achievement', value: 'fraud_buster' },
        rarity: 'epic',
        icon: 'police-badge',
        color: '#FF6B6B'
      },
      {
        id: 'consumer_champion',
        name: 'Consumer Champion',
        description: 'Resolved 5 consumer protection disputes',
        requirement: { type: 'achievement', value: 'consumer_champion' },
        rarity: 'legendary',
        icon: 'trophy',
        color: '#FFD700'
      },
      // Streak-based titles
      {
        id: 'dedicated_protector',
        name: 'Dedicated Protector',
        description: 'Maintained a 30-day streak',
        requirement: { type: 'streak', value: 30 },
        rarity: 'uncommon',
        icon: 'fire',
        color: '#FF6B35'
      },
      {
        id: 'year_warrior',
        name: 'Year Warrior',
        description: 'Maintained a 365-day streak',
        requirement: { type: 'streak', value: 365 },
        rarity: 'legendary',
        icon: 'calendar-star',
        color: '#4ECDC4'
      }
    ];
  }

  /**
   * Save user profile
   */
  private async saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
    try {
      this.userProfiles.set(userId, profile);
      await AsyncStorage.setItem(`user_profile_${userId}`, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  }

  /**
   * Save level system
   */
  private async saveLevelSystem(): Promise<void> {
    try {
      await AsyncStorage.setItem('user_level_system', JSON.stringify(this.levelSystem));
    } catch (error) {
      console.error('Failed to save level system:', error);
    }
  }

  /**
   * Save available titles
   */
  private async saveAvailableTitles(): Promise<void> {
    try {
      await AsyncStorage.setItem('available_titles', JSON.stringify(this.availableTitles));
    } catch (error) {
      console.error('Failed to save available titles:', error);
    }
  }

  /**
   * Load user profiles (would load all or recent users)
   */
  private async loadUserProfiles(): Promise<void> {
    try {
      // This would typically load specific users on demand
      // For now, just log that loading is complete
      console.log('User profiles loading complete');
    } catch (error) {
      console.error('Failed to load user profiles:', error);
    }
  }

  /**
   * Get comprehensive user statistics
   */
  async getUserComprehensiveStats(userId: string): Promise<any> {
    const profile = await this.getUserProfile(userId);
    const leaderboardPosition = await this.getUserLeaderboardPosition(userId, 'points');
    const tier = this.getUserRankingTier(profile.level);

    return {
      profile,
      leaderboardPosition,
      tier,
      progressToNextLevel: this.calculateProgressToNextLevel(profile.experience, profile.level),
      totalUsers: this.userProfiles.size,
      achievementsBreakdown: this.getAchievementsBreakdown(profile),
      recentActivity: await this.getRecentActivity(userId)
    };
  }

  /**
   * Calculate progress to next level
   */
  private calculateProgressToNextLevel(currentXP: number, currentLevel: number): { current: number; required: number; percentage: number } {
    if (currentLevel >= this.levelSystem.length) {
      return { current: currentXP, required: currentXP, percentage: 100 };
    }

    const currentLevelData = this.levelSystem[currentLevel - 1];
    const nextLevelData = this.levelSystem[currentLevel];

    const required = nextLevelData.requiredExperience - currentLevelData.requiredExperience;
    const current = currentXP - currentLevelData.requiredExperience;
    const percentage = Math.round((current / required) * 100);

    return { current, required, percentage };
  }

  /**
   * Get achievements breakdown by category
   */
  private getAchievementsBreakdown(profile: UserProfile): any {
    const breakdown: any = {};

    profile.achievements.forEach(achievement => {
      const category = achievement.category || 'general';
      if (!breakdown[category]) {
        breakdown[category] = 0;
      }
      breakdown[category]++;
    });

    return breakdown;
  }

  /**
   * Get recent user activity
   */
  private async getRecentActivity(userId: string): Promise<any[]> {
    // This would integrate with analytics service to get recent activity
    // For now, return empty array
    return [];
  }
}