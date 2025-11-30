// Analyze Threat using Anthropic Claude API
// Edge Function for CallWall Mobile App

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

interface ThreatAnalysisRequest {
  communicationText: string;
  context?: {
    callerNumber?: string;
    callTime?: string;
    callFrequency?: string;
  };
  userTier: 'free' | 'premium' | 'business';
}

interface ThreatAnalysisResponse {
  success: boolean;
  analysis?: {
    threatLevel: ThreatLevel;
    sentimentScore: number;
    fdcpaViolations: string[];
    harassmentIndicators: string[];
    recommendedActions: string[];
    confidence: number;
    reasoning?: string;
  };
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { communicationText, context, userTier }: ThreatAnalysisRequest = await req.json();

    if (!communicationText || !userTier) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Free tier users get basic analysis only (no AI)
    if (userTier === 'free') {
      return new Response(
        JSON.stringify({
          success: true,
          analysis: {
            threatLevel: 'none',
            sentimentScore: 0,
            fdcpaViolations: [],
            harassmentIndicators: [],
            recommendedActions: ['Upgrade to Premium for AI-powered threat analysis'],
            confidence: 0.5,
            reasoning: 'Basic analysis only - upgrade for full AI-powered threat detection',
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Anthropic Claude API
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Threat analysis service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a legal compliance and threat analysis expert specializing in debt collection communications and FDCPA (Fair Debt Collection Practices Act) compliance.

Analyze the provided communication and return a JSON response with the following structure:
{
  "threatLevel": "none" | "low" | "medium" | "high" | "critical",
  "sentimentScore": number between -1.0 (very negative) and 1.0 (very positive),
  "fdcpaViolations": array of strings describing any FDCPA violations,
  "harassmentIndicators": array of strings describing harassment patterns,
  "recommendedActions": array of strings with actionable recommendations,
  "confidence": number between 0 and 1,
  "reasoning": brief explanation of your analysis
}

FDCPA violations to check for:
- Calling outside 8am-9pm local time
- Contacting at workplace after being told not to
- Disclosing debt to third parties
- Using obscene or profane language
- Threatening violence or harm
- Misrepresenting legal status or consequences
- Failing to identify as a debt collector

Threat levels:
- none: Normal communication, no concerns
- low: Minor concerns, no immediate action needed
- medium: Some concerning language, recommend monitoring
- high: Serious violations or threats detected, recommend legal action
- critical: Severe violations, immediate legal action recommended`;

    const userPrompt = `Communication to analyze:
"${communicationText}"

${context?.callerNumber ? `Caller number: ${context.callerNumber}` : ''}
${context?.callTime ? `Call time: ${context.callTime}` : ''}
${context?.callFrequency ? `Call frequency: ${context.callFrequency}` : ''}`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Anthropic Claude API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Threat analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const claudeResult = await claudeResponse.json();
    const analysisText = claudeResult.content[0].text;

    // Parse JSON response from Claude
    let analysis;
    try {
      // Try to extract JSON from the response (Claude might include markdown code blocks)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(analysisText);
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', analysisText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse analysis results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and normalize the response
    const validatedAnalysis = {
      threatLevel: analysis.threatLevel || 'none',
      sentimentScore: Math.max(-1, Math.min(1, analysis.sentimentScore || 0)),
      fdcpaViolations: Array.isArray(analysis.fdcpaViolations) ? analysis.fdcpaViolations : [],
      harassmentIndicators: Array.isArray(analysis.harassmentIndicators) ? analysis.harassmentIndicators : [],
      recommendedActions: Array.isArray(analysis.recommendedActions) ? analysis.recommendedActions : [],
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.8)),
      reasoning: analysis.reasoning || 'AI analysis completed',
    };

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        analysis: validatedAnalysis,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Threat analysis error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
