/**
 * CallWall AI Document Generator
 * Advanced AI-powered legal document generation interface
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AILegalDocumentEngine, UserDebtSituation, GeneratedDocument, LegalStrategy } from '../../services/ai/AILegalDocumentEngine';
import { LEGAL_DOCUMENT_TEMPLATES, TEMPLATE_CATEGORIES } from '../../data/legalDocumentTemplates';
import { STATE_LAWS } from '../../data/stateLaws';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';

interface AIDocumentGeneratorProps {
  visible: boolean;
  onClose: () => void;
  onDocumentGenerated?: (document: GeneratedDocument) => void;
  initialSituation?: Partial<UserDebtSituation>;
}

const { width, height } = Dimensions.get('window');

export default function AIDocumentGenerator({
  visible,
  onClose,
  onDocumentGenerated,
  initialSituation
}: AIDocumentGeneratorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userSituation, setUserSituation] = useState<UserDebtSituation>({
    debtType: 'credit_card',
    amount: 0,
    creditor: '',
    state: '',
    harassmentLevel: 'medium',
    userGoals: ['validate_debt'],
    ...initialSituation,
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<LegalStrategy | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null);

  const [animatedValue] = useState(new Animated.Value(0));
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const aiEngine = new AILegalDocumentEngine();

  useEffect(() => {
    if (visible) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const steps = [
    { id: 'situation', title: 'Your Situation', subtitle: 'Tell us about your debt situation' },
    { id: 'template', title: 'Choose Document', subtitle: 'AI will recommend the best legal document' },
    { id: 'ai-analysis', title: 'AI Strategy', subtitle: 'Get personalized legal strategy' },
    { id: 'generate', title: 'Generate Document', subtitle: 'Create your customized legal document' },
  ];

  const analyzeSituation = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await aiEngine.analyzeSituation(userSituation);
      setAiAnalysis(analysis);

      // Recommend best template based on AI analysis
      const recommendedTemplate = recommendTemplate(userSituation, analysis);
      setSelectedTemplate(recommendedTemplate);

      setCurrentStep(2);
    } catch (error) {
      Alert.alert('Analysis Error', 'Unable to analyze your situation. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const recommendTemplate = (situation: UserDebtSituation, analysis: LegalStrategy): string => {
    // AI template recommendation logic
    if (situation.harassmentLevel === 'severe' || situation.harassmentLevel === 'high') {
      return 'cease_desist_complete';
    }

    if (situation.userGoals.includes('validate_debt')) {
      if (situation.lastPaymentDate && isStatuteExpired(situation.state, situation.lastPaymentDate)) {
        return 'debt_validation_statute_barred';
      }
      return 'debt_validation_detailed';
    }

    if (situation.userGoals.includes('cease_contact')) {
      return 'cease_desist_limited';
    }

    if (situation.userGoals.includes('negotiate_settlement')) {
      return 'settlement_negotiation';
    }

    return 'debt_validation_basic'; // Default
  };

  const isStatuteExpired = (state: string, lastPaymentDate: string): boolean => {
    const stateLaw = STATE_LAWS[state];
    if (!stateLaw) return false;

    const lastPayment = new Date(lastPaymentDate);
    const now = new Date();
    const yearsSincePayment = (now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24 * 365);

    const sol = stateLaw.statuteOfLimitations['written_contract'] || 6;
    return yearsSincePayment > sol;
  };

  const generateDocument = async () => {
    if (!selectedTemplate) {
      Alert.alert('Template Required', 'Please select a document template.');
      return;
    }

    setIsGenerating(true);
    try {
      const document = await aiEngine.generateDocument(selectedTemplate, userSituation);
      setGeneratedDocument(document);
      setCurrentStep(3);
      onDocumentGenerated?.(document);
    } catch (error) {
      Alert.alert('Generation Error', 'Unable to generate document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderSituationForm();
      case 1:
        return renderTemplateSelection();
      case 2:
        return renderAIAnalysis();
      case 3:
        return renderGeneratedDocument();
      default:
        return renderSituationForm();
    }
  };

  const renderSituationForm = () => (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Debt Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Debt Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
            {['credit_card', 'medical', 'student_loan', 'auto_loan', 'mortgage', 'payday', 'other'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionChip,
                  userSituation.debtType === type && styles.selectedChip,
                ]}
                onPress={() => setUserSituation(prev => ({ ...prev, debtType: type as any }))}
              >
                <Text style={[
                  styles.optionText,
                  userSituation.debtType === type && styles.selectedText,
                ]}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Debt Amount</Text>
          <View style={styles.amountInput}>
            <Text style={styles.currencySymbol}>$</Text>
            <Text style={styles.amountText}>
              {userSituation.amount.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Creditor/Collection Agency</Text>
          <View style={styles.input}>
            <Text style={styles.inputText}>
              {userSituation.creditor || 'Enter creditor name'}
            </Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your State</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stateScroll}>
            {Object.keys(STATE_LAWS).map((state) => (
              <TouchableOpacity
                key={state}
                style={[
                  styles.stateChip,
                  userSituation.state === state && styles.selectedChip,
                ]}
                onPress={() => setUserSituation(prev => ({ ...prev, state }))}
              >
                <Text style={[
                  styles.stateText,
                  userSituation.state === state && styles.selectedText,
                ]}>
                  {STATE_LAWS[state].abbreviation}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Harassment Level</Text>
        <View style={styles.harassmentLevels}>
          {[
            { level: 'low' as const, icon: 'sentiment-satisfied', color: Colors.success },
            { level: 'medium' as const, icon: 'sentiment-neutral', color: Colors.warning },
            { level: 'high' as const, icon: 'mood-bad', color: Colors.accent },
            { level: 'severe' as const, icon: 'dangerous', color: Colors.error },
          ].map(({ level, icon, color }) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.harassmentLevel,
                userSituation.harassmentLevel === level && { backgroundColor: color },
              ]}
              onPress={() => setUserSituation(prev => ({ ...prev, harassmentLevel: level }))}
            >
              <Icon name={icon} size={24} color={userSituation.harassmentLevel === level ? Colors.white : color} />
              <Text style={[
                styles.harassmentText,
                userSituation.harassmentLevel === level && styles.harassmentTextSelected,
              ]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Your Goals</Text>
        <View style={styles.goalsContainer}>
          {[
            { goal: 'validate_debt' as const, title: 'Validate Debt', icon: 'gavel' },
            { goal: 'cease_contact' as const, title: 'Stop Contact', icon: 'phone-disabled' },
            { goal: 'negotiate_settlement' as const, title: 'Settle Debt', icon: 'handshake' },
            { goal: 'sue_collector' as const, title: 'Legal Action', icon: 'balance' },
          ].map(({ goal, title, icon }) => (
            <TouchableOpacity
              key={goal}
              style={[
                styles.goalCard,
                userSituation.userGoals.includes(goal) && styles.selectedGoal,
              ]}
              onPress={() => {
                setUserSituation(prev => ({
                  ...prev,
                  userGoals: prev.userGoals.includes(goal)
                    ? prev.userGoals.filter(g => g !== goal)
                    : [...prev.userGoals, goal],
                }));
              }}
            >
              <Icon
                name={icon}
                size={20}
                color={userSituation.userGoals.includes(goal) ? Colors.accent : Colors.textSecondary}
              />
              <Text style={[
                styles.goalText,
                userSituation.userGoals.includes(goal) && styles.goalTextSelected,
              ]}>
                {title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderTemplateSelection = () => (
    <ScrollView style={styles.templatesContainer}>
      <View style={styles.aiRecommendation}>
        <Icon name="lightbulb" size={24} color={Colors.accent} />
        <Text style={styles.recommendationText}>
          AI Recommendation: Based on your situation, we recommend starting with a validation letter
        </Text>
      </View>

      {Object.entries(TEMPLATE_CATEGORIES).map(([key, title]) => (
        <View key={key} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>{title}</Text>
          {LEGAL_DOCUMENT_TEMPLATES
            .filter(template => template.category === key)
            .map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  selectedTemplate === template.id && styles.selectedTemplate,
                ]}
                onPress={() => setSelectedTemplate(template.id)}
              >
                <View style={styles.templateHeader}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <View style={styles.successRateBadge}>
                    <Text style={styles.successRateText}>{template.successRate}%</Text>
                  </View>
                </View>

                <Text style={styles.templateDescription}>{template.description}</Text>

                <View style={styles.templateFooter}>
                  <View style={styles.templateMeta}>
                    <Icon name="schedule" size={14} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {template.estimatedTimeToResolve} days
                    </Text>
                  </View>

                  {template.stateSpecific && (
                    <View style={styles.stateBadge}>
                      <Icon name="location-on" size={14} color={Colors.primary} />
                      <Text style={styles.stateBadgeText}>State-specific</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
        </View>
      ))}
    </ScrollView>
  );

  const renderAIAnalysis = () => (
    <ScrollView style={styles.analysisContainer}>
      <View style={styles.analysisHeader}>
        <Icon name="psychology" size={48} color={Colors.accent} />
        <Text style={styles.analysisTitle}>AI Legal Strategy Analysis</Text>
        <Text style={styles.analysisSubtitle}>
          Our AI has analyzed your situation and created a personalized strategy
        </Text>
      </View>

      {aiAnalysis && (
        <>
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Success Probability</Text>
            <View style={styles.probabilityBar}>
              <View
                style={[
                  styles.probabilityFill,
                  { width: `${aiAnalysis.probabilityOfSuccess}%` }
                ]}
              />
            </View>
            <Text style={styles.probabilityText}>
              {aiAnalysis.probabilityOfSuccess}% chance of success
            </Text>
          </View>

          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Recommended Actions</Text>
            {aiAnalysis.recommendedActions.map((action, index) => (
              <View key={index} style={styles.actionCard}>
                <View style={styles.actionPriority}>
                  <View style={[
                    styles.priorityDot,
                    { backgroundColor: action.priority === 'high' ? Colors.accent : Colors.warning }
                  ]} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{action.action}</Text>
                  <Text style={styles.actionTimeline}>{action.timeline}</Text>
                  <Text style={styles.actionOutcome}>{action.expectedOutcome}</Text>
                </View>
                <View style={styles.actionMeta}>
                  <Text style={styles.actionCost}>{action.cost}</Text>
                  <Text style={styles.actionEffort}>{action.effort} effort</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Timeline</Text>
            <Text style={styles.timelineText}>{aiAnalysis.estimatedTimeline}</Text>
          </View>

          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Risks to Consider</Text>
            {aiAnalysis.risks.map((risk, index) => (
              <View key={index} style={styles.riskItem}>
                <Icon name="warning" size={16} color={Colors.warning} />
                <Text style={styles.riskText}>{risk}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderGeneratedDocument = () => (
    <ScrollView style={styles.documentContainer}>
      {generatedDocument && (
        <>
          <View style={styles.documentHeader}>
            <Icon name="description" size={32} color={Colors.accent} />
            <Text style={styles.documentTitle}>{generatedDocument.title}</Text>
            <View style={styles.successIndicator}>
              <Icon name="check-circle" size={20} color={Colors.success} />
              <Text style={styles.successText}>Document Generated</Text>
            </View>
          </View>

          <View style={styles.documentPreview}>
            <Text style={styles.documentContent}>{generatedDocument.content}</Text>
          </View>

          <View style={styles.documentMeta}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Success Rate:</Text>
              <Text style={styles.metaValue}>{generatedDocument.estimatedSuccessRate}%</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Risk Level:</Text>
              <Text style={[
                styles.metaValue,
                {
                  color: generatedDocument.riskAssessment === 'low' ? Colors.success :
                         generatedDocument.riskAssessment === 'medium' ? Colors.warning : Colors.error
                }
              ]}>
                {generatedDocument.riskAssessment.toUpperCase()}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Expected Outcome:</Text>
              <Text style={styles.metaValue}>{generatedDocument.expectedOutcome}</Text>
            </View>
          </View>

          <View style={styles.documentActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => {
                // Handle save/print functionality
                Alert.alert('Document Saved', 'Your document has been saved to your profile.');
              }}
            >
              <Icon name="save" size={20} color={Colors.white} />
              <Text style={styles.buttonText}>Save Document</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => {
                setCurrentStep(0);
                setGeneratedDocument(null);
                setAiAnalysis(null);
                setSelectedTemplate('');
              }}
            >
              <Icon name="add" size={20} color={Colors.accent} />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Create Another</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderNavigation = () => (
    <View style={styles.navigation}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => {
          if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
          } else {
            onClose();
          }
        }}
        disabled={isAnalyzing || isGenerating}
      >
        <Icon
          name={currentStep === 0 ? 'close' : 'arrow-back'}
          size={24}
          color={Colors.text}
        />
        <Text style={styles.navButtonText}>
          {currentStep === 0 ? 'Close' : 'Back'}
        </Text>
      </TouchableOpacity>

      <View style={styles.progressIndicator}>
        {steps.map((step, index) => (
          <View
            key={step.id}
            style={[
              styles.progressDot,
              index === currentStep && styles.activeDot,
              index < currentStep && styles.completedDot,
            ]}
          />
        ))}
      </View>

      {currentStep === 0 && (
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={analyzeSituation}
          disabled={!userSituation.state || isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Text style={styles.nextButtonText}>Analyze</Text>
              <Icon name="arrow-forward" size={20} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>
      )}

      {currentStep === 1 && (
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={() => setCurrentStep(2)}
          disabled={!selectedTemplate}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
          <Icon name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      )}

      {currentStep === 2 && (
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={generateDocument}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Text style={styles.nextButtonText}>Generate</Text>
              <Icon name="description" size={20} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>AI Document Generator</Text>
            <Text style={styles.currentStep}>
              {steps[currentStep].title}
            </Text>
            <Text style={styles.stepSubtitle}>
              {steps[currentStep].subtitle}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {renderStep()}
        </View>

        {renderNavigation()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  currentStep: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Navigation
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  nextButton: {
    backgroundColor: Colors.accent,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginRight: Spacing.sm,
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  activeDot: {
    backgroundColor: Colors.accent,
    width: 24,
  },
  completedDot: {
    backgroundColor: Colors.success,
  },

  // Form styles
  formContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  formSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  optionsScroll: {
    flexDirection: 'row',
  },
  optionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedChip: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  optionText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedText: {
    color: Colors.white,
    fontWeight: '500',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencySymbol: {
    fontSize: 16,
    color: Colors.accent,
    marginRight: Spacing.sm,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 16,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputText: {
    fontSize: 16,
    color: Colors.text,
  },
  stateScroll: {
    flexDirection: 'row',
  },
  stateChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 40,
    alignItems: 'center',
  },
  stateText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  harassmentLevels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  harassmentLevel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.input,
  },
  harassmentText: {
    fontSize: 12,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  harassmentTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '48%',
  },
  selectedGoal: {
    backgroundColor: `${Colors.accent}20`,
    borderColor: Colors.accent,
  },
  goalText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  goalTextSelected: {
    color: Colors.accent,
    fontWeight: '500',
  },

  // Template selection styles
  templatesContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  aiRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.accent}20`,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  recommendationText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  categorySection: {
    marginBottom: Spacing.xl,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  templateCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.small,
  },
  selectedTemplate: {
    borderColor: Colors.accent,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  successRateBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  successRateText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  templateDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}20`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  stateBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },

  // AI Analysis styles
  analysisContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  analysisHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  analysisSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  analysisSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  probabilityBar: {
    height: 8,
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  probabilityFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.sm,
  },
  probabilityText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionPriority: {
    marginRight: Spacing.md,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  actionTimeline: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  actionOutcome: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  actionMeta: {
    alignItems: 'flex-end',
  },
  actionCost: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500',
  },
  actionEffort: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  timelineText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  riskText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
    flex: 1,
  },

  // Generated document styles
  documentContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  documentHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  documentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  successIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  successText: {
    fontSize: 14,
    color: Colors.success,
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  documentPreview: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  documentContent: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  documentMeta: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metaLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  metaValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  documentActions: {
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  secondaryButtonText: {
    color: Colors.accent,
  },
});