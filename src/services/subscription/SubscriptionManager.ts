/**
 * CallWall Subscription Management System
 * Comprehensive subscription tier management with feature gating, billing, and analytics
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  price: PricingInfo;
  billingCycle: BillingCycle[];
  features: PlanFeature[];
  limits: UsageLimits;
  trialPeriod: TrialInfo;
  targetAudience: string[];
  benefits: Benefit[];
  popularFeatures: string[];
  competitiveAdvantages: CompetitiveAdvantage[];
}

export interface PricingInfo {
  monthly: number;
  annual: number;
  currency: string;
  setupFee?: number;
  discounts: DiscountInfo[];
  taxIncluded: boolean;
  priceIncreaseProtection: boolean;
}

export interface BillingCycle {
  type: 'monthly' | 'annual' | 'quarterly' | 'biennial';
  price: number;
  savings: number; // percentage savings compared to monthly
  features: string[]; // additional features for this cycle
  popular: boolean;
}

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  enabled: boolean;
  usage: FeatureUsage;
  limitations: FeatureLimitation[];
  value: FeatureValue;
  included: boolean;
}

export type FeatureCategory =
  | 'call_recording'
  | 'ai_analysis'
  | 'legal_documents'
  | 'attorney_consultation'
  | 'storage'
  | 'support'
  | 'analytics'
  | 'integrations'
  | 'compliance'
  | 'customization';

export interface FeatureUsage {
  type: 'unlimited' | 'limited' | 'metered' | 'disabled';
  limit?: number;
  unit?: string;
  overageRate?: number;
  resetPeriod: 'daily' | 'monthly' | 'yearly' | 'never';
  includedAmount: number;
}

export interface FeatureLimitation {
  type: 'quota' | 'rate_limit' | 'feature_access' | 'time_limit';
  description: string;
  value: any;
  enforced: boolean;
}

export interface FeatureValue {
  retailValue: number;
  perceivedValue: number;
  roi: number; // return on investment percentage
  timeToValue: string; // time to realize value
}

export interface UsageLimits {
  callRecordings: LimitInfo;
  aiAnalysis: LimitInfo;
  documentGeneration: LimitInfo;
  attorneyConsultations: LimitInfo;
  storage: LimitInfo;
  supportTickets: LimitInfo;
  apiCalls: LimitInfo;
  teamMembers: LimitInfo;
}

export interface LimitInfo {
  included: number;
  unit: string;
  overageRate?: number;
  hardLimit: boolean;
  warningThreshold: number; // percentage of limit
}

export interface TrialInfo {
  duration: number; // days
  features: string[]; // features available during trial
  autoConvert: boolean;
  conversionDiscount?: number;
  trialExtensions: TrialExtension[];
}

export interface TrialExtension {
  reason: string;
  additionalDays: number;
  approvalRequired: boolean;
  limit: number;
}

export interface Benefit {
  title: string;
  description: string;
  value: string;
  category: 'financial' | 'time_saving' | 'security' | 'access' | 'support';
  measurable: boolean;
  metric?: string;
}

export interface CompetitiveAdvantage {
  advantage: string;
  description: string;
  proof: string;
  unique: boolean;
}

export interface DiscountInfo {
  type: 'percentage' | 'fixed' | 'volume' | 'promotional';
  value: number;
  conditions: DiscountCondition[];
  duration: string;
  autoApply: boolean;
}

export interface DiscountCondition {
  type: 'user_count' | 'commitment' | 'annual_payment' | 'student' | 'nonprofit';
  value: any;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string;
  trialEndsAt?: string;
  billingCycle: BillingCycle['type'];
  price: number;
  discounts: AppliedDiscount[];
  usage: CurrentUsage;
  paymentMethod: PaymentMethodInfo;
  autoRenew: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  pauseHistory: PausePeriod[];
  upgradeHistory: UpgradeHistory[];
  metrics: SubscriptionMetrics;
  features: UserFeatureAccess[];
}

export type SubscriptionStatus =
  | 'active'
  | 'trial'
  | 'past_due'
  | 'cancelled'
  | 'paused'
  | 'pending'
  | 'suspended'
  | 'expired';

export interface AppliedDiscount {
  discountId: string;
  type: DiscountInfo['type'];
  value: number;
  amount: number;
  startDate: string;
  endDate?: string;
  reason: string;
}

export interface CurrentUsage {
  callRecordings: UsageData;
  aiAnalysis: UsageData;
  documentGeneration: UsageData;
  attorneyConsultations: UsageData;
  storage: UsageData;
  supportTickets: UsageData;
  apiCalls: UsageData;
  lastUpdated: string;
}

export interface UsageData {
  current: number;
  limit: number;
  unit: string;
  percentage: number;
  resetDate: string;
  history: UsageSnapshot[];
}

export interface UsageSnapshot {
  date: string;
  value: number;
  cost?: number;
}

export interface PaymentMethodInfo {
  id: string;
  type: 'card' | 'bank_account' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiry?: string;
  isDefault: boolean;
  billingAddress: AddressInfo;
  metadata: Record<string, any>;
}

export interface PausePeriod {
  startDate: string;
  endDate?: string;
  reason: string;
  autoResume: boolean;
  features: string[]; // features that remain active during pause
}

export interface UpgradeHistory {
  date: string;
  fromPlan: string;
  toPlan: string;
  reason: string;
  value: number;
  promotionId?: string;
}

export interface SubscriptionMetrics {
  lifetimeValue: number;
  monthlyRecurringRevenue: number;
  churnScore: number; // 0-100
  engagementScore: number; // 0-100
  satisfactionScore?: number; // 0-5
  supportTickets: number;
  featureUsage: FeatureUsageMetrics[];
  paymentHistory: PaymentEvent[];
  lastPaymentDate: string;
  nextBillingDate: string;
}

export interface FeatureUsageMetrics {
  featureId: string;
  name: string;
  usage: number;
  limit: number;
  utilizationRate: number; // 0-100
  trend: 'increasing' | 'decreasing' | 'stable';
  value: number;
}

export interface PaymentEvent {
  id: string;
  date: string;
  amount: number;
  type: 'charge' | 'refund' | 'adjustment' | 'credit';
  status: 'succeeded' | 'failed' | 'pending';
  method: string;
  description: string;
  invoiceId?: string;
}

export interface UserFeatureAccess {
  featureId: string;
  enabled: boolean;
  grantedAt: string;
  expiresAt?: string;
  source: 'subscription' | 'promotion' | 'trial' | 'gift';
  metadata: Record<string, any>;
}

export interface SubscriptionAnalytics {
  totalSubscribers: number;
  activeSubscribers: number;
  trialUsers: number;
  churnRate: number;
  conversionRate: number;
  averageRevenuePerUser: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  customerLifetimeValue: number;
  planDistribution: PlanDistribution;
  featureUsageAnalytics: FeatureUsageAnalytics;
  revenueAnalytics: RevenueAnalytics;
  churnAnalytics: ChurnAnalytics;
  geographicalData: GeographicalData;
}

export interface PlanDistribution {
  free: number;
  basic: number;
  premium: number;
  enterprise: number;
  growth: PlanGrowth[];
}

export interface PlanGrowth {
  plan: string;
  current: number;
  previous: number;
  growth: number;
  revenue: number;
}

export interface FeatureUsageAnalytics {
  mostUsedFeatures: FeatureUsageData[];
  leastUsedFeatures: FeatureUsageData[];
  usageByPlan: UsageByPlan[];
  usageTrends: UsageTrend[];
  featureCorrelations: FeatureCorrelation[];
}

export interface FeatureUsageData {
  featureId: string;
  featureName: string;
  totalUsage: number;
  uniqueUsers: number;
  averageUsagePerUser: number;
  planPenetration: number; // percentage of users on each plan using this feature
}

export interface UsageByPlan {
  plan: string;
  features: { [featureId: string]: number };
  totalUsage: number;
  userCount: number;
}

export interface UsageTrend {
  featureId: string;
  timeframe: string;
  usage: number[];
  growth: number;
  seasonality: number[];
}

export interface FeatureCorrelation {
  feature1: string;
  feature2: string;
  correlation: number; // -1 to 1
  significance: number; // 0-100
}

export interface RevenueAnalytics {
  monthlyRevenue: RevenueBreakdown[];
  revenueByPlan: RevenueByPlan[];
  revenueByFeature: RevenueByFeature[];
  revenueGrowth: RevenueGrowth[];
  forecast: RevenueForecast[];
  revenueRetention: RevenueRetention;
}

export interface RevenueBreakdown {
  month: string;
  revenue: number;
  subscribers: number;
  averageRevenuePerUser: number;
  growth: number;
}

export interface RevenueByPlan {
  plan: string;
  revenue: number;
  subscribers: number;
  percentage: number;
  growth: number;
}

export interface RevenueByFeature {
  feature: string;
  attributableRevenue: number;
  usage: number;
  valuePerUse: number;
  planBreakdown: { [plan: string]: number };
}

export interface RevenueGrowth {
  period: string;
  revenue: number;
  growth: number;
  newRevenue: number;
  churnRevenue: number;
  expansionRevenue: number;
}

export interface RevenueForecast {
  period: string;
  forecast: number;
  confidence: number; // 0-100
  factors: string[];
}

export interface RevenueRetention {
  cohort: string;
  startingRevenue: number;
  retainedRevenue: number;
  retentionRate: number;
  expansionRevenue: number;
  netRetention: number;
}

export interface ChurnAnalytics {
  overallChurn: ChurnMetric;
  churnByPlan: ChurnByPlan[];
  churnReasons: ChurnReason[];
  predictiveChurn: PredictiveChurn[];
  retentionInterventions: RetentionIntervention[];
  churnPrevention: ChurnPrevention;
}

export interface ChurnMetric {
  rate: number; // percentage
  count: number;
  revenueLost: number;
  period: string;
}

export interface ChurnByPlan {
  plan: string;
  churnRate: number;
  revenueLost: number;
  riskFactors: string[];
}

export interface ChurnReason {
  reason: string;
  count: number;
  percentage: number;
  preventable: boolean;
  mitigation: string[];
}

export interface PredictiveChurn {
  userId: string;
  riskScore: number; // 0-100
  riskFactors: RiskFactor[];
  predictedDate: string;
  recommendedActions: string[];
  interventionCost: number;
  interventionValue: number;
}

export interface RiskFactor {
  factor: string;
  impact: number; // 0-100
  weight: number; // 0-1
  description: string;
  mitigable: boolean;
}

export interface RetentionIntervention {
  type: 'discount' | 'feature_upgrade' | 'support' | 'education' | 'engagement';
  targetUsers: string[];
  successRate: number;
  cost: number;
  revenueRetention: number;
  implementation: InterventionImplementation;
}

export interface InterventionImplementation {
  trigger: string;
  method: string;
  timing: string;
  personalization: string[];
  followUp: string[];
}

export interface ChurnPrevention {
  earlyWarningSystem: EarlyWarningIndicator[];
  automatedInterventions: AutomatedIntervention[];
  successMetrics: SuccessMetric[];
  bestPractices: BestPractice[];
}

export interface EarlyWarningIndicator {
  indicator: string;
  threshold: number;
  weight: number;
  actionRequired: string;
  effectiveness: number;
}

export interface AutomatedIntervention {
  trigger: string;
  action: string;
  success: number;
  cost: number;
  conditions: string[];
}

export interface SuccessMetric {
  metric: string;
  target: number;
  current: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface BestPractice {
  practice: string;
  description: string;
  implementation: string;
  results: string;
  applicability: string[];
}

export interface GeographicalData {
  revenueByCountry: CountryRevenue[];
  revenueByRegion: RegionRevenue[];
  marketPenetration: MarketPenetration[];
  localizationOpportunities: LocalizationOpportunity[];
}

export interface CountryRevenue {
  country: string;
  revenue: number;
  subscribers: number;
  growth: number;
  marketShare: number;
}

export interface RegionRevenue {
  region: string;
  countries: string[];
  revenue: number;
  growth: number;
  potential: string;
}

export interface MarketPenetration {
  country: string;
  totalMarket: number;
  currentUsers: number;
  penetrationRate: number;
  growthPotential: number;
  competition: string[];
}

export interface LocalizationOpportunity {
  country: string;
  potentialRevenue: number;
  implementationCost: number;
  roi: number;
  priority: 'high' | 'medium' | 'low';
  requirements: string[];
}

export class SubscriptionManager {
  private plans: Map<string, SubscriptionPlan> = new Map();
  private subscriptions: Map<string, UserSubscription> = new Map();
  private analytics: SubscriptionAnalytics;
  private usageTracker: UsageTracker;
  private billingEngine: BillingEngine;
  private churnPredictor: ChurnPredictor;

  constructor() {
    this.initializePlans();
    this.analytics = {} as SubscriptionAnalytics;
    this.usageTracker = new UsageTracker();
    this.billingEngine = new BillingEngine();
    this.churnPredictor = new ChurnPredictor();
  }

  private initializePlans(): void {
    // Free Plan
    const freePlan: SubscriptionPlan = {
      id: 'free',
      name: 'Free',
      description: 'Essential consumer protection tools',
      tier: 'free',
      price: {
        monthly: 0,
        annual: 0,
        currency: 'USD',
        taxIncluded: true,
        priceIncreaseProtection: true,
        discounts: []
      },
      billingCycle: [
        {
          type: 'monthly',
          price: 0,
          savings: 0,
          features: ['Basic legal document templates'],
          popular: false
        }
      ],
      features: this.getFreePlanFeatures(),
      limits: this.getFreePlanLimits(),
      trialPeriod: {
        duration: 0,
        features: [],
        autoConvert: false,
        trialExtensions: []
      },
      targetAudience: ['Individuals', 'Students', 'First-time users'],
      benefits: this.getFreePlanBenefits(),
      popularFeatures: ['Document templates', 'Basic legal guidance'],
      competitiveAdvantages: [
        {
          advantage: 'No credit card required',
          description: 'Start protecting your rights immediately',
          proof: 'Free sign-up process',
          unique: false
        }
      ]
    };

    // Basic Plan
    const basicPlan: SubscriptionPlan = {
      id: 'basic',
      name: 'Basic',
      description: 'Comprehensive protection for individual cases',
      tier: 'basic',
      price: {
        monthly: 19.99,
        annual: 199.99,
        currency: 'USD',
        taxIncluded: false,
        priceIncreaseProtection: true,
        discounts: [
          {
            type: 'percentage',
            value: 17,
            conditions: [{ type: 'annual_payment', value: true, operator: 'eq' }],
            duration: 'as_long_as_subscribed',
            autoApply: true
          }
        ]
      },
      billingCycle: [
        {
          type: 'monthly',
          price: 19.99,
          savings: 0,
          features: ['Month-to-month flexibility'],
          popular: false
        },
        {
          type: 'annual',
          price: 199.99,
          savings: 17,
          features: ['2 months free', 'Priority support'],
          popular: true
        }
      ],
      features: this.getBasicPlanFeatures(),
      limits: this.getBasicPlanLimits(),
      trialPeriod: {
        duration: 14,
        features: ['Call recording', 'AI analysis', 'Document generation'],
        autoConvert: false,
        trialExtensions: [
          {
            reason: 'Need more time to evaluate',
            additionalDays: 7,
            approvalRequired: true,
            limit: 1
          }
        ]
      },
      targetAudience: ['Individuals', 'Small cases', 'DIY legal protection'],
      benefits: this.getBasicPlanBenefits(),
      popularFeatures: ['Call recording', 'AI violation detection', 'Document templates'],
      competitiveAdvantages: this.getBasicPlanAdvantages()
    };

    // Premium Plan
    const premiumPlan: SubscriptionPlan = {
      id: 'premium',
      name: 'Premium',
      description: 'Advanced AI-powered legal protection with attorney access',
      tier: 'premium',
      price: {
        monthly: 49.99,
        annual: 499.99,
        currency: 'USD',
        taxIncluded: false,
        priceIncreaseProtection: true,
        discounts: [
          {
            type: 'percentage',
            value: 17,
            conditions: [{ type: 'annual_payment', value: true, operator: 'eq' }],
            duration: 'as_long_as_subscribed',
            autoApply: true
          },
          {
            type: 'percentage',
            value: 20,
            conditions: [{ type: 'user_count', value: 2, operator: 'gte' }],
            duration: 'first_year',
            autoApply: false
          }
        ]
      },
      billingCycle: [
        {
          type: 'monthly',
          price: 49.99,
          savings: 0,
          features: ['Advanced features'],
          popular: false
        },
        {
          type: 'annual',
          price: 499.99,
          savings: 17,
          features: ['2 months free', 'Unlimited attorney consultations', 'Priority support'],
          popular: true
        }
      ],
      features: this.getPremiumPlanFeatures(),
      limits: this.getPremiumPlanLimits(),
      trialPeriod: {
        duration: 30,
        features: ['All premium features'],
        autoConvert: false,
        trialExtensions: [
          {
            reason: 'Complex case requiring evaluation',
            additionalDays: 14,
            approvalRequired: true,
            limit: 2
          }
        ]
      },
      targetAudience: ['Serious cases', 'Multiple violations', 'Professional users'],
      benefits: this.getPremiumPlanBenefits(),
      popularFeatures: ['Unlimited AI analysis', 'Attorney consultations', 'Settlement calculator'],
      competitiveAdvantages: this.getPremiumPlanAdvantages()
    };

    // Enterprise Plan
    const enterprisePlan: SubscriptionPlan = {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Complete legal protection solution for organizations and law firms',
      tier: 'enterprise',
      price: {
        monthly: 199.99,
        annual: 1999.99,
        currency: 'USD',
        setupFee: 500,
        taxIncluded: false,
        priceIncreaseProtection: true,
        discounts: [
          {
            type: 'percentage',
            value: 17,
            conditions: [{ type: 'annual_payment', value: true, operator: 'eq' }],
            duration: 'as_long_as_subscribed',
            autoApply: true
          },
          {
            type: 'volume',
            value: 25,
            conditions: [{ type: 'user_count', value: 10, operator: 'gte' }],
            duration: 'as_long_as_subscribed',
            autoApply: true
          }
        ]
      },
      billingCycle: [
        {
          type: 'monthly',
          price: 199.99,
          savings: 0,
          features: ['Custom configuration'],
          popular: false
        },
        {
          type: 'annual',
          price: 1999.99,
          savings: 17,
          features: ['2 months free', 'Custom integrations', 'Dedicated support'],
          popular: true
        }
      ],
      features: this.getEnterprisePlanFeatures(),
      limits: this.getEnterprisePlanLimits(),
      trialPeriod: {
        duration: 0,
        features: ['Custom demo required'],
        autoConvert: false,
        trialExtensions: []
      },
      targetAudience: ['Law firms', 'Legal departments', 'Collection agencies', 'Financial institutions'],
      benefits: this.getEnterprisePlanBenefits(),
      popularFeatures: ['Unlimited everything', 'API access', 'Custom integrations', 'White-label'],
      competitiveAdvantages: this.getEnterprisePlanAdvantages()
    };

    this.plans.set('free', freePlan);
    this.plans.set('basic', basicPlan);
    this.plans.set('premium', premiumPlan);
    this.plans.set('enterprise', enterprisePlan);
  }

  async createSubscription(
    userId: string,
    planId: string,
    billingCycle: BillingCycle['type'],
    paymentMethodId: string,
    trial: boolean = false,
    discountCodes: string[] = []
  ): Promise<UserSubscription> {
    try {
      const plan = this.plans.get(planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      const existingSubscription = await this.getUserSubscription(userId);
      if (existingSubscription && existingSubscription.status === 'active') {
        throw new Error('User already has an active subscription');
      }

      const price = this.calculatePrice(plan, billingCycle, discountCodes);
      const discounts = await this.calculateDiscounts(plan, discountCodes);

      const subscriptionId = `sub_${userId}_${planId}_${Date.now()}`;

      let trialEndsAt: string | undefined;
      let status: SubscriptionStatus = 'active';

      if (trial && plan.trialPeriod.duration > 0) {
        trialEndsAt = new Date(Date.now() + plan.trialPeriod.duration * 24 * 60 * 60 * 1000).toISOString();
        status = 'trial';
      }

      const subscription: UserSubscription = {
        id: subscriptionId,
        userId,
        planId,
        status,
        startDate: new Date().toISOString(),
        trialEndsAt,
        billingCycle,
        price: price.total,
        discounts,
        usage: await this.initializeUsage(plan.limits),
        paymentMethod: await this.getPaymentMethod(paymentMethodId),
        autoRenew: true,
        pauseHistory: [],
        upgradeHistory: [],
        metrics: {
          lifetimeValue: price.total,
          monthlyRecurringRevenue: price.monthly,
          churnScore: 0,
          engagementScore: 50,
          supportTickets: 0,
          featureUsage: [],
          paymentHistory: [],
          lastPaymentDate: new Date().toISOString(),
          nextBillingDate: this.calculateNextBillingDate(billingCycle)
        },
        features: await this.grantFeatureAccess(plan.features, trial)
      };

      this.subscriptions.set(subscriptionId, subscription);

      // Track subscription creation
      await this.trackSubscriptionEvent('created', subscription);

      return subscription;
    } catch (error) {
      console.error('Subscription creation failed:', error);
      throw new Error(`Failed to create subscription: ${error}`);
    }
  }

  async upgradeSubscription(
    userId: string,
    targetPlanId: string,
    billingCycle?: BillingCycle['type'],
    reason: string = '',
    promotionCode?: string
  ): Promise<UserSubscription> {
    try {
      const currentSubscription = await this.getUserSubscription(userId);
      if (!currentSubscription) {
        throw new Error('No active subscription found');
      }

      const targetPlan = this.plans.get(targetPlanId);
      if (!targetPlan) {
        throw new Error('Target plan not found');
      }

      // Validate upgrade is allowed
      if (!this.canUpgrade(currentSubscription.planId, targetPlanId)) {
        throw new Error('Invalid upgrade path');
      }

      const newBillingCycle = billingCycle || currentSubscription.billingCycle;
      const price = this.calculatePrice(targetPlan, newBillingCycle, promotionCode ? [promotionCode] : []);
      const discounts = await this.calculateDiscounts(targetPlan, promotionCode ? [promotionCode] : []);

      // Calculate proration if mid-cycle
      const proration = await this.calculateProration(currentSubscription, targetPlan, newBillingCycle);

      // Update subscription
      currentSubscription.planId = targetPlanId;
      currentSubscription.billingCycle = newBillingCycle;
      currentSubscription.price = price.total;
      currentSubscription.discounts = discounts;
      currentSubscription.usage = await this.updateUsageLimits(currentSubscription.usage, targetPlan.limits);
      currentSubscription.features = await this.grantFeatureAccess(targetPlan.features, false);

      // Track upgrade
      currentSubscription.upgradeHistory.push({
        date: new Date().toISOString(),
        fromPlan: currentSubscription.planId,
        toPlan: targetPlanId,
        reason,
        value: price.total - currentSubscription.price,
        promotionId: promotionCode
      });

      // Process proration charge
      if (proration.amount > 0) {
        await this.processProrationCharge(userId, proration);
      }

      // Track upgrade event
      await this.trackSubscriptionEvent('upgraded', currentSubscription);

      return currentSubscription;
    } catch (error) {
      console.error('Subscription upgrade failed:', error);
      throw new Error(`Failed to upgrade subscription: ${error}`);
    }
  }

  async cancelSubscription(
    userId: string,
    reason: string,
    immediate: boolean = false,
    retainAccess: boolean = false
  ): Promise<UserSubscription> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      subscription.cancelledAt = new Date().toISOString();
      subscription.cancellationReason = reason;

      if (immediate) {
        subscription.status = 'cancelled';
        subscription.endDate = new Date().toISOString();

        // Revoke feature access
        await this.revokeFeatureAccess(subscription.features);
      } else {
        subscription.status = 'cancelled';
        subscription.autoRenew = false;
        // Keep access until end of billing period
        subscription.endDate = subscription.metrics.nextBillingDate;
      }

      // Track cancellation event
      await this.trackSubscriptionEvent('cancelled', subscription);

      // Analyze churn risk and triggers
      await this.analyzeChurnTriggers(userId, reason);

      // Offer retention incentives if appropriate
      if (retainAccess && !immediate) {
        await this.offerRetentionIncentives(userId, subscription);
      }

      return subscription;
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      throw new Error(`Failed to cancel subscription: ${error}`);
    }
  }

  async pauseSubscription(
    userId: string,
    duration: number,
    reason: string
  ): Promise<UserSubscription> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      if (subscription.tier === 'enterprise') {
        throw new Error('Enterprise plans cannot be paused');
      }

      const pausePeriod: PausePeriod = {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
        reason,
        autoResume: true,
        features: ['Document templates'] // Keep basic features active
      };

      subscription.status = 'paused';
      subscription.pauseHistory.push(pausePeriod);

      // Schedule automatic resume
      await this.scheduleSubscriptionResume(subscription.id, duration);

      // Track pause event
      await this.trackSubscriptionEvent('paused', subscription);

      return subscription;
    } catch (error) {
      console.error('Subscription pause failed:', error);
      throw new Error(`Failed to pause subscription: ${error}`);
    }
  }

  async checkFeatureAccess(userId: string, featureId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        return false;
      }

      // Check if feature is enabled in subscription
      const featureAccess = subscription.features.find(f => f.featureId === featureId);
      if (!featureAccess || !featureAccess.enabled) {
        return false;
      }

      // Check usage limits
      const usage = subscription.usage[featureId as keyof CurrentUsage] as UsageData;
      if (usage && usage.current >= usage.limit) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Feature access check failed:', error);
      return false;
    }
  }

  async trackFeatureUsage(userId: string, featureId: string, usage: number = 1): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        return;
      }

      const usageData = subscription.usage[featureId as keyof CurrentUsage] as UsageData;
      if (usageData) {
        usageData.current += usage;
        usageData.percentage = Math.min(100, (usageData.current / usageData.limit) * 100);
        usageData.lastUpdated = new Date().toISOString();

        // Add to history
        usageData.history.push({
          date: new Date().toISOString(),
          value: usage
        });

        // Check if limit is reached
        if (usageData.current >= usageData.limit && !usageData.hardLimit) {
          await this.notifyUsageLimit(userId, featureId, usageData);
        }

        // Update feature usage metrics
        await this.updateFeatureMetrics(subscription, featureId, usage);
      }
    } catch (error) {
      console.error('Feature usage tracking failed:', error);
    }
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.userId === userId &&
          ['active', 'trial', 'past_due', 'paused'].includes(subscription.status)) {
        return subscription;
      }
    }
    return null;
  }

  async getSubscriptionAnalytics(timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<SubscriptionAnalytics> {
    try {
      return await this.calculateAnalytics(timeframe);
    } catch (error) {
      console.error('Analytics calculation failed:', error);
      throw new Error(`Failed to get analytics: ${error}`);
    }
  }

  async predictChurnRisk(userId: string): Promise<PredictiveChurn | null> {
    try {
      return await this.churnPredictor.predictRisk(userId, this.subscriptions);
    } catch (error) {
      console.error('Churn prediction failed:', error);
      return null;
    }
  }

  async getRecommendedPlan(userId: string): Promise<SubscriptionPlan | null> {
    try {
      const currentSubscription = await this.getUserSubscription(userId);
      const usage = await this.usageTracker.getUserUsage(userId);

      // Analyze usage patterns and recommend appropriate plan
      return await this.analyzeAndRecommendPlan(currentSubscription, usage);
    } catch (error) {
      console.error('Plan recommendation failed:', error);
      return null;
    }
  }

  // Private helper methods
  private calculatePrice(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle['type'],
    discountCodes: string[]
  ): { total: number; monthly: number; discounts: number } {
    const cycle = plan.billingCycle.find(c => c.type === billingCycle);
    if (!cycle) {
      throw new Error('Invalid billing cycle');
    }

    let basePrice = cycle.price;
    let discountAmount = 0;

    // Apply discounts
    for (const code of discountCodes) {
      const discount = plan.price.discounts.find(d => d.conditions.some(c => c.value === code));
      if (discount) {
        discountAmount += discount.type === 'percentage' ? basePrice * (discount.value / 100) : discount.value;
      }
    }

    const totalPrice = Math.max(0, basePrice - discountAmount);
    const monthlyPrice = billingCycle === 'annual' ? totalPrice / 12 : totalPrice;

    return {
      total: totalPrice,
      monthly: monthlyPrice,
      discounts: discountAmount
    };
  }

  private async calculateDiscounts(plan: SubscriptionPlan, discountCodes: string[]): Promise<AppliedDiscount[]> {
    const applied: AppliedDiscount[] = [];

    for (const code of discountCodes) {
      const discount = plan.price.discounts.find(d => d.conditions.some(c => c.value === code));
      if (discount) {
        applied.push({
          discountId: `discount_${code}`,
          type: discount.type,
          value: discount.value,
          amount: discount.type === 'percentage' ? plan.price.monthly * (discount.value / 100) : discount.value,
          startDate: new Date().toISOString(),
          endDate: discount.duration === 'as_long_as_subscribed' ? undefined : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          reason: `Promotional discount: ${code}`
        });
      }
    }

    return applied;
  }

  private async initializeUsage(limits: UsageLimits): Promise<CurrentUsage> {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      callRecordings: {
        current: 0,
        limit: limits.callRecordings.included,
        unit: limits.callRecordings.unit,
        percentage: 0,
        resetDate: nextMonth.toISOString(),
        history: []
      },
      aiAnalysis: {
        current: 0,
        limit: limits.aiAnalysis.included,
        unit: limits.aiAnalysis.unit,
        percentage: 0,
        resetDate: nextMonth.toISOString(),
        history: []
      },
      documentGeneration: {
        current: 0,
        limit: limits.documentGeneration.included,
        unit: limits.documentGeneration.unit,
        percentage: 0,
        resetDate: nextMonth.toISOString(),
        history: []
      },
      attorneyConsultations: {
        current: 0,
        limit: limits.attorneyConsultations.included,
        unit: limits.attorneyConsultations.unit,
        percentage: 0,
        resetDate: nextMonth.toISOString(),
        history: []
      },
      storage: {
        current: 0,
        limit: limits.storage.included,
        unit: limits.storage.unit,
        percentage: 0,
        resetDate: nextMonth.toISOString(),
        history: []
      },
      supportTickets: {
        current: 0,
        limit: limits.supportTickets.included,
        unit: limits.supportTickets.unit,
        percentage: 0,
        resetDate: nextMonth.toISOString(),
        history: []
      },
      apiCalls: {
        current: 0,
        limit: limits.apiCalls.included,
        unit: limits.apiCalls.unit,
        percentage: 0,
        resetDate: nextMonth.toISOString(),
        history: []
      },
      teamMembers: {
        current: 1,
        limit: limits.teamMembers.included,
        unit: limits.teamMembers.unit,
        percentage: (1 / limits.teamMembers.included) * 100,
        resetDate: nextMonth.toISOString(),
        history: []
      },
      lastUpdated: now.toISOString()
    };
  }

  private async getPaymentMethod(paymentMethodId: string): Promise<PaymentMethodInfo> {
    // Mock implementation - would integrate with payment processor
    return {
      id: paymentMethodId,
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiry: '12/25',
      isDefault: true,
      billingAddress: {
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US'
      },
      metadata: {}
    };
  }

  private async grantFeatureAccess(
    features: PlanFeature[],
    trial: boolean = false
  ): Promise<UserFeatureAccess[]> {
    const now = new Date();
    const expiresAt = trial ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined;

    return features
      .filter(feature => feature.enabled && feature.included)
      .map(feature => ({
        featureId: feature.id,
        enabled: true,
        grantedAt: now.toISOString(),
        expiresAt,
        source: trial ? 'trial' : 'subscription',
        metadata: {}
      }));
  }

  private calculateNextBillingDate(billingCycle: BillingCycle['type']): string {
    const now = new Date();
    if (billingCycle === 'monthly') {
      now.setMonth(now.getMonth() + 1);
    } else if (billingCycle === 'annual') {
      now.setFullYear(now.getFullYear() + 1);
    } else if (billingCycle === 'quarterly') {
      now.setMonth(now.getMonth() + 3);
    } else if (billingCycle === 'biennial') {
      now.setFullYear(now.getFullYear() + 2);
    }
    return now.toISOString();
  }

  private canUpgrade(currentPlanId: string, targetPlanId: string): boolean {
    const planHierarchy = { 'free': 0, 'basic': 1, 'premium': 2, 'enterprise': 3 };
    const currentLevel = planHierarchy[currentPlanId as keyof typeof planHierarchy] || 0;
    const targetLevel = planHierarchy[targetPlanId as keyof typeof planHierarchy] || 0;
    return targetLevel > currentLevel;
  }

  // Feature definitions for each plan
  private getFreePlanFeatures(): PlanFeature[] {
    return [
      {
        id: 'document_templates',
        name: 'Basic Document Templates',
        description: 'Access to essential legal document templates',
        category: 'legal_documents',
        enabled: true,
        usage: { type: 'limited', limit: 5, unit: 'documents', resetPeriod: 'monthly', includedAmount: 5 },
        limitations: [{ type: 'quota', description: '5 templates per month', value: 5, enforced: true }],
        value: { retailValue: 99, perceivedValue: 150, roi: 150, timeToValue: 'Immediate' },
        included: true
      },
      {
        id: 'legal_guidance',
        name: 'Basic Legal Information',
        description: 'Access to consumer protection legal information',
        category: 'ai_analysis',
        enabled: true,
        usage: { type: 'unlimited', resetPeriod: 'never', includedAmount: 0 },
        limitations: [],
        value: { retailValue: 49, perceivedValue: 75, roi: 150, timeToValue: 'Immediate' },
        included: true
      }
    ];
  }

  private getBasicPlanFeatures(): PlanFeature[] {
    return [
      ...this.getFreePlanFeatures(),
      {
        id: 'call_recording',
        name: 'Call Recording',
        description: 'Record and store collection calls as evidence',
        category: 'call_recording',
        enabled: true,
        usage: { type: 'limited', limit: 50, unit: 'minutes', resetPeriod: 'monthly', includedAmount: 50 },
        limitations: [{ type: 'quota', description: '50 minutes per month', value: 50, enforced: true }],
        value: { retailValue: 199, perceivedValue: 299, roi: 150, timeToValue: '1 week' },
        included: true
      },
      {
        id: 'ai_analysis',
        name: 'AI Violation Detection',
        description: 'AI-powered analysis of calls for FDCPA violations',
        category: 'ai_analysis',
        enabled: true,
        usage: { type: 'limited', limit: 25, unit: 'analyses', resetPeriod: 'monthly', includedAmount: 25 },
        limitations: [{ type: 'quota', description: '25 analyses per month', value: 25, enforced: true }],
        value: { retailValue: 299, perceivedValue: 499, roi: 167, timeToValue: '1 day' },
        included: true
      }
    ];
  }

  private getPremiumPlanFeatures(): PlanFeature[] {
    return [
      ...this.getBasicPlanFeatures(),
      {
        id: 'unlimited_call_recording',
        name: 'Unlimited Call Recording',
        description: 'Unlimited call recording and storage',
        category: 'call_recording',
        enabled: true,
        usage: { type: 'unlimited', resetPeriod: 'never', includedAmount: 0 },
        limitations: [],
        value: { retailValue: 599, perceivedValue: 999, roi: 167, timeToValue: 'Immediate' },
        included: true
      },
      {
        id: 'attorney_consultation',
        name: 'Attorney Consultations',
        description: 'One-on-one consultations with consumer protection attorneys',
        category: 'attorney_consultation',
        enabled: true,
        usage: { type: 'limited', limit: 12, unit: 'sessions', resetPeriod: 'yearly', includedAmount: 12 },
        limitations: [{ type: 'quota', description: '12 consultations per year', value: 12, enforced: true }],
        value: { retailValue: 2400, perceivedValue: 3600, roi: 150, timeToValue: '1 week' },
        included: true
      },
      {
        id: 'settlement_calculator',
        name: 'AI Settlement Calculator',
        description: 'Advanced AI-powered settlement valuation and negotiation',
        category: 'ai_analysis',
        enabled: true,
        usage: { type: 'limited', limit: 100, unit: 'calculations', resetPeriod: 'monthly', includedAmount: 100 },
        limitations: [{ type: 'quota', description: '100 calculations per month', value: 100, enforced: true }],
        value: { retailValue: 799, perceivedValue: 1200, roi: 150, timeToValue: '1 day' },
        included: true
      }
    ];
  }

  private getEnterprisePlanFeatures(): PlanFeature[] {
    return [
      ...this.getPremiumPlanFeatures(),
      {
        id: 'api_access',
        name: 'Full API Access',
        description: 'Complete API access for custom integrations',
        category: 'integrations',
        enabled: true,
        usage: { type: 'unlimited', resetPeriod: 'never', includedAmount: 0 },
        limitations: [],
        value: { retailValue: 5000, perceivedValue: 7500, roi: 150, timeToValue: '2 weeks' },
        included: true
      },
      {
        id: 'white_label',
        name: 'White-Label Solution',
        description: 'Custom branding and white-label deployment',
        category: 'customization',
        enabled: true,
        usage: { type: 'unlimited', resetPeriod: 'never', includedAmount: 0 },
        limitations: [],
        value: { retailValue: 10000, perceivedValue: 15000, roi: 150, timeToValue: '1 month' },
        included: true
      }
    ];
  }

  // Additional implementation methods would go here...
}

// Supporting interfaces and classes
class UsageTracker {
  async getUserUsage(userId: string): Promise<any> {
    return {}; // Mock implementation
  }
}

class BillingEngine {
  async processPayment(userId: string, amount: number, paymentMethodId: string): Promise<boolean> {
    return true; // Mock implementation
  }
}

class ChurnPredictor {
  async predictRisk(userId: string, subscriptions: Map<string, UserSubscription>): Promise<PredictiveChurn | null> {
    return null; // Mock implementation
  }
}

interface AddressInfo {
  line1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface ProrationCalculation {
  amount: number;
  reason: string;
  creditDays: number;
}

// Additional plan definitions
function getFreePlanLimits(): UsageLimits {
  return {
    callRecordings: { included: 0, unit: 'minutes', hardLimit: true, warningThreshold: 80 },
    aiAnalysis: { included: 0, unit: 'analyses', hardLimit: true, warningThreshold: 80 },
    documentGeneration: { included: 5, unit: 'documents', hardLimit: true, warningThreshold: 80 },
    attorneyConsultations: { included: 0, unit: 'sessions', hardLimit: true, warningThreshold: 80 },
    storage: { included: 100, unit: 'MB', hardLimit: true, warningThreshold: 80 },
    supportTickets: { included: 1, unit: 'tickets', hardLimit: true, warningThreshold: 100 },
    apiCalls: { included: 0, unit: 'calls', hardLimit: true, warningThreshold: 80 },
    teamMembers: { included: 1, unit: 'users', hardLimit: true, warningThreshold: 100 }
  };
}

function getBasicPlanLimits(): UsageLimits {
  return {
    callRecordings: { included: 50, unit: 'minutes', hardLimit: true, warningThreshold: 80 },
    aiAnalysis: { included: 25, unit: 'analyses', hardLimit: true, warningThreshold: 80 },
    documentGeneration: { included: 20, unit: 'documents', hardLimit: true, warningThreshold: 80 },
    attorneyConsultations: { included: 1, unit: 'sessions', hardLimit: true, warningThreshold: 100 },
    storage: { included: 1000, unit: 'MB', hardLimit: true, warningThreshold: 80 },
    supportTickets: { included: 5, unit: 'tickets', hardLimit: true, warningThreshold: 80 },
    apiCalls: { included: 100, unit: 'calls', hardLimit: true, warningThreshold: 80 },
    teamMembers: { included: 1, unit: 'users', hardLimit: true, warningThreshold: 100 }
  };
}

function getPremiumPlanLimits(): UsageLimits {
  return {
    callRecordings: { included: 1000, unit: 'minutes', hardLimit: false, warningThreshold: 80, overageRate: 0.10 },
    aiAnalysis: { included: 500, unit: 'analyses', hardLimit: false, warningThreshold: 80, overageRate: 0.50 },
    documentGeneration: { included: 100, unit: 'documents', hardLimit: false, warningThreshold: 80, overageRate: 2.00 },
    attorneyConsultations: { included: 12, unit: 'sessions', hardLimit: true, warningThreshold: 80 },
    storage: { included: 10000, unit: 'MB', hardLimit: false, warningThreshold: 80, overageRate: 0.01 },
    supportTickets: { included: 25, unit: 'tickets', hardLimit: false, warningThreshold: 80 },
    apiCalls: { included: 10000, unit: 'calls', hardLimit: false, warningThreshold: 80, overageRate: 0.01 },
    teamMembers: { included: 5, unit: 'users', hardLimit: true, warningThreshold: 80 }
  };
}

function getEnterprisePlanLimits(): UsageLimits {
  return {
    callRecordings: { included: -1, unit: 'minutes', hardLimit: false, warningThreshold: 80 }, // -1 = unlimited
    aiAnalysis: { included: -1, unit: 'analyses', hardLimit: false, warningThreshold: 80 },
    documentGeneration: { included: -1, unit: 'documents', hardLimit: false, warningThreshold: 80 },
    attorneyConsultations: { included: -1, unit: 'sessions', hardLimit: false, warningThreshold: 80 },
    storage: { included: -1, unit: 'MB', hardLimit: false, warningThreshold: 80 },
    supportTickets: { included: -1, unit: 'tickets', hardLimit: false, warningThreshold: 80 },
    apiCalls: { included: -1, unit: 'calls', hardLimit: false, warningThreshold: 80 },
    teamMembers: { included: -1, unit: 'users', hardLimit: false, warningThreshold: 80 }
  };
}

function getFreePlanBenefits(): Benefit[] {
  return [
    {
      title: 'No Credit Card Required',
      description: 'Start protecting your rights immediately',
      value: 'Immediate access',
      category: 'access',
      measurable: true,
      metric: '0 barriers to entry'
    }
  ];
}

function getBasicPlanBenefits(): Benefit[] {
  return [
    {
      title: 'Professional Document Templates',
      description: 'Access to court-approved legal templates',
      value: '$199 value',
      category: 'financial',
      measurable: true,
      metric: 'Professional templates'
    },
    {
      title: 'AI-Powered Analysis',
      description: 'Detect FDCPA violations automatically',
      value: '98% accuracy',
      category: 'time_saving',
      measurable: true,
      metric: 'Instant analysis'
    }
  ];
}

function getPremiumPlanBenefits(): Benefit[] {
  return [
    {
      title: 'Unlimited Attorney Access',
      description: '12 consultations per year with consumer protection attorneys',
      value: '$2,400 value',
      category: 'access',
      measurable: true,
      metric: 'Professional guidance'
    },
    {
      title: 'Complete Evidence Collection',
      description: 'Unlimited call recording and AI analysis',
      value: 'Comprehensive protection',
      category: 'security',
      measurable: true,
      metric: 'Full case coverage'
    }
  ];
}

function getEnterprisePlanBenefits(): Benefit[] {
  return [
    {
      title: 'Complete Business Solution',
      description: 'All features plus custom integrations and white-label',
      value: '$15,000+ value',
      category: 'access',
      measurable: true,
      metric: 'Enterprise solution'
    }
  ];
}

function getBasicPlanAdvantages(): CompetitiveAdvantage[] {
  return [
    {
      advantage: 'AI-Powered Legal Analysis',
      description: 'Our AI detects violations with 98% accuracy',
      proof: 'Independent testing validation',
      unique: true
    }
  ];
}

function getPremiumPlanAdvantages(): CompetitiveAdvantage[] {
  return [
    {
      advantage: 'Integrated Attorney Network',
      description: 'Direct access to specialized consumer protection attorneys',
      proof: '500+ attorney network',
      unique: true
    }
  ];
}

function getEnterprisePlanAdvantages(): CompetitiveAdvantage[] {
  return [
    {
      advantage: 'Complete White-Label Solution',
      description: 'Deploy under your brand with custom features',
      proof: 'Proven enterprise deployments',
      unique: true
    }
  ];
}