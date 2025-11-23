/**
 * CallWall Payment Processing System
 * Comprehensive payment processing with Stripe integration, billing automation, and financial analytics
 */

import Stripe from 'stripe';
import { UserSubscription, PaymentMethodInfo, BillingCycle } from '../subscription/SubscriptionManager';

export interface PaymentProcessor {
  processPayment(request: PaymentRequest): Promise<PaymentResult>;
  processRefund(refundRequest: RefundRequest): Promise<RefundResult>;
  createSubscription(subscriptionRequest: SubscriptionRequest): Promise<SubscriptionResult>;
  updateSubscription(subscriptionId: string, updateRequest: SubscriptionUpdateRequest): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string, cancelRequest: CancelSubscriptionRequest): Promise<CancelResult>;
  createPaymentIntent(paymentIntentRequest: PaymentIntentRequest): Promise<PaymentIntentResult>;
  confirmPayment(paymentIntentId: string): Promise<PaymentConfirmationResult>;
  getPaymentMethods(customerId: string): Promise<PaymentMethodInfo[]>;
  addPaymentMethod(customerId: string, paymentMethodRequest: AddPaymentMethodRequest): Promise<PaymentMethodInfo>;
  updatePaymentMethod(paymentMethodId: string, updateRequest: UpdatePaymentMethodRequest): Promise<PaymentMethodInfo>;
  deletePaymentMethod(paymentMethodId: string): Promise<boolean>;
  createInvoice(invoiceRequest: InvoiceRequest): Promise<InvoiceResult>;
  getInvoices(customerId: string, filters?: InvoiceFilters): Promise<Invoice[]>;
  getPaymentHistory(customerId: string, filters?: PaymentFilters): Promise<PaymentRecord[]>;
  calculateProration(subscriptionId: string, newPlanId: string): Promise<ProrationCalculation>;
  handleWebhook(event: StripeWebhookEvent): Promise<WebhookResult>;
  generateFinancialReport(timeframe: FinancialTimeframe, filters?: FinancialFilters): Promise<FinancialReport>;
  exportTransactionData(filters: ExportFilters): Promise<ExportResult>;
}

export interface PaymentRequest {
  customerId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  description: string;
  metadata: Record<string, any>;
  receiptEmail?: string;
  statementDescriptor?: string;
  applicationFeeAmount?: number;
  transferData?: TransferData;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  status: 'succeeded' | 'failed' | 'pending' | 'requires_action';
  amount: number;
  currency: string;
  receiptUrl?: string;
  failureReason?: string;
  nextAction?: NextAction;
  processingTime: number;
  fraudRisk: FraudAssessment;
  metadata: Record<string, any>;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Full refund if not specified
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'expired_uncaptured_charge';
  metadata?: Record<string, any>;
  refundApplicationFee?: boolean;
  reverseTransfer?: boolean;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  status: 'succeeded' | 'pending' | 'failed' | 'canceled';
  amount: number;
  currency: string;
  receiptNumber?: string;
  reason: string;
  processingTime: number;
  metadata: Record<string, any>;
}

export interface SubscriptionRequest {
  customerId: string;
  priceId: string;
  paymentMethodId: string;
  billingCycleAnchor?: number;
  trialPeriodDays?: number;
  metadata: Record<string, any>;
  collectionMethod: 'charge_automatically' | 'send_invoice';
  promotionCode?: string;
  coupon?: string;
  defaultPaymentMethod?: string;
  expand?: string[];
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string;
  trialEnd?: string;
  plan: SubscriptionPlanInfo;
  customer: string;
  paymentMethod: string;
  metadata: Record<string, any>;
  latestInvoice?: string;
  pendingSetupIntent?: string;
  discount?: DiscountInfo;
}

export interface SubscriptionUpdateRequest {
  paymentMethodId?: string;
  planId?: string;
  quantity?: number;
  prorationBehavior: 'create_prorations' | 'none' | 'always_invoice';
  billingCycleAnchor?: number;
  trialPeriodDays?: number;
  metadata?: Record<string, any>;
  promotionCode?: string;
  coupon?: string;
  defaultPaymentMethod?: string;
}

export interface CancelSubscriptionRequest {
  subscriptionId: string;
  reason: string;
  invoiceNow?: boolean;
  prorate?: boolean;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, any>;
}

export interface CancelResult {
  success: boolean;
  subscriptionId: string;
  status: 'canceled' | 'active' | 'incomplete_expired';
  canceledAt?: string;
  periodEnd?: string;
  refundAmount?: number;
  metadata: Record<string, any>;
}

export interface PaymentIntentRequest {
  customerId: string;
  amount: number;
  currency: string;
  paymentMethodTypes: string[];
  paymentMethodId?: string;
  confirm: boolean;
  description: string;
  metadata: Record<string, any>;
  receiptEmail?: string;
  setupFutureUsage?: 'off_session' | 'on_session';
  useStripeSDK?: boolean;
  return_url?: string;
}

export interface PaymentIntentResult {
  success: boolean;
  clientSecret?: string;
  paymentIntentId: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  amount: number;
  currency: string;
  nextAction?: NextAction;
  metadata: Record<string, any>;
}

export interface PaymentConfirmationResult {
  success: boolean;
  paymentIntentId: string;
  status: string;
  amount: number;
  currency: string;
  receiptUrl?: string;
  failureReason?: string;
  processingTime: number;
}

export interface AddPaymentMethodRequest {
  customerId: string;
  type: 'card' | 'bank_account' | 'sepa_debit';
  card?: CardDetails;
  bankAccount?: BankAccountDetails;
  sepaDebit?: SEPADebitDetails;
  billingDetails: BillingDetails;
  metadata: Record<string, any>;
}

export interface UpdatePaymentMethodRequest {
  card?: CardDetails;
  billingDetails?: BillingDetails;
  metadata?: Record<string, any>;
}

export interface InvoiceRequest {
  customerId: string;
  subscriptionId?: string;
  description?: string;
  metadata: Record<string, any>;
  daysUntilDue?: number;
  autoAdvance?: boolean;
  collectionMethod: 'charge_automatically' | 'send_invoice';
  customFields?: InvoiceCustomField[];
  footer?: string;
  memo?: string;
}

export interface InvoiceFilters {
  status?: ('draft' | 'open' | 'paid' | 'void' | 'uncollectible')[];
  subscription?: string;
  created?: DateFilter;
  dueDate?: DateFilter;
  limit?: number;
  startingAfter?: string;
}

export interface PaymentFilters {
  type?: ('charge' | 'refund' | 'payout')[];
  created?: DateFilter;
  amount?: NumberFilter;
  currency?: string;
  limit?: number;
  startingAfter?: string;
}

export interface InvoiceResult {
  success: boolean;
  invoiceId: string;
  number: string;
  status: string;
  amount: number;
  currency: string;
  dueDate: string;
  paid?: boolean;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  metadata: Record<string, any>;
}

export interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  amount: number;
  currency: string;
  dueDate: string;
  created: string;
  paid?: string;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  subscription?: string;
  customer: string;
  metadata: Record<string, any>;
  lines: InvoiceLine[];
  totalTaxAmount: number;
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
}

export interface InvoiceLine {
  id: string;
  description: string;
  amount: number;
  currency: string;
  quantity?: number;
  period?: Period;
  proration?: boolean;
  metadata: Record<string, any>;
}

export interface Period {
  start: string;
  end: string;
}

export interface PaymentRecord {
  id: string;
  type: 'charge' | 'refund' | 'payout';
  amount: number;
  currency: string;
  status: string;
  created: string;
  description: string;
  customer: string;
  invoice?: string;
  metadata: Record<string, any>;
  failureCode?: string;
  failureMessage?: string;
  receiptUrl?: string;
}

export interface ProrationCalculation {
  subscriptionId: string;
  currentPlanId: string;
  newPlanId: string;
  prorationDate: string;
  currentPeriodEnd: string;
  prorationAmount: number;
  creditAmount: number;
  debitAmount: number;
  netAmount: number;
  currency: string;
  invoiceItems: InvoiceItem[];
  prorationDetails: ProrationDetails;
}

export interface InvoiceItem {
  id: string;
  amount: number;
  currency: string;
  description: string;
  quantity?: number;
  unitAmount: number;
  period?: Period;
  proration: boolean;
  metadata: Record<string, any>;
}

export interface ProrationDetails {
  unusedTime: number;
  usedTime: number;
  billingCycleProration: boolean;
  timezone: string;
}

export interface FinancialReport {
  timeframe: FinancialTimeframe;
  currency: string;
  summary: FinancialSummary;
  revenue: RevenueReport;
  transactions: TransactionReport;
  subscriptions: SubscriptionFinancialReport;
  refunds: RefundReport;
  failedPayments: FailedPaymentReport;
  forecasting: FinancialForecasting;
  metrics: FinancialMetrics;
}

export interface FinancialTimeframe {
  start: string;
  end: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  custom?: boolean;
}

export interface FinancialSummary {
  totalRevenue: number;
  netRevenue: number;
  grossRevenue: number;
  refunds: number;
  chargebacks: number;
  fees: number;
  netFees: number;
  profit: number;
  profitMargin: number;
  averageTransactionValue: number;
  transactionCount: number;
  customerCount: number;
  subscriptionRevenue: number;
  oneTimeRevenue: number;
}

export interface RevenueReport {
  byPeriod: RevenueByPeriod[];
  byPlan: RevenueByPlan[];
  byRegion: RevenueByRegion[];
  byPaymentMethod: RevenueByPaymentMethod[];
  recurringVsNonRecurring: RecurringRevenueBreakdown;
  growth: RevenueGrowth;
}

export interface RevenueByPeriod {
  period: string;
  revenue: number;
  transactions: number;
  customers: number;
  growth: number;
}

export interface RevenueByPlan {
  planId: string;
  planName: string;
  revenue: number;
  subscribers: number;
  averageRevenuePerUser: number;
  contribution: number; // percentage of total revenue
  growth: number;
}

export interface RevenueByRegion {
  country: string;
  region: string;
  revenue: number;
  customers: number;
  averageRevenuePerCustomer: number;
  currency: string;
}

export interface RevenueByPaymentMethod {
  paymentMethod: string;
  revenue: number;
  transactions: number;
  successRate: number;
  fees: number;
}

export interface RecurringRevenueBreakdown {
  recurring: number;
  nonRecurring: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  churnRate: number;
  netRevenueRetention: number;
}

export interface RevenueGrowth {
  periodOverPeriod: number;
  yearOverYear: number;
  compoundAnnualGrowthRate: number;
  projectedGrowth: number;
}

export interface TransactionReport {
  successfulTransactions: TransactionSummary;
  failedTransactions: TransactionSummary;
  declinedTransactions: TransactionSummary;
  byPaymentMethod: TransactionByPaymentMethod[];
  byRegion: TransactionByRegion[];
  byTimeOfDay: TransactionByTimeOfDay[];
  failureAnalysis: FailureAnalysis;
}

export interface TransactionSummary {
  count: number;
  amount: number;
  averageValue: number;
  currency: string;
  successRate: number;
  processingTime: number;
}

export interface TransactionByPaymentMethod {
  paymentMethod: string;
  count: number;
  amount: number;
  successRate: number;
  averageValue: number;
  fees: number;
}

export interface TransactionByRegion {
  country: string;
  region: string;
  count: number;
  amount: number;
  averageValue: number;
  successRate: number;
  currency: string;
}

export interface TransactionByTimeOfDay {
  hour: number;
  count: number;
  amount: number;
  successRate: number;
  averageValue: number;
}

export interface FailureAnalysis {
  totalFailures: number;
  failureRate: number;
  commonFailureReasons: FailureReason[];
  failureByPaymentMethod: FailureByPaymentMethod[];
  impactOnRevenue: number;
  recommendedActions: string[];
}

export interface FailureReason {
  reason: string;
  code: string;
  count: number;
  percentage: number;
  revenueImpact: number;
  preventable: boolean;
  mitigation: string[];
}

export interface FailureByPaymentMethod {
  paymentMethod: string;
  failures: number;
  attempts: number;
  failureRate: number;
  commonReasons: string[];
}

export interface SubscriptionFinancialReport {
  activeSubscriptions: number;
  newSubscriptions: number;
  churnedSubscriptions: number;
  pausedSubscriptions: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
  churnRate: number;
  upgradeRate: number;
  downgradeRate: number;
  byPlan: SubscriptionMetricsByPlan[];
  byBillingCycle: SubscriptionMetricsByBillingCycle[];
}

export interface SubscriptionMetricsByPlan {
  planId: string;
  planName: string;
  activeSubscriptions: number;
  newSubscriptions: number;
  churnedSubscriptions: number;
  revenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  upgradeRate: number;
  downgradeRate: number;
}

export interface SubscriptionMetricsByBillingCycle {
  billingCycle: string;
  subscriptions: number;
  revenue: number;
  churnRate: number;
  averageRevenuePerUser: number;
  retentionRate: number;
}

export interface RefundReport {
  totalRefunds: number;
  refundAmount: number;
  refundRate: number;
  averageRefundAmount: number;
  byReason: RefundByReason[];
  byPlan: RefundByPlan[];
  byTimeSincePurchase: RefundByTimeSincePurchase[];
  impact: RefundImpact;
}

export interface RefundByReason {
  reason: string;
  count: number;
  amount: number;
  percentage: number;
  averageAmount: number;
}

export interface RefundByPlan {
  planId: string;
  planName: string;
  refunds: number;
  refundAmount: number;
  refundRate: number;
}

export interface RefundByTimeSincePurchase {
  timeframe: string;
  refunds: number;
  amount: number;
  percentage: number;
}

export interface RefundImpact {
  revenueLoss: number;
  netRevenueAfterRefunds: number;
  customerRetention: number;
  repeatPurchaseRate: number;
}

export interface FailedPaymentReport {
  totalFailedPayments: number;
  failedAmount: number;
  failureRate: number;
  recoveryRate: number;
  byReason: FailedPaymentByReason[];
  byPlan: FailedPaymentByPlan[];
  recoveryStrategies: RecoveryStrategy[];
  revenueAtRisk: number;
  recoveredRevenue: number;
}

export interface FailedPaymentByReason {
  reason: string;
  count: number;
  amount: number;
  percentage: number;
  recoveryRate: number;
}

export interface FailedPaymentByPlan {
  planId: string;
  planName: string;
  failedPayments: number;
  failedAmount: number;
  failureRate: number;
  recoveryRate: number;
}

export interface RecoveryStrategy {
  strategy: string;
  description: string;
  successRate: number;
  implementation: string;
  cost: number;
  recoveredRevenue: number;
}

export interface FinancialForecasting {
  nextMonth: Forecast;
  nextQuarter: Forecast;
  nextYear: Forecast;
  assumptions: ForecastingAssumption[];
  scenarios: ForecastScenario[];
  recommendations: ForecastRecommendation[];
}

export interface Forecast {
  revenue: number;
  transactions: number;
  customers: number;
  growth: number;
  confidence: number;
  factors: string[];
}

export interface ForecastingAssumption {
  assumption: string;
  value: number;
  impact: 'high' | 'medium' | 'low';
  basis: string;
}

export interface ForecastScenario {
  name: string;
  description: string;
  revenue: number;
  probability: number;
  keyDrivers: string[];
}

export interface ForecastRecommendation {
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  implementation: string;
  timeframe: string;
}

export interface FinancialMetrics {
  profitMargin: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  returnOnInvestment: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  paybackPeriod: string;
  breakEvenPoint: string;
  cashFlow: CashFlowMetrics;
}

export interface CashFlowMetrics {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  freeCashFlow: number;
  cashConversionCycle: string;
  burnRate: number;
  runway: string;
}

export class StripePaymentProcessor implements PaymentProcessor {
  private stripe: Stripe;
  private webhookSecret: string;
  private fraudDetector: FraudDetector;
  private analytics: PaymentAnalytics;

  constructor(apiKey: string, webhookSecret: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
    this.webhookSecret = webhookSecret;
    this.fraudDetector = new FraudDetector();
    this.analytics = new PaymentAnalytics();
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const startTime = Date.now();

    try {
      // Pre-payment fraud check
      const fraudRisk = await this.fraudDetector.assessRisk(request);

      if (fraudRisk.riskLevel === 'high' && fraudRisk.block) {
        return {
          success: false,
          paymentId: '',
          status: 'failed',
          amount: request.amount,
          currency: request.currency,
          failureReason: 'High fraud risk detected',
          processingTime: Date.now() - startTime,
          fraudRisk,
          metadata: request.metadata
        };
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: request.amount,
        currency: request.currency,
        customer: request.customerId,
        payment_method: request.paymentMethodId,
        description: request.description,
        metadata: request.metadata,
        receipt_email: request.receiptEmail,
        statement_descriptor: request.statementDescriptor,
        application_fee_amount: request.applicationFeeAmount,
        transfer_data: request.transferData,
        confirm: true,
        return_url: 'https://callwall.app/payment/return'
      });

      // Check if payment requires additional action
      if (paymentIntent.status === 'requires_action') {
        return {
          success: false,
          paymentId: paymentIntent.id,
          status: 'requires_action',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          nextAction: {
            type: paymentIntent.next_action?.type || 'unknown',
            clientSecret: paymentIntent.client_secret
          },
          processingTime: Date.now() - startTime,
          fraudRisk,
          metadata: request.metadata
        };
      }

      // Payment successful
      if (paymentIntent.status === 'succeeded') {
        await this.analytics.trackPayment({
          paymentIntentId: paymentIntent.id,
          customerId: request.customerId,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'succeeded',
          processingTime: Date.now() - startTime,
          fraudRisk
        });

        return {
          success: true,
          paymentId: paymentIntent.id,
          status: 'succeeded',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          receiptUrl: paymentIntent.charges.data[0]?.receipt_url,
          processingTime: Date.now() - startTime,
          fraudRisk,
          metadata: request.metadata
        };
      }

      // Payment failed
      const lastPaymentError = paymentIntent.last_payment_error;

      return {
        success: false,
        paymentId: paymentIntent.id,
        status: 'failed',
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        failureReason: lastPaymentError?.message || 'Payment failed',
        processingTime: Date.now() - startTime,
        fraudRisk,
        metadata: request.metadata
      };

    } catch (error) {
      console.error('Payment processing failed:', error);

      return {
        success: false,
        paymentId: '',
        status: 'failed',
        amount: request.amount,
        currency: request.currency,
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
        fraudRisk: { riskLevel: 'low', score: 0, factors: [], block: false },
        metadata: request.metadata
      };
    }
  }

  async processRefund(refundRequest: RefundRequest): Promise<RefundResult> {
    const startTime = Date.now();

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: refundRequest.paymentId,
        amount: refundRequest.amount,
        reason: refundRequest.reason,
        metadata: refundRequest.metadata,
        refund_application_fee: refundRequest.refundApplicationFee,
        reverse_transfer: refundRequest.reverseTransfer
      });

      await this.analytics.trackRefund({
        refundId: refund.id,
        paymentId: refundRequest.paymentId,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refundRequest.reason,
        processingTime: Date.now() - startTime
      });

      return {
        success: refund.status === 'succeeded',
        refundId: refund.id,
        status: refund.status as any,
        amount: refund.amount,
        currency: refund.currency,
        receiptNumber: refund.receipt_number,
        reason: refundRequest.reason,
        processingTime: Date.now() - startTime,
        metadata: refund.metadata
      };

    } catch (error) {
      console.error('Refund processing failed:', error);

      return {
        success: false,
        refundId: '',
        status: 'failed',
        amount: refundRequest.amount || 0,
        currency: 'usd',
        reason: refundRequest.reason,
        processingTime: Date.now() - startTime,
        metadata: refundRequest.metadata || {}
      };
    }
  }

  async createSubscription(subscriptionRequest: SubscriptionRequest): Promise<SubscriptionResult> {
    try {
      // Apply promotion code if provided
      let subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: subscriptionRequest.customerId,
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: subscriptionRequest.metadata
      };

      // Add items based on price
      if (subscriptionRequest.priceId) {
        subscriptionParams.items = [{
          price: subscriptionRequest.priceId,
        }];
      }

      // Add trial period if specified
      if (subscriptionRequest.trialPeriodDays) {
        subscriptionParams.trial_period_days = subscriptionRequest.trialPeriodDays;
      }

      // Add billing cycle anchor if specified
      if (subscriptionRequest.billingCycleAnchor) {
        subscriptionParams.billing_cycle_anchor = subscriptionRequest.billingCycleAnchor;
      }

      // Add promotion code if provided
      if (subscriptionRequest.promotionCode) {
        subscriptionParams.promotion_code = subscriptionRequest.promotionCode;
      }

      // Add coupon if provided
      if (subscriptionRequest.coupon) {
        subscriptionParams.coupon = subscriptionRequest.coupon;
      }

      // Add default payment method if specified
      if (subscriptionRequest.defaultPaymentMethod) {
        subscriptionParams.default_payment_method = subscriptionRequest.defaultPaymentMethod;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionParams);

      // Get plan details
      const price = await this.stripe.prices.retrieve(subscription.items.data[0].price.id);
      const product = await this.stripe.products.retrieve(price.product as string);

      return {
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : undefined,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : undefined,
        plan: {
          id: price.id,
          name: product.name,
          amount: price.unit_amount || 0,
          currency: price.currency,
          interval: price.recurring?.interval || 'month',
          intervalCount: price.recurring?.interval_count || 1
        },
        customer: subscription.customer as string,
        paymentMethod: subscription.default_payment_method as string,
        metadata: subscription.metadata,
        latestInvoice: subscription.latest_invoice as string,
        pendingSetupIntent: subscription.pending_setup_intent as string
      };

    } catch (error) {
      console.error('Subscription creation failed:', error);

      throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateSubscription(subscriptionId: string, updateRequest: SubscriptionUpdateRequest): Promise<SubscriptionResult> {
    try {
      let updateParams: Stripe.SubscriptionUpdateParams = {
        proration_behavior: updateRequest.prorationBehavior,
        metadata: updateRequest.metadata
      };

      // Update payment method if provided
      if (updateRequest.paymentMethodId) {
        updateParams.default_payment_method = updateRequest.paymentMethodId;
      }

      // Update plan if provided
      if (updateRequest.planId) {
        updateParams.items = [{
          price: updateRequest.planId,
        }];
      }

      // Update billing cycle anchor if provided
      if (updateRequest.billingCycleAnchor) {
        updateParams.billing_cycle_anchor = updateRequest.billingCycleAnchor;
      }

      // Add trial period if specified
      if (updateRequest.trialPeriodDays) {
        updateParams.trial_period_days = updateRequest.trialPeriodDays;
      }

      // Add promotion code if provided
      if (updateRequest.promotionCode) {
        updateParams.promotion_code = updateRequest.promotionCode;
      }

      // Add coupon if provided
      if (updateRequest.coupon) {
        updateParams.coupon = updateRequest.coupon;
      }

      // Update default payment method if specified
      if (updateRequest.defaultPaymentMethod) {
        updateParams.default_payment_method = updateRequest.defaultPaymentMethod;
      }

      const subscription = await this.stripe.subscriptions.update(subscriptionId, updateParams);

      // Get plan details
      const price = await this.stripe.prices.retrieve(subscription.items.data[0].price.id);
      const product = await this.stripe.products.retrieve(price.product as string);

      return {
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : undefined,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : undefined,
        plan: {
          id: price.id,
          name: product.name,
          amount: price.unit_amount || 0,
          currency: price.currency,
          interval: price.recurring?.interval || 'month',
          intervalCount: price.recurring?.interval_count || 1
        },
        customer: subscription.customer as string,
        paymentMethod: subscription.default_payment_method as string,
        metadata: subscription.metadata,
        latestInvoice: subscription.latest_invoice as string
      };

    } catch (error) {
      console.error('Subscription update failed:', error);

      throw new Error(`Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelSubscription(subscriptionId: string, cancelRequest: CancelSubscriptionRequest): Promise<CancelResult> {
    try {
      let cancelParams: Stripe.SubscriptionCancelParams = {
        metadata: cancelRequest.metadata
      };

      // Handle cancellation behavior
      if (cancelRequest.cancelAtPeriodEnd) {
        // Update subscription to cancel at period end
        const subscription = await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
          metadata: cancelRequest.metadata
        });

        return {
          success: true,
          subscriptionId: subscription.id,
          status: subscription.status as any,
          periodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          metadata: subscription.metadata
        };
      } else {
        // Cancel immediately
        const subscription = await this.stripe.subscriptions.cancel(subscriptionId, cancelParams);

        return {
          success: true,
          subscriptionId: subscription.id,
          status: subscription.status as any,
          canceledAt: new Date(subscription.canceled_at! * 1000).toISOString(),
          metadata: subscription.metadata
        };
      }

    } catch (error) {
      console.error('Subscription cancellation failed:', error);

      throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createPaymentIntent(paymentIntentRequest: PaymentIntentRequest): Promise<PaymentIntentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: paymentIntentRequest.amount,
        currency: paymentIntentRequest.currency,
        customer: paymentIntentRequest.customerId,
        payment_method_types: paymentIntentRequest.paymentMethodTypes,
        payment_method: paymentIntentRequest.paymentMethodId,
        confirm: paymentIntentRequest.confirm,
        description: paymentIntentRequest.description,
        metadata: paymentIntentRequest.metadata,
        receipt_email: paymentIntentRequest.receiptEmail,
        setup_future_usage: paymentIntentRequest.setupFutureUsage,
        usage: 'off_session',
        return_url: paymentIntentRequest.return_url
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status as any,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        nextAction: paymentIntent.next_action ? {
          type: paymentIntent.next_action.type,
          clientSecret: paymentIntent.client_secret
        } : undefined,
        metadata: paymentIntent.metadata
      };

    } catch (error) {
      console.error('Payment intent creation failed:', error);

      throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentConfirmationResult> {
    const startTime = Date.now();

    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);

      return {
        success: paymentIntent.status === 'succeeded',
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        receiptUrl: paymentIntent.charges.data[0]?.receipt_url,
        failureReason: paymentIntent.last_payment_error?.message,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Payment confirmation failed:', error);

      return {
        success: false,
        paymentIntentId: paymentIntentId,
        status: 'failed',
        amount: 0,
        currency: 'usd',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      };
    }
  }

  async getPaymentMethods(customerId: string): Promise<PaymentMethodInfo[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type as any,
        last4: pm.card?.last4,
        brand: pm.card?.brand,
        expiry: pm.card ? `${pm.card.exp_month.toString().padStart(2, '0')}/${pm.card.exp_year}` : undefined,
        isDefault: false, // Would need to check against customer's default payment method
        billingAddress: {
          line1: pm.billing_details.address?.line1 || '',
          city: pm.billing_details.address?.city || '',
          state: pm.billing_details.address?.state || '',
          zip: pm.billing_details.address?.postal_code || '',
          country: pm.billing_details.address?.country || ''
        },
        metadata: pm.metadata
      }));

    } catch (error) {
      console.error('Failed to get payment methods:', error);
      return [];
    }
  }

  async addPaymentMethod(customerId: string, paymentMethodRequest: AddPaymentMethodRequest): Promise<PaymentMethodInfo> {
    try {
      let paymentMethodParams: Stripe.PaymentMethodCreateParams = {
        type: paymentMethodRequest.type,
        customer: customerId,
        billing_details: paymentMethodRequest.billingDetails,
        metadata: paymentMethodRequest.metadata
      };

      // Add card details if provided
      if (paymentMethodRequest.card) {
        paymentMethodParams.card = paymentMethodRequest.card;
      }

      // Add bank account details if provided
      if (paymentMethodRequest.bankAccount) {
        paymentMethodParams.us_bank_account = paymentMethodRequest.bankAccount;
      }

      // Add SEPA debit details if provided
      if (paymentMethodRequest.sepaDebit) {
        paymentMethodParams.sepa_debit = paymentMethodRequest.sepaDebit;
      }

      const paymentMethod = await this.stripe.paymentMethods.create(paymentMethodParams);

      return {
        id: paymentMethod.id,
        type: paymentMethod.type as any,
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
        expiry: paymentMethod.card ? `${paymentMethod.card.exp_month.toString().padStart(2, '0')}/${paymentMethod.card.exp_year}` : undefined,
        isDefault: false,
        billingAddress: {
          line1: paymentMethod.billing_details.address?.line1 || '',
          city: paymentMethod.billing_details.address?.city || '',
          state: paymentMethod.billing_details.address?.state || '',
          zip: paymentMethod.billing_details.address?.postal_code || '',
          country: paymentMethod.billing_details.address?.country || ''
        },
        metadata: paymentMethod.metadata
      };

    } catch (error) {
      console.error('Failed to add payment method:', error);
      throw new Error(`Failed to add payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePaymentMethod(paymentMethodId: string, updateRequest: UpdatePaymentMethodRequest): Promise<PaymentMethodInfo> {
    try {
      let updateParams: Stripe.PaymentMethodUpdateParams = {
        metadata: updateRequest.metadata
      };

      // Update card details if provided
      if (updateRequest.card) {
        updateParams.card = updateRequest.card;
      }

      // Update billing details if provided
      if (updateRequest.billingDetails) {
        updateParams.billing_details = updateRequest.billingDetails;
      }

      const paymentMethod = await this.stripe.paymentMethods.update(paymentMethodId, updateParams);

      return {
        id: paymentMethod.id,
        type: paymentMethod.type as any,
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
        expiry: paymentMethod.card ? `${paymentMethod.card.exp_month.toString().padStart(2, '0')}/${paymentMethod.card.exp_year}` : undefined,
        isDefault: false,
        billingAddress: {
          line1: paymentMethod.billing_details.address?.line1 || '',
          city: paymentMethod.billing_details.address?.city || '',
          state: paymentMethod.billing_details.address?.state || '',
          zip: paymentMethod.billing_details.address?.postal_code || '',
          country: paymentMethod.billing_details.address?.country || ''
        },
        metadata: paymentMethod.metadata
      };

    } catch (error) {
      console.error('Failed to update payment method:', error);
      throw new Error(`Failed to update payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
      return true;

    } catch (error) {
      console.error('Failed to delete payment method:', error);
      return false;
    }
  }

  async createInvoice(invoiceRequest: InvoiceRequest): Promise<InvoiceResult> {
    try {
      let invoiceParams: Stripe.InvoiceCreateParams = {
        customer: invoiceRequest.customerId,
        description: invoiceRequest.description,
        metadata: invoiceRequest.metadata,
        days_until_due: invoiceRequest.daysUntilDue,
        auto_advance: invoiceRequest.autoAdvance,
        collection_method: invoiceRequest.collectionMethod,
        footer: invoiceRequest.footer,
        memo: invoiceRequest.memo
      };

      // Add subscription if provided
      if (invoiceRequest.subscriptionId) {
        invoiceParams.subscription = invoiceRequest.subscriptionId;
      }

      // Add custom fields if provided
      if (invoiceRequest.customFields && invoiceRequest.customFields.length > 0) {
        invoiceParams.custom_fields = invoiceRequest.customFields.map(field => ({
          name: field.name,
          value: field.value
        }));
      }

      const invoice = await this.stripe.invoices.create(invoiceParams);

      return {
        success: true,
        invoiceId: invoice.id,
        number: invoice.number || '',
        status: invoice.status as any,
        amount: invoice.total,
        currency: invoice.currency,
        dueDate: new Date(invoice.due_date! * 1000).toISOString(),
        paid: invoice.paid ? new Date(invoice.status_transitions!.paid_at! * 1000).toISOString() : undefined,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        metadata: invoice.metadata
      };

    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw new Error(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getInvoices(customerId: string, filters?: InvoiceFilters): Promise<Invoice[]> {
    try {
      let listParams: Stripe.InvoiceListParams = {
        customer: customerId,
        limit: filters?.limit || 100
      };

      // Add status filter if provided
      if (filters?.status && filters.status.length > 0) {
        listParams.status = filters.status as any;
      }

      // Add subscription filter if provided
      if (filters?.subscription) {
        listParams.subscription = filters.subscription;
      }

      // Add created date filter if provided
      if (filters?.created) {
        if (filters.created.gte) {
          listParams.created = { gte: Math.floor(filters.created.gte.getTime() / 1000) };
        }
        if (filters.created.lte) {
          listParams.created = { ...listParams.created, lte: Math.floor(filters.created.lte.getTime() / 1000) };
        }
      }

      // Add pagination
      if (filters?.startingAfter) {
        listParams.starting_after = filters.startingAfter;
      }

      const invoices = await this.stripe.invoices.list(listParams);

      return invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number || '',
        status: invoice.status as any,
        amount: invoice.total,
        currency: invoice.currency,
        dueDate: new Date(invoice.due_date! * 1000).toISOString(),
        created: new Date(invoice.created * 1000).toISOString(),
        paid: invoice.paid ? new Date(invoice.status_transitions!.paid_at! * 1000).toISOString() : undefined,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        subscription: invoice.subscription as string,
        customer: invoice.customer as string,
        metadata: invoice.metadata,
        lines: invoice.lines.data.map(line => ({
          id: line.id,
          description: line.description || '',
          amount: line.amount || 0,
          currency: line.currency,
          quantity: line.quantity || undefined,
          period: line.period ? {
            start: new Date(line.period.start * 1000).toISOString(),
            end: new Date(line.period.end * 1000).toISOString()
          } : undefined,
          proration: line.proration || false,
          metadata: line.metadata
        })),
        totalTaxAmount: invoice.total_tax_amounts.reduce((sum, tax) => sum + tax.amount, 0),
        subtotal: invoice.subtotal,
        tax: invoice.tax || 0,
        discount: invoice.discount ? invoice.discount.amount : undefined,
        total: invoice.total
      }));

    } catch (error) {
      console.error('Failed to get invoices:', error);
      return [];
    }
  }

  async getPaymentHistory(customerId: string, filters?: PaymentFilters): Promise<PaymentRecord[]> {
    try {
      let chargeParams: Stripe.ChargeListParams = {
        customer: customerId,
        limit: filters?.limit || 100,
        expand: ['data.balance_transaction']
      };

      // Add type filter if provided
      if (filters?.type && filters.type.length > 0) {
        // Note: Stripe doesn't support filtering by multiple types directly
        // We would need to make separate calls for each type
      }

      // Add created date filter if provided
      if (filters?.created) {
        if (filters.created.gte) {
          chargeParams.created = { gte: Math.floor(filters.created.gte.getTime() / 1000) };
        }
        if (filters.created.lte) {
          chargeParams.created = { ...chargeParams.created, lte: Math.floor(filters.created.lte.getTime() / 1000) };
        }
      }

      // Add pagination
      if (filters?.startingAfter) {
        chargeParams.starting_after = filters.startingAfter;
      }

      const charges = await this.stripe.charges.list(chargeParams);

      return charges.data.map(charge => ({
        id: charge.id,
        type: 'charge',
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        created: new Date(charge.created * 1000).toISOString(),
        description: charge.description || '',
        customer: charge.customer as string,
        invoice: charge.invoice as string,
        metadata: charge.metadata,
        failureCode: charge.failure_code,
        failureMessage: charge.failure_message,
        receiptUrl: charge.receipt_url
      }));

    } catch (error) {
      console.error('Failed to get payment history:', error);
      return [];
    }
  }

  async calculateProration(subscriptionId: string, newPlanId: string): Promise<ProrationCalculation> {
    try {
      // Get current subscription
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['customer.default_source']
      });

      // Get current and new price details
      const currentPriceId = subscription.items.data[0].price.id;
      const currentPrice = await this.stripe.prices.retrieve(currentPriceId);
      const newPrice = await this.stripe.prices.retrieve(newPlanId);

      // Calculate proration timestamp (now)
      const prorationTimestamp = Math.floor(Date.now() / 1000);

      // Create invoice items for proration
      const creditInvoiceItem = await this.stripe.invoiceItems.create({
        customer: subscription.customer as string,
        subscription: subscriptionId,
        price: currentPriceId,
        quantity: -1,
        unit_amount: currentPrice.unit_amount,
        proration_date: prorationTimestamp,
        description: 'Unused time credit'
      });

      const debitInvoiceItem = await this.stripe.invoiceItems.create({
        customer: subscription.customer as string,
        subscription: subscriptionId,
        price: newPlanId,
        quantity: 1,
        unit_amount: newPrice.unit_amount,
        proration_date: prorationTimestamp,
        description: 'New plan charge'
      });

      const creditAmount = creditInvoiceItem.amount;
      const debitAmount = debitInvoiceItem.amount;
      const netAmount = debitAmount + creditAmount; // creditAmount is negative

      return {
        subscriptionId,
        currentPlanId,
        newPlanId,
        prorationDate: new Date(prorationTimestamp * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        prorationAmount: Math.abs(netAmount),
        creditAmount: Math.abs(creditAmount),
        debitAmount,
        netAmount,
        currency: newPrice.currency,
        invoiceItems: [
          {
            id: creditInvoiceItem.id,
            amount: creditInvoiceItem.amount,
            currency: creditInvoiceItem.currency,
            description: creditInvoiceItem.description,
            unitAmount: creditInvoiceItem.unit_amount || 0,
            proration: true,
            metadata: creditInvoiceItem.metadata
          },
          {
            id: debitInvoiceItem.id,
            amount: debitInvoiceItem.amount,
            currency: debitInvoiceItem.currency,
            description: debitInvoiceItem.description,
            unitAmount: debitInvoiceItem.unit_amount || 0,
            proration: true,
            metadata: debitInvoiceItem.metadata
          }
        ],
        prorationDetails: {
          unusedTime: this.calculateUnusedTime(subscription, prorationTimestamp),
          usedTime: this.calculateUsedTime(subscription, prorationTimestamp),
          billingCycleProration: true,
          timezone: 'UTC'
        }
      };

    } catch (error) {
      console.error('Failed to calculate proration:', error);
      throw new Error(`Failed to calculate proration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handleWebhook(event: StripeWebhookEvent): Promise<WebhookResult> {
    try {
      // Verify webhook signature
      const signature = event.headers['stripe-signature'];
      const webhookEvent = this.stripe.webhooks.constructEvent(
        event.body,
        signature,
        this.webhookSecret
      );

      switch (webhookEvent.type) {
        case 'invoice.payment_succeeded':
          return await this.handleInvoicePaymentSucceeded(webhookEvent.data.object as Stripe.Invoice);

        case 'invoice.payment_failed':
          return await this.handleInvoicePaymentFailed(webhookEvent.data.object as Stripe.Invoice);

        case 'customer.subscription.created':
          return await this.handleSubscriptionCreated(webhookEvent.data.object as Stripe.Subscription);

        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdated(webhookEvent.data.object as Stripe.Subscription);

        case 'customer.subscription.deleted':
          return await this.handleSubscriptionDeleted(webhookEvent.data.object as Stripe.Subscription);

        case 'payment_method.attached':
          return await this.handlePaymentMethodAttached(webhookEvent.data.object as Stripe.PaymentMethod);

        default:
          return {
            success: true,
            event: webhookEvent.type,
            processed: false,
            message: 'Event type not handled',
            data: null
          };
      }

    } catch (error) {
      console.error('Webhook handling failed:', error);

      return {
        success: false,
        event: event.type,
        processed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  async generateFinancialReport(timeframe: FinancialTimeframe, filters?: FinancialFilters): Promise<FinancialReport> {
    try {
      return await this.analytics.generateFinancialReport(timeframe, filters);
    } catch (error) {
      console.error('Failed to generate financial report:', error);
      throw new Error(`Failed to generate financial report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exportTransactionData(filters: ExportFilters): Promise<ExportResult> {
    try {
      return await this.analytics.exportTransactionData(filters);
    } catch (error) {
      console.error('Failed to export transaction data:', error);
      throw new Error(`Failed to export transaction data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods
  private calculateUnusedTime(subscription: Stripe.Subscription, prorationTimestamp: number): number {
    const periodEnd = subscription.current_period_end;
    const periodStart = subscription.current_period_start;
    const totalPeriod = periodEnd - periodStart;
    const unusedPeriod = periodEnd - prorationTimestamp;
    return (unusedPeriod / totalPeriod) * 100;
  }

  private calculateUsedTime(subscription: Stripe.Subscription, prorationTimestamp: number): number {
    return 100 - this.calculateUnusedTime(subscription, prorationTimestamp);
  }

  // Webhook event handlers
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<WebhookResult> {
    try {
      // Process successful invoice payment
      await this.analytics.trackInvoicePayment({
        invoiceId: invoice.id,
        customerId: invoice.customer as string,
        amount: invoice.paid ? invoice.amount_paid : 0,
        status: 'succeeded'
      });

      return {
        success: true,
        event: 'invoice.payment_succeeded',
        processed: true,
        message: 'Invoice payment succeeded',
        data: {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          amount: invoice.amount_paid
        }
      };

    } catch (error) {
      console.error('Failed to handle invoice payment succeeded:', error);

      return {
        success: false,
        event: 'invoice.payment_succeeded',
        processed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<WebhookResult> {
    try {
      // Process failed invoice payment
      await this.analytics.trackInvoicePayment({
        invoiceId: invoice.id,
        customerId: invoice.customer as string,
        amount: 0,
        status: 'failed'
      });

      // Implement dunning strategy
      await this.initiateDunningProcess(invoice);

      return {
        success: true,
        event: 'invoice.payment_failed',
        processed: true,
        message: 'Invoice payment failed - dunning initiated',
        data: {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          attemptCount: invoice.attempt_count
        }
      };

    } catch (error) {
      console.error('Failed to handle invoice payment failed:', error);

      return {
        success: false,
        event: 'invoice.payment_failed',
        processed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<WebhookResult> {
    try {
      // Track subscription creation
      await this.analytics.trackSubscriptionEvent({
        eventType: 'created',
        subscriptionId: subscription.id,
        customerId: subscription.customer as string,
        planId: subscription.items.data[0].price.id,
        status: subscription.status
      });

      return {
        success: true,
        event: 'customer.subscription.created',
        processed: true,
        message: 'Subscription created successfully',
        data: {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status
        }
      };

    } catch (error) {
      console.error('Failed to handle subscription created:', error);

      return {
        success: false,
        event: 'customer.subscription.created',
        processed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<WebhookResult> {
    try {
      // Track subscription update
      await this.analytics.trackSubscriptionEvent({
        eventType: 'updated',
        subscriptionId: subscription.id,
        customerId: subscription.customer as string,
        planId: subscription.items.data[0].price.id,
        status: subscription.status
      });

      return {
        success: true,
        event: 'customer.subscription.updated',
        processed: true,
        message: 'Subscription updated successfully',
        data: {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status
        }
      };

    } catch (error) {
      console.error('Failed to handle subscription updated:', error);

      return {
        success: false,
        event: 'customer.subscription.updated',
        processed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<WebhookResult> {
    try {
      // Track subscription deletion
      await this.analytics.trackSubscriptionEvent({
        eventType: 'deleted',
        subscriptionId: subscription.id,
        customerId: subscription.customer as string,
        planId: subscription.items.data[0].price.id,
        status: subscription.status
      });

      return {
        success: true,
        event: 'customer.subscription.deleted',
        processed: true,
        message: 'Subscription deleted successfully',
        data: {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status
        }
      };

    } catch (error) {
      console.error('Failed to handle subscription deleted:', error);

      return {
        success: false,
        event: 'customer.subscription.deleted',
        processed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  private async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<WebhookResult> {
    try {
      // Track payment method attachment
      await this.analytics.trackPaymentMethodEvent({
        eventType: 'attached',
        paymentMethodId: paymentMethod.id,
        customerId: paymentMethod.customer as string,
        type: paymentMethod.type
      });

      return {
        success: true,
        event: 'payment_method.attached',
        processed: true,
        message: 'Payment method attached successfully',
        data: {
          paymentMethodId: paymentMethod.id,
          customerId: paymentMethod.customer,
          type: paymentMethod.type
        }
      };

    } catch (error) {
      console.error('Failed to handle payment method attached:', error);

      return {
        success: false,
        event: 'payment_method.attached',
        processed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  private async initiateDunningProcess(invoice: Stripe.Invoice): Promise<void> {
    // Implement dunning logic for failed payments
    // This would typically involve:
    // 1. Sending email notifications to customer
    // 2. Updating customer account status
    // 3. Scheduling retry attempts
    // 4. Potentially suspending access if retries fail
    console.log(`Initiating dunning process for invoice ${invoice.id}`);
  }
}

// Supporting classes and interfaces
class FraudDetector {
  async assessRisk(request: PaymentRequest): Promise<FraudAssessment> {
    // Mock implementation - would integrate with actual fraud detection service
    return {
      riskLevel: 'low',
      score: 15,
      factors: ['Known customer', 'Low amount', 'Standard payment method'],
      block: false
    };
  }
}

class PaymentAnalytics {
  async trackPayment(data: any): Promise<void> {
    console.log('Tracking payment:', data);
  }

  async trackRefund(data: any): Promise<void> {
    console.log('Tracking refund:', data);
  }

  async trackInvoicePayment(data: any): Promise<void> {
    console.log('Tracking invoice payment:', data);
  }

  async trackSubscriptionEvent(data: any): Promise<void> {
    console.log('Tracking subscription event:', data);
  }

  async trackPaymentMethodEvent(data: any): Promise<void> {
    console.log('Tracking payment method event:', data);
  }

  async generateFinancialReport(timeframe: FinancialTimeframe, filters?: FinancialFilters): Promise<FinancialReport> {
    // Mock implementation
    return {
      timeframe,
      currency: 'USD',
      summary: {
        totalRevenue: 100000,
        netRevenue: 85000,
        grossRevenue: 100000,
        refunds: 5000,
        chargebacks: 1000,
        fees: 9000,
        netFees: 8500,
        profit: 76000,
        profitMargin: 76,
        averageTransactionValue: 50,
        transactionCount: 2000,
        customerCount: 500,
        subscriptionRevenue: 80000,
        oneTimeRevenue: 20000
      },
      revenue: {
        byPeriod: [],
        byPlan: [],
        byRegion: [],
        byPaymentMethod: [],
        recurringVsNonRecurring: {
          recurring: 80000,
          nonRecurring: 20000,
          monthlyRecurringRevenue: 6667,
          annualRecurringRevenue: 80000,
          churnRate: 5,
          netRevenueRetention: 95
        },
        growth: {
          periodOverPeriod: 10,
          yearOverYear: 25,
          compoundAnnualGrowthRate: 30,
          projectedGrowth: 35
        }
      },
      transactions: {
        successfulTransactions: {
          count: 1900,
          amount: 95000,
          averageValue: 50,
          currency: 'USD',
          successRate: 95,
          processingTime: 2000
        },
        failedTransactions: {
          count: 100,
          amount: 5000,
          averageValue: 50,
          currency: 'USD',
          successRate: 0,
          processingTime: 1000
        },
        declinedTransactions: {
          count: 50,
          amount: 2500,
          averageValue: 50,
          currency: 'USD',
          successRate: 0,
          processingTime: 500
        },
        byPaymentMethod: [],
        byRegion: [],
        byTimeOfDay: [],
        failureAnalysis: {
          totalFailures: 150,
          failureRate: 7.5,
          commonFailureReasons: [],
          failureByPaymentMethod: [],
          impactOnRevenue: 7500,
          recommendedActions: ['Improve error handling', 'Update payment methods']
        }
      },
      subscriptions: {
        activeSubscriptions: 400,
        newSubscriptions: 50,
        churnedSubscriptions: 20,
        pausedSubscriptions: 10,
        monthlyRecurringRevenue: 6667,
        annualRecurringRevenue: 80000,
        averageRevenuePerUser: 200,
        customerLifetimeValue: 1200,
        churnRate: 5,
        upgradeRate: 15,
        downgradeRate: 10,
        byPlan: [],
        byBillingCycle: []
      },
      refunds: {
        totalRefunds: 100,
        refundAmount: 5000,
        refundRate: 5,
        averageRefundAmount: 50,
        byReason: [],
        byPlan: [],
        byTimeSincePurchase: [],
        impact: {
          revenueLoss: 5000,
          netRevenueAfterRefunds: 95000,
          customerRetention: 85,
          repeatPurchaseRate: 70
        }
      },
      failedPayments: {
        totalFailedPayments: 150,
        failedAmount: 7500,
        failureRate: 7.5,
        recoveryRate: 60,
        byReason: [],
        byPlan: [],
        recoveryStrategies: [],
        revenueAtRisk: 7500,
        recoveredRevenue: 4500
      },
      forecasting: {
        nextMonth: {
          revenue: 110000,
          transactions: 2200,
          customers: 550,
          growth: 10,
          confidence: 85,
          factors: ['Seasonal trends', 'Customer growth']
        },
        nextQuarter: {
          revenue: 350000,
          transactions: 7000,
          customers: 650,
          growth: 12,
          confidence: 80,
          factors: ['Market expansion', 'Product improvements']
        },
        nextYear: {
          revenue: 1500000,
          transactions: 30000,
          customers: 1200,
          growth: 25,
          confidence: 75,
          factors: ['Strategic initiatives', 'Market conditions']
        },
        assumptions: [],
        scenarios: [],
        recommendations: []
      },
      metrics: {
        profitMargin: 76,
        grossMargin: 90,
        operatingMargin: 80,
        netMargin: 76,
        returnOnInvestment: 150,
        customerAcquisitionCost: 50,
        customerLifetimeValue: 1200,
        paybackPeriod: '6 months',
        breakEvenPoint: '18 months',
        cashFlow: {
          operatingCashFlow: 80000,
          investingCashFlow: -20000,
          financingCashFlow: 10000,
          freeCashFlow: 70000,
          cashConversionCycle: '45 days',
          burnRate: 5000,
          runway: '14 months'
        }
      }
    };
  }

  async exportTransactionData(filters: ExportFilters): Promise<ExportResult> {
    // Mock implementation
    return {
      success: true,
      format: 'csv',
      url: 'https://callwall.app/exports/transactions.csv',
      recordCount: 1000,
      fileSize: '2.5MB',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }
}

// Additional interfaces
interface FraudAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  score: number; // 0-100
  factors: string[];
  block: boolean;
}

interface NextAction {
  type: string;
  clientSecret?: string;
}

interface TransferData {
  destination: string;
  amount?: number;
  currency?: string;
}

interface StripeWebhookEvent {
  body: string;
  headers: Record<string, string>;
  type: string;
}

interface WebhookResult {
  success: boolean;
  event: string;
  processed: boolean;
  message: string;
  data: any;
}

interface SubscriptionPlanInfo {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
}

interface DiscountInfo {
  coupon?: string;
  promotionCode?: string;
}

interface CardDetails {
  number?: string;
  exp_month?: number;
  exp_year?: number;
  cvc?: string;
  token?: string;
}

interface BankAccountDetails {
  country?: string;
  currency?: string;
  account_holder_name?: string;
  account_holder_type?: string;
  account_number?: string;
  routing_number?: string;
}

interface SEPADebitDetails {
  iban?: string;
  account_holder_name?: string;
}

interface BillingDetails {
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  email?: string;
  name?: string;
  phone?: string;
}

interface InvoiceCustomField {
  name: string;
  value: string;
}

interface DateFilter {
  gte?: Date;
  lte?: Date;
}

interface NumberFilter {
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
}

interface FinancialFilters {
  plans?: string[];
  regions?: string[];
  paymentMethods?: string[];
  customers?: string[];
}

interface ExportFilters {
  format?: 'csv' | 'json' | 'xlsx';
  dateRange?: DateFilter;
  transactionType?: string[];
  fields?: string[];
}

interface ExportResult {
  success: boolean;
  format: string;
  url: string;
  recordCount: number;
  fileSize: string;
  expiresAt: string;
}