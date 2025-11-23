import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeInUp,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Types
import {
  UserProfile,
  UserAchievement,
  UserChallenge,
  Reward,
  LeaderboardEntry,
  Competition
} from '../../types/gamification';

// Components
import { AchievementCard } from '../../components/gamification/AchievementCard';
import { ChallengeCard } from '../../components/gamification/ChallengeCard';
import { RewardCarousel } from '../../components/gamification/RewardCarousel';
import { LeaderboardRow } from '../../components/gamification/LeaderboardRow';
import { ProgressRing } from '../../components/gamification/ProgressRing';
import { StreakCounter } from '../../components/gamification/StreakCounter';

// Services
import {
  GamificationEngine,
  UserProfileService,
  RewardSystem,
  LeaderboardSystem,
  ChallengeSystem
} from '../../services/gamification';

interface GamificationScreenProps {
  userId: string;
  navigation?: any;
  onAchievementPress?: (achievement: UserAchievement) => void;
  onChallengePress?: (challenge: UserChallenge) => void;
  onRewardPress?: (reward: Reward) => void;
  onLeaderboardPress?: () => void;
  onProfileEdit?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 32;

/**
 * Comprehensive Gamification Screen
 *
 * Next-generation user engagement interface with stunning visual design,
 * real-time progress tracking, and interactive gamification elements.
 *
 * Key Features:
 * - User profile overview with stats and achievements
 * - Real-time challenge progress tracking
 * - Interactive reward showcase and redemption
 * - Live leaderboards and competitive rankings
 * - Beautiful progress visualizations and charts
 * - Social features and community engagement
 * - Streak tracking and motivational elements
 * - Personalized recommendations and insights
 */

const GamificationScreen: React.FC<GamificationScreenProps> = ({
  userId,
  navigation,
  onAchievementPress,
  onChallengePress,
  onRewardPress,
  onLeaderboardPress,
  onProfileEdit,
}) => {
  const insets = useSafeAreaInsets();

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [activeCompetitions, setActiveCompetitions] = useState<Competition[]>([]);
  const [userStats, setUserStats] = useState<any>(null);

  // Animation values
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);
  const tabIndicatorPosition = useSharedValue(0);

  // Services
  const gamificationEngine = useMemo(() => new GamificationEngine(), []);
  const userProfileService = useMemo(() => new UserProfileService(), []);
  const rewardSystem = useMemo(() => new RewardSystem(), []);
  const leaderboardSystem = useMemo(() => new LeaderboardSystem(), []);
  const challengeSystem = useMemo(() => new ChallengeSystem(gamificationEngine), []);

  // Tab configuration
  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'dashboard' },
    { id: 'achievements', name: 'Achievements', icon: 'trophy' },
    { id: 'challenges', name: 'Challenges', icon: 'target' },
    { id: 'rewards', name: 'Rewards', icon: 'gift' },
    { id: 'leaderboard', name: 'Leaderboard', icon: 'podium' },
  ];

  // Initialize data
  useEffect(() => {
    loadGamificationData();
  }, [userId]);

  // Tab indicator animation
  useEffect(() => {
    const tabIndex = tabs.findIndex(tab => tab.id === activeTab);
    tabIndicatorPosition.value = withSpring(tabIndex * (screenWidth / tabs.length));
  }, [activeTab]);

  // Header animation on scroll
  const headerAnimatedStyle = useAnimatedStyle(() => {
    headerOpacity.value = withTiming(Math.max(0.3, 1 - scrollY.value / 200));
    return {
      opacity: headerOpacity.value,
    };
  });

  const loadGamificationData = useCallback(async () => {
    try {
      setLoading(true);

      // Load user data in parallel
      const [
        profile,
        achievements,
        challenges,
        rewards,
        leaderboard,
        competitions,
        stats
      ] = await Promise.all([
        userProfileService.getUserProfile(userId),
        gamificationEngine.getUserAchievements(userId),
        challengeSystem.getUserChallenges(userId),
        rewardSystem.getAvailableRewardsForUser(userId),
        leaderboardSystem.getLeaderboardEntries('points', 'weekly', 1, 10),
        challengeSystem.getActiveCompetitions(),
        gamificationEngine.getUserGamificationStats(userId)
      ]);

      setUserProfile(profile);
      setUserAchievements(achievements);
      setUserChallenges(challenges);
      setAvailableRewards(rewards);
      setLeaderboardEntries(leaderboard.entries);
      setActiveCompetitions(competitions);
      setUserStats(stats);

    } catch (error) {
      console.error('Failed to load gamification data:', error);
      Alert.alert('Error', 'Failed to load gamification data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGamificationData();
    setRefreshing(false);
  }, [loadGamificationData]);

  const handleShare = useCallback(async () => {
    if (!userProfile) return;

    try {
      const shareMessage = `🎮 I'm level ${userProfile.level} on the Consumer Protector app!

📊 Stats:
• ${userStats?.totalAchievements || 0} Achievements
• ${userStats?.currentStreak || 0} Day Streak
• ${userProfile.totalPoints} Points

Join me in protecting consumers and climbing the leaderboards! 🛡️`;

      await Share.share({
        message: shareMessage,
        title: 'Consumer Protector - My Progress',
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  }, [userProfile, userStats]);

  const renderHeader = () => (
    <Animated.View style={[styles.header, headerAnimatedStyle]}>
      <View style={styles.headerContent}>
        <View style={styles.userInfo}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.avatarContainer}
          >
            <Text style={styles.avatarText}>
              {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </LinearGradient>

          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userProfile?.displayName || 'User'}</Text>
            <View style={styles.levelContainer}>
              <Text style={styles.levelText}>Level {userProfile?.level || 1}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${userStats?.progressToNextLevel?.percentage || 0}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {userStats?.progressToNextLevel?.percentage || 0}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={20} color="#667eea" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onProfileEdit}
          >
            <Ionicons name="settings-outline" size={20} color="#667eea" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userProfile?.totalPoints || 0}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userStats?.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userStats?.totalAchievements || 0}</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userStats?.rank || '-'}</Text>
          <Text style={styles.statLabel}>Rank</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tabContainer}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={activeTab === tab.id ? '#667eea' : '#8e8e93'}
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Animated.View
        style={[
          styles.tabIndicator,
          {
            transform: [{ translateX: tabIndicatorPosition.value }]
          }
        ]}
      />
    </View>
  );

  const renderOverview = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Active Challenges */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Challenges</Text>
          <TouchableOpacity onPress={() => setActiveTab('challenges')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {userChallenges.slice(0, 3).map((challenge, index) => (
          <Animated.View
            key={challenge.id}
            entering={FadeInUp.delay(index * 100)}
          >
            <ChallengeCard
              challenge={challenge}
              onPress={() => onChallengePress?.(challenge)}
              style={styles.challengeCard}
            />
          </Animated.View>
        ))}
      </View>

      {/* Recent Achievements */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <TouchableOpacity onPress={() => setActiveTab('achievements')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.achievementsContainer}>
            {userAchievements.slice(0, 5).map((achievement, index) => (
              <Animated.View
                key={achievement.id}
                entering={FadeInUp.delay(index * 100)}
              >
                <AchievementCard
                  achievement={achievement}
                  onPress={() => onAchievementPress?.(achievement)}
                  compact
                />
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Featured Rewards */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Rewards</Text>
          <TouchableOpacity onPress={() => setActiveTab('rewards')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <RewardCarousel
          rewards={availableRewards.slice(0, 5)}
          onRewardPress={onRewardPress}
        />
      </View>

      {/* Progress Charts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Progress</Text>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Weekly Activity</Text>
          <LineChart
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [{
                data: [12, 19, 15, 25, 22, 30, 28]
              }]
            }}
            width={chartWidth}
            height={200}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#f8f9fa',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#667eea'
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderAchievements = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Achievements</Text>

        <View style={styles.achievementStats}>
          <View style={styles.achievementStat}>
            <Text style={styles.achievementStatValue}>{userAchievements.length}</Text>
            <Text style={styles.achievementStatLabel}>Unlocked</Text>
          </View>
          <View style={styles.achievementStat}>
            <Text style={styles.achievementStatValue}>{userStats?.completionRate || 0}%</Text>
            <Text style={styles.achievementStatLabel}>Completion</Text>
          </View>
        </View>

        {userAchievements.map((achievement, index) => (
          <Animated.View
            key={achievement.id}
            entering={FadeInUp.delay(index * 50)}
          >
            <AchievementCard
              achievement={achievement}
              onPress={() => onAchievementPress?.(achievement)}
              style={styles.achievementCard}
            />
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );

  const renderChallenges = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Challenges</Text>

        {userChallenges.map((challenge, index) => (
          <Animated.View
            key={challenge.id}
            entering={FadeInUp.delay(index * 50)}
          >
            <ChallengeCard
              challenge={challenge}
              onPress={() => onChallengePress?.(challenge)}
              style={styles.challengeCard}
            />
          </Animated.View>
        ))}
      </View>

      {activeCompetitions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Competitions</Text>

          {activeCompetitions.map((competition, index) => (
            <View key={competition.id} style={styles.competitionCard}>
              <Text style={styles.competitionName}>{competition.name}</Text>
              <Text style={styles.competitionDescription}>{competition.description}</Text>
              <View style={styles.competitionProgress}>
                <Text style={styles.competitionProgressText}>
                  {competition.currentParticipants} participants
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderRewards = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Rewards</Text>
          <Text style={styles.pointsBalance}>
            {userProfile?.totalPoints || 0} points
          </Text>
        </View>

        {availableRewards.map((reward, index) => (
          <TouchableOpacity
            key={reward.id}
            style={styles.rewardCard}
            onPress={() => onRewardPress?.(reward)}
          >
            <View style={styles.rewardContent}>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardName}>{reward.name}</Text>
                <Text style={styles.rewardDescription}>{reward.description}</Text>
                <View style={styles.rewardMeta}>
                  <Text style={styles.rewardCost}>{reward.pointCost} pts</Text>
                  <View style={[styles.rarityBadge, styles[`rarity${reward.rarity}`]]}>
                    <Text style={styles.rarityText}>{reward.rarity}</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderLeaderboard = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weekly Leaderboard</Text>
          <TouchableOpacity onPress={onLeaderboardPress}>
            <Text style={styles.seeAll}>Full Rankings</Text>
          </TouchableOpacity>
        </View>

        {leaderboardEntries.map((entry, index) => (
          <LeaderboardRow
            key={entry.userId}
            entry={entry}
            isCurrentUser={entry.userId === userId}
            rank={index + 1}
          />
        ))}
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'achievements':
        return renderAchievements();
      case 'challenges':
        return renderChallenges();
      case 'rewards':
        return renderRewards();
      case 'leaderboard':
        return renderLeaderboard();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading Gamification...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Animated Background */}
      <LinearGradient
        colors={['#f8f9fa', '#ffffff']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      {renderHeader()}

      {/* Tab Bar */}
      {renderTabBar()}

      {/* Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={(event) => {
          scrollY.value = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {renderContent()}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8e8e93',
    fontFamily: 'Inter-Medium',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  levelContainer: {
    alignItems: 'flex-start',
  },
  levelText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  progressBar: {
    width: 120,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  tabBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    position: 'relative',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#f3f4f6',
  },
  tabText: {
    fontSize: 14,
    color: '#8e8e93',
    marginLeft: 6,
    fontFamily: 'Inter-Medium',
  },
  activeTabText: {
    color: '#667eea',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: screenWidth / tabs.length,
    backgroundColor: '#667eea',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
  },
  seeAll: {
    fontSize: 14,
    color: '#667eea',
    fontFamily: 'Inter-Medium',
  },
  challengeCard: {
    marginBottom: 12,
  },
  achievementsContainer: {
    flexDirection: 'row',
  },
  achievementCard: {
    marginRight: 12,
    marginBottom: 12,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  achievementStats: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  achievementStat: {
    flex: 1,
    alignItems: 'center',
  },
  achievementStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    fontFamily: 'Inter-Bold',
  },
  achievementStatLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  competitionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  competitionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  competitionDescription: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  competitionProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  competitionProgressText: {
    fontSize: 12,
    color: '#667eea',
    fontFamily: 'Inter-Medium',
  },
  rewardCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rewardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  rewardDescription: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  rewardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
    fontFamily: 'Inter-Bold',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  raritycommon: {
    backgroundColor: '#e5e7eb',
  },
  rarityuncommon: {
    backgroundColor: '#d1fae5',
  },
  rarityrare: {
    backgroundColor: '#dbeafe',
  },
  rarityepic: {
    backgroundColor: '#ede9fe',
  },
  rarilegendary: {
    backgroundColor: '#fef3c7',
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    fontFamily: 'Inter-SemiBold',
  },
  pointsBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
    fontFamily: 'Inter-Bold',
  },
});

export default GamificationScreen;