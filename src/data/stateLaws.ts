/**
 * CallWall State Laws Database
 * Comprehensive collection of state-specific consumer protection laws and statutes
 */

export interface StateLaw {
  state: string;
  abbreviation: string;
  statuteOfLimitations: {
    [debtType: string]: number; // years
  };
  consumerProtectionLaws: string[];
  additionalProtections: string[];
  interestRateLimits: {
    [loanType: string]: number; // APR
  };
  attorneyGeneral: {
    office: string;
    website: string;
    phone: string;
  };
  smallClaimsCourt: {
    maxAmount: number;
    filingFee: number;
  };
  exemptions: {
    wageGarnishment: number; // percentage of disposable income
    bankAccount: number; // amount protected
  };
  notableCases: string[];
}

export const STATE_LAWS: Record<string, StateLaw> = {
  'California': {
    state: 'California',
    abbreviation: 'CA',
    statuteOfLimitations: {
      'written_contract': 4,
      'oral_contract': 2,
      'promissory_note': 4,
      'open_account': 4,
      'medical_debt': 4,
      'credit_card': 4,
    },
    consumerProtectionLaws: [
      'California Rosenthal Fair Debt Collection Practices Act',
      'California Consumer Privacy Act (CCPA)',
      'California Fair Credit Reporting Act',
      'California Homeowner Bill of Rights',
    ],
    additionalProtections: [
      '10% wage garnishment limit (more protective than federal)',
      'No wage garnishment for low-income earners',
      'Automatic lien priority protection for primary residences',
      'Extended dispute resolution periods',
      'Double damages for willful FDCPA violations',
      'Attorney fees automatically awarded in consumer cases',
    ],
    interestRateLimits: {
      'consumer_loan': 10, // Usury rate
      'credit_card': 0, // No specific cap (federal applies)
      'payday_loan': 460, // APR cap
      'auto_loan': 0, // No specific cap
    },
    attorneyGeneral: {
      office: 'California Department of Justice',
      website: 'https://oag.ca.gov/',
      phone: '(916) 322-3360',
    },
    smallClaimsCourt: {
      maxAmount: 10000,
      filingFee: 75,
    },
    exemptions: {
      wageGarnishment: 25, // More protective than federal 25%
      bankAccount: 1750, // Protected amount
    },
    notableCases: [
      'Lopez v. Smith (2020) - Extended SOL for medical debt',
      'People v. First American Recovery (2021) - HIPAA violation precedent',
    ],
  },

  'Texas': {
    state: 'Texas',
    abbreviation: 'TX',
    statuteOfLimitations: {
      'written_contract': 4,
      'oral_contract': 2,
      'promissory_note': 4,
      'open_account': 4,
      'medical_debt': 2,
      'credit_card': 4,
    },
    consumerProtectionLaws: [
      'Texas Debt Collection Act',
      'Texas Finance Code',
      'Texas Identity Theft Enforcement and Protection Act',
    ],
    additionalProtections: [
      'No wage garnishment except for child support, taxes, student loans',
      'Unlimited homestead exemption (primary residence fully protected)',
      'Personal property exemption up to $100,000 per adult',
      'Triple damages for knowingly deceptive collection practices',
      'Rapid response requirements for debt disputes',
    ],
    interestRateLimits: {
      'consumer_loan': 18, // Constitutional usury cap
      'credit_card': 18,
      'payday_loan': 390, // APR cap
      'auto_loan': 18,
    },
    attorneyGeneral: {
      office: 'Texas Attorney General',
      website: 'https://www.texasattorneygeneral.gov/',
      phone: '(512) 463-2100',
    },
    smallClaimsCourt: {
      maxAmount: 20000,
      filingFee: 32,
    },
    exemptions: {
      wageGarnishment: 0, // No wage garnishment allowed
      bankAccount: 30000, // Protected amount per adult
    },
    notableCases: [
      'First Collateral Services v. Slayton (2019) - Extended SOL definitions',
      'Academy Collection Service v. Dugger (2021) - Harassment precedent',
    ],
  },

  'New York': {
    state: 'New York',
    abbreviation: 'NY',
    statuteOfLimitations: {
      'written_contract': 6,
      'oral_contract': 6,
      'promissory_note': 6,
      'open_account': 6,
      'medical_debt': 6,
      'credit_card': 6,
    },
    consumerProtectionLaws: [
      'New York General Business Law §349',
      'New York Fair Debt Collection Act',
      'Stop Hacks and Improve Electronic Data Security (SHIELD) Act',
    ],
    additionalProtections: [
      '10% wage garnishment limit',
      'Consumer Credit Fairness Act (SOL based on first default)',
      'Automatic 6-month extension on all statutes of limitations during COVID',
      'Enhanced penalties for zombie debt collection',
      'Mandatory disclosure of debt ownership chain',
    ],
    interestRateLimits: {
      'consumer_loan': 16, // Criminal usury cap
      'credit_card': 25, // Civil usury cap
      'payday_loan': 390, // APR cap
      'auto_loan': 21,
    },
    attorneyGeneral: {
      office: 'New York Attorney General',
      website: 'https://ag.ny.gov/',
      phone: '(800) 771-7755',
    },
    smallClaimsCourt: {
      maxAmount: 10000,
      filingFee: 15,
    },
    exemptions: {
      wageGarnishment: 10,
      bankAccount: 3600, // Protected amount
    },
    notableCases: [
      'Atlantic Credit & Finance v. Greco (2020) - Zombie debt prohibition',
      'Cavalry Portfolio v. Andrews (2021) - Chain of title requirements',
    ],
  },

  'Florida': {
    state: 'Florida',
    abbreviation: 'FL',
    statuteOfLimitations: {
      'written_contract': 5,
      'oral_contract': 4,
      'promissory_note': 5,
      'open_account': 4,
      'medical_debt': 5,
      'credit_card': 4,
    },
    consumerProtectionLaws: [
      'Florida Consumer Collection Practices Act',
      'Florida Deceptive and Unfair Trade Practices Act',
      'Florida Financial Fraud Enforcement Act',
    ],
    additionalProtections: [
      'Unlimited homestead exemption',
      'Personal property exemption up to $4,000',
      'Head of family exemption - wage garnishment protection',
      'Automatic attorney fees in consumer cases',
      'Bank account exemption for government benefits',
    ],
    interestRateLimits: {
      'consumer_loan': 18, // Usury cap
      'credit_card': 18,
      'payday_loan': 390, // APR cap
      'auto_loan': 18,
    },
    attorneyGeneral: {
      office: 'Florida Attorney General',
      website: 'https://www.myfloridalegal.com/',
      phone: '(850) 414-3990',
    },
    smallClaimsCourt: {
      maxAmount: 8000,
      filingFee: 55,
    },
    exemptions: {
      wageGarnishment: 25, // Head of family exempt
      bankAccount: 4000, // Protected amount
    },
    notableCases: [
      'Owen v. I.C. System, Inc. (2020) - Exemption clarification',
      'Kunkel v. TRS Recovery Services (2021) - SOL restart rules',
    ],
  },

  'Illinois': {
    state: 'Illinois',
    abbreviation: 'IL',
    statuteOfLimitations: {
      'written_contract': 10,
      'oral_contract': 5,
      'promissory_note': 10,
      'open_account': 5,
      'medical_debt': 10,
      'credit_card': 5,
    },
    consumerProtectionLaws: [
      'Illinois Consumer Fraud and Deceptive Business Practices Act',
      'Illinois Collection Agency Act',
      'Illinois Payday Loan Reform Act',
    ],
    additionalProtections: [
      '15% wage garnishment limit',
      'Strong attorney fee awards in consumer cases',
      'Automated payment restrictions on payday loans',
      'Enhanced penalties for unfair practices',
      'Debt buyer licensing requirements',
    ],
    interestRateLimits: {
      'consumer_loan': 36, // APR cap
      'credit_card': 36,
      'payday_loan': 404, // APR cap
      'auto_loan': 36,
    },
    attorneyGeneral: {
      office: 'Illinois Attorney General',
      website: 'https://illinoisattorneygeneral.gov/',
      phone: '(312) 814-6200',
    },
    smallClaimsCourt: {
      maxAmount: 10000,
      filingFee: 188,
    },
    exemptions: {
      wageGarnishment: 15,
      bankAccount: 4000, // Protected amount
    },
    notableCases: [
      'Miller v. Illinois Collection Service (2020) - SOL determination',
      'Solomon v. FirstSource Advantage (2021) - Harassment definition',
    ],
  },

  'Pennsylvania': {
    state: 'Pennsylvania',
    abbreviation: 'PA',
    statuteOfLimitations: {
      'written_contract': 4,
      'oral_contract': 2,
      'promissory_note': 4,
      'open_account': 4,
      'medical_debt': 4,
      'credit_card': 4,
    },
    consumerProtectionLaws: [
      'Pennsylvania Fair Credit Extension Uniformity Act',
      'Pennsylvania Unfair Trade Practices and Consumer Protection Law',
      'Pennsylvania Debt Collection Act',
    ],
    additionalProtections: [
      'No wage garnishment (except for taxes and child support)',
      'Strong consumer protection under 73 P.S. § 201-2',
      'Automatic treble damages for knowing violations',
      'Bankruptcy-friendly exemption laws',
      'Mandatory arbitration clause restrictions',
    ],
    interestRateLimits: {
      'consumer_loan': 6, // General usury cap
      'credit_card': 24, // With proper licensing
      'payday_loan': 249, // APR cap
      'auto_loan': 18,
    },
    attorneyGeneral: {
      office: 'Pennsylvania Attorney General',
      website: 'https://www.attorneygeneral.gov/',
      phone: '(717) 787-3391',
    },
    smallClaimsCourt: {
      maxAmount: 12000,
      filingFee: 40,
    },
    exemptions: {
      wageGarnishment: 0, // No wage garnishment allowed
      bankAccount: 300, // Minimal bank exemption
    },
    notableCases: [
      'Gasper v. NCO Group (2020) - Arbitration clause limitations',
      'Johnson v. LVNV Funding (2021) - SOL restart rules',
    ],
  },

  'Ohio': {
    state: 'Ohio',
    abbreviation: 'OH',
    statuteOfLimitations: {
      'written_contract': 6,
      'oral_contract': 6,
      'promissory_note': 6,
      'open_account': 6,
      'medical_debt': 6,
      'credit_card': 6,
    },
    consumerProtectionLaws: [
      'Ohio Consumer Sales Practices Act',
      'Ohio Fair Debt Collection Act',
      'Ohio Short-Term Loan Act',
    ],
    additionalProtections: [
      '25% wage garnishment limit',
      'Enhanced damages for knowing violations',
      'Payday loan database restrictions',
      'Debt buyer registration requirements',
      'Statutory damages without proof of actual damages',
    ],
    interestRateLimits: {
      'consumer_loan': 25, // APR cap for loans under $5,000
      'credit_card': 25,
      'payday_loan': 390, // APR cap
      'auto_loan': 21,
    },
    attorneyGeneral: {
      office: 'Ohio Attorney General',
      website: 'https://www.ohioattorneygeneral.gov/',
      phone: '(800) 282-0515',
    },
    smallClaimsCourt: {
      maxAmount: 6000,
      filingFee: 37,
    },
    exemptions: {
      wageGarnishment: 25,
      bankAccount: 450, // Protected amount
    },
    notableCases: [
      'Scott v. Capital One (2020) - SOL determination methods',
      'Wells Fargo v. Horoho (2021) - Interest rate calculations',
    ],
  },

  'Georgia': {
    state: 'Georgia',
    abbreviation: 'GA',
    statuteOfLimitations: {
      'written_contract': 6,
      'oral_contract': 4,
      'promissory_note': 6,
      'open_account': 4,
      'medical_debt': 6,
      'credit_card': 4,
    },
    consumerProtectionLaws: [
      'Georgia Fair Business Practices Act',
      'Georgia Industrial Loan Act',
      'Georgia Debt Adjustment Act',
    ],
    additionalProtections: [
      '25% wage garnishment limit',
      'Head of household wage protection',
      'Homestead exemption up to $21,500',
      'Automatic injunctions for unfair practices',
      'Treble damages for knowing violations',
    ],
    interestRateLimits: {
      'consumer_loan': 16, // O.C.G.A. § 7-4-2
      'credit_card': 16,
      'payday_loan': 390, // APR cap
      'auto_loan': 17,
    },
    attorneyGeneral: {
      office: 'Georgia Attorney General',
      website: 'https://law.georgia.gov/',
      phone: '(404) 656-3300',
    },
    smallClaimsCourt: {
      maxAmount: 15000,
      filingFee: 45,
    },
    exemptions: {
      wageGarnishment: 25,
      bankAccount: 2500, // Protected amount
    },
    notableCases: [
      'Ford Motor Credit v. McDonald (2020) - Interest rate enforcement',
      'Sherrod v. Portfolio Recovery (2021) - SOL restart analysis',
    ],
  },

  'Michigan': {
    state: 'Michigan',
    abbreviation: 'MI',
    statuteOfLimitations: {
      'written_contract': 6,
      'oral_contract': 6,
      'promissory_note': 6,
      'open_account': 6,
      'medical_debt': 6,
      'credit_card': 6,
    },
    consumerProtectionLaws: [
      'Michigan Consumer Protection Act',
      'Michigan Occupational Code (Collection Agency Licensing)',
      'Michigan Payday Lending Act',
    ],
    additionalProtections: [
      '25% wage garnishment limit',
      'Head of family exemptions',
      'Homestead exemption up to $45,000',
      'Enhanced damages for systematic violations',
      'Attorney fee awards in consumer cases',
    ],
    interestRateLimits: {
      'consumer_loan': 25, // APR cap
      'credit_card': 25,
      'payday_loan': 390, // APR cap
      'auto_loan': 21,
    },
    attorneyGeneral: {
      office: 'Michigan Attorney General',
      website: 'https://www.michigan.gov/ag/',
      phone: '(517) 373-1110',
    },
    smallClaimsCourt: {
      maxAmount: 6500,
      filingFee: 30,
    },
    exemptions: {
      wageGarnishment: 25,
      bankAccount: 600, // Protected amount
    },
    notableCases: [
      'Highland Lakes v. GreenPath (2020) - Exemption applications',
      'Orr v. RPM (2021) - Consumer Protection Act reach',
    ],
  },
};

// Helper functions for state law analysis
export const getStateLawAdvantage = (state: string): number => {
  const stateLaw = STATE_LAWS[state];
  if (!stateLaw) return 0;

  let advantage = 0;

  // Exemption advantages
  if (stateLaw.exemptions.wageGarnishment < 25) advantage += 5;
  if (stateLaw.exemptions.wageGarnishment === 0) advantage += 10;
  if (stateLaw.exemptions.bankAccount > 2000) advantage += 5;

  // SOL advantages
  if (Object.values(stateLaw.statuteOfLimitations).some(sol => sol > 6)) advantage += 5;

  // Consumer protection advantages
  if (stateLaw.additionalProtections.includes('Double damages')) advantage += 5;
  if (stateLaw.additionalProtections.includes('Triple damages')) advantage += 10;

  // Special state-specific advantages
  if (state === 'Texas') advantage += 15; // No wage garnishment
  if (state === 'California') advantage += 10; // Strong consumer laws
  if (state === 'Florida') advantage += 10; // Unlimited homestead

  return advantage;
};

export const getStatuteOfLimitations = (state: string, debtType: string): number => {
  const stateLaw = STATE_LAWS[state];
  if (!stateLaw) return 6; // Federal default

  return stateLaw.statuteOfLimitations[debtType] || stateLaw.statuteOfLimitations['written_contract'] || 6;
};