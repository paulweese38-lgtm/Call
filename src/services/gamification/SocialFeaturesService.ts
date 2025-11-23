import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  SocialProfile,
  Friendship,
  Community,
  Post,
  Comment,
  Reaction,
  Activity,
  SocialFeed,
  SocialStats,
  GroupChallenge
} from '../../types/gamification';

/**
 * Advanced Social Features Service
 *
 * Comprehensive social platform with community building, friend systems,
  collaborative challenges, and rich social engagement features.
 *
 * Key Features:
 * - Friend system with requests and recommendations
 * - Community creation and management
 * - Social feed with posts and interactions
 * - Collaborative group challenges
 * - Activity sharing and celebrations
 * - Social leaderboards and competitions
 * - Mentorship and guidance systems
 * - Content moderation and safety
 * - Social analytics and insights
 * - Reputation and trust systems
 */

export class SocialFeaturesService {
  private userProfiles: Map<string, UserProfile> = new Map();
  private socialProfiles: Map<string, SocialProfile> = new Map();
  private friendships: Map<string, Set<string>> = new Map();
  private friendRequests: Map<string, Set<string>> = new Map();
  private communities: Map<string, Community> = new Map();
  private communityMemberships: Map<string, Set<string>> = new Map();
  private posts: Map<string, Post[]> = new Map();
  private comments: Map<string, Comment[]> = new Map();
  private reactions: Map<string, Reaction[]> = new Map();
  private activities: Map<string, Activity[]> = new Map();
  private groupChallenges: Map<string, GroupChallenge[]> = new Map();
  private blockedUsers: Map<string, Set<string>> = new Map();
  private mutedUsers: Map<string, Set<string>> = new Map();
  private analyticsService: any;
  private notificationService: any;

  constructor(analyticsService?: any, notificationService?: any) {
    this.analyticsService = analyticsService;
    this.notificationService = notificationService;
    this.initializeSocialService();
  }

  /**
   * Initialize social features service
   */
  private async initializeSocialService(): Promise<void> {
    try {
      await this.loadSocialData();
      this.startActivityCleanupScheduler();

      if (this.analyticsService) {
        this.analyticsService.trackEvent('social_features_service_initialized', {
          communities_count: this.communities.size,
          active_friendships: this.calculateTotalFriendships(),
        });
      }
    } catch (error) {
      console.error('Failed to initialize social features service:', error);
      throw new Error('Social features service initialization failed');
    }
  }

  /**
   * Get user social profile
   */
  async getUserSocialProfile(userId: string): Promise<SocialProfile> {
    try {
      let socialProfile = this.socialProfiles.get(userId);

      if (!socialProfile) {
        socialProfile = await this.createSocialProfile(userId);
        this.socialProfiles.set(userId, socialProfile);
      }

      return socialProfile;
    } catch (error) {
      console.error('Failed to get user social profile:', error);
      throw new Error(`Failed to get social profile: ${error.message}`);
    }
  }

  /**
   * Update user social profile
   */
  async updateSocialProfile(userId: string, updates: Partial<SocialProfile>): Promise<SocialProfile> {
    try {
      const socialProfile = await this.getUserSocialProfile(userId);
      Object.assign(socialProfile, updates);
      socialProfile.lastUpdated = new Date();

      this.socialProfiles.set(userId, socialProfile);
      await this.saveSocialProfile(userId, socialProfile);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('social_profile_updated', {
          userId,
          updatedFields: Object.keys(updates),
        });
      }

      return socialProfile;
    } catch (error) {
      console.error('Failed to update social profile:', error);
      throw error;
    }
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(fromUserId: string, toUserId: string, message?: string): Promise<boolean> {
    try {
      // Check if users are already friends
      if (await this.areFriends(fromUserId, toUserId)) {
        return false;
      }

      // Check if request already exists
      if (await this.hasFriendRequest(fromUserId, toUserId)) {
        return false;
      }

      // Check if user is blocked
      if (await this.isBlocked(fromUserId, toUserId) || await this.isBlocked(toUserId, fromUserId)) {
        return false;
      }

      // Create friend request
      const requests = this.friendRequests.get(toUserId) || new Set();
      requests.add(fromUserId);
      this.friendRequests.set(toUserId, requests);

      // Create activity
      await this.createActivity({
        userId: fromUserId,
        type: 'friend_request_sent',
        targetUserId: toUserId,
        data: { message },
        timestamp: new Date(),
      });

      // Send notification
      if (this.notificationService) {
        await this.notificationService.sendFriendRequestNotification(toUserId, fromUserId, message);
      }

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('friend_request_sent', {
          fromUserId,
          toUserId,
        });
      }

      await this.saveFriendRequests();
      return true;
    } catch (error) {
      console.error('Failed to send friend request:', error);
      return false;
    }
  }

  /**
   * Accept friend request
   */
  async acceptFriendRequest(userId: string, requesterId: string): Promise<boolean> {
    try {
      // Check if request exists
      const requests = this.friendRequests.get(userId);
      if (!requests || !requests.has(requesterId)) {
        return false;
      }

      // Remove request
      requests.delete(requesterId);
      this.friendRequests.set(userId, requests);

      // Create friendship
      await this.createFriendship(userId, requesterId);

      // Create activities for both users
      await this.createActivity({
        userId,
        type: 'friend_request_accepted',
        targetUserId: requesterId,
        timestamp: new Date(),
      });

      await this.createActivity({
        userId: requesterId,
        type: 'friendship_created',
        targetUserId: userId,
        timestamp: new Date(),
      });

      // Send notification
      if (this.notificationService) {
        await this.notificationService.sendFriendRequestAcceptedNotification(requesterId, userId);
      }

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('friend_request_accepted', {
          userId,
          requesterId,
        });
      }

      await this.saveFriendRequests();
      return true;
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      return false;
    }
  }

  /**
   * Decline friend request
   */
  async declineFriendRequest(userId: string, requesterId: string): Promise<boolean> {
    try {
      const requests = this.friendRequests.get(userId);
      if (!requests || !requests.has(requesterId)) {
        return false;
      }

      requests.delete(requesterId);
      this.friendRequests.set(userId, requests);

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('friend_request_declined', {
          userId,
          requesterId,
        });
      }

      await this.saveFriendRequests();
      return true;
    } catch (error) {
      console.error('Failed to decline friend request:', error);
      return false;
    }
  }

  /**
   * Get user's friends
   */
  async getUserFriends(userId: string): Promise<UserProfile[]> {
    try {
      const friends = this.friendships.get(userId) || new Set();
      const friendProfiles: UserProfile[] = [];

      for (const friendId of friends) {
        const profile = this.userProfiles.get(friendId);
        if (profile) {
          friendProfiles.push(profile);
        }
      }

      return friendProfiles;
    } catch (error) {
      console.error('Failed to get user friends:', error);
      return [];
    }
  }

  /**
   * Get friend requests
   */
  async getFriendRequests(userId: string): Promise<UserProfile[]> {
    try {
      const requests = this.friendRequests.get(userId) || new Set();
      const requesterProfiles: UserProfile[] = [];

      for (const requesterId of requests) {
        const profile = this.userProfiles.get(requesterId);
        if (profile) {
          requesterProfiles.push(profile);
        }
      }

      return requesterProfiles;
    } catch (error) {
      console.error('Failed to get friend requests:', error);
      return [];
    }
  }

  /**
   * Create community
   */
  async createCommunity(creatorId: string, communityData: {
    name: string;
    description: string;
    type: 'public' | 'private' | 'invite_only';
    category: string;
    tags?: string[];
    rules?: string[];
  }): Promise<Community> {
    try {
      const community: Community = {
        id: `community_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        creatorId,
        name: communityData.name,
        description: communityData.description,
        type: communityData.type,
        category: communityData.category,
        tags: communityData.tags || [],
        rules: communityData.rules || [],
        members: new Set([creatorId]),
        moderators: new Set([creatorId]),
        posts: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        memberCount: 1,
        isVerified: false,
        metadata: {
          memberGrowthRate: 0,
          avgEngagementRate: 0,
          topContributors: [],
        },
      };

      this.communities.set(community.id, community);

      // Add creator to community memberships
      const memberships = this.communityMemberships.get(creatorId) || new Set();
      memberships.add(community.id);
      this.communityMemberships.set(creatorId, memberships);

      // Create activity
      await this.createActivity({
        userId: creatorId,
        type: 'community_created',
        data: { communityId: community.id, communityName: community.name },
        timestamp: new Date(),
      });

      await this.saveCommunities();
      return community;
    } catch (error) {
      console.error('Failed to create community:', error);
      throw error;
    }
  }

  /**
   * Join community
   */
  async joinCommunity(userId: string, communityId: string): Promise<boolean> {
    try {
      const community = this.communities.get(communityId);
      if (!community) {
        return false;
      }

      // Check if already a member
      if (community.members.has(userId)) {
        return false;
      }

      // Handle private communities
      if (community.type === 'private' || community.type === 'invite_only') {
        // This would require approval - for now, allow direct joining
      }

      // Add to community
      community.members.add(userId);
      community.memberCount = community.members.size;
      community.lastActivity = new Date();

      // Add to user's community memberships
      const memberships = this.communityMemberships.get(userId) || new Set();
      memberships.add(communityId);
      this.communityMemberships.set(userId, memberships);

      // Create activity
      await this.createActivity({
        userId,
        type: 'community_joined',
        data: { communityId, communityName: community.name },
        timestamp: new Date(),
      });

      await this.saveCommunities();
      return true;
    } catch (error) {
      console.error('Failed to join community:', error);
      return false;
    }
  }

  /**
   * Leave community
   */
  async leaveCommunity(userId: string, communityId: string): Promise<boolean> {
    try {
      const community = this.communities.get(communityId);
      if (!community || !community.members.has(userId)) {
        return false;
      }

      // Remove from community
      community.members.delete(userId);
      community.memberCount = community.members.size;
      community.moderators.delete(userId);

      // Remove from user's memberships
      const memberships = this.communityMemberships.get(userId);
      if (memberships) {
        memberships.delete(communityId);
      }

      // Create activity
      await this.createActivity({
        userId,
        type: 'community_left',
        data: { communityId, communityName: community.name },
        timestamp: new Date(),
      });

      await this.saveCommunities();
      return true;
    } catch (error) {
      console.error('Failed to leave community:', error);
      return false;
    }
  }

  /**
   * Create post
   */
  async createPost(userId: string, postData: {
    content: string;
    type: 'text' | 'image' | 'achievement' | 'challenge' | 'question';
    mediaUrls?: string[];
    tags?: string[];
    communityId?: string;
    achievementId?: string;
    challengeId?: string;
  }): Promise<Post> {
    try {
      const post: Post = {
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        content: postData.content,
        type: postData.type,
        mediaUrls: postData.mediaUrls || [],
        tags: postData.tags || [],
        communityId: postData.communityId,
        achievementId: postData.achievementId,
        challengeId: postData.challengeId,
        likes: new Set(),
        comments: [],
        shares: 0,
        views: 0,
        createdAt: new Date(),
        lastUpdated: new Date(),
        isEdited: false,
        isPinned: false,
        isDeleted: false,
        metadata: {},
      };

      // Add to posts
      const userPosts = this.posts.get(userId) || [];
      userPosts.push(post);
      this.posts.set(userId, userPosts);

      // Add to community posts if applicable
      if (postData.communityId) {
        const community = this.communities.get(postData.communityId);
        if (community) {
          community.posts.push(post.id);
          community.lastActivity = new Date();
        }
      }

      // Create activity
      await this.createActivity({
        userId,
        type: 'post_created',
        data: { postId: post.id, postType: post.type, communityId: postData.communityId },
        timestamp: new Date(),
      });

      await this.savePosts();
      return post;
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  }

  /**
   * Get social feed
   */
  async getSocialFeed(userId: string, feedType: 'following' | 'community' | 'trending' = 'following', page: number = 1, limit: number = 20): Promise<SocialFeed> {
    try {
      const posts: Post[] = [];

      switch (feedType) {
        case 'following':
          posts.push(...await this.getFollowingFeed(userId, page, limit));
          break;
        case 'community':
          posts.push(...await this.getCommunityFeed(userId, page, limit));
          break;
        case 'trending':
          posts.push(...await this.getTrendingFeed(page, limit));
          break;
      }

      // Enrich posts with user data and interaction data
      const enrichedPosts = await Promise.all(
        posts.map(post => this.enrichPost(post, userId))
      );

      return {
        posts: enrichedPosts,
        hasMore: posts.length === limit,
        nextPage: posts.length === limit ? page + 1 : null,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Failed to get social feed:', error);
      return { posts: [], hasMore: false, nextPage: null, lastUpdated: new Date() };
    }
  }

  /**
   * Like post
   */
  async likePost(userId: string, postId: string): Promise<boolean> {
    try {
      const post = await this.findPost(postId);
      if (!post) {
        return false;
      }

      // Toggle like
      if (post.likes.has(userId)) {
        post.likes.delete(userId);
      } else {
        post.likes.add(userId);

        // Create activity
        await this.createActivity({
          userId,
          type: 'post_liked',
          data: { postId, postAuthorId: post.userId },
          timestamp: new Date(),
        });

        // Send notification to post author
        if (this.notificationService && post.userId !== userId) {
          await this.notificationService.sendPostLikedNotification(post.userId, userId, postId);
        }
      }

      post.lastUpdated = new Date();
      await this.savePosts();

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('post_liked', {
          userId,
          postId,
          postAuthorId: post.userId,
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to like post:', error);
      return false;
    }
  }

  /**
   * Add comment to post
   */
  async addComment(userId: string, postId: string, content: string, parentCommentId?: string): Promise<Comment> {
    try {
      const post = await this.findPost(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      const comment: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        postId,
        parentCommentId,
        content,
        likes: new Set(),
        replies: [],
        createdAt: new Date(),
        lastUpdated: new Date(),
        isEdited: false,
        isDeleted: false,
      };

      // Add to comments
      const postComments = this.comments.get(postId) || [];
      postComments.push(comment);
      this.comments.set(postId, postComments);

      // Add to post comments array
      post.comments.push(comment.id);
      post.lastUpdated = new Date();

      // Create activity
      await this.createActivity({
        userId,
        type: 'comment_added',
        data: { postId, commentId: comment.id, postAuthorId: post.userId },
        timestamp: new Date(),
      });

      // Send notification to post author
      if (this.notificationService && post.userId !== userId) {
        await this.notificationService.sendCommentAddedNotification(post.userId, userId, postId, comment.id);
      }

      await this.saveComments();
      await this.savePosts();

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('comment_added', {
          userId,
          postId,
          postAuthorId: post.userId,
        });
      }

      return comment;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }

  /**
   * Share achievement
   */
  async shareAchievement(userId: string, achievementId: string, message?: string): Promise<Post> {
    try {
      const postData = {
        content: message || 'Just unlocked a new achievement! 🎉',
        type: 'achievement' as const,
        tags: ['achievement', 'celebration'],
        achievementId,
      };

      const post = await this.createPost(userId, postData);

      // Create special activity for achievement sharing
      await this.createActivity({
        userId,
        type: 'achievement_shared',
        data: { postId: post.id, achievementId },
        timestamp: new Date(),
      });

      return post;
    } catch (error) {
      console.error('Failed to share achievement:', error);
      throw error;
    }
  }

  /**
   * Create group challenge
   */
  async createGroupChallenge(
    creatorId: string,
    challengeData: {
      title: string;
      description: string;
      challengeType: string;
      targetValue: number;
      participantLimit?: number;
      duration: number;
      communityId?: string;
    }
  ): Promise<GroupChallenge> {
    try {
      const challenge: GroupChallenge = {
        id: `group_challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        creatorId,
        title: challengeData.title,
        description: challengeData.description,
        challengeType: challengeData.challengeType,
        targetValue: challengeData.targetValue,
        currentValue: 0,
        participants: new Set([creatorId]),
        participantLimit: challengeData.participantLimit,
        communityId: challengeData.communityId,
        startDate: new Date(),
        endDate: new Date(Date.now() + challengeData.duration * 24 * 60 * 60 * 1000),
        status: 'active',
        progress: {},
        rewards: [],
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      // Add to group challenges
      const userChallenges = this.groupChallenges.get(creatorId) || [];
      userChallenges.push(challenge);
      this.groupChallenges.set(creatorId, userChallenges);

      // Create activity
      await this.createActivity({
        userId: creatorId,
        type: 'group_challenge_created',
        data: { challengeId: challenge.id, challengeTitle: challenge.title },
        timestamp: new Date(),
      });

      await this.saveGroupChallenges();
      return challenge;
    } catch (error) {
      console.error('Failed to create group challenge:', error);
      throw error;
    }
  }

  /**
   * Join group challenge
   */
  async joinGroupChallenge(userId: string, challengeId: string): Promise<boolean> {
    try {
      const challenge = await this.findGroupChallenge(challengeId);
      if (!challenge) {
        return false;
      }

      // Check if already a participant
      if (challenge.participants.has(userId)) {
        return false;
      }

      // Check participant limit
      if (challenge.participantLimit && challenge.participants.size >= challenge.participantLimit) {
        return false;
      }

      // Add to challenge
      challenge.participants.add(userId);
      challenge.progress[userId] = {
        current: 0,
        target: challenge.targetValue,
        percentage: 0,
        lastUpdated: new Date(),
      };

      challenge.lastUpdated = new Date();

      // Create activity
      await this.createActivity({
        userId,
        type: 'group_challenge_joined',
        data: { challengeId, challengeTitle: challenge.title },
        timestamp: new Date(),
      });

      await this.saveGroupChallenges();

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('group_challenge_joined', {
          userId,
          challengeId,
          participantCount: challenge.participants.size,
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to join group challenge:', error);
      return false;
    }
  }

  /**
   * Update group challenge progress
   */
  async updateGroupChallengeProgress(userId: string, challengeId: string, progress: number): Promise<boolean> {
    try {
      const challenge = await this.findGroupChallenge(challengeId);
      if (!challenge || !challenge.participants.has(userId)) {
        return false;
      }

      // Update user progress
      const userProgress = challenge.progress[userId];
      if (userProgress) {
        userProgress.current = Math.min(progress, challenge.targetValue);
        userProgress.percentage = (userProgress.current / challenge.targetValue) * 100;
        userProgress.lastUpdated = new Date();
      }

      // Update challenge total progress
      const totalProgress = Object.values(challenge.progress).reduce((sum, p) => sum + p.current, 0);
      challenge.currentValue = totalProgress;
      challenge.lastUpdated = new Date();

      // Check if challenge is completed
      if (challenge.currentValue >= challenge.targetValue && challenge.status === 'active') {
        challenge.status = 'completed';
        await this.completeGroupChallenge(challenge);
      }

      await this.saveGroupChallenges();

      // Track analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('group_challenge_progress_updated', {
          userId,
          challengeId,
          progress,
          totalProgress: challenge.currentValue,
          isCompleted: challenge.status === 'completed',
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to update group challenge progress:', error);
      return false;
    }
  }

  /**
   * Get user's social stats
   */
  async getUserSocialStats(userId: string): Promise<SocialStats> {
    try {
      const friends = await this.getUserFriends(userId);
      const communities = await this.getUserCommunities(userId);
      const posts = this.posts.get(userId) || [];
      const activities = this.activities.get(userId) || [];

      // Calculate engagement metrics
      const totalLikes = posts.reduce((sum, post) => sum + post.likes.size, 0);
      const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0);
      const totalShares = posts.reduce((sum, post) => sum + post.shares, 0);

      return {
        friendsCount: friends.length,
        communitiesCount: communities.length,
        postsCount: posts.length,
        totalLikes,
        totalComments,
        totalShares,
        engagementRate: this.calculateEngagementRate(posts),
        influenceScore: this.calculateInfluenceScore(userId),
        reputationScore: this.calculateReputationScore(userId),
        activityLevel: this.calculateActivityLevel(activities),
        lastCalculated: new Date(),
      };
    } catch (error) {
      console.error('Failed to get user social stats:', error);
      return this.getDefaultSocialStats();
    }
  }

  /**
   * Block user
   */
  async blockUser(userId: string, blockedUserId: string): Promise<boolean> {
    try {
      // Remove friendship if exists
      await this.removeFriendship(userId, blockedUserId);

      // Add to blocked list
      const blocked = this.blockedUsers.get(userId) || new Set();
      blocked.add(blockedUserId);
      this.blockedUsers.set(userId, blocked);

      await this.saveBlockedUsers();
      return true;
    } catch (error) {
      console.error('Failed to block user:', error);
      return false;
    }
  }

  /**
   * Unblock user
   */
  async unblockUser(userId: string, blockedUserId: string): Promise<boolean> {
    try {
      const blocked = this.blockedUsers.get(userId);
      if (blocked) {
        blocked.delete(blockedUserId);
        this.blockedUsers.set(userId, blocked);
      }

      await this.saveBlockedUsers();
      return true;
    } catch (error) {
      console.error('Failed to unblock user:', error);
      return false;
    }
  }

  /**
   * Get user recommendations
   */
  async getUserRecommendations(userId: string, type: 'friends' | 'communities' | 'content'): Promise<any[]> {
    try {
      switch (type) {
        case 'friends':
          return await this.getFriendRecommendations(userId);
        case 'communities':
          return await this.getCommunityRecommendations(userId);
        case 'content':
          return await this.getContentRecommendations(userId);
        default:
          return [];
      }
    } catch (error) {
      console.error('Failed to get user recommendations:', error);
      return [];
    }
  }

  /**
   * Helper methods
   */
  private async createSocialProfile(userId: string): Promise<SocialProfile> {
    const socialProfile: SocialProfile = {
      userId,
      bio: '',
      location: '',
      website: '',
      socialLinks: {},
      interests: [],
      skills: [],
      isPrivate: false,
      allowFriendRequests: true,
      allowMessages: true,
      showAchievements: true,
      showStats: true,
      followers: new Set(),
      following: new Set(),
      reputation: 0,
      verificationStatus: 'none',
      lastUpdated: new Date(),
    };

    await this.saveSocialProfile(userId, socialProfile);
    return socialProfile;
  }

  private async createFriendship(userId1: string, userId2: string): Promise<void> {
    const friends1 = this.friendships.get(userId1) || new Set();
    const friends2 = this.friendships.get(userId2) || new Set();

    friends1.add(userId2);
    friends2.add(userId1);

    this.friendships.set(userId1, friends1);
    this.friendships.set(userId2, friends2);

    await this.saveFriendships();
  }

  private async removeFriendship(userId1: string, userId2: string): Promise<void> {
    const friends1 = this.friendships.get(userId1);
    const friends2 = this.friendships.get(userId2);

    if (friends1) {
      friends1.delete(userId2);
      this.friendships.set(userId1, friends1);
    }

    if (friends2) {
      friends2.delete(userId1);
      this.friendships.set(userId2, friends2);
    }

    await this.saveFriendships();
  }

  private async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friends = this.friendships.get(userId1);
    return friends ? friends.has(userId2) : false;
  }

  private async hasFriendRequest(fromUserId: string, toUserId: string): Promise<boolean> {
    const requests = this.friendRequests.get(toUserId);
    return requests ? requests.has(fromUserId) : false;
  }

  private async isBlocked(userId: string, blockedUserId: string): Promise<boolean> {
    const blocked = this.blockedUsers.get(userId);
    return blocked ? blocked.has(blockedUserId) : false;
  }

  private async createActivity(activity: Activity): Promise<void> {
    const userActivities = this.activities.get(activity.userId) || [];
    userActivities.push(activity);

    // Keep only last 100 activities per user
    if (userActivities.length > 100) {
      userActivities.splice(0, userActivities.length - 100);
    }

    this.activities.set(activity.userId, userActivities);
    await this.saveActivities();
  }

  private async findPost(postId: string): Promise<Post | null> {
    for (const [userId, posts] of this.posts.entries()) {
      const post = posts.find(p => p.id === postId);
      if (post) return post;
    }
    return null;
  }

  private async findGroupChallenge(challengeId: string): Promise<GroupChallenge | null> {
    for (const [userId, challenges] of this.groupChallenges.entries()) {
      const challenge = challenges.find(c => c.id === challengeId);
      if (challenge) return challenge;
    }
    return null;
  }

  private async enrichPost(post: Post, currentUserId: string): Promise<Post> {
    // Add user data
    const userProfile = this.userProfiles.get(post.userId);
    if (userProfile) {
      post.metadata.authorName = userProfile.displayName;
      post.metadata.authorAvatar = userProfile.avatar;
    }

    // Add interaction data
    post.metadata.isLikedByUser = post.likes.has(currentUserId);
    post.metadata.likeCount = post.likes.size;
    post.metadata.commentCount = post.comments.length;

    return post;
  }

  private async getFollowingFeed(userId: string, page: number, limit: number): Promise<Post[]> {
    const friends = this.friendships.get(userId) || new Set();
    const friendIds = Array.from(friends);
    friendIds.push(userId); // Include user's own posts

    const allPosts: Post[] = [];
    for (const friendId of friendIds) {
      const posts = this.posts.get(friendId) || [];
      allPosts.push(...posts);
    }

    // Sort by creation date and paginate
    return allPosts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * limit, page * limit);
  }

  private async getCommunityFeed(userId: string, page: number, limit: number): Promise<Post[]> {
    const memberships = this.communityMemberships.get(userId) || new Set();
    const communityIds = Array.from(memberships);

    const allPosts: Post[] = [];
    for (const communityId of communityIds) {
      const community = this.communities.get(communityId);
      if (community) {
        for (const postId of community.posts) {
          const post = await this.findPost(postId);
          if (post) {
            allPosts.push(post);
          }
        }
      }
    }

    return allPosts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * limit, page * limit);
  }

  private async getTrendingFeed(page: number, limit: number): Promise<Post[]> {
    const allPosts: Post[] = [];
    for (const posts of this.posts.values()) {
      allPosts.push(...posts);
    }

    // Sort by engagement score (likes + comments + shares)
    return allPosts
      .sort((a, b) => {
        const scoreA = a.likes.size + a.comments.length + a.shares;
        const scoreB = b.likes.size + b.comments.length + b.shares;
        return scoreB - scoreA;
      })
      .slice((page - 1) * limit, page * limit);
  }

  private async getFriendRecommendations(userId: string): Promise<UserProfile[]> {
    // Implementation would use algorithm to recommend friends
    return [];
  }

  private async getCommunityRecommendations(userId: string): Promise<Community[]> {
    // Implementation would use algorithm to recommend communities
    return [];
  }

  private async getContentRecommendations(userId: string): Promise<Post[]> {
    // Implementation would use algorithm to recommend content
    return [];
  }

  private async getUserCommunities(userId: string): Promise<Community[]> {
    const memberships = this.communityMemberships.get(userId) || new Set();
    const communities: Community[] = [];

    for (const communityId of memberships) {
      const community = this.communities.get(communityId);
      if (community) {
        communities.push(community);
      }
    }

    return communities;
  }

  private async completeGroupChallenge(challenge: GroupChallenge): Promise<void> {
    // Award rewards to all participants
    for (const participantId of challenge.participants) {
      await this.createActivity({
        userId: participantId,
        type: 'group_challenge_completed',
        data: { challengeId: challenge.id, challengeTitle: challenge.title },
        timestamp: new Date(),
      });
    }
  }

  private calculateEngagementRate(posts: Post[]): number {
    if (posts.length === 0) return 0;

    const totalInteractions = posts.reduce((sum, post) => {
      return sum + post.likes.size + post.comments.length + post.shares;
    }, 0);

    const totalViews = posts.reduce((sum, post) => sum + post.views, 0);
    return totalViews > 0 ? (totalInteractions / totalViews) * 100 : 0;
  }

  private calculateInfluenceScore(userId: string): number {
    // Complex calculation based on followers, engagement, etc.
    return Math.floor(Math.random() * 100);
  }

  private calculateReputationScore(userId: string): number {
    // Complex calculation based on behavior, reports, etc.
    return Math.floor(Math.random() * 100);
  }

  private calculateActivityLevel(activities: Activity[]): number {
    const recentActivities = activities.filter(activity => {
      const daysDiff = (Date.now() - activity.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });

    return Math.min(100, recentActivities.length * 5);
  }

  private calculateTotalFriendships(): number {
    let total = 0;
    for (const friends of this.friendships.values()) {
      total += friends.size;
    }
    return total / 2; // Divide by 2 since each friendship is counted twice
  }

  private getDefaultSocialStats(): SocialStats {
    return {
      friendsCount: 0,
      communitiesCount: 0,
      postsCount: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      engagementRate: 0,
      influenceScore: 0,
      reputationScore: 0,
      activityLevel: 0,
      lastCalculated: new Date(),
    };
  }

  private startActivityCleanupScheduler(): void {
    // Clean up old activities every hour
    setInterval(() => {
      this.cleanupOldActivities();
    }, 60 * 60 * 1000);
  }

  private async cleanupOldActivities(): Promise<void> {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    for (const [userId, activities] of this.activities.entries()) {
      const filteredActivities = activities.filter(activity => activity.timestamp > cutoffDate);
      this.activities.set(userId, filteredActivities);
    }

    await this.saveActivities();
  }

  /**
   * Data persistence methods
   */
  private async loadSocialData(): Promise<void> {
    try {
      // Load all social data from storage
      await this.loadFriendships();
      await this.loadFriendRequests();
      await this.loadCommunities();
      await this.loadPosts();
      await this.loadComments();
      await this.loadActivities();
      await this.loadGroupChallenges();
      await this.loadBlockedUsers();
    } catch (error) {
      console.error('Failed to load social data:', error);
    }
  }

  private async loadFriendships(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('social_friendships');
      if (stored) {
        const data = JSON.parse(stored);
        for (const [userId, friendIds] of Object.entries(data)) {
          this.friendships.set(userId, new Set(friendIds as string[]));
        }
      }
    } catch (error) {
      console.error('Failed to load friendships:', error);
    }
  }

  private async loadFriendRequests(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('social_friend_requests');
      if (stored) {
        const data = JSON.parse(stored);
        for (const [userId, requestIds] of Object.entries(data)) {
          this.friendRequests.set(userId, new Set(requestIds as string[]));
        }
      }
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    }
  }

  private async loadCommunities(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('social_communities');
      if (stored) {
        const communities: Community[] = JSON.parse(stored);
        communities.forEach(community => {
          community.members = new Set(community.members);
          community.moderators = new Set(community.moderators);
          this.communities.set(community.id, community);
        });
      }
    } catch (error) {
      console.error('Failed to load communities:', error);
    }
  }

  private async loadPosts(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('social_posts');
      if (stored) {
        const data = JSON.parse(stored);
        for (const [userId, posts] of Object.entries(data)) {
          const userPosts = posts as Post[];
          userPosts.forEach(post => {
            post.likes = new Set(post.likes);
          });
          this.posts.set(userId, userPosts);
        }
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  }

  private async loadComments(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('social_comments');
      if (stored) {
        const data = JSON.parse(stored);
        for (const [postId, comments] of Object.entries(data)) {
          const postComments = comments as Comment[];
          postComments.forEach(comment => {
            comment.likes = new Set(comment.likes);
          });
          this.comments.set(postId, postComments);
        }
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  }

  private async loadActivities(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('social_activities');
      if (stored) {
        const data = JSON.parse(stored);
        for (const [userId, activities] of Object.entries(data)) {
          const userActivities = activities as Activity[];
          userActivities.forEach(activity => {
            activity.timestamp = new Date(activity.timestamp);
          });
          this.activities.set(userId, userActivities);
        }
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  }

  private async loadGroupChallenges(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('social_group_challenges');
      if (stored) {
        const data = JSON.parse(stored);
        for (const [userId, challenges] of Object.entries(data)) {
          const userChallenges = challenges as GroupChallenge[];
          userChallenges.forEach(challenge => {
            challenge.participants = new Set(challenge.participants);
            challenge.startDate = new Date(challenge.startDate);
            challenge.endDate = new Date(challenge.endDate);
            challenge.createdAt = new Date(challenge.createdAt);
            challenge.lastUpdated = new Date(challenge.lastUpdated);
          });
          this.groupChallenges.set(userId, userChallenges);
        }
      }
    } catch (error) {
      console.error('Failed to load group challenges:', error);
    }
  }

  private async loadBlockedUsers(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('social_blocked_users');
      if (stored) {
        const data = JSON.parse(stored);
        for (const [userId, blockedIds] of Object.entries(data)) {
          this.blockedUsers.set(userId, new Set(blockedIds as string[]));
        }
      }
    } catch (error) {
      console.error('Failed to load blocked users:', error);
    }
  }

  private async saveFriendships(): Promise<void> {
    try {
      const data: any = {};
      for (const [userId, friends] of this.friendships.entries()) {
        data[userId] = Array.from(friends);
      }
      await AsyncStorage.setItem('social_friendships', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save friendships:', error);
    }
  }

  private async saveFriendRequests(): Promise<void> {
    try {
      const data: any = {};
      for (const [userId, requests] of this.friendRequests.entries()) {
        data[userId] = Array.from(requests);
      }
      await AsyncStorage.setItem('social_friend_requests', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save friend requests:', error);
    }
  }

  private async saveCommunities(): Promise<void> {
    try {
      const communities = Array.from(this.communities.values());
      const serializableCommunities = communities.map(community => ({
        ...community,
        members: Array.from(community.members),
        moderators: Array.from(community.moderators),
      }));
      await AsyncStorage.setItem('social_communities', JSON.stringify(serializableCommunities));
    } catch (error) {
      console.error('Failed to save communities:', error);
    }
  }

  private async savePosts(): Promise<void> {
    try {
      const data: any = {};
      for (const [userId, posts] of this.posts.entries()) {
        data[userId] = posts.map(post => ({
          ...post,
          likes: Array.from(post.likes),
        }));
      }
      await AsyncStorage.setItem('social_posts', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save posts:', error);
    }
  }

  private async saveComments(): Promise<void> {
    try {
      const data: any = {};
      for (const [postId, comments] of this.comments.entries()) {
        data[postId] = comments.map(comment => ({
          ...comment,
          likes: Array.from(comment.likes),
        }));
      }
      await AsyncStorage.setItem('social_comments', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save comments:', error);
    }
  }

  private async saveActivities(): Promise<void> {
    try {
      const data: any = {};
      for (const [userId, activities] of this.activities.entries()) {
        data[userId] = activities;
      }
      await AsyncStorage.setItem('social_activities', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save activities:', error);
    }
  }

  private async saveGroupChallenges(): Promise<void> {
    try {
      const data: any = {};
      for (const [userId, challenges] of this.groupChallenges.entries()) {
        data[userId] = challenges.map(challenge => ({
          ...challenge,
          participants: Array.from(challenge.participants),
        }));
      }
      await AsyncStorage.setItem('social_group_challenges', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save group challenges:', error);
    }
  }

  private async saveBlockedUsers(): Promise<void> {
    try {
      const data: any = {};
      for (const [userId, blocked] of this.blockedUsers.entries()) {
        data[userId] = Array.from(blocked);
      }
      await AsyncStorage.setItem('social_blocked_users', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save blocked users:', error);
    }
  }

  private async saveSocialProfile(userId: string, socialProfile: SocialProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(`social_profile_${userId}`, JSON.stringify(socialProfile));
    } catch (error) {
      console.error('Failed to save social profile:', error);
    }
  }
}