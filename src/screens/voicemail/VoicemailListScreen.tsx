import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

interface Voicemail {
  id: string;
  phone_number: string;
  duration: number;
  transcript: string | null;
  category: 'personal' | 'business' | 'legal' | 'spam' | null;
  threat_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  sentiment_score: number | null;
  is_read: boolean;
  created_at: string;
}

interface Filters {
  category: string;
  threatLevel: string;
  dateRange: string;
  readStatus: string;
}

export function VoicemailListScreen({ navigation }: any) {
  const { profile } = useAuthStore();
  const [voicemails, setVoicemails] = useState<Voicemail[]>([]);
  const [filteredVoicemails, setFilteredVoicemails] = useState<Voicemail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [usage, setUsage] = useState<any>(null);
  const [filters, setFilters] = useState<Filters>({
    category: 'all',
    threatLevel: 'all',
    dateRange: 'all',
    readStatus: 'all',
  });

  useEffect(() => {
    if (profile) {
      fetchVoicemails();
      fetchUsage();
    }
  }, [profile]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchQuery, filters, voicemails]);

  const fetchVoicemails = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('voicemail_messages')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setVoicemails(data || []);
    } catch (error: any) {
      console.error('Fetch voicemails error:', error);
      Alert.alert('Error', 'Failed to load voicemails');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchUsage = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setUsage(data);
    } catch (error: any) {
      console.error('Fetch usage error:', error);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...voicemails];

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter((vm) => vm.category === filters.category);
    }

    // Apply threat level filter
    if (filters.threatLevel !== 'all') {
      filtered = filtered.filter((vm) => vm.threat_level === filters.threatLevel);
    }

    // Apply read status filter
    if (filters.readStatus === 'read') {
      filtered = filtered.filter((vm) => vm.is_read);
    } else if (filters.readStatus === 'unread') {
      filtered = filtered.filter((vm) => !vm.is_read);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      if (filters.dateRange === 'last7days') {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (filters.dateRange === 'last30days') {
        cutoffDate.setDate(now.getDate() - 30);
      }

      filtered = filtered.filter((vm) => new Date(vm.created_at) >= cutoffDate);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (vm) =>
          vm.phone_number.includes(query) ||
          (vm.transcript && vm.transcript.toLowerCase().includes(query))
      );
    }

    setFilteredVoicemails(filtered);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchVoicemails();
  };

  const handleVoicemailPress = (voicemail: Voicemail) => {
    navigation.navigate('VoicemailDetail', { voicemailId: voicemail.id });
  };

  const handleRecordPress = () => {
    // Check tier limit
    if (profile?.subscription_tier === 'free' && usage?.voicemail_transcriptions_count >= 10) {
      Alert.alert(
        'Limit Reached',
        'You've reached your monthly limit of 10 voicemail transcriptions. Upgrade to Premium for 100/month.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') },
        ]
      );
      return;
    }

    navigation.navigate('VoicemailRecord');
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      if (hours === 0) {
        const mins = Math.floor(diffMs / (1000 * 60));
        return `${mins} mins ago`;
      }
      return `${hours} hours ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getCategoryColor = (category: string | null): string => {
    switch (category) {
      case 'personal':
        return '#2196f3';
      case 'business':
        return '#43a047';
      case 'legal':
        return '#ff9800';
      case 'spam':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getThreatColor = (threatLevel: string): string => {
    switch (threatLevel) {
      case 'critical':
        return '#d32f2f';
      case 'high':
        return '#f57c00';
      case 'medium':
        return '#fbc02d';
      case 'low':
        return '#689f38';
      default:
        return '#9e9e9e';
    }
  };

  const getThreatIcon = (threatLevel: string): string => {
    switch (threatLevel) {
      case 'critical':
      case 'high':
        return 'warning';
      case 'medium':
        return 'alert-circle';
      case 'low':
        return 'information-circle';
      default:
        return '';
    }
  };

  const applyFilters = () => {
    setShowFilterModal(false);
    applyFiltersAndSearch();
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      threatLevel: 'all',
      dateRange: 'all',
      readStatus: 'all',
    });
  };

  const unreadCount = voicemails.filter((vm) => !vm.is_read).length;

  const renderVoicemailItem = ({ item }: { item: Voicemail }) => (
    <TouchableOpacity style={styles.voicemailItem} onPress={() => handleVoicemailPress(item)}>
      <View style={styles.voicemailHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.phoneNumber}>{item.phone_number}</Text>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.timestamp}>{formatTimestamp(item.created_at)}</Text>
      </View>

      <View style={styles.voicemailMeta}>
        {item.category && (
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}

        {item.threat_level !== 'none' && (
          <View style={styles.threatIndicator}>
            <Ionicons
              name={getThreatIcon(item.threat_level) as any}
              size={16}
              color={getThreatColor(item.threat_level)}
            />
            <Text style={[styles.threatText, { color: getThreatColor(item.threat_level) }]}>
              {item.threat_level}
            </Text>
          </View>
        )}

        <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
      </View>

      {item.transcript && (
        <Text style={styles.transcriptPreview} numberOfLines={2}>
          {item.transcript.substring(0, 60)}
          {item.transcript.length > 60 ? '...' : ''}
        </Text>
      )}

      <View style={styles.voicemailFooter}>
        <TouchableOpacity style={styles.playButton}>
          <Ionicons name="play-circle" size={24} color="#1976d2" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="voicemail" size={80} color="#bdbdbd" />
      <Text style={styles.emptyTitle}>No voicemails yet</Text>
      <Text style={styles.emptySubtitle}>Record your first voicemail to get started</Text>
    </View>
  );

  const tierLimits = {
    free: 10,
    premium: 100,
    business: 500,
  };

  const tier = profile?.subscription_tier || 'free';
  const usedCount = usage?.voicemail_transcriptions_count || 0;
  const limit = tierLimits[tier as keyof typeof tierLimits];

  return (
    <View style={styles.container}>
      {/* Usage Indicator */}
      {(tier === 'free' || tier === 'premium') && (
        <View style={styles.usageCard}>
          <Text style={styles.usageText}>
            {usedCount}/{limit} transcriptions used this month
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min((usedCount / limit) * 100, 100)}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#757575" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by number or transcript..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#1976d2" />
          {(filters.category !== 'all' ||
            filters.threatLevel !== 'all' ||
            filters.dateRange !== 'all' ||
            filters.readStatus !== 'all') && <View style={styles.filterActiveDot} />}
        </TouchableOpacity>
      </View>

      {/* Voicemail List */}
      <FlatList
        data={filteredVoicemails}
        renderItem={renderVoicemailItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          filteredVoicemails.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#1976d2']} />
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleRecordPress}>
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={28} color="#212121" />
              </TouchableOpacity>
            </View>

            {/* Category Filter */}
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.filterChips}>
              {['all', 'personal', 'business', 'legal', 'spam'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.filterChip,
                    filters.category === cat && styles.filterChipActive,
                  ]}
                  onPress={() => setFilters({ ...filters, category: cat })}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.category === cat && styles.filterChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Threat Level Filter */}
            <Text style={styles.filterLabel}>Threat Level</Text>
            <View style={styles.filterChips}>
              {['all', 'none', 'low', 'medium', 'high', 'critical'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.filterChip,
                    filters.threatLevel === level && styles.filterChipActive,
                  ]}
                  onPress={() => setFilters({ ...filters, threatLevel: level })}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.threatLevel === level && styles.filterChipTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date Range Filter */}
            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.filterChips}>
              {['all', 'last7days', 'last30days'].map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.filterChip,
                    filters.dateRange === range && styles.filterChipActive,
                  ]}
                  onPress={() => setFilters({ ...filters, dateRange: range })}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.dateRange === range && styles.filterChipTextActive,
                    ]}
                  >
                    {range === 'last7days'
                      ? 'Last 7 Days'
                      : range === 'last30days'
                      ? 'Last 30 Days'
                      : 'All Time'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Read Status Filter */}
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.filterChips}>
              {['all', 'read', 'unread'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    filters.readStatus === status && styles.filterChipActive,
                  ]}
                  onPress={() => setFilters({ ...filters, readStatus: status })}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.readStatus === status && styles.filterChipTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
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
    backgroundColor: '#f5f5f5',
  },
  usageCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  usageText: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1976d2',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
  },
  filterButton: {
    padding: 4,
    position: 'relative',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f44336',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#424242',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
  },
  voicemailItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  voicemailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196f3',
  },
  timestamp: {
    fontSize: 12,
    color: '#757575',
  },
  voicemailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  threatIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  threatText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  duration: {
    fontSize: 12,
    color: '#757575',
  },
  transcriptPreview: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginBottom: 8,
  },
  voicemailFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  playButton: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginTop: 16,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  filterChipText: {
    fontSize: 14,
    color: '#424242',
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  clearButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1976d2',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  applyButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#1976d2',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
