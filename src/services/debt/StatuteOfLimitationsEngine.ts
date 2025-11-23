/**
 * CallWall Statute of Limitations Engine
 * Advanced state-by-state SOL analysis and calculation system
 */

export interface DebtInfo {
  id: string;
  originalCreditor: string;
  currentAmount: number;
  originalAmount?: number;
  accountNumber?: string;
  contractDate?: string;
  lastPaymentDate?: string;
  defaultDate?: string;
  chargeOffDate?: string;
  debtType: 'written_contract' | 'oral_contract' | 'promissory_note' | 'open_account' | 'credit_card' | 'medical_debt' | 'auto_loan' | 'mortgage' | 'student_loan' | 'tax_debt' | 'other';
  state: string;
  jurisdiction: string;
  hasJudgment?: boolean;
  judgmentDate?: string;
  lastAcknowledgment?: string;
  payments: PaymentRecord[];
}

export interface PaymentRecord {
  amount: number;
  date: string;
  method: string;
  reference?: string;
  appliedTo: string[];
}

export interface StatuteOfLimitationsResult {
  debtId: string;
  state: string;
  debtType: string;
  statuteYears: number;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  status: 'valid' | 'expired' | 'unknown';
  lastActivityDate?: string;
  tollingEvents: TollingEvent[];
  specialRules: SpecialRule[];
  canRestart: boolean;
  restartMethod?: string;
  recommendations: string[];
  legalBasis: string[];
  confidence: number;
}

export interface TollingEvent {
  type: 'payment' | 'acknowledgment' | 'partial_payment' | 'installment_agreement' | 'judgment' | 'charge_off';
  date: string;
  amount?: number;
  description: string;
  impact: 'restarts_sol' | 'extends_sol' | 'no_impact';
  legalReference: string;
}

export interface SpecialRule {
  type: string;
  description: string;
  effect: string;
  conditions: string[];
  legalReference: string;
}

export interface StateSOLConfig {
  state: string;
  abbreviation: string;
  statuteOfLimitations: {
    [debtType: string]: SOLRule;
  };
  tollingRules: TollingRule[];
  specialRules: SpecialRule[];
  usuryLimits: {
    [loanType: string]: number;
  };
  additionalProtections: string[];
  legalCitation: string;
}

export interface SOLRule {
  years: number;
  startingPoint: 'contract_date' | 'last_payment' | 'last_activity' | 'default_date' | 'charge_off_date';
  tollingEvents: string[];
  exceptions: string[];
  specialRules: string[];
  calculationMethod: 'calendar' | 'court_ordinance' | 'civil_code';
}

export interface TollingRule {
  type: string;
  description: string;
  resetsSOL: boolean;
  extendsSOL: boolean;
  legalReference: string;
}

export interface SOLAnalysisReport {
  totalDebts: number;
  expiredDebts: number;
  expiringDebts: number;
  debtsByType: { [type: string]: number };
  debtsByState: { [state: string]: number };
  averageTimeToExpiry: number;
  restartOpportunities: SOLRestartOpportunity[];
  riskyDebts: RiskyDebt[];
}

export interface SOLRestartOpportunity {
  debtId: string;
  currentStatus: string;
  recommendedAction: string;
  timeWindow: string;
  potentialBenefit: string;
  confidence: number;
}

export interface RiskyDebt {
  debtId: string;
  creditor: string;
  amount: number;
  riskType: 'expired_sue' | 'missed_opportunity' | 'unclear_status';
  description: string;
  timeframe: string;
  recommendation: string;
}

export interface SOLCalculationEngine {
  calculateSOL(debt: DebtInfo): StatuteOfLimitationsResult;
  analyzeTollingEvents(events: TollingEvent[], rule: SOLRule): TollingEvent[];
  applySpecialRules(analysis: StatuteOfLimitationsResult, rules: SpecialRule[]): StatuteOfLimitationsResult;
  generateReport(debts: DebtInfo[]): SOLAnalysisReport;
}

/**
 * Advanced Statute of Limitations Engine
 */
export class StatuteOfLimitationsEngine {
  private stateConfigs: Map<string, StateSOLConfig> = new Map();
  private calculationEngines: Map<string, SOLCalculationEngine> = new Map();

  constructor() {
    this.initializeStateConfigs();
    this.initializeCalculationEngines();
  }

  /**
   * Calculate statute of limitations for a debt
   */
  async calculateStatuteOfLimitations(debt: DebtInfo): Promise<StatuteOfLimitationsResult> {
    const stateConfig = this.stateConfigs.get(debt.state);
    if (!stateConfig) {
      throw new Error(`No SOL configuration found for state: ${debt.state}`);
    }

    const rule = stateConfig.statuteOfLimitations[debt.debtType];
    if (!rule) {
      throw new Error(`No SOL rule found for debt type: ${debt.debtType} in state: ${debt.state}`);
    }

    const engine = this.calculationEngines.get(debt.jurisdiction || 'general');
    if (!engine) {
      throw new Error(`No calculation engine found for jurisdiction: ${debt.jurisdiction}`);
    }

    // Calculate basic SOL
    let result = engine.calculateSOL(debt);

    // Analyze tolling events
    const tollingAnalysis = engine.analyzeTollingEvents(
      this.reconstructTollingHistory(debt),
      rule
    );
    result.tollingEvents = tollingAnalysis;

    // Apply special rules
    const specialRules = this.applySpecialRules(result, stateConfig.specialRules);
    result.specialRules = specialRules.specialRules;

    // Determine restart possibilities
    result.canRestart = this.canRestartSOL(result, tollingAnalysis, stateConfig.specialRules);
    if (result.canRestart) {
      result.restartMethod = this.getRestartMethod(result, stateConfig.specialRules);
    }

    // Generate recommendations
    result.recommendations = this.generateRecommendations(result, stateConfig);

    return result;
  }

  /**
   * Analyze multiple debts and generate comprehensive report
   */
  async analyzePortfolio(debts: DebtInfo[]): Promise<SOLAnalysisReport> {
    const analyses: StatuteOfLimitationsResult[] = [];

    // Calculate SOL for each debt
    for (const debt of debts) {
      try {
        const analysis = await this.calculateStatuteOfLimitations(debt);
        analyses.push(analysis);
      } catch (error) {
        console.error(`Error calculating SOL for debt ${debt.id}:`, error);
        // Create placeholder analysis for failed calculation
        analyses.push({
          debtId: debt.id,
          state: debt.state,
          debtType: debt.debtType,
          statuteYears: 0,
          startDate: '',
          endDate: '',
          daysRemaining: 0,
          status: 'unknown',
          tollingEvents: [],
          specialRules: [],
          canRestart: false,
          recommendations: ['Unable to calculate SOL'],
          legalBasis: [],
          confidence: 0,
        });
      }
    }

    // Generate comprehensive report
    const report = await this.generateReport(analyses);

    return report;
  }

  /**
   * Identify SOL restart opportunities
   */
  async identifyRestartOpportunities(debts: DebtInfo[]): Promise<SOLRestartOpportunity[]> {
    const opportunities: SOLRestartOpportunity[] = [];

    for (const debt of debts) {
      try {
        const analysis = await this.calculateStatuteOfLimitations(debt);

        if (analysis.status === 'expired' && analysis.canRestart) {
          const opportunity = this.createRestartOpportunity(debt, analysis);
          opportunities.push(opportunity);
        }
      } catch (error) {
        console.error(`Error analyzing restart opportunity for debt ${debt.id}:`, error);
      }
    }

    return opportunities.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Identify risky SOL situations
   */
  async identifyRiskyDebts(debts: DebtInfo[]): Promise<RiskyDebt[]> {
    const riskyDebts: RiskyDebt[] = [];

    for (const debt of debts) {
      try {
        const analysis = await this.calculateStatuteOfLimitations(debt);

        // Check for various risk scenarios
        if (this.isExpiredSueRisk(analysis, debt)) {
          riskyDebts.push({
            debtId: debt.id,
            creditor: debt.originalCreditor,
            amount: debt.currentAmount,
            riskType: 'expired_sue',
            description: 'Statute expired but collector may still sue',
            timeframe: 'Immediately',
            recommendation: 'Send SOL letter and defend against lawsuit',
          });
        }

        if (this.isMissedOpportunityRisk(analysis, debt)) {
          riskyDebts.push({
            debtId: debt.id,
            creditor: debt.originalCreditor,
            amount: debt.currentAmount,
            riskType: 'missed_opportunity',
            description: 'Recent SOL could be challenged if acted upon quickly',
            timeframe: `${analysis.daysRemaining} days`,
            recommendation: 'Assert SOL defense immediately',
          });
        }

        if (this.isUnclearStatusRisk(analysis, debt)) {
          riskyDebts.push({
            debtId: debt.id,
            creditor: debt.originalCreditor,
            amount: debt.currentAmount,
            riskType: 'unclear_status',
            description: 'SOL status unclear due to complex activity history',
            timeframe: 'Immediate investigation needed',
            recommendation: 'Obtain complete payment history and consult attorney',
          });
        }
      } catch (error) {
        console.error(`Error analyzing risk for debt ${debt.id}:`, error);
      }
    }

    return riskyDebts.sort((a, b) => b.amount - a.amount);
  }

  /**
   * Get SOL state for a debt type in a specific state
   */
  getSOLState(debt: DebtInfo): 'valid' | 'expired' | 'unknown' {
    try {
      const analysis = this.calculateStatuteOfLimitations(debt);
      return analysis.status;
    } catch (error) {
      console.error('Error getting SOL state:', error);
      return 'unknown';
    }
  }

  /**
   * Get days remaining on SOL
   */
  getDaysRemaining(debt: DebtInfo): number {
    try {
      const analysis = await this.calculateStatuteLimitations(debt);
      return Math.max(0, analysis.daysRemaining);
    } catch (error) {
      console.error('Error calculating days remaining:', error);
      return 0;
    }
  }

  /**
   * Check if debt is time-barred
   */
  isTimeBarred(debt: DebtInfo): boolean {
    return this.getSOLState(debt) === 'expired';
  }

  /**
   * Initialize state SOL configurations
   */
  private initializeStateConfigs(): void {
    const configs: StateSOLConfig[] = [
      // California
      {
        state: 'California',
        abbreviation: 'CA',
        statuteOfLimitations: {
          'written_contract': { years: 4, startingPoint: 'contract_date', tollingEvents: [], exceptions: [], specialRules: [], calculationMethod: 'civil_code' },
          'oral_contract': { years: 2, startingPoint: 'contract_date', tollingEvents: [], exceptions: [], specialRules: [], calculationMethod: 'civil_code' },
          'promissory_note': { years: 4, startingPoint: 'contract_date', tollingEvents: [], exceptions: [], specialRules: [], calculationMethod: 'civil_code' },
          'open_account': { years: 4, startingPoint: 'contract_date', tollingEvents: [], exceptions: [], specialRules: [], calculationMethod: 'civil_code' },
          'credit_card': { years: 4, startingPoint: 'contract_date', tollingEvents: [], exceptions: [], specialRules: [], calculationMethod: 'civil_code' },
          'medical_debt': { years: 4, startingPoint: 'contract_date', tollingEvents: [], exceptions: [], specialRules: [], calculationMethod: 'civil_code' },
          'auto_loan': { years: 4, startingPoint: 'contract_date', tollingEvents: [], exceptions: [], specialRules: [], calculationMethod: 'civil_code' },
        },
        tollingRules: [
          {
            type: 'payment',
            description: 'Any payment restarts SOL',
            resetsSOL: true,
            extendsSOL: false,
            legalReference: 'CCP § 337(c)'
          },
          {
            type: 'acknowledgment',
            description: 'Written acknowledgment restarts SOL',
            resetsSOL: true,
            extendsSOL: false,
            legalReference: 'CCP § 337(c)'
          },
        ],
        specialRules: [
          {
            type: 'minor_contract_exception',
            duration: 4,
            description: 'Contracts under $2000 have 4-year SOL, else 2 years',
            effect: 'reduces_statute_period',
            conditions: ['contract_value < 2000'],
            legalReference: 'CCP § 337'
          },
          {
            type: 'borrower_defense',
            description: '6-month extension if borrower raises defense',
            effect: 'extends_statute_period',
            conditions: ['defense_filed_in_court'],
            legalReference: 'CCP § 337(b)'
          },
        ],
        usuryLimits: {
          'consumer_loan': 10,
          'credit_card': 0,
          'payday_loan': 460,
        },
        additionalProtections: [
          'No wage garnishment for most debts',
          '10% wage garnishment cap (more protective than federal)',
          'Homestead exemption protection',
          'Double damages for consumer credit reporting violations',
        ],
        legalCitation: 'California Code of Civil Procedure § 337',
      },

      // Texas
      {
        state: 'Texas',
        abbreviation: 'TX',
        statuteOfLimitations: {
          'written_contract': { years: 4, startingPoint: 'last_payment', tollingEvents: ['payment', 'acknowledgment'], exceptions: [], specialRules: [], calculationMethod: 'civil_code' },
          'oral_contract': { years: 4, startingPoint: 'last_payment', tollingEvents: ['payment', 'acknowledgment'], exceptions: [], specialRules: [], calculationMethod: 'civil_code' },
          'promissory_note': { years: 4, startingPoint: 'last_payment', tollingEvents: ['payment', 'acknowledgment'], exceptions: [], specialRules: [], calculationMethod: 'civil_code' },
          'open_account': { years: 4, startingPoint: 'last_payment', tollingEvents: ['payment', 'acknowledgment'], exceptions: [], specialRules: [], calculationMethod: 'civil_code' },
          'credit_card': { years: 4, startingPoint: 'last_payment', tollingEvents: ['payment', 'acknowledgment'], exceptions: [], specialRules: [], calculationMethod: 'civil_code' },
          'medical_debt': { years: 4, startingPoint: 'last_payment', tollingEvents: ['payment', 'acknowledgment'], exceptions: [], specialRules: [], calculationMethod: 'civil_code' },
          'auto_loan': { years: 4, startingPoint: 'last_payment', tollingEvents: ['payment', 'acknowledgment'], exceptions: [], specialRules: [], calculationMethod: 'civil_code' },
          'student_loan': { years: 10, startingPoint: 'last_payment', tollingEvents: ['payment'], exceptions: [], specialRules: [], calculationMethod: 'civil_code' },
        },
        tollingRules: [
          {
            type: 'payment',
            description: 'Any payment restarts SOL',
            resetsSOL: true,
            extendsSOL: false,
            legalReference: 'Tex. Civ. Prac. & Remedies Code § 16.004'
          },
        ],
        specialRules: [
          {
            type: 'no_sue_after_10_years',
            duration: 10,
            description: 'Cannot sue on expired debts',
            effect: 'bars_legal_action',
            conditions: ['sol_expired_10_years'],
            legalReference: 'Tex. Civ. Prac. & Remedies Code § 16.004'
          },
          {
            type: 'homestead_exemption',
            description: 'Unlimited homestead protection',
            effect: 'protects_primary_residence',
            conditions: ['owner_occupied'],
            legalReference: 'Tex. Prop. Code § 41.001'
          },
        ],
        usuryLimits: {
          'consumer_loan': 18,
          'credit_card': 18,
          'payday_loan': 390,
        },
        additionalProtections: [
          'No wage garnishment for consumer debts',
          'Unlimited homestead exemption',
          'Personal property exemption',
          'No statutory minimum wage protection',
        ],
        legalCitation: 'Texas Civil Practice & Remedies Code § 16.004',
      },

      // New York
      {
        state: 'New York',
        abbreviation: 'NY',
        statuteOfLimitations: {
          'written_contract': { years: 6, startingPoint: 'default_date', tollingEvents: ['payment', 'acknowledgment'], exceptions: [], specialRules: [], calculationMethod: 'court_ordinance' },
          'oral_contract': { years: 6, startingPoint: 'default_date', tollingEvents: ['payment', 'acknowledgment'], exceptions: [], specialRules: [], calculationMethod: 'court_ordinance' },
          'promissory_note': { years: 6, startingPoint: 'default_date', tollingEvents: ['payment', 'acknowledgment'], exceptions: [], specialRules: [], calculationMethod: 'court_ordinance' },
          'open_account': { years: 6, startingPoint: 'default_date', tollingEvents: ['payment', 'acknowledgment'], exceptions: [], specialRules: [], calculationMethod: 'court_ordinance' },
          'credit_card': { years: 6, startingPoint: 'default_date', tollingEvents: ['payment', 'acknowledgment'], exceptions: [], specialRules: [], calculationMethod: 'court_ordinance' },
          'medical_debt': { years: 6, startingPoint: 'default_date', tollingEvents: ['payment', 'acknowledgment'], exceptions: [], specialRules: [], calculationMethod: 'court_ordinance' },
          'auto_loan': { years: 6, startingPoint: 'default_date', tollingEvents: ['payment', 'acknowledgment'], exceptions: [], specialRules: [], calculationMethod: 'court_ordinance' },
          'student_loan': { years: 20, startingPoint: 'default_date', tollingEvents: [], exceptions: [], specialRules: [], calculationMethod: 'court_ordinance' },
        },
        tollingRules: [
          {
            type: 'payment',
            description: 'Payment extends SOL by 6 years from payment date',
            resetsSOL: false,
            extendsSOL: true,
            legalReference: 'CPLR 213(8)'
          },
          {
            type: 'acknowledgment',
            description: 'Written acknowledgment extends SOL by 6 years from acknowledgment',
            resetsSOL: false,
            extendsSOL: true,
            legalReference: 'CPLR 213(8)'
          },
        ],
        specialRules: [
          {
            type: 'consumer_credit_fairness_act',
            duration: 6,
            description: 'Extends SOL for 6 months during COVID',
            effect: 'extends_statute_period',
            conditions: ['covid_pandemic_period'],
            legalReference: '2020 COVID-19 Emergency Eviction and Foreclosure Prevention Act'
          },
        ],
        usuryLimits: {
          'consumer_loan': 16,
          'credit_card': 25,
          'payday_loan': 390,
        },
        additionalProtections: [
          'Automatic 6-month SOL extension for all debts',
          'Enhanced penalties for violations',
          'Strong consumer credit reporting rights',
        ],
        legalCitation: 'New York Civil Practice Law and Rules § 213',
      },
    ];

    configs.forEach(config => {
      this.stateConfigs.set(config.state, config);
    });
  }

  // Helper methods (implementations would follow)
  private initializeCalculationEngines(): void {
    // Initialize different calculation engines for different jurisdictions
  }

  private async generateReport(analyses: StatuteOfLimitationsResult[]): Promise<SOLAnalysisReport> {
    const totalDebts = analyses.length;
    const expiredDebts = analyses.filter(a => a.status === 'expired').length;
    const expiringDebts = analyses.filter(a => a.daysRemaining > 0 && a.daysRemaining <= 30).length;

    const debtsByType: { [type: string]: number } = {};
    const debtsByState: { [state: string]: number } = {};

    analyses.forEach(analysis => {
      debtsByType[analysis.debtType] = (debtsByType[analysis.debtType] || 0) + 1;
      debtsByState[analysis.state] = (debtsByState[analysis.state] || 0) + 1;
    });

    const averageTimeToExpiry = analyses
      .filter(a => a.status !== 'expired')
      .reduce((sum, a) => sum + a.daysRemaining, 0) /
      analyses.filter(a => a.status !== 'expired').length;

    return {
      totalDebts,
      expiredDebts,
      expiringDebts,
      debtsByType,
      debtsByState,
      averageTimeToExpiry,
      restartOpportunities: [],
      riskyDebts: [],
    };
  }

  private createRestartOpportunity(debt: DebtInfo, analysis: StatuteOfLimitationsResult): SOLRestartOpportunity {
    return {
      debtId: debt.id,
      currentStatus: 'expired',
      recommendedAction: 'Assert SOL defense in any legal action',
      timeWindow: 'Immediate',
      potentialBenefit 'Complete defense against collection efforts',
      confidence: analysis.confidence,
    };
  }

  private generateRecommendations(analysis: StatuteOfLimitationsResult, config: StateSOLConfig): string[] {
    const recommendations: string[] = [];

    if (analysis.status === 'expired') {
      recommendations.push('Statute of limitations has expired');

      if (analysis.canRestart) {
        recommendations.push(`SOL can be restarted via ${analysis.restartMethod}`);
        recommendations.push('Send written SOL letter to collector');
      } else {
        recommendations.push('Debt is permanently time-barred');
        recommendations.push('Inform collector that further collection attempts are illegal');
        recommendations.push('Document any continued attempts as violations');
      }
    } else if (analysis.status === 'valid') {
      recommendations.push(`${analysis.statuteYears} year SOL period is active`);
      recommendations.push(`SOL expires on ${new Date(analysis.endDate).toLocaleDateString()}`);

      if (analysis.daysRemaining <= 30) {
        recommendations.push('SOL expires soon - prepare defense strategy');
      }
    } else {
      recommendations.push('SOL status requires investigation');
      recommendations.push('Consult attorney for SOL analysis');
    }

    // Add state-specific recommendations
    config.additionalProtections.forEach(protection => {
      recommendations.push(`State protection: ${protection}`);
    });

    return recommendations;
  }

  private canRestartSOL(analysis: StatuteOfLimitationsResult, tollingEvents: TollingEvent[], specialRules: SpecialRule[]): boolean {
    // Check for special rules that allow restart
    const restartRules = specialRules.filter(rule =>
      rule.type.includes('extension') ||
      rule.type.includes('restart') ||
      rule.type.includes('borrower_defense')
    );

    return restartRules.length > 0 ||
           tollingEvents.some(event => event.impact === 'restarts_sol');
  }

  private getRestartMethod(analysis: StatuteLimitationsResult, specialRules: SpecialRule[]): string {
    const extensionRules = specialRules.filter(rule =>
      rule.type.includes('extension') || rule.type.includes('borrower_defense')
    );

    if (extensionRules.length > 0) {
      return 'borrower defense filing';
    }

    return 'no restart method available';
  }

  private reconstructTollingHistory(debt: DebtInfo): TollingEvent[] {
    const events: TollingEvent[] = [];

    // Add payment events
    debt.payments.forEach(payment => {
      events.push({
        type: 'payment',
        date: payment.date,
        amount: payment.amount,
        description: `Payment of $${payment.amount}`,
        impact: 'restarts_sol',
        legalReference: 'State SOL laws',
      });
    });

    // Add acknowledgment events
    if (debt.lastAcknowledgment) {
      events.push({
        type: 'acknowledgment',
        date: debt.lastAcknowledgment,
        description: 'Debt acknowledged in writing',
        impact: 'restarts_sol',
        legalReference: 'FDCPA § 1692g',
      });
    }

    // Add judgment events
    if (debt.hasJudgment && debt.judgmentDate) {
      events.push({
        type: 'judgment',
        date: debt.judgmentDate,
        description: 'Court judgment obtained',
        impact: 'no_impact',
        legalReference: 'State SOL laws',
      });
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private isExpiredSueRisk(analysis: StatuteLimitationsResult, debt: DebtInfo): boolean {
    return analysis.status === 'expired' && debt.currentAmount > 0;
  }

  private isMissedOpportunityRisk(analysis: StatuteLimitationsResult, debt: DebtInfo): boolean {
    return analysis.status === 'expired' &&
           analysis.canRestart &&
           debt.currentAmount > 0 &&
           analysis.daysRemaining < 180; // Within 6 months of opportunity
  }

  private isUnclearStatusRisk(analysis: StatuteLimitationsResult, debt: DebtInfo): boolean {
    return analysis.status === 'unknown' ||
           (analysis.confidence < 70 && debt.currentAmount > 0);
  }
}

// Supporting calculation engine
class CaliforniaSOLEngine implements SOLCalculationEngine {
  async calculateSOL(debt: DebtInfo): Promise<StatuteOfLimitationsResult> {
    // Implementation for California SOL calculation
    return {} as StatuteLimitationsResult;
  }

  async analyzeTollingEvents(events: TollingEvent[], rule: SOLRule): Promise<TollingEvent[]> {
    return events;
  }

  applySpecialRules(analysis: StatuteLimitationsResult, rules: SpecialRule[]): StatuteLimitationsResult {
    return analysis;
  }

  generateReport(debts: DebtInfo[]): Promise<SOLAnalysisReport> {
    return {} as SOLAnalysisReport;
  }
}

class GeneralSOLEngine implements SOLCalculationEngine {
  async calculateSOL(debt: DebtInfo): Promise<StatuteOfLimitationsResult> {
    // Implementation for general SOL calculation
    return {} as StatuteLimitationsResult;
  }

  async analyzeTollingEvents(events: TollingEvent[], rule: SOLRule): Promise<TollingEvent[]> {
    return events;
  }

  applySpecialRules(analysis: StatuteLimitationsResult, rules: SpecialRule[]): StatuteLimitationsResult {
    return analysis;
  }

  generateReport(debts: DebtInfo[]): Promise<SOLAnalysisReport> {
    return {} as SOLAnalysisReport;
  }
}