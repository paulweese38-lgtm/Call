// Threat Analysis Service
// Uses Anthropic Claude for AI-powered threat detection

export interface ThreatAnalysis {
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  sentimentScore: number; // -1.0 to 1.0
  fdcpaViolations: string[];
  harassmentIndicators: string[];
  recommendedActions: string[];
  confidence: number;
  timestamp: string;
}

// This service would call Anthropic API via Supabase Edge Function
// For MVP, implementing basic keyword-based analysis
export async function analyzeThreat(
  communicationText: string,
  context?: {
    callerNumber?: string;
    callTime?: string;
    callFrequency?: string;
  }
): Promise<ThreatAnalysis> {
  try {
    // Basic keyword-based analysis (would be replaced with Anthropic API call)
    const text = communicationText.toLowerCase();

    // Detect threats and harassment
    const threatKeywords = ['sue', 'lawsuit', 'arrest', 'warrant', 'police', 'jail', 'legal action'];
    const harassmentKeywords = ['repeatedly', 'constantly', 'won\'t stop', 'harass'];
    const fdcpaKeywords = ['before 8am', 'after 9pm', 'at work', 'third party'];

    const threatScore = threatKeywords.filter((k) => text.includes(k)).length;
    const harassmentScore = harassmentKeywords.filter((k) => text.includes(k)).length;
    const fdcpaScore = fdcpaKeywords.filter((k) => text.includes(k)).length;

    // Calculate sentiment (basic approach)
    const negativeWords = ['angry', 'threatening', 'demand', 'must', 'illegal', 'bad'];
    const positiveWords = ['please', 'thank', 'understand', 'help', 'appreciate'];
    const negCount = negativeWords.filter((w) => text.includes(w)).length;
    const posCount = positiveWords.filter((w) => text.includes(w)).length;
    const sentimentScore = ((posCount - negCount) / Math.max(posCount + negCount, 1)) * 0.5;

    // Determine threat level
    let threatLevel: ThreatAnalysis['threatLevel'] = 'none';
    if (threatScore >= 3 || harassmentScore >= 2) {
      threatLevel = 'critical';
    } else if (threatScore >= 2 || fdcpaScore >= 2) {
      threatLevel = 'high';
    } else if (threatScore >= 1 || harassmentScore >= 1) {
      threatLevel = 'medium';
    } else if (fdcpaScore >= 1) {
      threatLevel = 'low';
    }

    // Detect FDCPA violations
    const fdcpaViolations: string[] = [];
    if (text.includes('before 8am') || text.includes('after 9pm')) {
      fdcpaViolations.push('Called outside permitted hours (8am-9pm)');
    }
    if (text.includes('at work') && text.includes('told not to')) {
      fdcpaViolations.push('Contacted at workplace after being told not to');
    }
    if (text.includes('third party') || text.includes('told others')) {
      fdcpaViolations.push('Disclosed debt information to third parties');
    }

    // Harassment indicators
    const harassmentIndicators: string[] = [];
    if (harassmentScore > 0) {
      harassmentIndicators.push('Repeated or excessive contact');
    }
    if (threatScore > 0) {
      harassmentIndicators.push('Threatening language detected');
    }

    // Recommended actions
    const recommendedActions: string[] = [];
    if (threatLevel === 'critical' || threatLevel === 'high') {
      recommendedActions.push('Document this communication immediately');
      recommendedActions.push('Consider sending a cease and desist letter');
      recommendedActions.push('Consult with a consumer rights attorney');
    }
    if (fdcpaViolations.length > 0) {
      recommendedActions.push('File a complaint with the CFPB');
      recommendedActions.push('Report to your state Attorney General');
    }
    if (threatLevel === 'medium') {
      recommendedActions.push('Keep detailed records of all communications');
      recommendedActions.push('Send debt validation request');
    }

    return {
      threatLevel,
      sentimentScore: Math.max(-1, Math.min(1, sentimentScore)),
      fdcpaViolations,
      harassmentIndicators,
      recommendedActions,
      confidence: 0.7, // Basic analysis has lower confidence
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Threat analysis error:', error);

    // Return safe default on error
    return {
      threatLevel: 'none',
      sentimentScore: 0,
      fdcpaViolations: [],
      harassmentIndicators: [],
      recommendedActions: [],
      confidence: 0,
      timestamp: new Date().toISOString()
    };
  }
}

// For Premium/Business tiers, this calls actual Anthropic API via Edge Function
export async function analyzeWithAI(
  communicationText: string,
  userTier: 'free' | 'premium' | 'business',
  context?: {
    callerNumber?: string;
    callTime?: string;
    callFrequency?: string;
  }
): Promise<ThreatAnalysis> {
  // Free tier gets basic keyword-based analysis
  if (userTier === 'free') {
    return analyzeThreat(communicationText, context);
  }

  try {
    // Dynamic import to avoid circular dependency
    const { supabase } = await import('../lib/supabase');

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('Not authenticated, falling back to basic analysis');
      return analyzeThreat(communicationText, context);
    }

    // Call analyze-threat Edge Function
    const { data, error } = await supabase.functions.invoke('analyze-threat', {
      body: {
        communicationText,
        context,
        userTier,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      return analyzeThreat(communicationText, context);
    }

    if (!data.success) {
      console.error('Threat analysis failed:', data.error);
      return analyzeThreat(communicationText, context);
    }

    return {
      ...data.analysis,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('AI threat analysis error:', error);
    // Fallback to basic analysis on error
    return analyzeThreat(communicationText, context);
  }
}
