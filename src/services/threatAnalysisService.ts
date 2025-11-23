interface ThreatAnalysisRequest {
  communicationType: 'phone_call' | 'text_message' | 'email' | 'voicemail' | 'letter';
  content: string;
  senderInfo?: {
    phoneNumber?: string;
    email?: string;
    name?: string;
    organization?: string;
  };
  context?: {
    timeOfContact: string;
    frequency: string;
    previousContacts: number;
  };
}

interface ThreatAnalysisResult {
  threatLevel: 'low' | 'medium' | 'high';
  riskScore: number; // 0-100
  sentiment: 'positive' | 'neutral' | 'negative' | 'hostile';
  threats: ThreatType[];
  recommendations: string[];
  legalViolations: LegalViolation[];
  summary: string;
  emotionalImpact: EmotionalImpact;
}

interface ThreatType {
  type: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  evidence: string[];
}

interface LegalViolation {
  statute: string;
  description: string;
  severity: 'warning' | 'violation' | 'serious_violation';
  potentialPenalty: string;
}

interface EmotionalImpact {
  stressLevel: number; // 0-10
  harassmentIndicators: string[];
  psychologicalTactics: string[];
  intimidationLevel: 'low' | 'medium' | 'high';
}

class ThreatAnalysisService {
  private anthropicApiKey: string;
  private openaiApiKey: string;

  constructor() {
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
  }

  async analyzeThreat(request: ThreatAnalysisRequest): Promise<ThreatAnalysisResult> {
    try {
      // Use Anthropic Claude for comprehensive analysis
      const analysis = await this.performAnthropicAnalysis(request);

      // Cross-validate with OpenAI if available
      if (this.openaiApiKey) {
        const openaiAnalysis = await this.performOpenAIAnalysis(request);
        return this.mergeAnalyses(analysis, openaiAnalysis);
      }

      return analysis;
    } catch (error) {
      console.error('Threat analysis error:', error);
      throw new Error('Failed to analyze communication threat');
    }
  }

  private async performAnthropicAnalysis(request: ThreatAnalysisRequest): Promise<ThreatAnalysisResult> {
    const prompt = this.buildAnalysisPrompt(request);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.content[0].text;

    return this.parseAnalysisResponse(analysisText, request);
  }

  private async performOpenAIAnalysis(request: ThreatAnalysisRequest): Promise<ThreatAnalysisResult> {
    const prompt = this.buildOpenAIAnalysisPrompt(request);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in analyzing communications for threats, harassment, and legal violations. Provide detailed, objective analysis.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content || '';

    return this.parseAnalysisResponse(analysisText, request);
  }

  private buildAnalysisPrompt(request: ThreatAnalysisRequest): string {
    const { communicationType, content, senderInfo, context } = request;

    return `As a legal communication expert and threat analyst, please analyze the following communication for potential threats, harassment, and FDCPA violations.

COMMUNICATION DETAILS:
- Type: ${communicationType}
- Content: "${content}"
- Sender: ${senderInfo ? JSON.stringify(senderInfo, null, 2) : 'Unknown'}
- Context: ${context ? JSON.stringify(context, null, 2) : 'No additional context'}

Please provide a comprehensive analysis including:

1. THREAT LEVEL (low/medium/high) and RISK SCORE (0-100)
2. SENTIMENT ANALYSIS and EMOTIONAL IMPACT assessment
3. SPECIFIC THREATS identified with severity levels
4. POTENTIAL LEGAL VIOLATIONS under FDCPA, TCPA, or other relevant laws
5. RECOMMENDATIONS for the recipient
6. DETAILED SUMMARY of findings

Format your response as structured JSON with these exact fields:
{
  "threatLevel": "low|medium|high",
  "riskScore": 0-100,
  "sentiment": "positive|neutral|negative|hostile",
  "threats": [
    {
      "type": "threat_category",
      "description": "detailed description",
      "severity": "minor|moderate|severe",
      "evidence": ["evidence1", "evidence2"]
    }
  ],
  "legalViolations": [
    {
      "statute": "law_name_and_section",
      "description": "violation description",
      "severity": "warning|violation|serious_violation",
      "potentialPenalty": "description of penalties"
    }
  ],
  "recommendations": ["recommendation1", "recommendation2"],
  "summary": "comprehensive summary",
  "emotionalImpact": {
    "stressLevel": 0-10,
    "harassmentIndicators": ["indicator1", "indicator2"],
    "psychologicalTactics": ["tactic1", "tactic2"],
    "intimidationLevel": "low|medium|high"
  }
}

Focus on protecting the recipient's rights and providing actionable guidance.`;
  }

  private buildOpenAIAnalysisPrompt(request: ThreatAnalysisRequest): string {
    const { communicationType, content, senderInfo } = request;

    return `Analyze this ${communicationType} for threats and legal violations:

Content: "${content}"
Sender: ${senderInfo ? JSON.stringify(senderInfo) : 'Unknown'}

Provide analysis in JSON format with threat level, legal violations, and recommendations.`;
  }

  private parseAnalysisResponse(analysisText: string, request: ThreatAnalysisRequest): ThreatAnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateAndNormalizeResult(parsed);
      }
    } catch (error) {
      console.error('Failed to parse analysis response:', error);
    }

    // Fallback to basic analysis if JSON parsing fails
    return this.createFallbackAnalysis(request);
  }

  private validateAndNormalizeResult(result: any): ThreatAnalysisResult {
    return {
      threatLevel: this.validateThreatLevel(result.threatLevel),
      riskScore: Math.min(100, Math.max(0, Number(result.riskScore) || 0)),
      sentiment: this.validateSentiment(result.sentiment),
      threats: Array.isArray(result.threats) ? result.threats.map(this.normalizeThreat) : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
      legalViolations: Array.isArray(result.legalViolations) ? result.legalViolations.map(this.normalizeViolation) : [],
      summary: result.summary || 'Analysis completed',
      emotionalImpact: this.normalizeEmotionalImpact(result.emotionalImpact),
    };
  }

  private validateThreatLevel(level: any): 'low' | 'medium' | 'high' {
    const validLevels = ['low', 'medium', 'high'];
    return validLevels.includes(level) ? level : 'medium';
  }

  private validateSentiment(sentiment: any): 'positive' | 'neutral' | 'negative' | 'hostile' {
    const validSentiments = ['positive', 'neutral', 'negative', 'hostile'];
    return validSentiments.includes(sentiment) ? sentiment : 'neutral';
  }

  private normalizeThreat(threat: any): ThreatType {
    return {
      type: threat.type || 'Unidentified Threat',
      description: threat.description || 'No description available',
      severity: ['minor', 'moderate', 'severe'].includes(threat.severity) ? threat.severity : 'moderate',
      evidence: Array.isArray(threat.evidence) ? threat.evidence : [],
    };
  }

  private normalizeViolation(violation: any): LegalViolation {
    return {
      statute: violation.statute || 'Unknown',
      description: violation.description || 'No description available',
      severity: ['warning', 'violation', 'serious_violation'].includes(violation.severity) ? violation.severity : 'warning',
      potentialPenalty: violation.potentialPenalty || 'Not specified',
    };
  }

  private normalizeEmotionalImpact(impact: any): EmotionalImpact {
    return {
      stressLevel: Math.min(10, Math.max(0, Number(impact?.stressLevel) || 0)),
      harassmentIndicators: Array.isArray(impact?.harassmentIndicators) ? impact.harassmentIndicators : [],
      psychologicalTactics: Array.isArray(impact?.psychologicalTactics) ? impact.psychologicalTactics : [],
      intimidationLevel: ['low', 'medium', 'high'].includes(impact?.intimidationLevel) ? impact.intimidationLevel : 'medium',
    };
  }

  private createFallbackAnalysis(request: ThreatAnalysisRequest): ThreatAnalysisResult {
    // Basic keyword-based analysis as fallback
    const content = request.content.toLowerCase();
    const threatKeywords = ['threat', 'sue', 'legal action', 'arrest', 'warrant', 'jail'];
    const harassmentKeywords = ['harass', 'annoy', 'bother', 'repeated', 'constantly'];
    const legalKeywords = ['fdcpa', 'fair debt', 'collection', 'creditor', 'debt collector'];

    let threatLevel: 'low' | 'medium' | 'high' = 'low';
    let riskScore = 0;
    let sentiment: 'positive' | 'neutral' | 'negative' | 'hostile' = 'neutral';

    const threatMatches = threatKeywords.filter(keyword => content.includes(keyword)).length;
    const harassmentMatches = harassmentKeywords.filter(keyword => content.includes(keyword)).length;
    const legalMatches = legalKeywords.filter(keyword => content.includes(keyword)).length;

    riskScore = (threatMatches * 30) + (harassmentMatches * 20) + (legalMatches * 10);

    if (riskScore >= 70) {
      threatLevel = 'high';
      sentiment = 'hostile';
    } else if (riskScore >= 40) {
      threatLevel = 'medium';
      sentiment = 'negative';
    }

    const threats: ThreatType[] = [];
    if (threatMatches > 0) {
      threats.push({
        type: 'Explicit Threat',
        description: 'Communication contains threatening language',
        severity: threatMatches > 1 ? 'severe' : 'moderate',
        evidence: threatKeywords.filter(keyword => content.includes(keyword)),
      });
    }

    if (harassmentMatches > 0) {
      threats.push({
        type: 'Harassment',
        description: 'Communication appears to be harassing in nature',
        severity: 'moderate',
        evidence: harassmentKeywords.filter(keyword => content.includes(keyword)),
      });
    }

    return {
      threatLevel,
      riskScore,
      sentiment,
      threats,
      recommendations: this.generateFallbackRecommendations(threatLevel, request.communicationType),
      legalViolations: [],
      summary: `Basic analysis completed. ${threatMatches} potential threats, ${harassmentMatches} harassment indicators detected.`,
      emotionalImpact: {
        stressLevel: Math.ceil(riskScore / 10),
        harassmentIndicators: harassmentKeywords.filter(keyword => content.includes(keyword)),
        psychologicalTactics: [],
        intimidationLevel: threatLevel,
      },
    };
  }

  private generateFallbackRecommendations(threatLevel: 'low' | 'medium' | 'high', communicationType: string): string[] {
    const baseRecommendations = [
      'Document all communications',
      'Keep records of dates, times, and content',
      'Consider blocking the sender if appropriate',
    ];

    if (threatLevel === 'high') {
      return [
        ...baseRecommendations,
        'Consider contacting law enforcement',
        'Consult with a legal professional',
        'File a complaint with the Consumer Financial Protection Bureau',
        'Consider requesting a cease and desist letter',
      ];
    }

    if (threatLevel === 'medium') {
      return [
        ...baseRecommendations,
        'Monitor for escalation',
        'Know your rights under relevant laws',
        'Consider legal consultation if behavior continues',
      ];
    }

    return baseRecommendations;
  }

  private mergeAnalyses(anthropicResult: ThreatAnalysisResult, openaiResult: ThreatAnalysisResult): ThreatAnalysisResult {
    // Simple averaging and combination of results
    const averagedRiskScore = Math.round((anthropicResult.riskScore + openaiResult.riskScore) / 2);

    // Take the higher threat level for safety
    const threatLevel = this.getHigherThreatLevel(anthropicResult.threatLevel, openaiResult.threatLevel);

    // Combine unique threats and violations
    const combinedThreats = [...anthropicResult.threats];
    openaiResult.threats.forEach(threat => {
      if (!combinedThreats.some(t => t.type === threat.type)) {
        combinedThreats.push(threat);
      }
    });

    const combinedViolations = [...anthropicResult.legalViolations];
    openaiResult.legalViolations.forEach(violation => {
      if (!combinedViolations.some(v => v.statute === violation.statute)) {
        combinedViolations.push(violation);
      }
    });

    const combinedRecommendations = [...new Set([...anthropicResult.recommendations, ...openaiResult.recommendations])];

    return {
      threatLevel,
      riskScore: averagedRiskScore,
      sentiment: anthropicResult.sentiment, // Prioritize Anthropic's sentiment analysis
      threats: combinedThreats,
      legalViolations: combinedViolations,
      recommendations: combinedRecommendations,
      summary: `Combined analysis: ${anthropicResult.summary}. Cross-validation: ${openaiResult.summary}`,
      emotionalImpact: anthropicResult.emotionalImpact, // Prioritize Anthropic's emotional analysis
    };
  }

  private getHigherThreatLevel(level1: string, level2: string): 'low' | 'medium' | 'high' {
    const levels = { low: 1, medium: 2, high: 3 };
    const level1Value = levels[level1 as keyof typeof levels] || 1;
    const level2Value = levels[level2 as keyof typeof levels] || 1;

    return level1Value >= level2Value ? (level1 as 'low' | 'medium' | 'high') : (level2 as 'low' | 'medium' | 'high');
  }
}

export const threatAnalysisService = new ThreatAnalysisService();
export default threatAnalysisService;