import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

interface TierPlan {
  id: 'free' | 'premium' | 'business';
  name: string;
  price: string;
  yearlyPrice?: string;
  color: string;
  features: string[];
  popular?: boolean;
}

const PLANS: TierPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    color: '#9e9e9e',
    features: [
      '2 legal documents/month',
      '10 voicemail transcriptions',
      '25 phone numbers',
      '5 voice generations',
      '1 voice personality',
      '50MB storage',
      'Community support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$9.99',
    yearlyPrice: '$99',
    color: '#1976d2',
    popular: true,
    features: [
      'Unlimited legal documents',
      '100 voicemail transcriptions',
      'Unlimited phone numbers',
      '50 voice generations',
      'All 6 voice personalities',
      'Advanced threat analysis',
      '5GB storage',
      'Email support (24-48h)',
      'Export to PDF/CSV',
      'Real-time notifications',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: '$29.99',
    yearlyPrice: '$299',
    color: '#7b1fa2',
    features: [
      'Everything in Premium',
      '500 voicemail transcriptions',
      '200 voice generations',
      'Multi-user access (5 seats)',
      'API access',
      'Custom branding',
      '25GB storage',
      'Priority support (4h)',
      'FDCPA compliance monitoring',
      'Advanced analytics',
      'Dedicated account manager',
    ],
  },
];

export function SubscriptionScreen({ navigation }: any) {
  const { profile } = useAuthStore();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentTier = profile?.subscription_tier || 'free';

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      Alert.alert('Already on Free Plan', 'You are currently on the free plan');
      return;
    }

    if (planId === currentTier) {
      Alert.alert('Current Plan', `You are already subscribed to ${planId}`);
      return;
    }

    setIsProcessing(true);

    try {
      // In a real implementation, this would:
      // 1. Create Stripe checkout session
      // 2. Open Stripe payment sheet
      // 3. Handle payment confirmation
      // 4. Update user's subscription_tier in database

      // For now, just show a placeholder message
      Alert.alert(
        'Stripe Integration',
        `This would open Stripe checkout for ${planId} ${billingPeriod} plan.\n\nImplementation requires:\n1. Stripe publishable key\n2. Backend API for checkout session\n3. @stripe/stripe-react-native integration`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Simulate successful upgrade for demo
              simulateUpgrade(planId);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Subscription error:', error);
      Alert.alert('Error', 'Failed to process subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateUpgrade = async (planId: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ subscription_tier: planId })
        .eq('id', profile.id);

      if (error) throw error;

      Alert.alert('Success', `Upgraded to ${planId} plan!`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Update tier error:', error);
      Alert.alert('Error', 'Failed to update subscription');
    }
  };

  const handleManageSubscription = () => {
    // This would open Stripe customer portal
    Alert.alert(
      'Manage Subscription',
      'This would open the Stripe customer portal where you can:\n• Update payment method\n• View billing history\n• Cancel subscription',
      [{ text: 'OK' }]
    );
  };

  const renderPlanCard = (plan: TierPlan) => {
    const isCurrentPlan = plan.id === currentTier;
    const displayPrice = billingPeriod === 'yearly' && plan.yearlyPrice
      ? `${plan.yearlyPrice}/year`
      : `${plan.price}/month`;

    return (
      <View
        key={plan.id}
        style={[
          styles.planCard,
          isCurrentPlan && styles.planCardCurrent,
          plan.popular && styles.planCardPopular,
        ]}
      >
        {plan.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>
        )}

        <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
        <Text style={styles.planPrice}>{displayPrice}</Text>

        {billingPeriod === 'yearly' && plan.yearlyPrice && (
          <Text style={styles.savingsText}>Save 2 months!</Text>
        )}

        <View style={styles.featuresList}>
          {plan.features.map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color={plan.color} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.subscribeButton,
            { backgroundColor: isCurrentPlan ? '#e0e0e0' : plan.color },
            isProcessing && styles.subscribeButtonDisabled,
          ]}
          onPress={() => handleSubscribe(plan.id)}
          disabled={isProcessing || isCurrentPlan}
        >
          {isProcessing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={[
              styles.subscribeButtonText,
              isCurrentPlan && styles.subscribeButtonTextCurrent,
            ]}>
              {isCurrentPlan ? 'Current Plan' : `Choose ${plan.name}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Billing Period Toggle */}
        <View style={styles.billingToggle}>
          <TouchableOpacity
            style={[
              styles.billingOption,
              billingPeriod === 'monthly' && styles.billingOptionActive,
            ]}
            onPress={() => setBillingPeriod('monthly')}
          >
            <Text
              style={[
                styles.billingOptionText,
                billingPeriod === 'monthly' && styles.billingOptionTextActive,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.billingOption,
              billingPeriod === 'yearly' && styles.billingOptionActive,
            ]}
            onPress={() => setBillingPeriod('yearly')}
          >
            <Text
              style={[
                styles.billingOptionText,
                billingPeriod === 'yearly' && styles.billingOptionTextActive,
              ]}
            >
              Yearly
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>SAVE 17%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {PLANS.map(renderPlanCard)}
        </View>

        {/* Manage Subscription */}
        {currentTier !== 'free' && (
          <TouchableOpacity
            style={styles.manageButton}
            onPress={handleManageSubscription}
          >
            <Ionicons name="settings-outline" size={20} color="#1976d2" />
            <Text style={styles.manageButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
        )}

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I cancel anytime?</Text>
            <Text style={styles.faqAnswer}>
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What payment methods do you accept?</Text>
            <Text style={styles.faqAnswer}>
              We accept all major credit cards, debit cards, and digital wallets through Stripe.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I switch plans?</Text>
            <Text style={styles.faqAnswer}>
              Yes, you can upgrade or downgrade at any time. Changes take effect immediately.
            </Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  billingOption: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    position: 'relative',
  },
  billingOptionActive: {
    backgroundColor: '#1976d2',
  },
  billingOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  billingOptionTextActive: {
    color: '#ffffff',
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    right: -4,
    backgroundColor: '#43a047',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  saveBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planCardCurrent: {
    borderColor: '#43a047',
  },
  planCardPopular: {
    borderColor: '#1976d2',
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 20,
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  savingsText: {
    fontSize: 14,
    color: '#43a047',
    fontWeight: '600',
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 20,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#424242',
    flex: 1,
  },
  subscribeButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  subscribeButtonTextCurrent: {
    color: '#757575',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  faqSection: {
    marginTop: 32,
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  faqItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
});
