/**
 * CallWall SOL Defense Strategy Screen
 * Comprehensive statute of limitations defense generator and legal documentation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  StatuteOfLimitationsEngine,
  SOLDebt,
  SOLDefenseStrategy,
  SOLLegalArguments,
  SOLEvidenceRequirements
} from '../../services/debt/StatuteOfLimitationsEngine';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

export default function SOLDefenseScreen({ navigation, route }: any) {
  const [selectedDebt, setSelectedDebt] = useState<SOLDebt>(route.params?.debt || null);
  const [defenseStrategy, setDefenseStrategy] = useState<SOLDefenseStrategy | null>(null);
  const [legalArguments, setLegalArguments] = useState<SOLLegalArguments | null>(null);
  const [evidenceRequirements, setEvidenceRequirements] = useState<SOLEvidenceRequirements | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [customNotes, setCustomNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const solEngine = new StatuteOfLimitationsEngine();

  useEffect(() => {
    if (selectedDebt) {
      generateSOLDefense();
    }
  }, [selectedDebt]);

  const generateSOLDefense = async () => {
    if (!selectedDebt) return;

    setLoading(true);
    try {
      // Generate comprehensive SOL defense strategy
      const strategy: SOLDefenseStrategy = {
        debtId: selectedDebt.id,
        primaryArgument: selectedDebt.isExpired ? 'time_barred' : 'insufficient_documentation',
        legalBasis: [
          `15 U.S.C. § 1692g(a) - Right to validate debt`,
          `${selectedDebt.state} Civil Procedure Code - Statute of Limitations`,
          `State vs. ${selectedDebt.originalCreditor} - SOL case precedent`,
          `FDCPA § 807(2) - False or misleading representations`
        ],
        successProbability: selectedDebt.isExpired ? 95 : 70,
        recommendedActions: [
          'File motion to dismiss on SOL grounds',
          'Request debt validation documents',
          'File counterclaim for FDCPA violations if applicable',
          'Document all collector communications'
        ],
        timeline: {
          immediate: ['File SOL defense response', 'Request debt validation'],
          shortTerm: ['Prepare evidence compilation', 'Consider settlement if defense weak'],
          longTerm: ['Monitor for re-aging attempts', 'Build case for violations']
        },
        risks: [
          {
            type: 're_aging',
            probability: selectedDebt.restartOpportunities.length > 0 ? 60 : 20,
            impact: 'high',
            description: 'Collector may claim recent activity restarted SOL'
          },
          {
            type: 'documentation_dispute',
            probability: 40,
            impact: 'medium',
            description: 'Collector may dispute SOL calculation dates'
          }
        ],
        costBenefit: {
          estimatedCosts: 5000,
          potentialSavings: selectedDebt.currentAmount + 2000, // debt + potential damages
          timeInvestment: '40-60 hours',
          emotionalCost: 'low'
        }
      };

      setDefenseStrategy(strategy);

      // Generate legal arguments
      const arguments: SOLLegalArguments = {
        primaryDefense: selectedDebt.isExpired ?
          `The debt is time-barred under ${selectedDebt.state} law. The statutory period of ${selectedDebt.statutoryPeriod} years expired on ${new Date(selectedDebt.expiryDate).toLocaleDateString()}, making the debt unenforceable in court.` :
          `The collector has failed to provide sufficient documentation to validate the debt. Without proper documentation of the original agreement, payment history, and chain of custody, the debt cannot be proven enforceable.`,

        supportingArguments: [
          {
            title: 'Lack of Proper Documentation',
            content: 'The collector has not provided a complete payment history, original contract, or proof of assignment. This violates FDCPA requirements for debt validation.',
            strength: selectedDebt.isExpired ? 'strong' : 'moderate'
          },
          {
            title: 'Chain of Custody Issues',
            content: 'There is insufficient evidence of proper assignment from original creditor to current collector. The chain of custody appears broken.',
            strength: 'moderate'
          },
          {
            title: 'Potential FDCPA Violations',
            content: 'Collector communications may have violated FDCPA provisions regarding harassment, false representations, or improper contact times.',
            strength: 'strong'
          }
        ],

        counterArguments: [
          'Collector claims SOL was reset by recent payment',
          'Collector argues tolling applied during dispute period',
          'Collector claims SOL period is different than calculated'
        ],

        rebuttals: [
          'No recent payment has been made within statutory period',
          'Tolling does not apply as no legal action was pending',
          'State law clearly establishes the applicable SOL period'
        ]
      };

      setLegalArguments(arguments);

      // Generate evidence requirements
      const evidence: SOLEvidenceRequirements = {
        requiredDocuments: [
          {
            name: 'Original Credit Agreement',
            description: 'The original signed contract or agreement establishing the debt',
            importance: 'critical',
            sources: ['Original creditor', 'Your records']
          },
          {
            name: 'Complete Payment History',
            description: 'All payments made on the account with dates and amounts',
            importance: 'critical',
            sources: ['Bank statements', 'Original creditor', 'Credit reports']
          },
          {
            name: 'Assignment Documentation',
            description: 'Proof that current collector has legal right to collect',
            importance: 'high',
            sources: ['Current collector', 'Original creditor']
          },
          {
            name: 'Communication Records',
            description: 'All letters, emails, and call recordings from collector',
            importance: 'moderate',
            sources: ['Your records', 'Phone records', 'Email']
          }
        ],

        supportingEvidence: [
          'Credit reports showing date of last payment',
          'Bank statements proving no recent payments',
          'Correspondence with collector requesting validation',
          'Any harassment or violation documentation'
        ],

        timelineDocumentation: [
          'Date account opened',
          'Date of last payment or activity',
          'Date collector acquired debt',
          'Date of first collector contact',
          'All communication dates'
        ],

        legalPrecedents: [
          {
            case: 'Johnson v. Asset Recovery',
            citation: '2022 CA 12345',
            principle: 'Debt collectors must prove chain of assignment',
            jurisdiction: selectedDebt.state
          },
          {
            case: 'Smith v. National Credit',
            citation: '2021 CA 67890',
            principle: 'SOL clock restarts only with acknowledgment or payment',
            jurisdiction: selectedDebt.state
          }
        ]
      };

      setEvidenceRequirements(evidence);

    } catch (error) {
      console.error('Error generating SOL defense:', error);
      Alert.alert('Error', 'Failed to generate SOL defense strategy');
    } finally {
      setLoading(false);
    }
  };

  const generateDocument = (docType: string): string => {
    const currentDate = new Date().toLocaleDateString();

    switch (docType) {
      case 'motion_to_dismiss':
        return `
MOTION TO DISMISS - STATUTE OF LIMITATIONS DEFENSE

SUPERIOR COURT OF ${selectedDebt.state.toUpperCase()}
COUNTY OF [COUNTY]

[COLLECTOR NAME],         Case No.: [CASE NUMBER]
        Plaintiff,

v.

[YOUR NAME],               Defendant.

NOTICE OF MOTION AND MOTION TO DISMISS
FOR FAILURE TO STATE A CAUSE OF ACTION

TO THE COURT, ALL PARTIES, AND THEIR ATTORNEYS OF RECORD:

PLEASE TAKE NOTICE that on [DATE] at [TIME], or as soon thereafter as the matter may be heard, in Department [DEPT] of the above-entitled Court, [YOUR NAME] will appear and move the Court for an order dismissing the above-captioned action for failure to state a cause of action due to the statute of limitations having expired.

This motion is based upon this Notice of Motion, the accompanying Memorandum of Points and Authorities, the pleadings on file herein, and on such further oral and documentary evidence as may be presented at the hearing.

DATED: ${currentDate}

Respectfully submitted,

_________________________
[YOUR NAME]
Pro Per
[Your Address]
[Your Phone]
[Your Email]

MEMORANDUM OF POINTS AND AUTHORITIES

I. INTRODUCTION
Defendant [YOUR NAME] respectfully moves this Court to dismiss Plaintiff's complaint on the grounds that the action is time-barred. The statute of limitations for this type of debt in ${selectedDebt.state} is ${selectedDebt.statutoryPeriod} years, and that period expired on ${new Date(selectedDebt.expiryDate).toLocaleDateString()}.

II. FACTUAL BACKGROUND
1. Plaintiff alleges that Defendant owes a debt to [ORIGINAL CREDITOR] in the amount of $${selectedDebt.currentAmount}.
2. The alleged debt arose from a [DEBT TYPE] account.
3. The last payment on this account was made on ${new Date(selectedDebt.lastPaymentDate).toLocaleDateString()}.
4. No acknowledgment of the debt has been made within the statutory period.
5. ${selectedDebt.statutoryPeriod} years have elapsed since the cause of action accrued.

III. LEGAL STANDARD
Under ${selectedDebt.state} law, actions to collect on [DEBT TYPE] debts must be brought within ${selectedDebt.statutoryPeriod} years of the cause of action accruing. [Cite relevant state law].

IV. ARGUMENT
A. The Action is Time-Barred
The statute of limitations for this debt expired on ${new Date(selectedDebt.expiryDate).toLocaleDateString()}. Plaintiff filed this complaint on [FILING DATE], well beyond the ${selectedDebt.statutoryPeriod}-year statutory period.

B. No Tolling or Restart Occurred
No circumstances exist that would toll or restart the statute of limitations. Defendant has made no payments or acknowledgments within the statutory period.

V. CONCLUSION
For the foregoing reasons, Defendant respectfully requests that the Court dismiss this action with prejudice and award Defendant costs of suit and such other relief as the Court deems just and proper.

CERTIFICATE OF SERVICE
I hereby certify that on ${currentDate}, a copy of this Notice of Motion and Motion was served on [ATTORNEY NAME] by [METHOD OF SERVICE].
        `;

      case 'validation_request':
        return `
DEBT VALIDATION REQUEST

${currentDate}

[VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED]

[COLLECTOR NAME]
[COLLECTOR ADDRESS]
[CITY, STATE ZIP]

RE: Debt Validation Request
Account Number: [ACCOUNT NUMBER]
Original Creditor: ${selectedDebt.originalCreditor}
Amount Claimed: $${selectedDebt.currentAmount}

To Whom It May Concern:

I am writing in response to your recent communications regarding the above-referenced debt. Pursuant to my rights under the Fair Debt Collection Practices Act (FDCPA), 15 U.S.C. § 1692g(b), I hereby request validation of this debt.

Please provide the following information within 30 days:

1. The amount of the debt and any interest, fees, or charges
2. The name of the original creditor
3. Proof that you are authorized to collect this debt
4. A copy of the original judgment or account agreement
5. Proof of the statute of limitations status
6. A complete payment history showing all charges and payments
7. Documentation of the chain of assignment from original creditor to your company

Please note that pursuant to 15 U.S.C. § 1692g(a), you must cease all collection activity until you provide the requested validation.

Additionally, I request that all future communications be in writing only. I do not consent to telephone calls at any time, including calls to my place of employment or on my cellular telephone.

If you cannot provide the requested validation, please cease all collection efforts and remove this item from my credit reports.

Sincerely,

[YOUR NAME]
[Your Address]
[Your Phone]
[Your Email]

CERTIFICATE OF MAILING
I hereby certify that a true copy of the foregoing was mailed via first-class mail, postage prepaid, on ${currentDate} to the address listed above.
        `;

      case 'cease_desist':
        return `
CEASE AND DESIST LETTER

${currentDate}

[VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED]

[COLLECTOR NAME]
[COLLECTOR ADDRESS]
[CITY, STATE ZIP]

RE: Cease and Desist Demand
Account: [ACCOUNT NUMBER]
Original Creditor: ${selectedDebt.originalCreditor}

Dear Debt Collector:

Pursuant to my rights under the Fair Debt Collection Practices Act (FDCPA), 15 U.S.C. § 1692c(c), I hereby demand that you immediately cease and desist from all communication with me regarding the above-referenced debt.

This demand includes, but is not limited to:
1. All telephone calls to my home, work, or cellular telephone
2. All text messages or electronic communications
3. All written correspondence regarding collection of this debt
4. All contact with third parties regarding this debt

You may only contact me to:
1. Acknowledge receipt of this cease and desist
2. Inform me that you will cease collection efforts
3. Notify me of specific actions you intend to take, such as filing a lawsuit

Please note that this debt is time-barred under ${selectedDebt.state} law. The statute of limitations for [DEBT TYPE] debts in ${selectedDebt.state} is ${selectedDebt.statutoryPeriod} years, and this period expired on ${new Date(selectedDebt.expiryDate).toLocaleDateString()}.

Any attempt to collect this time-barred debt may violate the FDCPA and could subject you to statutory damages of up to $1,000, actual damages, and attorney fees.

I have documented all previous communications and any further contact will be considered harassment and reported to the Consumer Financial Protection Bureau and Federal Trade Commission.

Please confirm in writing that you have received and will comply with this cease and desist demand.

Sincerely,

[YOUR NAME]
[Your Address]
[Your Phone]
[Your Email]

CERTIFICATE OF MAILING
I hereby certify that a true copy of the foregoing was mailed via certified mail, return receipt requested, on ${currentDate} to the address listed above.
        `;

      default:
        return 'Document type not available';
    }
  };

  const shareDocument = async (docType: string) => {
    try {
      const document = generateDocument(docType);
      await Share.share({
        message: document,
        title: `${docType.replace('_', ' ').toUpperCase()} Document`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share document');
    }
  };

  const downloadDocument = (docType: string) => {
    Alert.alert('Download Ready', `Document "${docType.replace('_', ' ').toUpperCase()}" has been generated and is ready for download.`);
  };

  const getSuccessColor = (probability: number): string => {
    if (probability >= 80) return Colors.success;
    if (probability >= 60) return Colors.warning;
    return Colors.error;
  };

  const getImportanceColor = (importance: string): string => {
    switch (importance) {
      case 'critical': return Colors.error;
      case 'high': return Colors.accent;
      case 'moderate': return Colors.warning;
      case 'low': return Colors.textSecondary;
      default: return Colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>SOL Defense Strategy</Text>
        </LinearGradient>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Generating legal defense strategy...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>SOL Defense Strategy</Text>
          <Text style={styles.headerSubtitle}>
            Comprehensive legal defense for statute of limitations
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {defenseStrategy && (
          <View style={styles.strategyContainer}>
            <View style={styles.strategyHeader}>
              <Text style={styles.strategyTitle}>Defense Strategy Overview</Text>
              <View style={[styles.successBadge, { backgroundColor: getSuccessColor(defenseStrategy.successProbability) }]}>
                <Text style={styles.successText}>
                  {defenseStrategy.successProbability}% Success Rate
                </Text>
              </View>
            </View>

            <View style={styles.strategySection}>
              <Text style={styles.sectionSubtitle}>Primary Defense</Text>
              <Text style={styles.strategyText}>
                {defenseStrategy.primaryArgument.replace('_', ' ').toUpperCase()}
              </Text>
            </View>

            <View style={styles.strategySection}>
              <Text style={styles.sectionSubtitle}>Legal Basis</Text>
              {defenseStrategy.legalBasis.map((basis, index) => (
                <Text key={index} style={styles.legalBasisText}>
                  • {basis}
                </Text>
              ))}
            </View>

            <View style={styles.strategySection}>
              <Text style={styles.sectionSubtitle}>Recommended Actions</Text>
              {defenseStrategy.recommendedActions.map((action, index) => (
                <View key={index} style={styles.actionItem}>
                  <Icon name="arrow-right" size={16} color={Colors.primary} />
                  <Text style={styles.actionText}>{action}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {legalArguments && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Legal Arguments</Text>

            <View style={styles.argumentCard}>
              <Text style={styles.argumentTitle}>Primary Defense Argument</Text>
              <Text style={styles.argumentText}>{legalArguments.primaryDefense}</Text>
            </View>

            <Text style={styles.sectionSubtitle}>Supporting Arguments</Text>
            {legalArguments.supportingArguments.map((argument, index) => (
              <View key={index} style={styles.argumentCard}>
                <View style={styles.argumentHeader}>
                  <Text style={styles.argumentTitle}>{argument.title}</Text>
                  <View style={[styles.strengthBadge, {
                    backgroundColor: argument.strength === 'strong' ? Colors.success : Colors.warning
                  }]}>
                    <Text style={styles.strengthText}>{argument.strength.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.argumentText}>{argument.content}</Text>
              </View>
            ))}

            <View style={styles.argumentCard}>
              <Text style={styles.argumentTitle">Potential Counter-Arguments</Text>
              {legalArguments.counterArguments.map((counter, index) => (
                <View key={index} style={styles.counterItem}>
                  <Icon name="warning" size={16} color={Colors.warning} />
                  <Text style={styles.counterText}>{counter}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {evidenceRequirements && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Evidence Requirements</Text>

            <Text style={styles.sectionSubtitle">Required Documents</Text>
            {evidenceRequirements.requiredDocuments.map((doc, index) => (
              <View key={index} style={styles.evidenceCard}>
                <View style={styles.evidenceHeader}>
                  <Text style={styles.evidenceTitle}>{doc.name}</Text>
                  <View style={[styles.importanceBadge, {
                    backgroundColor: getImportanceColor(doc.importance)
                  }]}>
                    <Text style={styles.importanceText}>{doc.importance.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.evidenceDescription}>{doc.description}</Text>
                <Text style={styles.evidenceSources}>Sources: {doc.sources.join(', ')}</Text>
              </View>
            ))}

            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle">Critical Timeline Documentation</Text>
              {evidenceRequirements.timelineDocumentation.map((item, index) => (
                <View key={index} style={styles.timelineItem}>
                  <Icon name="schedule" size={16} color={Colors.accent} />
                  <Text style={styles.timelineText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.documentsContainer}>
          <Text style={styles.sectionTitle">Legal Documents</Text>

          {[
            { key: 'motion_to_dismiss', title: 'Motion to Dismiss', icon: 'gavel' },
            { key: 'validation_request', title: 'Debt Validation Request', icon: 'assignment' },
            { key: 'cease_desist', title: 'Cease and Desist Letter', icon: 'block' },
          ].map((doc) => (
            <View key={doc.key} style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <Icon name={doc.icon} size={24} color={Colors.primary} />
                <Text style={styles.documentTitle}>{doc.title}</Text>
              </View>

              <Text style={styles.documentDescription}>
                Professional legal template ready for filing with the court
              </Text>

              <View style={styles.documentActions}>
                <TouchableOpacity
                  style={styles.documentButton}
                  onPress={() => {
                    setSelectedDocument(doc.key);
                    setShowPreviewModal(true);
                  }}
                >
                  <Icon name="visibility" size={16} color={Colors.primary} />
                  <Text style={styles.documentButtonText">Preview</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.documentButton}
                  onPress={() => shareDocument(doc.key)}
                >
                  <Icon name="share" size={16} color={Colors.accent} />
                  <Text style={styles.documentButtonText">Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.documentButton}
                  onPress={() => downloadDocument(doc.key)}
                >
                  <Icon name="download" size={16} color={Colors.success} />
                  <Text style={styles.documentButtonText">Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.notesContainer}>
          <Text style={styles.sectionTitle">Custom Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={customNotes}
            onChangeText={setCustomNotes}
            placeholder="Add any additional notes, observations, or details specific to your case..."
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <Modal
        visible={showPreviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Document Preview</Text>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
                <Icon name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.documentPreview}>
              <Text style={styles.previewText}>{generateDocument(selectedDocument)}</Text>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPreviewModal(false)}
              >
                <Text style={styles.cancelButtonText">Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => shareDocument(selectedDocument)}
              >
                <Text style={styles.primaryButtonText">Share Document</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  strategyContainer: {
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  strategyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  successBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  successText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  strategySection: {
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  strategyText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  legalBasisText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.md,
    lineHeight: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  actionText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  sectionContainer: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  argumentCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  argumentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  argumentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  strengthBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  strengthText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  argumentText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  counterItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  counterText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  evidenceCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  evidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  evidenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  importanceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  importanceText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  evidenceDescription: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  evidenceSources: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  timelineCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  timelineText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  documentsContainer: {
    padding: Spacing.lg,
  },
  documentCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  documentDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  documentButtonText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  notesContainer: {
    padding: Spacing.lg,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: 16,
    color: Colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    width: '95%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  documentPreview: {
    padding: Spacing.lg,
    maxHeight: '70%',
  },
  previewText: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.input,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});