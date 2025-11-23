/**
 * CallWall Attorney Referral System
 * AI-powered attorney matching and referral platform for consumer protection cases
 */

import {
  LegalCase,
  AttorneyInfo,
  ViolationReference,
  EvidenceItem
} from './AILegalAssistant';

export interface AttorneyReferral {
  id: string;
  userId: string;
  caseId: string;
  attorneyId: string;
  matchScore: number; // 0-100
  matchConfidence: number; // 0-100
  referralDate: string;
  status: 'pending' | 'contacted' | 'consultation_scheduled' | 'retained' | 'declined' | 'expired';
  introductionSent: boolean;
  contactMethod: 'email' | 'phone' | 'referral_service' | 'direct';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timeframe: string;
  budget: BudgetInfo;
  specialRequirements: string[];
  attorneyResponse?: AttorneyResponse;
  followUpSchedule: FollowUpTask[];
  referralFee?: ReferralFee;
}

export interface AttorneyResponse {
  responseDate: string;
  interested: boolean;
  available: boolean;
  consultationDetails: ConsultationDetails;
  feeStructure: FeeStructure;
  caseAssessment: CaseAssessment;
  questions: string[];
  nextSteps: string[];
  contactPreference: string;
}

export interface ConsultationDetails {
  type: 'phone' | 'video' | 'in_person';
  duration: string;
  availability: TimeSlot[];
  preparationRequired: string[];
  documentsNeeded: string[];
  cost: number;
  waived: boolean;
}

export interface FeeStructure {
  type: 'hourly' | 'contingency' | 'hybrid' | 'flat_fee' | 'pro_bono';
  hourlyRate?: number;
  contingencyRate?: number;
  retainer?: number;
  flatFeeAmount?: number;
  costsAdvancement: boolean;
  expensesIncluded: boolean;
  paymentTerms: string;
  estimate: CostEstimate;
}

export interface CostEstimate {
  total: number;
  attorneyFees: number;
  costs: number;
  expenses: number;
  contingencySuccess: number;
  worstCase: number;
  bestCase: number;
  assumptions: string[];
}

export interface CaseAssessment {
  strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  successProbability: number; // 0-100
  estimatedValue: number;
  timeframe: string;
  risks: string[];
  strengths: string[];
  recommendedApproach: string;
  experienceLevel: 'limited' | 'moderate' | 'extensive' | 'expert';
}

export interface BudgetInfo {
  type: 'limited' | 'moderate' | 'flexible' | 'no_constraint';
  maxHourlyRate?: number;
  maxContingency?: number;
  paymentPreference: 'contingency' | 'hourly' | 'hybrid' | 'flexible';
  retainerCapacity?: number;
  costConcerns: string[];
}

export interface FollowUpTask {
  id: string;
  task: string;
  dueDate: string;
  assignedTo: 'user' | 'attorney' | 'system';
  completed: boolean;
  completedDate?: string;
  reminderSent: boolean;
}

export interface ReferralFee {
  percentage: number;
  flatFee?: number;
  terms: string;
  paidBy: 'client' | 'attorney' | 'split';
  paymentTrigger: string;
  capped: boolean;
  capAmount?: number;
}

export interface AttorneyProfile {
  id: string;
  personalInfo: PersonalInfo;
  practice: PracticeInfo;
  expertise: ExpertiseInfo;
  reputation: ReputationInfo;
  availability: AvailabilityInfo;
  preferences: AttorneyPreferences;
  compliance: ComplianceInfo;
  performance: PerformanceMetrics;
  insurance: InsuranceInfo;
}

export interface PersonalInfo {
  name: string;
  title: string;
  firmName: string;
  photo?: string;
  bio: string;
  education: Education[];
  barAdmissions: BarAdmission[];
  languages: Language[];
  location: LocationInfo;
  contact: ContactInfo;
  website?: string;
  socialMedia: SocialMediaInfo;
}

export interface PracticeInfo {
  firmSize: 'solo' | 'small' | 'medium' | 'large';
  firmType: 'boutique' | 'general' | 'specialized' | 'biglaw';
  practiceAreas: string[];
  industries: string[];
  officeLocations: OfficeLocation[];
  founded: number;
  attorneyCount: number;
  supportStaff: number;
  technology: TechnologyInfo;
}

export interface ExpertiseInfo {
  specialties: LegalSpecialty[];
  caseTypes: CaseType[];
  experience: ExperienceInfo;
  certifications: Certification[];
  publications: Publication[];
  speaking: SpeakingEngagement[];
  awards: Award[];
  notableCases: NotableCase[];
}

export interface LegalSpecialty {
  area: string;
  years: number;
  proficiency: 'basic' | 'intermediate' | 'advanced' | 'expert';
  focusPercentage: number; // 0-100
  representative: boolean;
  recentCases: number;
  successRate: number;
}

export interface CaseType {
  type: string;
  experience: 'limited' | 'moderate' | 'extensive';
  typicalValue: ValueRange;
  successRate: number;
  averageDuration: string;
  currentCases: number;
  preferredApproach: string;
}

export interface ExperienceInfo {
  totalYears: number;
  consumerLawYears: number;
  fdcpaCases: number;
  fcraCases: number;
  tcpaCases: number;
  stateLawCases: number;
  trialExperience: TrialExperience;
  appellateExperience: AppellateExperience;
  settlementExperience: SettlementExperience;
}

export interface ReputationInfo {
  overallRating: number; // 0-5
  reviewCount: number;
  platformRatings: PlatformRating[];
  peerRecognition: PeerRecognition[];
  mediaMentions: MediaMention[];
  disciplinaryHistory: DisciplinaryRecord[];
  clientTestimonials: ClientTestimonial[];
  professionalAssociations: ProfessionalAssociation[];
}

export interface AvailabilityInfo {
  acceptingNewCases: boolean;
  caseLoad: CaseLoadInfo;
  responseTime: ResponseTimeInfo;
  consultationSchedule: ConsultationSchedule;
  travelWillingness: TravelWillingness;
  emergencyAvailability: boolean;
  vacationSchedule: VacationPeriod[];
  referralNetwork: ReferralNetworkInfo;
}

export interface AttorneyPreferences {
  caseValueRange: ValueRange;
  caseComplexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  geographicPreferences: GeographicPreference[];
  clientPreferences: ClientPreference[];
  feePreferences: FeePreference[];
  practicePreferences: PracticePreference[];
  technologyPreferences: TechnologyPreference[];
}

export interface MatchingCriteria {
  caseValue: ValueRange;
  caseType: string[];
  jurisdiction: string[];
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  feeStructure: string[];
  experienceLevel: 'junior' | 'mid_level' | 'senior' | 'expert';
  specialization: string[];
  language: string[];
  location: LocationPreference;
  availability: 'immediate' | 'within_week' | 'within_month' | 'flexible';
  reputation: number; // minimum rating
  budget: BudgetConstraint;
  specialRequirements: string[];
}

export interface MatchingAlgorithm {
  weights: MatchingWeights;
  rules: MatchingRule[];
  filters: MatchingFilter[];
  boosters: MatchingBooster[];
  penalties: MatchingPenalty[];
  thresholds: MatchingThreshold[];
}

export interface MatchingWeights {
  expertise: number; // 0-1
  experience: number; // 0-1
  location: number; // 0-1
  availability: number; // 0-1
  reputation: number; // 0-1
  feeStructure: number; // 0-1
  caseFit: number; // 0-1
  responseRate: number; // 0-1
  compatibility: number; // 0-1
}

export interface MatchingResult {
  attorneyId: string;
  score: number; // 0-100
  breakdown: ScoreBreakdown;
  rankingFactors: RankingFactor[];
  potentialIssues: PotentialIssue[];
  recommendation: RecommendationLevel;
  estimatedResponseTime: string;
  confidenceLevel: number; // 0-100
}

export interface ScoreBreakdown {
  expertise: number; // 0-100
  experience: number; // 0-100
  location: number; // 0-100
  availability: number; // 0-100
  reputation: number; // 0-100
  feeStructure: number; // 0-100
  caseFit: number; // 0-100
  responseRate: number; // 0-100
  compatibility: number; // 0-100
  overall: number; // 0-100
}

export interface RankingFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-1
  contribution: number; // contribution to overall score
  explanation: string;
}

export interface PotentialIssue {
  type: 'availability' | 'location' | 'expertise' | 'fees' | 'compatibility' | 'other';
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
  dealbreaker: boolean;
}

export interface RecommendationLevel {
  level: 'highly_recommended' | 'recommended' | 'consider' | 'not_recommended';
  reasoning: string;
  confidence: number; // 0-100
  alternatives: string[];
}

export class AttorneyReferralSystem {
  private attorneyProfiles: Map<string, AttorneyProfile> = new Map();
  private referrals: Map<string, AttorneyReferral> = new Map();
  private matchingAlgorithm: MatchingAlgorithm;
  private networkData: NetworkData;

  constructor() {
    this.initializeMatchingAlgorithm();
    this.loadAttorneyProfiles();
    this.initializeNetworkData();
  }

  private initializeMatchingAlgorithm(): void {
    this.matchingAlgorithm = {
      weights: {
        expertise: 0.25,
        experience: 0.20,
        location: 0.15,
        availability: 0.15,
        reputation: 0.10,
        feeStructure: 0.05,
        caseFit: 0.05,
        responseRate: 0.03,
        compatibility: 0.02
      },
      rules: [
        {
          name: 'basic_licensing',
          condition: 'attorney.barAdmissions.includes(jurisdiction)',
          action: 'include',
          priority: 'required'
        },
        {
          name: 'expertise_match',
          condition: 'attorney.expertise.specialties.includes(caseType)',
          action: 'boost_score',
          value: 20,
          priority: 'high'
        }
      ],
      filters: [],
      boosters: [],
      penalties: [],
      thresholds: {
        minimumScore: 60,
        highlyRecommended: 85,
        recommended: 70,
        consider: 60
      }
    };
  }

  async findAttorneys(criteria: MatchingCriteria): Promise<MatchingResult[]> {
    try {
      const candidates = await this.filterCandidates(criteria);
      const scoredCandidates = await this.scoreCandidates(candidates, criteria);
      const rankedCandidates = this.rankCandidates(scoredCandidates);
      const validatedCandidates = await this.validateCandidates(rankedCandidates);

      return validatedCandidates;
    } catch (error) {
      console.error('Attorney search failed:', error);
      throw new Error(`Failed to find attorneys: ${error}`);
    }
  }

  async createReferral(
    userId: string,
    caseId: string,
    attorneyId: string,
    criteria: MatchingCriteria,
    budget: BudgetInfo,
    specialRequirements: string[] = []
  ): Promise<AttorneyReferral> {
    try {
      const attorney = this.attorneyProfiles.get(attorneyId);
      if (!attorney) {
        throw new Error('Attorney not found');
      }

      const referralId = `ref_${userId}_${caseId}_${attorneyId}_${Date.now()}`;

      const referral: AttorneyReferral = {
        id: referralId,
        userId,
        caseId,
        attorneyId,
        matchScore: await this.calculateMatchScore(attorneyId, criteria),
        matchConfidence: 0, // Will be calculated
        referralDate: new Date().toISOString(),
        status: 'pending',
        introductionSent: false,
        contactMethod: this.determineContactMethod(attorney, criteria),
        priority: criteria.urgency,
        timeframe: this.determineTimeframe(criteria.urgency),
        budget,
        specialRequirements,
        followUpSchedule: this.generateFollowUpSchedule(),
        referralFee: this.calculateReferralFee(attorney, criteria)
      };

      this.referrals.set(referralId, referral);

      // Send introduction
      await this.sendAttorneyIntroduction(referral);

      return referral;
    } catch (error) {
      console.error('Referral creation failed:', error);
      throw new Error(`Failed to create referral: ${error}`);
    }
  }

  private async filterCandidates(criteria: MatchingCriteria): Promise<AttorneyProfile[]> {
    const candidates: AttorneyProfile[] = [];

    for (const attorney of this.attorneyProfiles.values()) {
      if (await this.meetsBasicCriteria(attorney, criteria)) {
        candidates.push(attorney);
      }
    }

    return candidates;
  }

  private async meetsBasicCriteria(attorney: AttorneyProfile, criteria: MatchingCriteria): Promise<boolean> {
    // Check jurisdiction admission
    const hasJurisdiction = criteria.jurisdiction.some(jurisdiction =>
      attorney.personalInfo.barAdmissions.some(admission => admission.state === jurisdiction)
    );
    if (!hasJurisdiction) return false;

    // Check if accepting new cases
    if (!attorney.availability.acceptingNewCases) return false;

    // Check fee structure compatibility
    if (criteria.feeStructure.length > 0) {
      const compatibleFeeStructure = criteria.feeStructure.some(structure =>
        attorney.preferences.feePreferences.some(pref => pref.type === structure)
      );
      if (!compatibleFeeStructure) return false;
    }

    // Check case value range
    if (criteria.caseValue.min > attorney.preferences.caseValueRange.max ||
        criteria.caseValue.max < attorney.preferences.caseValueRange.min) {
      return false;
    }

    // Check minimum reputation
    if (attorney.reputation.overallRating < criteria.reputation) return false;

    return true;
  }

  private async scoreCandidates(candidates: AttorneyProfile[], criteria: MatchingCriteria): Promise<MatchingResult[]> {
    const results: MatchingResult[] = [];

    for (const attorney of candidates) {
      const result = await this.scoreAttorney(attorney, criteria);
      results.push(result);
    }

    return results;
  }

  private async scoreAttorney(attorney: AttorneyProfile, criteria: MatchingCriteria): Promise<MatchingResult> {
    const weights = this.matchingAlgorithm.weights;

    // Calculate component scores
    const expertiseScore = this.calculateExpertiseScore(attorney, criteria);
    const experienceScore = this.calculateExperienceScore(attorney, criteria);
    const locationScore = this.calculateLocationScore(attorney, criteria);
    const availabilityScore = this.calculateAvailabilityScore(attorney, criteria);
    const reputationScore = this.calculateReputationScore(attorney, criteria);
    const feeStructureScore = this.calculateFeeStructureScore(attorney, criteria);
    const caseFitScore = this.calculateCaseFitScore(attorney, criteria);
    const responseRateScore = this.calculateResponseRateScore(attorney, criteria);
    const compatibilityScore = this.calculateCompatibilityScore(attorney, criteria);

    // Calculate overall score
    const overallScore = Math.round(
      expertiseScore * weights.expertise +
      experienceScore * weights.experience +
      locationScore * weights.location +
      availabilityScore * weights.availability +
      reputationScore * weights.reputation +
      feeStructureScore * weights.feeStructure +
      caseFitScore * weights.caseFit +
      responseRateScore * weights.responseRate +
      compatibilityScore * weights.compatibility
    );

    return {
      attorneyId: attorney.id,
      score: overallScore,
      breakdown: {
        expertise: expertiseScore,
        experience: experienceScore,
        location: locationScore,
        availability: availabilityScore,
        reputation: reputationScore,
        feeStructure: feeStructureScore,
        caseFit: caseFitScore,
        responseRate: responseRateScore,
        compatibility: compatibilityScore,
        overall: overallScore
      },
      rankingFactors: this.generateRankingFactors(attorney, criteria),
      potentialIssues: this.identifyPotentialIssues(attorney, criteria),
      recommendation: this.generateRecommendation(overallScore),
      estimatedResponseTime: attorney.availability.responseTime.average,
      confidenceLevel: this.calculateConfidenceLevel(attorney, criteria)
    };
  }

  private calculateExpertiseScore(attorney: AttorneyProfile, criteria: MatchingCriteria): number {
    let score = 50; // Base score

    // Check for relevant specialties
    const matchingSpecialties = attorney.expertise.specialties.filter(specialty =>
      criteria.specialization.includes(specialty.area)
    );

    if (matchingSpecialties.length > 0) {
      const avgProficiency = matchingSpecialties.reduce((sum, s) => sum + this.getProficiencyScore(s.proficiency), 0) / matchingSpecialties.length;
      score += avgProficiency * 0.4;
    }

    // Check case type experience
    const matchingCaseTypes = attorney.expertise.caseTypes.filter(caseType =>
      criteria.caseType.includes(caseType.type)
    );

    if (matchingCaseTypes.length > 0) {
      const avgSuccessRate = matchingCaseTypes.reduce((sum, ct) => sum + ct.successRate, 0) / matchingCaseTypes.length;
      score += (avgSuccessRate / 100) * 10;
    }

    return Math.min(100, Math.round(score));
  }

  private calculateExperienceScore(attorney: AttorneyProfile, criteria: MatchingCriteria): number {
    let score = 0;

    const experience = attorney.expertise.experience;

    // Base experience score
    score += Math.min(40, experience.totalYears * 2);

    // Consumer law specific experience
    score += Math.min(30, experience.consumerLawYears * 3);

    // FDCPA specific experience
    score += Math.min(20, (experience.fdcpaCases / 50) * 20);

    // Trial experience bonus
    if (experience.trialExperience.experience === 'extensive') {
      score += 10;
    }

    return Math.min(100, Math.round(score));
  }

  private calculateLocationScore(attorney: AttorneyProfile, criteria: MatchingCriteria): number {
    let score = 50;

    // Check geographic preferences
    const matchingLocations = attorney.preferences.geographicPreferences.filter(pref =>
      criteria.location.states?.includes(pref.state) ||
      criteria.location.regions?.includes(pref.region)
    );

    if (matchingLocations.length > 0) {
      score += 30;
    }

    // Check office locations
    const nearbyOffices = attorney.practice.officeLocations.filter(office =>
      criteria.location.radius && this.calculateDistance(criteria.location, office) <= criteria.location.radius
    );

    if (nearbyOffices.length > 0) {
      score += 20;
    }

    return Math.min(100, Math.round(score));
  }

  private calculateAvailabilityScore(attorney: AttorneyProfile, criteria: MatchingCriteria): number {
    let score = 0;

    if (criteria.availability === 'immediate') {
      score = attorney.availability.responseTime.immediate ? 100 : 20;
    } else if (criteria.availability === 'within_week') {
      score = attorney.availability.responseTime.within_24h ? 90 :
              attorney.availability.responseTime.within_48h ? 70 : 40;
    } else {
      score = 80; // Flexible availability gets good score
    }

    // Case load consideration
    if (attorney.availability.caseLoad.current < attorney.availability.caseLoad.preferred) {
      score += 10;
    } else if (attorney.availability.caseLoad.current > attorney.availability.caseLoad.preferred * 1.5) {
      score -= 20;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateReputationScore(attorney: AttorneyProfile, criteria: MatchingCriteria): number {
    const reputation = attorney.reputation;
    let score = 0;

    // Overall rating (0-5 scale converted to 0-100)
    score += reputation.overallRating * 20;

    // Review count consideration
    if (reputation.reviewCount > 50) {
      score += 10;
    } else if (reputation.reviewCount > 20) {
      score += 5;
    }

    // Platform ratings
    const avgPlatformRating = reputation.platformRatings.reduce((sum, r) => sum + r.rating, 0) / reputation.platformRatings.length;
    score += avgPlatformRating * 10;

    // Peer recognition
    if (reputation.peerRecognition.length > 0) {
      score += 10;
    }

    // No disciplinary history bonus
    if (reputation.disciplinaryHistory.length === 0) {
      score += 5;
    }

    return Math.min(100, Math.round(score));
  }

  private calculateFeeStructureScore(attorney: AttorneyProfile, criteria: MatchingCriteria): number {
    const feePrefs = attorney.preferences.feePreferences;
    let score = 0;

    // Check if preferred fee structures match
    const matchingFeeStructures = feePrefs.filter(pref =>
      criteria.feeStructure.includes(pref.type)
    );

    if (matchingFeeStructures.length > 0) {
      score += 50;

      // Bonus for contingency fee preference (common in consumer law)
      if (criteria.feeStructure.includes('contingency') && feePrefs.some(p => p.type === 'contingency')) {
        score += 30;
      }
    }

    // Check budget compatibility
    if (criteria.budget.maxHourlyRate && feePrefs.some(p => p.hourlyRate && p.hourlyRate <= criteria.budget.maxHourlyRate)) {
      score += 20;
    }

    return Math.min(100, Math.round(score));
  }

  private calculateCaseFitScore(attorney: AttorneyProfile, criteria: MatchingCriteria): number {
    let score = 50;

    // Check case value range compatibility
    const caseValueRange = attorney.preferences.caseValueRange;
    const criteriaValueRange = criteria.caseValue;

    const overlap = this.calculateOverlap(criteriaValueRange, caseValueRange);
    if (overlap > 0) {
      score += overlap * 50;
    }

    // Check case complexity preference
    const complexityScore = this.getComplexityScore(criteria.caseComplexity || 'moderate');
    score += complexityScore * 20;

    return Math.min(100, Math.round(score));
  }

  private calculateResponseRateScore(attorney: AttorneyProfile, criteria: MatchingCriteria): number {
    const responseTime = attorney.availability.responseTime;
    let score = 0;

    if (responseTime.immediate) score = 100;
    else if (responseTime.within_24h) score = 90;
    else if (responseTime.within_48h) score = 70;
    else if (responseTime.within_week) score = 50;
    else score = 30;

    return score;
  }

  private calculateCompatibilityScore(attorney: AttorneyProfile, criteria: MatchingCriteria): number {
    let score = 50;

    // Language compatibility
    if (criteria.language && criteria.language.length > 0) {
      const matchingLanguages = attorney.personalInfo.languages.filter(lang =>
        criteria.language.includes(lang.language)
      );
      score += matchingLanguages.length * 10;
    }

    // Technology preferences
    const techCompatibility = this.assessTechnologyCompatibility(attorney, criteria);
    score += techCompatibility * 20;

    // Practice style preferences
    const practiceCompatibility = this.assessPracticeCompatibility(attorney, criteria);
    score += practiceCompatibility * 20;

    return Math.min(100, Math.round(score));
  }

  private rankCandidates(scoredCandidates: MatchingResult[]): MatchingResult[] {
    return scoredCandidates.sort((a, b) => {
      // First by score (descending)
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      // Then by confidence level (descending)
      if (b.confidenceLevel !== a.confidenceLevel) {
        return b.confidenceLevel - a.confidenceLevel;
      }

      // Finally by estimated response time (ascending - faster is better)
      return this.getTimeInHours(a.estimatedResponseTime) - this.getTimeInHours(b.estimatedResponseTime);
    });
  }

  private async validateCandidates(candidates: MatchingResult[]): Promise<MatchingResult[]> {
    const validated: MatchingResult[] = [];

    for (const candidate of candidates) {
      if (await this.validateCandidate(candidate)) {
        validated.push(candidate);
      }
    }

    return validated;
  }

  private async validateCandidate(candidate: MatchingResult): Promise<boolean> {
    // Check if score meets minimum threshold
    if (candidate.score < this.matchingAlgorithm.thresholds.minimumScore) {
      return false;
    }

    // Check for dealbreaker issues
    const dealbreakers = candidate.potentialIssues.filter(issue => issue.dealbreaker);
    if (dealbreakers.length > 0) {
      return false;
    }

    // Additional validation checks could be added here
    return true;
  }

  // Helper methods
  private getProficiencyScore(proficiency: string): number {
    const scores = {
      'basic': 25,
      'intermediate': 50,
      'advanced': 75,
      'expert': 100
    };
    return scores[proficiency as keyof typeof scores] || 50;
  }

  private calculateDistance(location: LocationPreference, office: OfficeLocation): number {
    // Simplified distance calculation - would use actual geolocation
    return 100; // Mock distance in miles
  }

  private calculateOverlap(range1: ValueRange, range2: ValueRange): number {
    const overlapMin = Math.max(range1.min, range2.min);
    const overlapMax = Math.min(range1.max, range2.max);

    if (overlapMax <= overlapMin) return 0;

    const overlapSize = overlapMax - overlapMin;
    const range1Size = range1.max - range1.min;

    return overlapSize / range1Size;
  }

  private getComplexityScore(complexity: string): number {
    const scores = {
      'simple': 25,
      'moderate': 50,
      'complex': 75,
      'very_complex': 100
    };
    return scores[complexity as keyof typeof scores] || 50;
  }

  private assessTechnologyCompatibility(attorney: AttorneyProfile, criteria: MatchingCriteria): number {
    // Mock assessment - would evaluate actual technology preferences
    return 80;
  }

  private assessPracticeCompatibility(attorney: AttorneyProfile, criteria: MatchingCriteria): number {
    // Mock assessment - would evaluate actual practice preferences
    return 75;
  }

  private getTimeInHours(timeString: string): number {
    // Convert time strings like "24 hours", "2 days" to hours
    if (timeString.includes('hour')) return parseInt(timeString);
    if (timeString.includes('day')) return parseInt(timeString) * 24;
    if (timeString.includes('week')) return parseInt(timeString) * 24 * 7;
    return 48; // Default to 48 hours
  }

  private generateRankingFactors(attorney: AttorneyProfile, criteria: MatchingCriteria): RankingFactor[] {
    // Generate factors that influenced the ranking
    return [
      {
        factor: 'Consumer law expertise',
        impact: 'positive',
        weight: 0.25,
        contribution: 20,
        explanation: 'Strong background in consumer protection law'
      }
    ];
  }

  private identifyPotentialIssues(attorney: AttorneyProfile, criteria: MatchingCriteria): PotentialIssue[] {
    const issues: PotentialIssue[] = [];

    // Check for potential issues
    if (attorney.availability.caseLoad.current > attorney.availability.caseLoad.preferred * 1.5) {
      issues.push({
        type: 'availability',
        severity: 'medium',
        description: 'High case load may delay response times',
        mitigation: 'Expect longer response times initially',
        dealbreaker: false
      });
    }

    return issues;
  }

  private generateRecommendation(score: number): RecommendationLevel {
    if (score >= 85) {
      return {
        level: 'highly_recommended',
        reasoning: 'Excellent match across all criteria',
        confidence: 90,
        alternatives: ['Consider other highly-rated options as backup']
      };
    } else if (score >= 70) {
      return {
        level: 'recommended',
        reasoning: 'Strong candidate with good qualifications',
        confidence: 75,
        alternatives: ['Review other options for comparison']
      };
    } else {
      return {
        level: 'consider',
        reasoning: 'Meets basic requirements but may not be optimal',
        confidence: 60,
        alternatives: ['Continue searching for better matches']
      };
    }
  }

  private calculateConfidenceLevel(attorney: AttorneyProfile, criteria: MatchingCriteria): number {
    // Calculate confidence in the match based on data completeness
    let confidence = 80;

    // Reduce confidence if data is incomplete
    if (!attorney.reputation.reviewCount) confidence -= 10;
    if (!attorney.expertise.experience.fdcpaCases) confidence -= 10;
    if (!attorney.availability.responseTime) confidence -= 5;

    return Math.max(50, confidence);
  }

  private determineContactMethod(attorney: AttorneyProfile, criteria: MatchingCriteria): 'email' | 'phone' | 'referral_service' | 'direct' {
    // Determine best contact method based on attorney preferences
    if (attorney.personalInfo.contact.preferredContact === 'email') return 'email';
    if (attorney.personalInfo.contact.preferredContact === 'phone') return 'phone';
    return 'referral_service';
  }

  private determineTimeframe(urgency: string): string {
    const timeframes = {
      'urgent': 'Within 24 hours',
      'high': 'Within 48 hours',
      'medium': 'Within 1 week',
      'low': 'Within 2 weeks'
    };
    return timeframes[urgency as keyof typeof timeframes] || 'Within 1 week';
  }

  private generateFollowUpSchedule(): FollowUpTask[] {
    return [
      {
        id: 'followup_1',
        task: 'Send reminder email if no response',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        assignedTo: 'system',
        completed: false,
        reminderSent: false
      }
    ];
  }

  private calculateReferralFee(attorney: AttorneyProfile, criteria: MatchingCriteria): ReferralFee | undefined {
    // Mock implementation - would calculate based on arrangements
    return undefined;
  }

  private async sendAttorneyIntroduction(referral: AttorneyReferral): Promise<void> {
    // Mock implementation - would actually send introduction
    console.log(`Sending attorney introduction for referral ${referral.id}`);
    referral.introductionSent = true;
  }

  private async calculateMatchScore(attorneyId: string, criteria: MatchingCriteria): Promise<number> {
    // Calculate match score for referral tracking
    return 85; // Mock score
  }

  // Mock data loading
  private loadAttorneyProfiles(): void {
    // Load attorney profiles from database
    // For now, create a mock profile
    const mockAttorney: AttorneyProfile = {
      id: 'attorney_1',
      personalInfo: {
        name: 'Sarah Johnson',
        title: 'Partner',
        firmName: 'Consumer Rights Law Group',
        bio: 'Experienced consumer protection attorney',
        education: [],
        barAdmissions: [{ state: 'California', year: 2010, active: true }],
        languages: [{ language: 'English', fluency: 'native' }],
        location: { city: 'Los Angeles', state: 'CA', country: 'USA' },
        contact: { email: 'sarah@consumerrights.com', phone: '(310) 555-0123', preferredContact: 'email' }
      },
      practice: {
        firmSize: 'small',
        firmType: 'boutique',
        practiceAreas: ['Consumer Protection', 'FDCPA', 'FCRA'],
        industries: ['Financial Services', 'Healthcare'],
        officeLocations: [{ city: 'Los Angeles', state: 'CA', address: '123 Main St' }],
        founded: 2015,
        attorneyCount: 3,
        supportStaff: 2,
        technology: { caseManagement: 'Clio', videoConferencing: 'Zoom' }
      },
      expertise: {
        specialties: [{
          area: 'Consumer Protection',
          years: 12,
          proficiency: 'expert',
          focusPercentage: 80,
          representative: true,
          recentCases: 45,
          successRate: 85
        }],
        caseTypes: [{
          type: 'FDCPA Violation',
          experience: 'extensive',
          typicalValue: { min: 1000, max: 10000 },
          successRate: 85,
          averageDuration: '4-6 months',
          currentCases: 8,
          preferredApproach: 'Negotiation first, litigation if necessary'
        }],
        experience: {
          totalYears: 12,
          consumerLawYears: 12,
          fdcpaCases: 150,
          fcraCases: 75,
          tcpaCases: 30,
          stateLawCases: 90,
          trialExperience: { experience: 'moderate', cases: 12, wins: 9 },
          appellateExperience: { experience: 'limited', cases: 3, wins: 2 },
          settlementExperience: { settlements: 125, totalValue: 2500000, successRate: 95 }
        },
        certifications: [],
        publications: [],
        speaking: [],
        awards: [],
        notableCases: []
      },
      reputation: {
        overallRating: 4.8,
        reviewCount: 127,
        platformRatings: [],
        peerRecognition: [],
        mediaMentions: [],
        disciplinaryHistory: [],
        clientTestimonials: [],
        professionalAssociations: []
      },
      availability: {
        acceptingNewCases: true,
        caseLoad: { current: 8, preferred: 10, maximum: 15 },
        responseTime: {
          immediate: true,
          within_24h: true,
          within_48h: true,
          within_week: true,
          average: '12-24 hours'
        },
        consultationSchedule: {
          weekdays: ['9:00 AM - 5:00 PM'],
          weekends: false,
          evenings: false
        },
        travelWillingness: { local: true, regional: false, national: false },
        emergencyAvailability: false,
        vacationSchedule: [],
        referralNetwork: { active: true, partners: 15 }
      },
      preferences: {
        caseValueRange: { min: 1000, max: 50000 },
        caseComplexity: 'moderate',
        geographicPreferences: [{ state: 'CA', regions: ['Southern California'], preference: 'preferred' }],
        clientPreferences: [{ type: 'communication', value: 'email', importance: 'high' }],
        feePreferences: [{ type: 'contingency', rate: 33, minimum: 50000 }],
        practicePreferences: [{ area: 'negotiation', value: 'high', importance: 'medium' }],
        technologyPreferences: [{ type: 'case_management', preference: 'cloud_based' }]
      },
      compliance: {
        barStatus: 'good_standing',
        insurance: { professional: true, amount: 1000000, carrier: 'Chubb' },
        continuingEducation: { current: true, hours: 30 },
        disciplinaryHistory: []
      },
      performance: {
        casesHandled: 250,
        successRate: 85,
        averageSettlement: 4200,
        clientSatisfaction: 4.7,
        referralRate: 75,
        responseTime: '12-24 hours'
      },
      insurance: {
        professional: true,
        amount: 1000000,
        carrier: 'Chubb',
        claims: [],
        expiration: '2024-12-31'
      }
    };

    this.attorneyProfiles.set(mockAttorney.id, mockAttorney);
  }

  private initializeNetworkData(): void {
    // Initialize network data for attorney matching
    this.networkData = {
      referralNetworks: [],
      barAssociations: [],
      practiceGroups: [],
      industryConnections: []
    };
  }

  private async calculateMatchScore(attorneyId: string, criteria: MatchingCriteria): Promise<number> {
    return 85; // Mock implementation
  }
}

// Supporting interfaces (simplified)
interface Education {
  degree: string;
  school: string;
  year: number;
}

interface BarAdmission {
  state: string;
  year: number;
  active: boolean;
}

interface Language {
  language: string;
  fluency: 'basic' | 'conversational' | 'fluent' | 'native';
}

interface LocationInfo {
  city: string;
  state: string;
  country: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  preferredContact: 'email' | 'phone';
}

interface SocialMediaInfo {
  linkedin?: string;
  twitter?: string;
  website?: string;
}

interface OfficeLocation {
  city: string;
  state: string;
  address: string;
}

interface TechnologyInfo {
  caseManagement: string;
  videoConferencing: string;
}

interface TrialExperience {
  experience: 'none' | 'limited' | 'moderate' | 'extensive';
  cases: number;
  wins: number;
}

interface AppellateExperience {
  experience: 'none' | 'limited' | 'moderate' | 'extensive';
  cases: number;
  wins: number;
}

interface SettlementExperience {
  settlements: number;
  totalValue: number;
  successRate: number;
}

interface Certification {
  name: string;
  issuer: string;
  year: number;
}

interface Publication {
  title: string;
  publisher: string;
  year: number;
}

interface SpeakingEngagement {
  event: string;
  topic: string;
  year: number;
}

interface Award {
  name: string;
  issuer: string;
  year: number;
}

interface NotableCase {
  name: string;
  outcome: string;
  year: number;
  significance: string;
}

interface PlatformRating {
  platform: string;
  rating: number;
  reviews: number;
}

interface PeerRecognition {
  type: string;
  issuer: string;
  year: number;
}

interface MediaMention {
  outlet: string;
  topic: string;
  date: string;
}

interface DisciplinaryRecord {
  type: string;
  date: string;
  resolution: string;
}

interface ClientTestimonial {
  client: string;
  rating: number;
  comment: string;
  date: string;
}

interface ProfessionalAssociation {
  name: string;
  role: string;
  years: number;
}

interface CaseLoadInfo {
  current: number;
  preferred: number;
  maximum: number;
}

interface ResponseTimeInfo {
  immediate: boolean;
  within_24h: boolean;
  within_48h: boolean;
  within_week: boolean;
  average: string;
}

interface ConsultationSchedule {
  weekdays: string[];
  weekends: boolean;
  evenings: boolean;
}

interface TravelWillingness {
  local: boolean;
  regional: boolean;
  national: boolean;
}

interface VacationPeriod {
  startDate: string;
  endDate: string;
}

interface ReferralNetworkInfo {
  active: boolean;
  partners: number;
}

interface GeographicPreference {
  state: string;
  regions: string[];
  preference: 'preferred' | 'acceptable' | 'avoid';
}

interface ClientPreference {
  type: string;
  value: string;
  importance: 'low' | 'medium' | 'high';
}

interface FeePreference {
  type: string;
  rate?: number;
  minimum?: number;
}

interface PracticePreference {
  area: string;
  value: string;
  importance: 'low' | 'medium' | 'high';
}

interface TechnologyPreference {
  type: string;
  preference: string;
}

interface ValueRange {
  min: number;
  max: number;
}

interface LocationPreference {
  states?: string[];
  regions?: string[];
  radius?: number; // miles
  coordinates?: { lat: number; lng: number };
}

interface BudgetConstraint {
  maxHourlyRate?: number;
  maxContingency?: number;
  paymentPreference: string;
}

interface MatchingWeights {
  expertise: number;
  experience: number;
  location: number;
  availability: number;
  reputation: number;
  feeStructure: number;
  caseFit: number;
  responseRate: number;
  compatibility: number;
}

interface MatchingRule {
  name: string;
  condition: string;
  action: string;
  value?: number;
  priority: string;
}

interface MatchingFilter {
  type: string;
  field: string;
  value: any;
}

interface MatchingBooster {
  condition: string;
  boost: number;
}

interface MatchingPenalty {
  condition: string;
  penalty: number;
}

interface MatchingThreshold {
  minimumScore: number;
  highlyRecommended: number;
  recommended: number;
  consider: number;
}

interface ComplianceInfo {
  barStatus: string;
  insurance: InsuranceInfo;
  continuingEducation: ContinuingEducation;
  disciplinaryHistory: DisciplinaryRecord[];
}

interface ContinuingEducation {
  current: boolean;
  hours: number;
}

interface PerformanceMetrics {
  casesHandled: number;
  successRate: number;
  averageSettlement: number;
  clientSatisfaction: number;
  referralRate: number;
  responseTime: string;
}

interface InsuranceInfo {
  professional: boolean;
  amount: number;
  carrier: string;
  claims: any[];
  expiration: string;
}

interface NetworkData {
  referralNetworks: any[];
  barAssociations: any[];
  practiceGroups: any[];
  industryConnections: any[];
}

interface TimeSlot {
  date: string;
  time: string;
  duration: string;
}

interface ComplianceInfo {
  barStatus: string;
  insurance: InsuranceInfo;
  continuingEducation: ContinuingEducation;
  disciplinaryHistory: DisciplinaryRecord[];
}