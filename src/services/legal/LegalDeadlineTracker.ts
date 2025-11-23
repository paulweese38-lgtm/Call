/**
 * CallWall Legal Deadline Tracker
 * Comprehensive deadline management system for legal cases and regulatory compliance
 */

import { LegalCase, EvidenceItem, CaseEvent } from './AILegalAssistant';
import { CallRecording } from '../call/EnhancedCallRecordingEngine';

export interface LegalDeadline {
  id: string;
  caseId: string;
  title: string;
  description: string;
  type: DeadlineType;
  category: DeadlineCategory;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  status: 'pending' | 'approaching' | 'overdue' | 'completed' | 'extended' | 'cancelled';
  importance: 'routine' | 'important' | 'urgent' | 'critical';
  completedDate?: string;
  reminderSent: boolean;
  reminderSchedule: ReminderSchedule[];
  extensions: DeadlineExtension[];
  dependencies: string[]; // Other deadline IDs
  consequences: DeadlineConsequence[];
  requiredActions: ActionRequirement[];
  associatedDocuments: string[];
  estimatedDuration: string; // Time to complete
  costEstimate?: number;
  responsibleParty: 'user' | 'attorney' | 'collector' | 'court';
  jurisdiction: string;
  legalBasis: string;
  automated: boolean;
  recurring?: RecurringPattern;
  notes?: string;
  tags: string[];
}

export type DeadlineType =
  | 'statute_of_limitations'
  | 'response_deadline'
  | 'filing_deadline'
  | 'discovery_deadline'
  | 'motion_deadline'
  | 'court_date'
  | 'settlement_deadline'
  | 'appeal_deadline'
  | 'document_filing'
  | 'evidence_submission'
  | 'payment_deadline'
  | 'custom';

export type DeadlineCategory =
  | 'regulatory'
  | 'court_procedure'
  | 'evidence'
  | 'communication'
  | 'financial'
  | 'administrative'
  | 'settlement'
  | 'appeal';

export interface ReminderSchedule {
  id: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  timing: string; // e.g., '7 days before', '24 hours before', 'day of'
  sent: boolean;
  sentDate?: string;
  message?: string;
  customMessage?: string;
}

export interface DeadlineExtension {
  id: string;
  requestedDate: string;
  grantedDate?: string;
  newDueDate: string;
  reason: string;
  requestedBy: 'user' | 'attorney' | 'court';
  approvedBy?: string;
  status: 'pending' | 'granted' | 'denied';
  supportingDocuments?: string[];
  fee?: number;
}

export interface DeadlineConsequence {
  type: 'case_dismissal' | 'default_judgment' | 'statute_barred' | 'evidence_exclusion' | 'monetary_penalty' | 'court_sanctions' | 'loss_of_rights';
  severity: 'minor' | 'major' | 'severe' | 'critical';
  description: string;
  probability: number; // 0-100
  mitigation?: string;
}

export interface ActionRequirement {
  id: string;
  action: string;
  description: string;
  order: number;
  required: boolean;
  estimatedTime: string;
  cost?: number;
  resources: string[];
  completed: boolean;
  completedDate?: string;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  interval: number;
  endDate?: string;
  occurrences?: number;
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number;
}

export interface DeadlineTemplate {
  id: string;
  name: string;
  description: string;
  type: DeadlineType;
  category: DeadlineCategory;
  triggerConditions: TriggerCondition[];
  calculationRules: CalculationRule[];
  reminderDefaults: Omit<ReminderSchedule, 'id' | 'sent' | 'sentDate'>[];
  defaultConsequences: Omit<DeadlineConsequence, 'probability'>[];
  jurisdiction?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: string;
  costEstimate?: number;
}

export interface TriggerCondition {
  eventType: 'violation_detected' | 'document_sent' | 'call_recorded' | 'case_created' | 'custom';
  parameters: Record<string, any>;
  delayDays?: number;
  dateCalculation?: DateCalculation;
}

export interface DateCalculation {
  baseDate: 'violation_date' | 'document_date' | 'court_filing' | 'custom';
  offsetDays: number;
  businessDaysOnly: boolean;
  extendToBusinessDay: boolean;
}

export interface CalculationRule {
  rule: string;
  description: string;
  formula?: string;
  conditions?: Record<string, any>;
}

export interface DeadlineAnalysis {
  totalDeadlines: number;
  criticalDeadlines: number;
  upcomingDeadlines: Deadline[];
  overdueDeadlines: Deadline[];
  approachingDeadlines: Deadline[]; // Next 30 days
  deadlineTrends: DeadlineTrend[];
  riskAssessment: DeadlineRiskAssessment;
  completionRate: number;
  averageResponseTime: number;
  extensionRate: number;
}

export interface DeadlineTrend {
  period: string;
  completed: number;
  missed: number;
  extended: number;
  averageDaysLate: number;
}

export interface DeadlineRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  highRiskDeadlines: string[];
  riskFactors: RiskFactor[];
  recommendations: string[];
  immediateActions: string[];
}

export interface RiskFactor {
  deadlineId: string;
  factor: string;
  impact: 'low' | 'medium' | 'high';
  probability: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface DeadlineCalendar {
  year: number;
  month: number;
  deadlines: CalendarDeadline[];
  courtHolidays: Holiday[];
  businessDaysOnly: boolean;
}

export interface CalendarDeadline {
  id: string;
  title: string;
  date: number;
  type: DeadlineType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'completed' | 'overdue';
  category: DeadlineCategory;
}

export interface Holiday {
  date: string;
  name: string;
  federal: boolean;
  observed: boolean;
  courtClosed: boolean;
}

export class LegalDeadlineTracker {
  private deadlines: Map<string, LegalDeadline> = new Map();
  private templates: Map<string, DeadlineTemplate> = new Map();
  private jurisdictionRules: Map<string, JurisdictionRules> = new Map();

  constructor() {
    this.initializeTemplates();
    this.initializeJurisdictionRules();
    this.startAutomatedMonitoring();
  }

  private initializeTemplates(): void {
    // Statute of Limitations Templates
    this.templates.set('fdcpa_sol_federal', {
      id: 'fdcpa_sol_federal',
      name: 'FDCPA Statute of Limitations',
      description: 'One year from FDCPA violation date',
      type: 'statute_of_limitations',
      category: 'regulatory',
      triggerConditions: [
        {
          eventType: 'violation_detected',
          parameters: { violation_types: ['harassment', 'misrepresentation', 'threats'] }
        }
      ],
      calculationRules: [
        {
          rule: 'one_year_from_violation',
          description: 'FDCPA claims must be filed within one year of violation',
          formula: 'violation_date + 365 days'
        }
      ],
      reminderDefaults: [
        {
          type: 'push',
          timing: '90 days before',
          message: 'FDCPA statute of limitations approaching - consider legal action'
        },
        {
          type: 'email',
          timing: '30 days before',
          message: 'CRITICAL: FDCPA statute expires in 30 days'
        }
      ],
      defaultConsequences: [
        {
          type: 'case_dismissal',
          severity: 'critical',
          description: 'Case will be dismissed as time-barred'
        }
      ],
      priority: 'critical',
      estimatedDuration: '1 year'
    });

    // Debt Validation Response Template
    this.templates.set('debt_validation_response', {
      id: 'debt_validation_response',
      name: 'Collector Response to Validation Request',
      description: '30 days for collector to respond to debt validation',
      type: 'response_deadline',
      category: 'communication',
      triggerConditions: [
        {
          eventType: 'document_sent',
          parameters: { document_type: 'debt_validation' },
          delayDays: 0
        }
      ],
      calculationRules: [
        {
          rule: 'fdcpa_30_day_response',
          description: 'Collector has 30 days to respond to validation request',
          formula: 'document_date + 30 days'
        }
      ],
      reminderDefaults: [
        {
          type: 'push',
          timing: '15 days before',
          message: 'Debt validation response due in 15 days'
        },
        {
          type: 'email',
          timing: '2 days before',
          message: 'Follow up on debt validation request'
        }
      ],
      defaultConsequences: [
        {
          type: 'evidence_exclusion',
          severity: 'major',
          description: 'Collector must cease collection efforts'
        }
      ],
      priority: 'high',
      estimatedDuration: '30 days'
    });

    // Court Filing Deadlines
    this.templates.set('complaint_filing_deadline', {
      id: 'complaint_filing_deadline',
      name: 'Complaint Filing Deadline',
      description: 'File complaint with court before SOL expires',
      type: 'filing_deadline',
      category: 'court_procedure',
      triggerConditions: [
        {
          eventType: 'custom',
          parameters: { action: 'prepare_litigation' },
          delayDays: 0
        }
      ],
      calculationRules: [
        {
          rule: 'file_before_sol',
          description: 'File complaint before statute of limitations expires',
          formula: 'sol_date - 30 days'
        }
      ],
      reminderDefaults: [
        {
          type: 'email',
          timing: '60 days before',
          message: 'Consider filing complaint soon'
        },
        {
          type: 'push',
          timing: '7 days before',
          message: 'URGENT: File complaint within 7 days'
        }
      ],
      defaultConsequences: [
        {
          type: 'case_dismissal',
          severity: 'critical',
          description: 'Unable to file lawsuit after SOL expires'
        }
      ],
      priority: 'critical',
      estimatedDuration: 'varies',
      costEstimate: 400
    });
  }

  private initializeJurisdictionRules(): void {
    // Federal rules
    this.jurisdictionRules.set('federal', {
      jurisdiction: 'federal',
      businessDaysOnly: false,
      courtHolidays: this.getFederalHolidays(),
      filingRequirements: {
        complaint: 'Electronic filing required',
        response: '21 days to answer complaint',
        discovery: 'Initial disclosures within 21 days'
      },
      extensionRules: {
        standardExtension: '30 days with showing good cause',
        stipulatedExtension: 'By agreement of parties',
        courtExtension: 'Court discretion'
      }
    });

    // State-specific rules (example: California)
    this.jurisdictionRules.set('California', {
      jurisdiction: 'California',
      businessDaysOnly: true,
      courtHolidays: this.getCaliforniaHolidays(),
      filingRequirements: {
        complaint: 'e-Filing required in most courts',
        response: '30 days to answer complaint',
        discovery: 'Initial disclosures within 30 days'
      },
      extensionRules: {
        standardExtension: '30 days with showing good cause',
        stipulatedExtension: 'By agreement of parties',
        courtExtension: 'Court discretion'
      }
    });
  }

  async generateDeadlinesForCase(legalCase: LegalCase, evidence: EvidenceItem[]): Promise<LegalDeadline[]> {
    try {
      const deadlines: LegalDeadline[] = [];

      // Generate deadlines from templates based on case data
      for (const [templateId, template] of this.templates.entries()) {
        const generatedDeadlines = await this.applyTemplate(template, legalCase, evidence);
        deadlines.push(...generatedDeadlines);
      }

      // Generate case-specific deadlines
      const caseSpecificDeadlines = await this.generateCaseSpecificDeadlines(legalCase, evidence);
      deadlines.push(...caseSpecificDeadlines);

      // Generate violation-based deadlines
      const violationDeadlines = await this.generateViolationDeadlines(legalCase, evidence);
      deadlines.push(...violationDeadlines);

      // Generate evidence submission deadlines
      const evidenceDeadlines = await this.generateEvidenceDeadlines(evidence);
      deadlines.push(...evidenceDeadlines);

      // Save deadlines and return
      deadlines.forEach(deadline => {
        this.deadlines.set(deadline.id, deadline);
      });

      return deadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    } catch (error) {
      console.error('Failed to generate deadlines for case:', error);
      throw new Error(`Deadline generation failed: ${error}`);
    }
  }

  private async applyTemplate(template: DeadlineTemplate, legalCase: LegalCase, evidence: EvidenceItem[]): Promise<LegalDeadline[]> {
    const deadlines: LegalDeadline[] = [];

    for (const condition of template.triggerConditions) {
      if (await this.evaluateTriggerCondition(condition, legalCase, evidence)) {
        const deadline = await this.createDeadlineFromTemplate(template, condition, legalCase);
        if (deadline) {
          deadlines.push(deadline);
        }
      }
    }

    return deadlines;
  }

  private async evaluateTriggerCondition(condition: TriggerCondition, legalCase: LegalCase, evidence: EvidenceItem[]): Promise<boolean> {
    switch (condition.eventType) {
      case 'violation_detected':
        return legalCase.violations.length > 0;
      case 'document_sent':
        return legalCase.evidence.some(e => e.type === 'document');
      case 'call_recorded':
        return evidence.some(e => e.type === 'call_recording');
      case 'case_created':
        return true; // Always triggered when case is created
      default:
        return false;
    }
  }

  private async createDeadlineFromTemplate(template: DeadlineTemplate, condition: TriggerCondition, legalCase: LegalCase): Promise<LegalDeadline | null> {
    let baseDate = new Date();

    if (condition.eventType === 'violation_detected' && legalCase.violations.length > 0) {
      const firstViolation = legalCase.violations[0];
      // In real implementation, extract violation date from violation data
      baseDate = new Date(legalCase.createdAt);
    }

    const dueDate = this.calculateDueDate(baseDate, condition.delayDays || 0, template);

    return {
      id: `deadline_${template.id}_${legalCase.id}_${Date.now()}`,
      caseId: legalCase.id,
      title: template.name,
      description: template.description,
      type: template.type,
      category: template.category,
      priority: template.priority,
      dueDate: dueDate.toISOString(),
      status: 'pending',
      importance: template.priority === 'critical' ? 'critical' : 'important',
      reminderSent: false,
      reminderSchedule: template.reminderDefaults.map((r, index) => ({
        id: `rem_${index}`,
        ...r,
        sent: false
      })),
      extensions: [],
      dependencies: [],
      consequences: template.defaultConsequences.map(c => ({
        ...c,
        probability: this.calculateConsequenceProbability(c.severity)
      })),
      requiredActions: this.generateRequiredActions(template),
      associatedDocuments: [],
      estimatedDuration: template.estimatedDuration,
      costEstimate: template.costEstimate,
      responsibleParty: template.type === 'response_deadline' ? 'collector' : 'user',
      jurisdiction: template.jurisdiction || legalCase.jurisdiction,
      legalBasis: this.getLegalBasisForTemplate(template),
      automated: true,
      tags: [template.type, template.category]
    };
  }

  private calculateDueDate(baseDate: Date, delayDays: number, template: DeadlineTemplate): Date {
    const jurisdiction = template.jurisdiction || 'federal';
    const rules = this.jurisdictionRules.get(jurisdiction);
    const businessDaysOnly = rules?.businessDaysOnly || false;

    let dueDate = new Date(baseDate);
    dueDate.setDate(dueDate.getDate() + delayDays);

    // Apply template-specific calculation rules
    if (template.id === 'debt_validation_response') {
      dueDate.setDate(dueDate.getDate() + 30); // 30 days for FDCPA validation
    } else if (template.id === 'fdcpa_sol_federal') {
      dueDate.setFullYear(dueDate.getFullYear() + 1); // 1 year for FDCPA SOL
    }

    // Adjust for business days if required
    if (businessDaysOnly) {
      dueDate = this.adjustForBusinessDays(dueDate);
    }

    return dueDate;
  }

  private adjustForBusinessDays(date: Date): Date {
    // Ensure deadline falls on a business day
    while (date.getDay() === 0 || date.getDay() === 6) { // Sunday = 0, Saturday = 6
      date.setDate(date.getDate() + 1);
    }
    return date;
  }

  private calculateConsequenceProbability(severity: string): number {
    const probabilityMap = {
      'minor': 25,
      'major': 50,
      'severe': 75,
      'critical': 90
    };
    return probabilityMap[severity as keyof typeof probabilityMap] || 50;
  }

  private generateRequiredActions(template: DeadlineTemplate): ActionRequirement[] {
    const actions: ActionRequirement[] = [];

    if (template.type === 'filing_deadline') {
      actions.push({
        id: 'file_complaint',
        action: 'File Legal Complaint',
        description: 'Prepare and file complaint with appropriate court',
        order: 1,
        required: true,
        estimatedTime: '4-6 hours',
        cost: 400,
        resources: ['Attorney', 'Court forms', 'Filing fees'],
        completed: false
      });
    } else if (template.type === 'document_filing') {
      actions.push({
        id: 'prepare_document',
        action: 'Prepare Legal Document',
        description: 'Draft and review the required document',
        order: 1,
        required: true,
        estimatedTime: '2-3 hours',
        resources: ['Document template', 'Case information'],
        completed: false
      });
    }

    return actions;
  }

  private getLegalBasisForTemplate(template: DeadlineTemplate): string {
    const legalBasis = {
      'fdcpa_sol_federal': '15 U.S.C. § 1692k - One year statute of limitations',
      'debt_validation_response': '15 U.S.C. § 1692g(a) - 30 day validation period',
      'complaint_filing_deadline': 'State and Federal Rules of Civil Procedure'
    };
    return legalBasis[template.id as keyof typeof legalBasis] || 'Applicable consumer protection laws';
  }

  private async generateCaseSpecificDeadlines(legalCase: LegalCase, evidence: EvidenceItem[]): Promise<LegalDeadline[]> {
    const deadlines: LegalDeadline[] = [];

    // Document follow-up deadlines
    const documentEvidence = evidence.filter(e => e.type === 'document');
    documentEvidence.forEach(doc => {
      const followupDeadline: LegalDeadline = {
        id: `followup_${doc.id}`,
        caseId: legalCase.id,
        title: `Follow up on ${doc.description}`,
        description: `Follow up on sent document: ${doc.description}`,
        type: 'response_deadline',
        category: 'communication',
        priority: 'medium',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        importance: 'routine',
        reminderSent: false,
        reminderSchedule: [
          {
            id: 'followup_reminder',
            type: 'push',
            timing: '2 days before',
            sent: false,
            message: 'Follow up on document sent'
          }
        ],
        extensions: [],
        dependencies: [],
        consequences: [],
        requiredActions: [
          {
            id: 'contact_collector',
            action: 'Contact Collector',
            description: 'Follow up on document response',
            order: 1,
            required: true,
            estimatedTime: '15 minutes',
            completed: false
          }
        ],
        associatedDocuments: [doc.id],
        estimatedDuration: '15 minutes',
        responsibleParty: 'user',
        jurisdiction: legalCase.jurisdiction,
        legalBasis: 'Good faith communication',
        automated: true,
        tags: ['followup', 'communication']
      };
      deadlines.push(followupDeadline);
    });

    return deadlines;
  }

  private async generateViolationDeadlines(legalCase: LegalCase, evidence: EvidenceItem[]): Promise<LegalDeadline[]> {
    const deadlines: LegalDeadline[] = [];

    // Deadlines based on violation severity
    const severeViolations = legalCase.violations.filter(v => v.severity === 'severe');
    if (severeViolations.length > 0) {
      const attorneyConsultationDeadline: LegalDeadline = {
        id: `attorney_consult_${legalCase.id}`,
        caseId: legalCase.id,
        title: 'Attorney Consultation for Severe Violations',
        description: 'Consult with attorney due to severe FDCPA violations',
        type: 'custom',
        category: 'administrative',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        importance: 'urgent',
        reminderSent: false,
        reminderSchedule: [
          {
            id: 'attorney_reminder',
            type: 'email',
            timing: '2 days before',
            sent: false,
            message: 'Schedule attorney consultation for severe violations'
          }
        ],
        extensions: [],
        dependencies: [],
        consequences: [
          {
            type: 'loss_of_rights',
            severity: 'major',
            description: 'Missing professional legal guidance may reduce case value',
            probability: 60
          }
        ],
        requiredActions: [
          {
            id: 'research_attorneys',
            action: 'Research Attorneys',
            description: 'Find and contact consumer protection attorneys',
            order: 1,
            required: true,
            estimatedTime: '2-3 hours',
            completed: false
          }
        ],
        associatedDocuments: [],
        estimatedDuration: '1-2 hours',
        costEstimate: 250,
        responsibleParty: 'user',
        jurisdiction: legalCase.jurisdiction,
        legalBasis: 'Professional legal representation recommendation',
        automated: true,
        tags: ['attorney', 'consultation', 'severe_violations']
      };
      deadlines.push(attorneyConsultationDeadline);
    }

    return deadlines;
  }

  private async generateEvidenceDeadlines(evidence: EvidenceItem[]): Promise<LegalDeadline[]> {
    const deadlines: LegalDeadline[] = [];

    // Call recording preservation deadlines
    const callRecordings = evidence.filter(e => e.type === 'call_recording');
    callRecordings.forEach(call => {
      const preservationDeadline: LegalDeadline = {
        id: `preserve_${call.id}`,
        caseId: '', // Will be set when assigned to case
        title: 'Preserve Call Recording',
        description: `Preserve and backup call recording from ${new Date(call.timestamp).toLocaleDateString()}`,
        type: 'evidence_submission',
        category: 'evidence',
        priority: 'high',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        importance: 'important',
        reminderSent: false,
        reminderSchedule: [
          {
            id: 'preserve_reminder',
            type: 'push',
            timing: '7 days before',
            sent: false,
            message: 'Backup call recording evidence'
          }
        ],
        extensions: [],
        dependencies: [],
        consequences: [
          {
            type: 'evidence_exclusion',
            severity: 'major',
            description: 'Lost recordings may be excluded as evidence',
            probability: 40
          }
        ],
        requiredActions: [
          {
            id: 'backup_recording',
            action: 'Backup Recording',
            description: 'Create secure backup of call recording',
            order: 1,
            required: true,
            estimatedTime: '15 minutes',
            completed: false
          }
        ],
        associatedDocuments: [call.id],
        estimatedDuration: '15 minutes',
        responsibleParty: 'user',
        jurisdiction: 'federal',
        legalBasis: 'Evidence preservation requirements',
        automated: true,
        tags: ['evidence', 'preservation', 'call_recording']
      };
      deadlines.push(preservationDeadline);
    });

    return deadlines;
  }

  async getDeadlinesForCase(caseId: string): Promise<LegalDeadline[]> {
    return Array.from(this.deadlines.values()).filter(deadline => deadline.caseId === caseId);
  }

  async getUpcomingDeadlines(days: number = 30): Promise<LegalDeadline[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return Array.from(this.deadlines.values()).filter(deadline => {
      const dueDate = new Date(deadline.dueDate);
      return dueDate >= now && dueDate <= futureDate && deadline.status === 'pending';
    });
  }

  async getOverdueDeadlines(): Promise<LegalDeadline[]> {
    const now = new Date();
    return Array.from(this.deadlines.values()).filter(deadline => {
      const dueDate = new Date(deadline.dueDate);
      return dueDate < now && deadline.status !== 'completed' && deadline.status !== 'cancelled';
    });
  }

  async updateDeadlineStatus(deadlineId: string, status: LegalDeadline['status'], completedDate?: string): Promise<void> {
    const deadline = this.deadlines.get(deadlineId);
    if (!deadline) {
      throw new Error('Deadline not found');
    }

    deadline.status = status;
    if (status === 'completed') {
      deadline.completedDate = completedDate || new Date().toISOString();
    }
  }

  async requestDeadlineExtension(deadlineId: string, reason: string, newDueDate: string): Promise<DeadlineExtension> {
    const deadline = this.deadlines.get(deadlineId);
    if (!deadline) {
      throw new Error('Deadline not found');
    }

    const extension: DeadlineExtension = {
      id: `ext_${deadlineId}_${Date.now()}`,
      requestedDate: new Date().toISOString(),
      newDueDate,
      reason,
      requestedBy: 'user',
      status: 'pending'
    };

    deadline.extensions.push(extension);

    // Update deadline status
    deadline.status = 'extended';

    return extension;
  }

  async generateDeadlineAnalysis(caseId?: string): Promise<DeadlineAnalysis> {
    const allDeadlines = caseId
      ? Array.from(this.deadlines.values()).filter(d => d.caseId === caseId)
      : Array.from(this.deadlines.values());

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const totalDeadlines = allDeadlines.length;
    const criticalDeadlines = allDeadlines.filter(d => d.priority === 'critical').length;
    const overdueDeadlines = allDeadlines.filter(d => new Date(d.dueDate) < now && d.status === 'pending');
    const upcomingDeadlines = allDeadlines.filter(d => {
      const dueDate = new Date(d.dueDate);
      return dueDate >= now && dueDate <= thirtyDaysFromNow && d.status === 'pending';
    });

    const completedDeadlines = allDeadlines.filter(d => d.status === 'completed');
    const completionRate = totalDeadlines > 0 ? (completedDeadlines.length / totalDeadlines) * 100 : 0;

    const deadlineTrends = this.calculateDeadlineTrends(allDeadlines);
    const riskAssessment = await this.assessDeadlineRisks(allDeadlines);

    return {
      totalDeadlines,
      criticalDeadlines,
      upcomingDeadlines,
      overdueDeadlines,
      approachingDeadlines: upcomingDeadlines,
      deadlineTrends,
      riskAssessment,
      completionRate,
      averageResponseTime: this.calculateAverageResponseTime(allDeadlines),
      extensionRate: this.calculateExtensionRate(allDeadlines)
    };
  }

  async generateCalendar(year: number, month: number, caseId?: string): Promise<DeadlineCalendar> {
    const allDeadlines = caseId
      ? Array.from(this.deadlines.values()).filter(d => d.caseId === caseId)
      : Array.from(this.deadlines.values());

    // Filter deadlines for the specified month/year
    const calendarDeadlines: CalendarDeadline[] = allDeadlines
      .filter(deadline => {
        const dueDate = new Date(deadline.dueDate);
        return dueDate.getFullYear() === year && dueDate.getMonth() === month - 1;
      })
      .map(deadline => ({
        id: deadline.id,
        title: deadline.title,
        date: new Date(deadline.dueDate).getDate(),
        type: deadline.type,
        priority: deadline.priority,
        status: deadline.status,
        category: deadline.category
      }));

    const jurisdiction = 'federal'; // Default, could be parameterized
    const courtHolidays = this.getCourtHolidays(year, month, jurisdiction);

    return {
      year,
      month,
      deadlines: calendarDeadlines,
      courtHolidays,
      businessDaysOnly: this.jurisdictionRules.get(jurisdiction)?.businessDaysOnly || false
    };
  }

  private calculateDeadlineTrends(deadlines: LegalDeadline[]): DeadlineTrend[] {
    // Mock implementation - would calculate actual trends over time periods
    return [
      {
        period: 'Last 30 Days',
        completed: 5,
        missed: 1,
        extended: 2,
        averageDaysLate: 3.5
      },
      {
        period: 'Last 90 Days',
        completed: 15,
        missed: 3,
        extended: 6,
        averageDaysLate: 4.2
      }
    ];
  }

  private async assessDeadlineRisks(deadlines: LegalDeadline[]): Promise<DeadlineRiskAssessment> {
    const now = new Date();
    const highRiskDeadlines: string[] = [];
    const riskFactors: RiskFactor[] = [];

    deadlines.forEach(deadline => {
      const daysUntilDue = Math.ceil((new Date(deadline.dueDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      if (daysUntilDue < 0 && deadline.status === 'pending') {
        highRiskDeadlines.push(deadline.id);
        riskFactors.push({
          deadlineId: deadline.id,
          factor: 'Overdue deadline',
          impact: 'high',
          probability: 'high',
          mitigation: 'Immediate action required or request extension'
        });
      } else if (daysUntilDue < 7 && deadline.priority === 'critical') {
        highRiskDeadlines.push(deadline.id);
        riskFactors.push({
          deadlineId: deadline.id,
          factor: 'Critical deadline approaching',
          impact: 'high',
          probability: 'medium',
          mitigation: 'Priority attention needed'
        });
      }
    });

    const overallRisk = riskFactors.length > 3 ? 'critical' :
                       riskFactors.length > 1 ? 'high' :
                       riskFactors.length > 0 ? 'medium' : 'low';

    return {
      overallRisk,
      highRiskDeadlines,
      riskFactors,
      recommendations: this.generateRiskRecommendations(riskFactors),
      immediateActions: this.generateImmediateActions(riskFactors)
    };
  }

  private generateRiskRecommendations(riskFactors: RiskFactor[]): string[] {
    const recommendations: string[] = [];

    if (riskFactors.some(f => f.factor.includes('Overdue'))) {
      recommendations.push('Address all overdue deadlines immediately');
      recommendations.push('Consider requesting extensions for overdue items');
    }

    if (riskFactors.some(f => f.factor.includes('Critical'))) {
      recommendations.push('Prioritize critical deadlines above all other tasks');
      recommendations.push('Set additional reminders for approaching critical deadlines');
    }

    if (riskFactors.length > 3) {
      recommendations.push('Consider consulting attorney for deadline management');
      recommendations.push('Review and potentially reduce deadline commitments');
    }

    return recommendations;
  }

  private generateImmediateActions(riskFactors: RiskFactor[]): string[] {
    const actions: string[] = [];

    riskFactors.forEach(factor => {
      if (factor.factor.includes('Overdue')) {
        actions.push(`Complete or extend deadline ${factor.deadlineId} immediately`);
      }
    });

    if (actions.length === 0) {
      actions.push('Continue monitoring deadline progress');
    }

    return actions;
  }

  private calculateAverageResponseTime(deadlines: LegalDeadline[]): number {
    const completedDeadlines = deadlines.filter(d => d.completedDate);
    if (completedDeadlines.length === 0) return 0;

    const totalDays = completedDeadlines.reduce((sum, deadline) => {
      const created = new Date(deadline.dueDate).getTime();
      const completed = new Date(deadline.completedDate!).getTime();
      return sum + (completed - created) / (24 * 60 * 60 * 1000);
    }, 0);

    return Math.round(totalDays / completedDeadlines.length);
  }

  private calculateExtensionRate(deadlines: LegalDeadline[]): number {
    if (deadlines.length === 0) return 0;

    const deadlinesWithExtensions = deadlines.filter(d => d.extensions.length > 0).length;
    return Math.round((deadlinesWithExtensions / deadlines.length) * 100);
  }

  private getCourtHolidays(year: number, month: number, jurisdiction: string): Holiday[] {
    // Mock implementation - would return actual court holidays
    return [
      {
        date: `${year}-07-04`,
        name: 'Independence Day',
        federal: true,
        observed: true,
        courtClosed: true
      }
    ];
  }

  private startAutomatedMonitoring(): void {
    // Start background process to monitor deadlines and send reminders
    setInterval(() => {
      this.checkAndSendReminders();
    }, 60 * 60 * 1000); // Check every hour
  }

  private async checkAndSendReminders(): Promise<void> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    for (const deadline of this.deadlines.values()) {
      if (deadline.status !== 'pending') continue;

      for (const reminder of deadline.reminderSchedule) {
        if (reminder.sent) continue;

        // Check if it's time to send this reminder
        const reminderDate = this.calculateReminderDate(deadline.dueDate, reminder.timing);
        if (reminderDate <= now) {
          await this.sendReminder(deadline, reminder);
          reminder.sent = true;
          reminder.sentDate = now.toISOString();
        }
      }
    }
  }

  private calculateReminderDate(dueDate: string, timing: string): Date {
    const due = new Date(dueDate);

    if (timing.includes('days before')) {
      const days = parseInt(timing.split(' ')[0]);
      return new Date(due.getTime() - days * 24 * 60 * 60 * 1000);
    }

    if (timing.includes('hours before')) {
      const hours = parseInt(timing.split(' ')[0]);
      return new Date(due.getTime() - hours * 60 * 60 * 1000);
    }

    if (timing === 'day of') {
      return due;
    }

    return new Date(due.getTime() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days before
  }

  private async sendReminder(deadline: LegalDeadline, reminder: ReminderSchedule): Promise<void> {
    // Mock implementation - would actually send notifications
    console.log(`Sending ${reminder.type} reminder for deadline: ${deadline.title}`);
    console.log(`Message: ${reminder.customMessage || reminder.message}`);
  }

  // Helper methods for jurisdiction rules
  private getFederalHolidays(): Holiday[] {
    return [
      {
        date: '2024-01-01',
        name: 'New Year\'s Day',
        federal: true,
        observed: true,
        courtClosed: true
      },
      {
        date: '2024-07-04',
        name: 'Independence Day',
        federal: true,
        observed: true,
        courtClosed: true
      },
      {
        date: '2024-12-25',
        name: 'Christmas Day',
        federal: true,
        observed: true,
        courtClosed: true
      }
    ];
  }

  private getCaliforniaHolidays(): Holiday[] {
    // Include federal holidays plus California-specific holidays
    return [
      ...this.getFederalHolidays(),
      {
        date: '2024-03-31',
        name: 'Cesar Chavez Day',
        federal: false,
        observed: true,
        courtClosed: true
      }
    ];
  }
}

// Supporting interfaces
interface JurisdictionRules {
  jurisdiction: string;
  businessDaysOnly: boolean;
  courtHolidays: Holiday[];
  filingRequirements: Record<string, string>;
  extensionRules: Record<string, string>;
}