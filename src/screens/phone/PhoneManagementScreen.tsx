import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

interface PhoneNumber {
  id: string;
  phone_number: string;
  label: string | null;
  call_count: number;
  last_call_at: string | null;
  is_blocked: boolean;
  notes: string | null;
  created_at: string;
}

type TabType = 'all' | 'blocked' | 'analytics';

export function PhoneManagementScreen({ navigation }: any) {
  const { profile } = useAuthStore();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [filteredNumbers, setFilteredNumbers] = useState<PhoneNumber[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchPhoneNumbers();
    }
  }, [profile]);

  useEffect(() => {
    applyFilters();
  }, [activeTab, searchQuery, phoneNumbers]);

  const fetchPhoneNumbers = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('user_id', profile.id)
        .order('last_call_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      setPhoneNumbers(data || []);
    } catch (error: any) {
      console.error('Fetch phone numbers error:', error);
      Alert.alert('Error', 'Failed to load phone numbers');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...phoneNumbers];

    // Apply tab filter
    if (activeTab === 'blocked') {
      filtered = filtered.filter((num) => num.is_blocked);
    } else if (activeTab === 'all') {
      filtered = filtered.filter((num) => !num.is_blocked);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (num) =>
          num.phone_number.includes(query) ||
          (num.label && num.label.toLowerCase().includes(query))
      );
    }

    setFilteredNumbers(filtered);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPhoneNumbers();
  };

  const handleBlockToggle = async (phoneNumber: PhoneNumber) => {
    const newBlockStatus = !phoneNumber.is_blocked;
    const action = newBlockStatus ? 'block' : 'unblock';

    try {
      const { error } = await supabase
        .from('phone_numbers')
        .update({ is_blocked: newBlockStatus })
        .eq('id', phoneNumber.id);

      if (error) throw error;

      // Update local state
      setPhoneNumbers((prev) =>
        prev.map((num) =>
          num.id === phoneNumber.id ? { ...num, is_blocked: newBlockStatus } : num
        )
      );

      Alert.alert('Success', `Number ${action}ed successfully`);
    } catch (error: any) {
      console.error(`${action} number error:`, error);
      Alert.alert('Error', `Failed to ${action} number`);
    }
  };

  const handleDelete = async (phoneNumber: PhoneNumber) => {
    Alert.alert(
      'Delete Number',
      `Are you sure you want to delete ${phoneNumber.phone_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(phoneNumber.id),
        },
      ]
    );
  };

  const confirmDelete = async (phoneNumberId: string) => {
    try {
      const { error } = await supabase.from('phone_numbers').delete().eq('id', phoneNumberId);

      if (error) throw error;

      // Update local state
      setPhoneNumbers((prev) => prev.filter((num) => num.id !== phoneNumberId));

      Alert.alert('Success', 'Number deleted');
    } catch (error: any) {
      console.error('Delete number error:', error);
      Alert.alert('Error', 'Failed to delete number');
    }
  };

  const formatTimestamp = (timestamp: string | null): string => {
    if (!timestamp) return 'Never';

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

  const renderPhoneItem = ({ item }: { item: PhoneNumber }) => (
    <TouchableOpacity
      style={styles.phoneItem}
      onPress={() => navigation.navigate('PhoneDetail', { phoneNumberId: item.id })}
    >
      <View style={styles.phoneItemLeft}>
        <Text style={styles.phoneNumber}>{item.phone_number}</Text>
        {item.label && <Text style={styles.phoneLabel}>{item.label}</Text>}
        <Text style={styles.lastCall}>Last call: {formatTimestamp(item.last_call_at)}</Text>
      </View>

      <View style={styles.phoneItemRight}>
        {item.call_count > 0 && (
          <View style={styles.callBadge}>
            <Text style={styles.callBadgeText}>{item.call_count}</Text>
          </View>
        )}

        {item.is_blocked && (
          <View style={styles.blockedIndicator}>
            <Ionicons name="ban" size={20} color="#f44336" />
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => handleBlockToggle(item)}
            style={styles.actionButton}
          >
            <Ionicons
              name={item.is_blocked ? 'checkmark-circle' : 'ban'}
              size={24}
              color={item.is_blocked ? '#43a047' : '#f44336'}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={24} color="#757575" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="call-outline" size={80} color="#bdbdbd" />
      <Text style={styles.emptyTitle}>
        {activeTab === 'blocked' ? 'No blocked numbers' : 'No phone numbers tracked yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'blocked'
          ? 'Numbers you block will appear here'
          : 'Add phone numbers to track calls and manage blocking'}
      </Text>
    </View>
  );

  const renderAnalytics = () => (
    <View style={styles.analyticsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{phoneNumbers.length}</Text>
        <Text style={styles.statLabel}>Total Numbers</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statValue}>
          {phoneNumbers.filter((n) => n.is_blocked).length}
        </Text>
        <Text style={styles.statLabel}>Blocked</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statValue}>
          {phoneNumbers.reduce((sum, n) => sum + n.call_count, 0)}
        </Text>
        <Text style={styles.statLabel}>Total Calls</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statValue}>
          {phoneNumbers.filter((n) => n.call_count > 5).length}
        </Text>
        <Text style={styles.statLabel}>Frequent Callers</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All Numbers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'blocked' && styles.tabActive]}
          onPress={() => setActiveTab('blocked')}
        >
          <Text style={[styles.tabText, activeTab === 'blocked' && styles.tabTextActive]}>
            Blocked
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar (only for all and blocked tabs) */}
      {activeTab !== 'analytics' && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#757575" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by number or label..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Content */}
      {activeTab === 'analytics' ? (
        renderAnalytics()
      ) : (
        <FlatList
          data={filteredNumbers}
          renderItem={renderPhoneItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            filteredNumbers.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#1976d2']} />
          }
        />
      )}

      {/* Floating Action Button */}
      {activeTab !== 'analytics' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('PhoneAdd')}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1976d2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  tabTextActive: {
    color: '#1976d2',
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
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  phoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  phoneItemLeft: {
    flex: 1,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  phoneLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  lastCall: {
    fontSize: 12,
    color: '#9e9e9e',
  },
  phoneItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  callBadge: {
    backgroundColor: '#1976d2',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  blockedIndicator: {
    marginRight: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
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
  analyticsContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});
