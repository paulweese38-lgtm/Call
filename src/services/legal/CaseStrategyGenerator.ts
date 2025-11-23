/**
 * CallWall Case Strategy Generator
 * AI-powered legal case strategy analysis and recommendation engine
 */

import {
  LegalCase,
  LegalStrategy,
  ViolationReference,
  EvidenceItem,
  StrategyRecommendation,
  RiskAssessment,
  SettlementStrategy,
  ExpectedOutcome,
  ActionStep
} from './AILegalAssistant';

export interface ViolationPattern {
  type: string;
  frequency: number;
  severity: 'minor' | 'moderate' | 'major' | 'severe';
  patterns: string[];
  legalBasis: string[];
  typicalDamages: {
    min: number;
    max: number;
    average: number;
  };
  precedents: CasePrecedent[];
}

export interface CasePrecedent {
  caseName: string;
  citation: string;
  year: number;
  jurisdiction: string;
  outcome: 'plaintiff_win' | 'defendant_win' | 'settlement';
  award: number;
  relevance: number; // 0-100
  summary: string;
}

export interface StrategyTemplate {
  id: string;
  name: string;
  caseType: string;
  violations: string[];
  evidenceStrength: 'weak' | 'moderate' | 'strong' | 'critical';
  timeline: string;
  successRate: number;
  averageAward: number;
  steps: StrategyStepTemplate[];
  riskFactors: string[];
  settlementRange: {
    min: number;
    max: number;
  };
}

export interface StrategyStepTemplate {
  order: number;
  title: string;
  description: string;
  type: 'document' | 'communication' | 'filing' | 'evidence' | 'negotiation';
  estimatedDuration: string;
  cost?: number;
  dependencies: number[];
  critical: boolean;
}

export interface CollectorProfile {
  id: string;
  name: string;
  type: 'original_creditor' | 'debt_buyer' | 'collection_agency';
  reputation: 'excellent' | 'good' | 'average' | 'poor' | 'very_poor';
  typicalSettlementRange: {
    percentage: number; // of original debt
    absolute: { min: number; max: number };
  };
  litigationHistory: {
    frequency: 'rare' | 'occasional' | 'frequent' | 'very_frequent';
    successRate: number;
    averageAward: number;
  };
  knownTactics: string[];
  regulatoryActions: RegulatoryAction[];
  settlementHistory: SettlementData[];
}

export interface RegulatoryAction {
  agency: string;
  type: 'fine' | 'cease_and_desist' | 'license_revocation' | 'consent_order';
  year: number;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
}

export interface SettlementData {
  year: number;
  caseType: string;
  settlementAmount: number;
  originalDebt: number;
  settlementPercentage: number;
  timeframe: string; // months to settlement
}

export interface JurisdictionAnalysis {
  jurisdiction: string;
  consumerProtectionLaws: StateLaw[];
  courtTendencies: {
    plaintiffFriendly: boolean;
    averageAward: number;
    successRate: number;
    timeline: string;
  };
  statuteOfLimitations: {
    contract: number; // years
    tort: number;
    mixed: number;
  };
  damageCaps: {
    statutory: number;
    punitive: number;
    emotional_distress: number;
  };
  attorneyFeeShifting: boolean;
  recentCases: CasePrecedent[];
}

export interface StateLaw {
  name: string;
  citation: string;
  provisions: string[];
  penalties: {
    statutory: number;
    actual: boolean;
    punitive: boolean;
    attorney: boolean;
  };
  interpretation: string;
}

export class CaseStrategyGenerator {
  private violationPatterns: Map<string, ViolationPattern> = new Map();
  private strategyTemplates: Map<string, StrategyTemplate> = new Map();
  private collectorProfiles: Map<string, CollectorProfile> = new Map();
  private jurisdictionData: Map<string, JurisdictionAnalysis> = new Map();

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    this.loadViolationPatterns();
    this.loadStrategyTemplates();
    this.loadCollectorProfiles();
    this.loadJurisdictionData();
  }

  async generateStrategy(legalCase: LegalCase): Promise<LegalStrategy> {
    try {
      // Analyze violation patterns
      const patternAnalysis = await this.analyzeViolationPatterns(legalCase.violations);

      // Assess evidence strength
      const evidenceAssessment = await this.assessEvidence(legalCase.evidence);

      // Analyze collector profile
      const collectorProfile = await this.analyzeCollector(legalCase);

      // Evaluate jurisdiction
      const jurisdictionAnalysis = await this.evaluateJurisdiction(legalCase.jurisdiction);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        legalCase,
        patternAnalysis,
        evidenceAssessment,
        collectorProfile,
        jurisdictionAnalysis
      );

      // Assess risks
      const riskAssessment = await this.assessRisks(
        legalCase,
        recommendations,
        collectorProfile,
        jurisdictionAnalysis
      );

      // Create settlement strategy
      const settlementStrategy = await this.createSettlementStrategy(
        legalCase,
        patternAnalysis,
        collectorProfile,
        jurisdictionAnalysis
      );

      // Predict outcomes
      const expectedOutcome = await this.predictOutcomes(
        legalCase,
        recommendations,
        riskAssessment,
        jurisdictionAnalysis
      );

      // Generate timeline and action steps
      const timeline = await this.generateTimeline(legalCase, recommendations);
      const nextSteps = await this.generateActionSteps(recommendations);

      // Calculate litigation probability
      const litigationProbability = await this.calculateLitigationProbability(
        legalCase,
        collectorProfile,
        settlementStrategy
      );

      return {
        caseId: legalCase.id,
        recommendations,
        timeline,
        riskAssessment,
        settlementStrategy,
        litigationProbability,
        expectedOutcome,
        nextSteps
      };
    } catch (error) {
      console.error('Strategy generation failed:', error);
      throw new Error(`Failed to generate strategy: ${error}`);
    }
  }

  private async analyzeViolationPatterns(violations: ViolationReference[]): Promise<ViolationPatternAnalysis> {
    const patterns = violations.map(violation => this.violationPatterns.get(violation.type));
    const validPatterns = patterns.filter(Boolean) as ViolationPattern[];

    const totalFrequency = violations.reduce((sum, v) => sum + v.occurrences, 0);
    const maxSeverity = this.getHighestSeverity(violations);
    const combinedDamages = this.calculateCombinedDamages(validPatterns, violations);

    return {
      patterns: validPatterns,
      totalViolations: violations.length,
      totalFrequency,
      maxSeverity,
      estimatedDamages: combinedDamages,
      legalBases: this.extractLegalBases(validPatterns),
      precedents: this.findRelevantPrecedents(validPatterns)
    };
  }

  private async assessEvidence(evidence: EvidenceItem[]): Promise<EvidenceAssessment> {
    const evidenceStrength = this.calculateEvidenceStrength(evidence);
    const admissibleEvidence = evidence.filter(item => item.admissible);
    const criticalEvidence = evidence.filter(item => item.strength === 'critical');
    const evidenceTypes = this.categorizeEvidence(evidence);

    return {
      overallStrength: evidenceStrength,
      admissibilityRate: admissibleEvidence.length / evidence.length,
      criticalEvidenceCount: criticalEvidence.length,
      evidenceTypes,
      gaps: this.identifyEvidenceGaps(evidenceTypes),
      enhancement: this.suggestEvidenceEnhancement(evidence)
    };
  }

  private async analyzeCollector(legalCase: LegalCase): Promise<CollectorAnalysis> {
    // In a real implementation, this would identify the collector from case data
    const collectorName = this.extractCollectorName(legalCase);
    const profile = this.collectorProfiles.get(collectorName) || this.generateDefaultProfile(collectorName);

    return {
      profile,
      litigationRisk: this.assessLitigationRisk(profile),
      settlementProbability: this.assessSettlementProbability(profile),
      negotiationTactics: this.getPredictionTactics(profile),
      regulatoryPressure: this.assessRegulatoryPressure(profile)
    };
  }

  private async evaluateJurisdiction(jurisdiction: string): Promise<JurisdictionEvaluation> {
    const data = this.jurisdictionData.get(jurisdiction) || this.generateDefaultJurisdiction(jurisdiction);

    return {
      analysis: data,
      plaintiffFriendliness: data.courtTendencies.plaintiffFriendly,
      expectedTimeline: data.courtTendencies.timeline,
      damagePotential: this.calculateDamagePotential(data),
      proceduralComplexity: this.assessProceduralComplexity(data)
    };
  }

  private async generateRecommendations(
    legalCase: LegalCase,
    patternAnalysis: ViolationPatternAnalysis,
    evidenceAssessment: EvidenceAssessment,
    collectorAnalysis: CollectorAnalysis,
    jurisdictionEvaluation: JurisdictionEvaluation
  ): Promise<StrategyRecommendation[]> {
    const recommendations: StrategyRecommendation[] = [];

    // Document preparation recommendations
    if (evidenceAssessment.overallStrength < 70) {
      recommendations.push({
        id: 'doc_1',
        type: 'document',
        title: 'Strengthen Evidence Documentation',
        description: 'Additional documentation needed to strengthen case evidence',
        priority: 'high',
        estimatedTime: '1-2 weeks',
        cost: 0,
        successProbability: 65,
        reasoning: 'Current evidence strength is below optimal threshold',
        dependencies: []
      });
    }

    // Cease and desist recommendation
    if (patternAnalysis.maxSeverity === 'major' || patternAnalysis.maxSeverity === 'severe') {
      recommendations.push({
        id: 'doc_2',
        type: 'document',
        title: 'Send Cease and Desist Letter',
        description: 'Formally demand collector stop all communications',
        priority: 'high',
        estimatedTime: '2-3 days',
        cost: 50,
        successProbability: 75,
        reasoning: 'Major violations warrant immediate cessation action',
        dependencies: []
      });
    }

    // Debt validation recommendation
    if (patternAnalysis.patterns.some(p => p.type === 'misrepresentation' || p.type === 'disclosure')) {
      recommendations.push({
        id: 'doc_3',
        type: 'document',
        title: 'Request Debt Validation',
        description: 'Demand collector provide proof of debt ownership and amount',
        priority: 'high',
        estimatedTime: '1 week',
        cost: 25,
        successProbability: 80,
        reasoning: 'Misrepresentation violations require debt verification',
        dependencies: []
      });
    }

    // Attorney consultation
    if (patternAnalysis.estimatedDamages.max > 2000 || collectorAnalysis.litigationRisk > 60) {
      recommendations.push({
        id: 'cons_1',
        type: 'action',
        title: 'Consult Consumer Protection Attorney',
        description: 'Professional legal review recommended for case complexity',
        priority: 'medium',
        estimatedTime: '1-2 weeks',
        cost: 250,
        successProbability: 85,
        reasoning: 'High case value or litigation risk warrants professional representation',
        dependencies: ['doc_2']
      });
    }

    return recommendations;
  }

  private async assessRisks(
    legalCase: LegalCase,
    recommendations: StrategyRecommendation[],
    collectorAnalysis: CollectorAnalysis,
    jurisdictionEvaluation: JurisdictionEvaluation
  ): Promise<RiskAssessment> {
    const factors: RiskFactor[] = [];

    // Evidence strength risk
    if (legalCase.evidence.length < 3) {
      factors.push({
        factor: 'Limited Evidence',
        impact: 'high',
        probability: 'medium',
        mitigation: 'Document all future communications and obtain written records'
      });
    }

    // Collector litigation risk
    if (collectorAnalysis.litigationRisk > 70) {
      factors.push({
        factor: 'Aggressive Litigation History',
        impact: 'high',
        probability: 'high',
        mitigation: 'Prepare for defense and consider early settlement'
      });
    }

    // Jurisdictional risk
    if (!jurisdictionEvaluation.plaintiffFriendliness) {
      factors.push({
        factor: 'Conservative Jurisdiction',
        impact: 'medium',
        probability: 'medium',
        mitigation: 'Focus on strong statutory violations and clear evidence'
      });
    }

    // Statute of limitations risk
    const solRisk = this.assessStatuteOfLimitationsRisk(legalCase);
    if (solRisk > 50) {
      factors.push({
        factor: 'Statute of Limitations',
        impact: 'high',
        probability: solRisk > 80 ? 'high' : 'medium',
        mitigation: 'Immediate action required, possible tolling arguments'
      });
    }

    const overallRisk = this.calculateOverallRisk(factors);
    const successRate = this.calculateSuccessRate(legalCase, factors, recommendations);

    return {
      overallRisk,
      factors,
      mitigation: this.generateMitigationStrategies(factors),
      successRate,
      potentialLosses: this.estimatePotentialLosses(legalCase, collectorAnalysis)
    };
  }

  private async createSettlementStrategy(
    legalCase: LegalCase,
    patternAnalysis: ViolationPatternAnalysis,
    collectorAnalysis: CollectorAnalysis,
    jurisdictionEvaluation: JurisdictionEvaluation
  ): Promise<SettlementStrategy> {
    const baseValue = patternAnalysis.estimatedDamages.average;
    const jurisdictionMultiplier = jurisdictionEvaluation.plaintiffFriendliness ? 1.2 : 0.8;
    const collectorMultiplier = collectorAnalysis.settlementProbability > 70 ? 1.1 : 0.9;

    const targetValue = baseValue * jurisdictionMultiplier * collectorMultiplier;

    return {
      demandRange: {
        min: Math.round(targetValue * 0.6),
        target: Math.round(targetValue),
        max: Math.round(targetValue * 1.5)
      },
      negotiationPoints: [
        'Statutory FDCPA violations',
        'Emotional distress damages',
        'Attorney fees and costs',
        'Regulatory complaints',
        'Credit reporting impact'
      ],
      concessionStrategy: [
        'Willing to negotiate payment plans',
        'Flexible on settlement timeframe',
        'Consider lump sum discount',
        'Release claims in exchange'
      ],
      timeline: collectorAnalysis.settlementProbability > 60 ? '2-3 months' : '4-6 months',
      bottomLine: Math.round(targetValue * 0.5)
    };
  }

  private async predictOutcomes(
    legalCase: LegalCase,
    recommendations: StrategyRecommendation[],
    riskAssessment: RiskAssessment,
    jurisdictionEvaluation: JurisdictionEvaluation
  ): Promise<ExpectedOutcome> {
    const baseProbability = riskAssessment.successRate;
    const evidenceBonus = this.calculateEvidenceBonus(legalCase.evidence);
    const recommendationBonus = recommendations.length * 2;

    const successProbability = Math.min(95, baseProbability + evidenceBonus + recommendationBonus);
    const expectedValue = legalCase.estimatedValue * (successProbability / 100);

    return {
      successProbability,
      expectedValue,
      timeframe: this.estimateTimeline(legalCase, riskAssessment),
      confidenceInterval: {
        low: Math.round(expectedValue * 0.6),
        high: Math.round(expectedValue * 1.5)
      },
      alternativeOutcomes: [
        {
          outcome: 'Pre-litigation Settlement',
          probability: 70,
          value: expectedValue * 0.8,
          description: 'Most common resolution, avoids court costs'
        },
        {
          outcome: 'Litigation Victory',
          probability: successProbability - 70,
          value: expectedValue * 1.2,
          description: 'Full statutory damages and attorney fees'
        },
        {
          outcome: 'Case Dismissal',
          probability: 100 - successProbability,
          value: 0,
          description: 'Technical deficiencies or lack of evidence'
        }
      ]
    };
  }

  private async generateTimeline(
    legalCase: LegalCase,
    recommendations: StrategyRecommendation[]
  ): Promise<StrategyTimeline[]> {
    const timeline: StrategyTimeline[] = [];

    // Phase 1: Documentation
    timeline.push({
      phase: 'Case Documentation',
      duration: '2-4 weeks',
      milestones: ['Gather all evidence', 'Organize communications', 'Draft initial documents'],
      deadlines: ['Evidence collection complete'],
      criticalPath: true
    });

    // Phase 2: Initial Communications
    timeline.push({
      phase: 'Collector Communications',
      duration: '4-6 weeks',
      milestones: ['Send cease and desist', 'Request validation', 'Document responses'],
      deadlines: ['Validation response: 30 days'],
      criticalPath: true
    });

    // Phase 3: Settlement Negotiations
    timeline.push({
      phase: 'Settlement Negotiations',
      duration: '4-8 weeks',
      milestones: ['Initial demand', 'Counter-offers', 'Final negotiations'],
      deadlines: ['Settlement decision point'],
      criticalPath: false
    });

    // Phase 4: Litigation (if necessary)
    timeline.push({
      phase: 'Litigation Preparation',
      duration: '8-12 weeks',
      milestones: ['File complaint', 'Discovery process', 'Pre-trial motions'],
      deadlines: ['Statute of limitations'],
      criticalPath: false
    });

    return timeline;
  }

  private async generateActionSteps(recommendations: StrategyRecommendation[]): Promise<ActionStep[]> {
    return recommendations.map((rec, index) => ({
      id: `step_${rec.id}`,
      title: rec.title,
      description: rec.description,
      type: rec.type,
      dueDate: this.calculateDueDate(rec, index),
      completed: false,
      dependencies: rec.dependencies,
      resources: this.generateResources(rec)
    }));
  }

  private async calculateLitigationProbability(
    legalCase: LegalCase,
    collectorAnalysis: CollectorAnalysis,
    settlementStrategy: SettlementStrategy
  ): Promise<number> {
    let probability = 15; // Base probability

    // Increase based on collector litigation history
    probability += collectorAnalysis.litigationRisk * 0.3;

    // Increase based on case value
    if (legalCase.estimatedValue > 5000) probability += 10;
    if (legalCase.estimatedValue > 10000) probability += 15;

    // Decrease based on settlement range reasonableness
    if (settlementStrategy.demandRange.target < legalCase.estimatedValue * 1.2) {
      probability -= 10;
    }

    return Math.min(80, Math.max(5, probability));
  }

  // Helper methods for database loading
  private loadViolationPatterns(): void {
    // Load violation patterns from database
    this.violationPatterns.set('harassment', {
      type: 'harassment',
      frequency: 0,
      severity: 'major',
      patterns: ['Repeated calls', 'Calls at unusual hours', 'Excessive call frequency'],
      legalBasis: ['15 U.S.C. § 1692c', 'State consumer protection laws'],
      typicalDamages: { min: 500, max: 1500, average: 1000 },
      precedents: []
    });

    this.violationPatterns.set('misrepresentation', {
      type: 'misrepresentation',
      frequency: 0,
      severity: 'major',
      patterns: ['False debt amounts', 'Threats of legal action', 'Impersonating officials'],
      legalBasis: ['15 U.S.C. § 1692e'],
      typicalDamages: { min: 800, max: 2000, average: 1400 },
      precedents: []
    });
  }

  private loadStrategyTemplates(): void {
    // Load strategy templates
    this.strategyTemplates.set('fdcpa_standard', {
      id: 'fdcpa_standard',
      name: 'Standard FDCPA Violation Strategy',
      caseType: 'fdcpa_violation',
      violations: ['harassment', 'misrepresentation'],
      evidenceStrength: 'moderate',
      timeline: '3-6 months',
      successRate: 75,
      averageAward: 2000,
      steps: [],
      riskFactors: ['Evidence quality', 'Collector cooperation'],
      settlementRange: { min: 1000, max: 3000 }
    });
  }

  private loadCollectorProfiles(): void {
    // Load collector profiles
    this.collectorProfiles.set('portfolio_recovery', {
      id: 'portfolio_recovery',
      name: 'Portfolio Recovery Associates',
      type: 'debt_buyer',
      reputation: 'poor',
      typicalSettlementRange: { percentage: 40, absolute: { min: 500, max: 5000 } },
      litigationHistory: { frequency: 'frequent', successRate: 65, averageAward: 2500 },
      knownTactics: ['Aggressive calling', 'Legal threats', 'Credit reporting pressure'],
      regulatoryActions: [],
      settlementHistory: []
    });
  }

  private loadJurisdictionData(): void {
    // Load jurisdiction data
    this.jurisdictionData.set('California', {
      jurisdiction: 'California',
      consumerProtectionLaws: [],
      courtTendencies: {
        plaintiffFriendly: true,
        averageAward: 3000,
        successRate: 80,
        timeline: '12-18 months'
      },
      statuteOfLimitations: { contract: 4, tort: 2, mixed: 4 },
      damageCaps: { statutory: 0, punitive: 0, emotional_distress: 0 },
      attorneyFeeShifting: true,
      recentCases: []
    });
  }

  // Additional helper methods
  private extractCollectorName(legalCase: LegalCase): string {
    // Extract collector name from case data
    return 'portfolio_recovery'; // Mock implementation
  }

  private generateDefaultProfile(name: string): CollectorProfile {
    return {
      id: `default_${name}`,
      name,
      type: 'collection_agency',
      reputation: 'average',
      typicalSettlementRange: { percentage: 50, absolute: { min: 500, max: 3000 } },
      litigationHistory: { frequency: 'occasional', successRate: 60, averageAward: 2000 },
      knownTactics: ['Standard collection practices'],
      regulatoryActions: [],
      settlementHistory: []
    };
  }

  private generateDefaultJurisdiction(jurisdiction: string): JurisdictionAnalysis {
    return {
      jurisdiction,
      consumerProtectionLaws: [],
      courtTendencies: {
        plaintiffFriendly: false,
        averageAward: 1500,
        successRate: 60,
        timeline: '18-24 months'
      },
      statuteOfLimitations: { contract: 6, tort: 2, mixed: 4 },
      damageCaps: { statutory: 1000, punitive: 5000, emotional_distress: 2500 },
      attorneyFeeShifting: false,
      recentCases: []
    };
  }

  // Additional implementation methods would go here...
  private getHighestSeverity(violations: ViolationReference[]): 'minor' | 'moderate' | 'major' | 'severe' {
    const severityOrder = { 'minor': 1, 'moderate': 2, 'major': 3, 'severe': 4 };
    return violations.reduce((highest, v) => {
      return severityOrder[v.severity] > severityOrder[highest] ? v.severity : highest;
    }, 'minor' as 'minor' | 'moderate' | 'major' | 'severe');
  }

  private calculateCombinedDamages(patterns: ViolationPattern[], violations: ViolationReference[]): { min: number; max: number; average: number } {
    const baseDamages = patterns.reduce((acc, pattern) => ({
      min: acc.min + pattern.typicalDamages.min,
      max: acc.max + pattern.typicalDamages.max,
      average: acc.average + pattern.typicalDamages.average
    }), { min: 0, max: 0, average: 0 });

    // Multiplier for frequency
    const totalFrequency = violations.reduce((sum, v) => sum + v.occurrences, 0);
    const frequencyMultiplier = Math.min(3, 1 + (totalFrequency / 10));

    return {
      min: Math.round(baseDamages.min * frequencyMultiplier),
      max: Math.round(baseDamages.max * frequencyMultiplier),
      average: Math.round(baseDamages.average * frequencyMultiplier)
    };
  }

  private extractLegalBases(patterns: ViolationPattern[]): string[] {
    const bases = patterns.flatMap(pattern => pattern.legalBasis);
    return [...new Set(bases)]; // Remove duplicates
  }

  private findRelevantPrecedents(patterns: ViolationPattern[]): CasePrecedent[] {
    // Mock implementation - would search case law database
    return [];
  }

  private calculateEvidenceStrength(evidence: EvidenceItem[]): number {
    if (evidence.length === 0) return 0;

    const strengthScores = { weak: 25, moderate: 50, strong: 75, critical: 100 };
    const totalScore = evidence.reduce((sum, item) => sum + strengthScores[item.strength], 0);
    return Math.min(100, Math.round(totalScore / evidence.length));
  }

  private categorizeEvidence(evidence: EvidenceItem[]): Record<string, number> {
    const categories: Record<string, number> = {};
    evidence.forEach(item => {
      categories[item.type] = (categories[item.type] || 0) + 1;
    });
    return categories;
  }

  private identifyEvidenceGaps(evidenceTypes: Record<string, number>): string[] {
    const gaps: string[] = [];
    if (!evidenceTypes['call_recording']) gaps.push('Call recordings needed');
    if (!evidenceTypes['document']) gaps.push('Written documentation needed');
    if (!evidenceTypes['transcript']) gaps.push('Call transcripts recommended');
    return gaps;
  }

  private suggestEvidenceEnhancement(evidence: EvidenceItem[]): string[] {
    const suggestions: string[] = [];
    if (evidence.length < 5) suggestions.push('Document additional communications');
    if (!evidence.some(e => e.type === 'call_recording')) suggestions.push('Record future calls');
    return suggestions;
  }

  // Additional method implementations...
  private assessLitigationRisk(profile: CollectorProfile): number {
    const reputationScores = { 'excellent': 10, 'good': 25, 'average': 50, 'poor': 75, 'very_poor': 90 };
    const frequencyScores = { 'rare': 10, 'occasional': 30, 'frequent': 70, 'very_frequent': 90 };

    return Math.round((reputationScores[profile.reputation] + frequencyScores[profile.litigationHistory.frequency]) / 2);
  }

  private assessSettlementProbability(profile: CollectorProfile): number {
    // Inverse of litigation risk with some adjustment
    return Math.round(100 - this.assessLitigationRisk(profile) * 0.7);
  }

  private getPredictionTactics(profile: CollectorProfile): string[] {
    return profile.knownTactics;
  }

  private assessRegulatoryPressure(profile: CollectorProfile): number {
    return profile.regulatoryActions.length * 15;
  }

  private calculateDamagePotential(data: JurisdictionAnalysis): number {
    return data.courtTendencies.averageAward;
  }

  private assessProceduralComplexity(data: JurisdictionAnalysis): 'low' | 'medium' | 'high' {
    return data.attorneyFeeShifting ? 'low' : 'medium';
  }

  private assessStatuteOfLimitationsRisk(legalCase: LegalCase): number {
    // Mock implementation - would calculate actual SOL risk
    return 25;
  }

  private calculateOverallRisk(factors: RiskFactor[]): 'low' | 'medium' | 'high' | 'very_high' {
    const highImpactFactors = factors.filter(f => f.impact === 'high').length;
    const highProbabilityFactors = factors.filter(f => f.probability === 'high').length;

    const riskScore = (highImpactFactors * 3 + highProbabilityFactors * 2 + factors.length) / 2;

    if (riskScore < 3) return 'low';
    if (riskScore < 6) return 'medium';
    if (riskScore < 10) return 'high';
    return 'very_high';
  }

  private calculateSuccessRate(legalCase: LegalCase, factors: RiskFactor[], recommendations: StrategyRecommendation[]): number {
    let baseRate = 70;

    // Adjust for risk factors
    factors.forEach(factor => {
      if (factor.impact === 'high' && factor.probability === 'high') baseRate -= 15;
      else if (factor.impact === 'high') baseRate -= 10;
      else if (factor.probability === 'high') baseRate -= 5;
    });

    // Adjust for recommendations
    baseRate += recommendations.length * 2;

    return Math.min(95, Math.max(20, baseRate));
  }

  private generateMitigationStrategies(factors: RiskFactor[]): string[] {
    return factors.map(factor => factor.mitigation);
  }

  private estimatePotentialLosses(legalCase: LegalCase, collectorAnalysis: CollectorAnalysis): number {
    return Math.round(legalCase.estimatedValue * 0.2); // Court costs and attorney fees
  }

  private calculateDueDate(recommendation: StrategyRecommendation, index: number): string {
    const daysFromNow = (index + 1) * 7; // One week per recommendation
    return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
  }

  private generateResources(recommendation: StrategyRecommendation): ResourceItem[] {
    // Mock resource generation
    return [{
      type: 'template',
      title: `${recommendation.title} Template`,
      description: 'Pre-approved template for this action'
    }];
  }

  private calculateEvidenceBonus(evidence: EvidenceItem[]): number {
    const strongEvidence = evidence.filter(e => e.strength === 'strong' || e.strength === 'critical').length;
    return Math.min(20, strongEvidence * 5);
  }

  private estimateTimeline(legalCase: LegalCase, riskAssessment: RiskAssessment): string {
    if (riskAssessment.overallRisk === 'low') return '2-4 months';
    if (riskAssessment.overallRisk === 'medium') return '4-6 months';
    if (riskAssessment.overallRisk === 'high') return '6-9 months';
    return '9-12 months';
  }
}

// Supporting interfaces
interface ViolationPatternAnalysis {
  patterns: ViolationPattern[];
  totalViolations: number;
  totalFrequency: number;
  maxSeverity: 'minor' | 'moderate' | 'major' | 'severe';
  estimatedDamages: { min: number; max: number; average: number };
  legalBases: string[];
  precedents: CasePrecedent[];
}

interface EvidenceAssessment {
  overallStrength: number; // 0-100
  admissibilityRate: number; // 0-1
  criticalEvidenceCount: number;
  evidenceTypes: Record<string, number>;
  gaps: string[];
  enhancement: string[];
}

interface CollectorAnalysis {
  profile: CollectorProfile;
  litigationRisk: number; // 0-100
  settlementProbability: number; // 0-100
  negotiationTactics: string[];
  regulatoryPressure: number; // 0-100
}

interface JurisdictionEvaluation {
  analysis: JurisdictionAnalysis;
  plaintiffFriendliness: boolean;
  expectedTimeline: string;
  damagePotential: number;
  proceduralComplexity: 'low' | 'medium' | 'high';
}

interface ResourceItem {
  type: 'template' | 'guide' | 'form' | 'law_reference' | 'tool';
  title: string;
  description: string;
  url?: string;
  content?: string;
}