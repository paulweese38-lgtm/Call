import { supabase } from '../lib/supabase';

export function formatPhoneNumber(rawNumber: string): string {
  // Remove all non-digit characters
  const digits = rawNumber.replace(/\D/g, '');

  // Add country code if not present
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

export function displayPhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('1')) {
    const areaCode = digits.substring(1, 4);
    const prefix = digits.substring(4, 7);
    const line = digits.substring(7);
    return `(${areaCode}) ${prefix}-${line}`;
  }

  return phoneNumber;
}

export async function addPhoneNumber(
  userId: string,
  phoneNumber: string,
  label?: string,
  notes?: string
): Promise<any> {
  try {
    const formatted = formatPhoneNumber(phoneNumber);

    // Check if already exists
    const { data: existing } = await supabase
      .from('phone_numbers')
      .select('id')
      .eq('user_id', userId)
      .eq('phone_number', formatted)
      .single();

    if (existing) {
      return existing;
    }

    // Check tier limit for free tier
    const { data: user } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (user?.subscription_tier === 'free') {
      const { count } = await supabase
        .from('phone_numbers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (count && count >= 25) {
        throw new Error('Free tier allows maximum 25 phone numbers. Please upgrade.');
      }
    }

    // Insert
    const { data, error } = await supabase
      .from('phone_numbers')
      .insert({
        user_id: userId,
        phone_number: formatted,
        label: label || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Add phone number error:', error);
    throw error;
  }
}

export async function blockPhoneNumber(phoneNumberId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('phone_numbers')
      .update({ is_blocked: true })
      .eq('id', phoneNumberId);

    if (error) throw error;
  } catch (error) {
    console.error('Block phone number error:', error);
    throw error;
  }
}

export async function unblockPhoneNumber(phoneNumberId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('phone_numbers')
      .update({ is_blocked: false })
      .eq('id', phoneNumberId);

    if (error) throw error;
  } catch (error) {
    console.error('Unblock phone number error:', error);
    throw error;
  }
}

export async function deletePhoneNumber(phoneNumberId: string): Promise<void> {
  try {
    const { error } = await supabase.from('phone_numbers').delete().eq('id', phoneNumberId);

    if (error) throw error;
  } catch (error) {
    console.error('Delete phone number error:', error);
    throw error;
  }
}

export async function updatePhoneNumber(
  phoneNumberId: string,
  updates: { label?: string; notes?: string }
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('phone_numbers')
      .update(updates)
      .eq('id', phoneNumberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Update phone number error:', error);
    throw error;
  }
}

export async function getCallAnalytics(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<any> {
  try {
    // Get voicemails in date range
    const { data: voicemails, error } = await supabase
      .from('voicemail_messages')
      .select('phone_number, category, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;
    if (!voicemails) return null;

    // Calculate statistics
    const totalCalls = voicemails.length;
    const uniqueNumbers = new Set(voicemails.map((v) => v.phone_number)).size;

    // Top callers
    const callerCounts = voicemails.reduce((acc, v) => {
      acc[v.phone_number] = (acc[v.phone_number] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCallers = Object.entries(callerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([number, count]) => ({ number, count }));

    // Category breakdown
    const categoryBreakdown = voicemails.reduce((acc, v) => {
      acc[v.category] = (acc[v.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCalls,
      uniqueNumbers,
      topCallers,
      categoryBreakdown,
    };
  } catch (error) {
    console.error('Get analytics error:', error);
    throw error;
  }
}
