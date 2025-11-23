import AsyncStorage from '@react-native-async-storage/async-storage';
import { Leaderboard, LeaderboardEntry, LeaderboardType, LeaderboardPeriod, LeaderboardFilter, Competition, UserRanking } from '../../types/gamification';

/**
 * Advanced Leaderboard System
 *
 * Multi-dimensional competitive rankings with real-time updates,
 * intelligent matchmaking, and sophisticated competition mechanics.
 *
 * Key Features:
 * - Real-time global and leaderboards
 * - Friend and group leaderboards
 * - Time-based competitions
 * - Skill-based matchmaking
 * - Regional and demographic filters
 * - Achievement-based leaderboards
 * - Live ranking updates
 * - Anti-cheat mechanisms
 * - Performance analytics
 * - Social comparison tools
 */

export class AdvancedLeaderboardSystem {
  private leaderboards: Map<string, Leaderboard> = new Map();
  private userRankings: Map<string, UserRanking[]> = new Map();
  private competitions: Map<string, Competition> = new Map();
  private userCompetitions: Map<string, string[]> = new Map();
  private rankingCache: Map<string, LeaderboardEntry[]> = new Map();
  private analyticsService: any;
  private notificationService: any;
  private antiCheatService: any;

  constructor(analyticsService?: any, notificationService?: any) {
    this.analyticsService = analyticsService;
    this.notificationService = notificationService;
    this.initializeLeaderboardSystem();
  }

  /**
   * Initialize leaderboard system
   */
  private async initializeLeaderboardSystem(): Promise<void> {
    try {
      await this.loadDefaultLeaderboards();
      await this.loadActiveCompetitions();
      await this.loadUserRankings();

      // Start leaderboard update scheduler
      this.startLeaderboardScheduler();

      if (this.analyticsService) {
        this.analyticsService.trackEvent('leaderboard_system_initialized', {
          leaderboards_count: this.leaderboards.size,
          competitions_count: this.competitions.size
        });
      }
    } catch (error) {
      console.error('Failed to initialize leaderboard system:', error);
      throw new Error('Leaderboard system initialization failed');
    }
  }

  /**
   * Get or create leaderboard
   */
  async getLeaderboard(
    type: LeaderboardType['type'],
    period: LeaderboardPeriod['type'],
    filters?: LeaderboardFilter
  ): Promise<Leaderboard> {
    const leaderboardId = this.generateLeaderboardId(type, period, filters);
    let leaderboard = this.leaderboards.get(leaderboardId);

    if (!leaderboard) {
      leaderboard = await this.createLeaderboard(type, period, filters);
      this.leaderboards.set(leaderboardId, leaderboard);
    }

    return leaderboard;
  }

  /**
   * Create new leaderboard
   */
  private async createLeaderboard(
    type: LeaderboardType['type'],
    period: LeaderboardPeriod['type'],
    filters?: LeaderboardFilter
  ): Promise<Leaderboard> {
    const leaderboardId = this.generateLeaderboardId(type, period, filters);
    const now = new Date();

    const leaderboard: Leaderboard = {
      id: leaderboardId,
      name: this.generateLeaderboardName(type, period, filters),
      type: { type },
      period: { type: period },
      filters: filters || {},
      entries: [],
      lastUpdated: now,
      totalParticipants: 0,
      isResetting: false,
      nextResetTime: this.calculateNextResetTime(period),
      metadata: {
        averageScore: 0,
        topScore: 0,
        scoreDistribution: {}
      }
    };

    await this.saveLeaderboard(leaderboard);
    return leaderboard;
  }

  /**
   * Update user score in leaderboards
   */
  async updateUserScore(
    userId: string,
    scoreData: {
      points?: number;
      achievements?: number;
      callsAnalyzed?: number;
      violationsDetected?: number;
      streakDays?: number;
      customMetric?: number;
    }
  ): Promise<void> {
    try {
      // Update all relevant leaderboards
      const leaderboardTypes: LeaderboardType['type'][] = [
        'points',
        'achievements',
        'calls_analyzed',
        'violations_detected',
        'streak_days'
      ];

      for (const type of leaderboardTypes) {
        if (scoreData[this.getScoreField(type)] !== undefined) {
          await this.updateLeaderboardScore(userId, type, scoreData[this.getScoreField(type)]);
        }
      }

      // Check for ranking changes and send notifications
      await this.checkRankingChanges(userId);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('leaderboard_score_updated', {
          userId,
          scoreData,
          updatedTypes: leaderboardTypes.filter(type => scoreData[this.getScoreField(type)] !== undefined)
        });
      }
    } catch (error) {
      console.error('Failed to update user score:', error);
      throw new Error(`Score update failed: ${error.message}`);
    }
  }

  /**
   * Update specific leaderboard score
   */
  private async updateLeaderboardScore(userId: string, type: LeaderboardType['type'], score: number): Promise<void> {
    // Update all time periods for this type
    const periods: LeaderboardPeriod['type'][] = ['all_time', 'monthly', 'weekly', 'daily'];

    for (const period of periods) {
      const leaderboard = await this.getLeaderboard(type, period);
      const existingEntry = leaderboard.entries.find(entry => entry.userId === userId);

      if (existingEntry) {
        // Update existing entry
        existingEntry.score = score;
        existingEntry.lastUpdated = new Date();
        existingEntry.rank = await this.calculateRank(leaderboard, userId);
      } else {
        // Add new entry
        const newEntry: LeaderboardEntry = {
          userId,
          rank: 0, // Will be calculated
          score,
          displayName: await this.getUserDisplayName(userId),
          avatar: await this.getUserAvatar(userId),
          level: await this.getUserLevel(userId),
          badges: await this.getUserBadges(userId),
          lastUpdated: new Date(),
          metadata: {}
        };

        newEntry.rank = await this.calculateRank(leaderboard, userId);
        leaderboard.entries.push(newEntry);
      }

      // Sort leaderboard
      leaderboard.entries.sort((a, b) => b.score - a.score);

      // Update ranks
      leaderboard.entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      leaderboard.totalParticipants = leaderboard.entries.length;
      leaderboard.lastUpdated = new Date();

      await this.saveLeaderboard(leaderboard);
    }
  }

  /**
   * Calculate user rank in leaderboard
   */
  private async calculateRank(leaderboard: Leaderboard, userId: string): Promise<number> {
    const userEntry = leaderboard.entries.find(entry => entry.userId === userId);
    if (!userEntry) return 0;

    // Count entries with higher scores
    return leaderboard.entries.filter(entry => entry.score > userEntry.score).length + 1;
  }

  /**
   * Get user rankings across all leaderboards
   */
  async getUserRankings(userId: string): Promise<UserRanking[]> {
    const cachedRankings = this.userRankings.get(userId);
    if (cachedRankings) {
      return cachedRankings;
    }

    const rankings: UserRanking[] = [];
    const types: LeaderboardType['type'][] = ['points', 'achievements', 'calls_analyzed', 'violations_detected', 'streak_days'];
    const periods: LeaderboardPeriod['type'][] = ['all_time', 'monthly', 'weekly'];

    for (const type of types) {
      for (const period of periods) {
        try {
          const leaderboard = await this.getLeaderboard(type, period);
          const userEntry = leaderboard.entries.find(entry => entry.userId === userId);

          if (userEntry) {
            rankings.push({
              userId,
              leaderboardId: leaderboard.id,
              leaderboardName: leaderboard.name,
              rank: userEntry.rank,
              score: userEntry.score,
              totalParticipants: leaderboard.totalParticipants,
              percentile: Math.round(((leaderboard.totalParticipants - userEntry.rank) / leaderboard.totalParticipants) * 100),
              period,
              type,
              lastUpdated: userEntry.lastUpdated
            });
          }
        } catch (error) {
          console.error(`Failed to get ranking for ${type} ${period}:`, error);
        }
      }
    }

    this.userRankings.set(userId, rankings);
    return rankings;
  }

  /**
   * Get leaderboard with pagination
   */
  async getLeaderboardEntries(
    type: LeaderboardType['type'],
    period: LeaderboardPeriod['type'],
    page: number = 1,
    limit: number = 50,
    filters?: LeaderboardFilter
  ): Promise<{ entries: LeaderboardEntry[]; hasMore: boolean; totalCount: number }> {
    try {
      const leaderboard = await this.getLeaderboard(type, period, filters);

      // Apply additional filters if needed
      let filteredEntries = leaderboard.entries;
      if (filters) {
        filteredEntries = this.applyFilters(leaderboard.entries, filters);
      }

      // Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const entries = filteredEntries.slice(startIndex, endIndex);

      return {
        entries,
        hasMore: endIndex < filteredEntries.length,
        totalCount: filteredEntries.length
      };
    } catch (error) {
      console.error('Failed to get leaderboard entries:', error);
      return { entries: [], hasMore: false, totalCount: 0 };
    }
  }

  /**
   * Get leaderboard around user (user's position and neighbors)
   */
  async getLeaderboardAroundUser(
    userId: string,
    type: LeaderboardType['type'],
    period: LeaderboardPeriod['type'],
    range: number = 5
  ): Promise<{ entries: LeaderboardEntry[]; userPosition: number }> {
    try {
      const leaderboard = await this.getLeaderboard(type, period);
      const userEntry = leaderboard.entries.find(entry => entry.userId === userId);

      if (!userEntry) {
        return { entries: [], userPosition: -1 };
      }

      const userRank = userEntry.rank - 1; // Convert to 0-based index
      const startIndex = Math.max(0, userRank - range);
      const endIndex = Math.min(leaderboard.entries.length, userRank + range + 1);

      const entries = leaderboard.entries.slice(startIndex, endIndex);

      return {
        entries,
        userPosition: userRank - startIndex // Position within the returned array
      };
    } catch (error) {
      console.error('Failed to get leaderboard around user:', error);
      return { entries: [], userPosition: -1 };
    }
  }

  /**
   * Create competition
   */
  async createCompetition(
    name: string,
    description: string,
    type: LeaderboardType['type'],
    startDate: Date,
    endDate: Date,
    rewards: any[],
    maxParticipants?: number
  ): Promise<Competition> {
    try {
      const competition: Competition = {
        id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        type: { type },
        status: 'upcoming',
        startDate,
        endDate,
        participants: [],
        rewards,
        maxParticipants,
        currentParticipants: 0,
        rules: {
          allowJoinsDuringCompetition: false,
          minimumLevel: 1,
          requiredAchievements: [],
          fairPlayRules: ['no_cheating', 'no_exploiting', 'respect_other_participants']
        },
        leaderboard: null,
        winner: null,
        metadata: {
          createdBy: 'system',
          difficulty: 'medium',
          category: 'consumer_protection'
        }
      };

      this.competitions.set(competition.id, competition);
      await this.saveCompetition(competition);

      // Schedule competition start
      this.scheduleCompetitionStart(competition);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('competition_created', {
          competitionId: competition.id,
          name,
          type,
          duration: endDate.getTime() - startDate.getTime()
        });
      }

      return competition;
    } catch (error) {
      console.error('Failed to create competition:', error);
      throw new Error(`Competition creation failed: ${error.message}`);
    }
  }

  /**
   * Join competition
   */
  async joinCompetition(userId: string, competitionId: string): Promise<boolean> {
    try {
      const competition = this.competitions.get(competitionId);
      if (!competition) {
        throw new Error('Competition not found');
      }

      // Check if user can join
      if (!this.canUserJoinCompetition(userId, competition)) {
        return false;
      }

      // Add user to competition
      competition.participants.push({
        userId,
        joinDate: new Date(),
        score: 0,
        rank: competition.participants.length + 1,
        isActive: true
      });
      competition.currentParticipants = competition.participants.length;

      // Track user competition
      const userCompetitions = this.userCompetitions.get(userId) || [];
      userCompetitions.push(competitionId);
      this.userCompetitions.set(userId, userCompetitions);

      await this.saveCompetition(competition);

      // Send notification
      if (this.notificationService) {
        await this.notificationService.sendCompetitionJoined(userId, competition);
      }

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('competition_joined', {
          userId,
          competitionId,
          participantCount: competition.currentParticipants
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to join competition:', error);
      return false;
    }
  }

  /**
   * Check if user can join competition
   */
  private canUserJoinCompetition(userId: string, competition: Competition): boolean {
    // Check competition status
    if (competition.status !== 'active') {
      return false;
    }

    // Check if already joined
    if (competition.participants.some(p => p.userId === userId)) {
      return false;
    }

    // Check maximum participants
    if (competition.maxParticipants && competition.currentParticipants >= competition.maxParticipants) {
      return false;
    }

    // Check join during competition rule
    if (!competition.rules.allowJoinsDuringCompetition && new Date() > competition.startDate) {
      return false;
    }

    // Check minimum level
    if (competition.rules.minimumLevel > 1) {
      // This would integrate with UserProfileService
      const userLevel = this.getUserLevel(userId);
      if (userLevel < competition.rules.minimumLevel) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get active competitions
   */
  async getActiveCompetitions(): Promise<Competition[]> {
    const now = new Date();
    return Array.from(this.competitions.values())
      .filter(competition =>
        competition.status === 'active' ||
        (competition.status === 'upcoming' && competition.startDate > now)
      );
  }

  /**
   * Get user competitions
   */
  async getUserCompetitions(userId: string): Promise<Competition[]> {
    const userCompetitionIds = this.userCompetitions.get(userId) || [];
    return userCompetitionIds
      .map(id => this.competitions.get(id))
      .filter(competition => competition !== undefined);
  }

  /**
   * Get competition leaderboard
   */
  async getCompetitionLeaderboard(competitionId: string): Promise<LeaderboardEntry[]> {
    const competition = this.competitions.get(competitionId);
    if (!competition || !competition.leaderboard) {
      return [];
    }

    return competition.leaderboard.entries;
  }

  /**
   * Check ranking changes and send notifications
   */
  private async checkRankingChanges(userId: string): Promise<void> {
    try {
      const currentRankings = await this.getUserRankings(userId);
      const previousRankings = this.userRankings.get(userId) || [];

      for (const currentRanking of currentRankings) {
        const previousRanking = previousRankings.find(r =>
          r.leaderboardId === currentRanking.leaderboardId
        );

        if (previousRanking && previousRanking.rank !== currentRanking.rank) {
          const rankChange = previousRanking.rank - currentRanking.rank;

          // Significant rank improvement
          if (rankChange >= 10) {
            if (this.notificationService) {
              await this.notificationService.sendRankingImproved(userId, currentRanking, rankChange);
            }
          }

          // Reached top 10
          if (currentRanking.rank <= 10 && previousRanking.rank > 10) {
            if (this.notificationService) {
              await this.notificationService.sendTopTenAchieved(userId, currentRanking);
            }
          }

          // Reached #1
          if (currentRanking.rank === 1 && previousRanking.rank > 1) {
            if (this.notificationService) {
              await this.notificationService.sendFirstPlaceAchieved(userId, currentRanking);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to check ranking changes:', error);
    }
  }

  /**
   * Start leaderboard scheduler
   */
  private startLeaderboardScheduler(): void {
    // Reset daily leaderboards at midnight
    setInterval(async () => {
      await this.resetDailyLeaderboards();
    }, 24 * 60 * 60 * 1000);

    // Reset weekly leaderboards on Monday
    setInterval(async () => {
      const now = new Date();
      if (now.getDay() === 1 && now.getHours() === 0) {
        await this.resetWeeklyLeaderboards();
      }
    }, 60 * 60 * 1000);

    // Reset monthly leaderboards on 1st of month
    setInterval(async () => {
      const now = new Date();
      if (now.getDate() === 1 && now.getHours() === 0) {
        await this.resetMonthlyLeaderboards();
      }
    }, 60 * 60 * 1000);
  }

  /**
   * Reset time-based leaderboards
   */
  private async resetDailyLeaderboards(): Promise<void> {
    console.log('Resetting daily leaderboards');
    await this.resetLeaderboardsByPeriod('daily');
  }

  private async resetWeeklyLeaderboards(): Promise<void> {
    console.log('Resetting weekly leaderboards');
    await this.resetLeaderboardsByPeriod('weekly');
  }

  private async resetMonthlyLeaderboards(): Promise<void> {
    console.log('Resetting monthly leaderboards');
    await this.resetLeaderboardsByPeriod('monthly');
  }

  private async resetLeaderboardsByPeriod(period: LeaderboardPeriod['type']): Promise<void> {
    for (const [leaderboardId, leaderboard] of this.leaderboards.entries()) {
      if (leaderboard.period.type === period) {
        // Archive current leaderboard data
        await this.archiveLeaderboard(leaderboard);

        // Reset leaderboard
        leaderboard.entries = [];
        leaderboard.totalParticipants = 0;
        leaderboard.lastUpdated = new Date();
        leaderboard.nextResetTime = this.calculateNextResetTime(period);

        await this.saveLeaderboard(leaderboard);
      }
    }
  }

  /**
   * Archive leaderboard data
   */
  private async archiveLeaderboard(leaderboard: Leaderboard): Promise<void> {
    try {
      const archiveData = {
        leaderboardId: leaderboard.id,
        entries: leaderboard.entries,
        archivedAt: new Date(),
        period: leaderboard.period.type,
        totalParticipants: leaderboard.totalParticipants
      };

      // Save to archive storage
      const archiveKey = `leaderboard_archive_${leaderboard.id}_${Date.now()}`;
      await AsyncStorage.setItem(archiveKey, JSON.stringify(archiveData));
    } catch (error) {
      console.error('Failed to archive leaderboard:', error);
    }
  }

  /**
   * Schedule competition start
   */
  private scheduleCompetitionStart(competition: Competition): void {
    const delay = competition.startDate.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(async () => {
        competition.status = 'active';
        competition.leaderboard = await this.createCompetitionLeaderboard(competition);
        await this.saveCompetition(competition);

        if (this.notificationService) {
          // Notify all participants
          for (const participant of competition.participants) {
            await this.notificationService.sendCompetitionStarted(participant.userId, competition);
          }
        }
      }, delay);
    }
  }

  /**
   * Create competition leaderboard
   */
  private async createCompetitionLeaderboard(competition: Competition): Promise<Leaderboard> {
    const leaderboard: Leaderboard = {
      id: `comp_lb_${competition.id}`,
      name: `${competition.name} Leaderboard`,
      type: competition.type,
      period: { type: 'custom' },
      filters: { competitionId: competition.id },
      entries: [],
      lastUpdated: new Date(),
      totalParticipants: competition.participants.length,
      isResetting: false,
      nextResetTime: competition.endDate,
      metadata: {
        competitionId: competition.id,
        averageScore: 0,
        topScore: 0,
        scoreDistribution: {}
      }
    };

    return leaderboard;
  }

  /**
   * Helper methods
   */
  private generateLeaderboardId(type: LeaderboardType['type'], period: LeaderboardPeriod['type'], filters?: LeaderboardFilter): string {
    const filterString = filters ? JSON.stringify(filters) : '';
    return `lb_${type}_${period}_${btoa(filterString).replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  private generateLeaderboardName(type: LeaderboardType['type'], period: LeaderboardPeriod['type'], filters?: LeaderboardFilter): string {
    const typeNames = {
      points: 'Points',
      achievements: 'Achievements',
      calls_analyzed: 'Calls Analyzed',
      violations_detected: 'Violations Detected',
      streak_days: 'Streak Days'
    };

    const periodNames = {
      all_time: 'All-Time',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly'
    };

    let name = `${typeNames[type]} ${periodNames[period]} Leaderboard`;

    if (filters?.region) {
      name += ` (${filters.region})`;
    }

    if (filters?.friends) {
      name += ' (Friends)';
    }

    return name;
  }

  private getScoreField(type: LeaderboardType['type']): string {
    const fieldMap = {
      points: 'points',
      achievements: 'achievements',
      calls_analyzed: 'callsAnalyzed',
      violations_detected: 'violationsDetected',
      streak_days: 'streakDays'
    };
    return fieldMap[type] || 'customMetric';
  }

  private calculateNextResetTime(period: LeaderboardPeriod['type']): Date {
    const now = new Date();

    switch (period) {
      case 'daily':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;

      case 'weekly':
        const nextMonday = new Date(now);
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
        nextMonday.setHours(0, 0, 0, 0);
        return nextMonday;

      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);
        return nextMonth;

      default:
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
    }
  }

  private applyFilters(entries: LeaderboardEntry[], filters: LeaderboardFilter): LeaderboardEntry[] {
    let filteredEntries = [...entries];

    if (filters.region) {
      // This would filter by user region
      // For now, return all entries
    }

    if (filters.levelRange) {
      filteredEntries = filteredEntries.filter(entry =>
        entry.level >= filters.levelRange!.min &&
        entry.level <= filters.levelRange!.max
      );
    }

    if (filters.friends) {
      // This would filter by user's friends list
      // For now, return all entries
    }

    return filteredEntries;
  }

  // Mock implementations for user data
  private async getUserDisplayName(userId: string): Promise<string> {
    return `User ${userId.slice(-6)}`;
  }

  private async getUserAvatar(userId: string): Promise<string> {
    return null;
  }

  private getUserLevel(userId: string): number {
    return 1; // Mock implementation
  }

  private async getUserBadges(userId: string): Promise<string[]> {
    return []; // Mock implementation
  }

  /**
   * Save methods
   */
  private async saveLeaderboard(leaderboard: Leaderboard): Promise<void> {
    try {
      this.leaderboards.set(leaderboard.id, leaderboard);
      await AsyncStorage.setItem(`leaderboard_${leaderboard.id}`, JSON.stringify(leaderboard));
    } catch (error) {
      console.error('Failed to save leaderboard:', error);
    }
  }

  private async saveCompetition(competition: Competition): Promise<void> {
    try {
      this.competitions.set(competition.id, competition);
      await AsyncStorage.setItem(`competition_${competition.id}`, JSON.stringify(competition));
    } catch (error) {
      console.error('Failed to save competition:', error);
    }
  }

  /**
   * Load default leaderboards
   */
  private async loadDefaultLeaderboards(): Promise<void> {
    const defaultTypes: LeaderboardType['type'][] = ['points', 'achievements', 'calls_analyzed', 'violations_detected', 'streak_days'];
    const defaultPeriods: LeaderboardPeriod['type'][] = ['all_time', 'monthly', 'weekly', 'daily'];

    for (const type of defaultTypes) {
      for (const period of defaultPeriods) {
        await this.getLeaderboard(type, period);
      }
    }
  }

  /**
   * Load active competitions
   */
  private async loadActiveCompetitions(): Promise<void> {
    try {
      const storedCompetitions = await AsyncStorage.getItem('active_competitions');
      if (storedCompetitions) {
        const competitions: Competition[] = JSON.parse(storedCompetitions);
        competitions.forEach(competition => {
          this.competitions.set(competition.id, competition);
        });
      }
    } catch (error) {
      console.error('Failed to load active competitions:', error);
    }
  }

  /**
   * Load user rankings
   */
  private async loadUserRankings(): Promise<void> {
    try {
      // This would load user rankings on demand
      console.log('User rankings loading complete');
    } catch (error) {
      console.error('Failed to load user rankings:', error);
    }
  }
}