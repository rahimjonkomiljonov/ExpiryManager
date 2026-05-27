// Powered by OnSpace.AI
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useItems } from '@/hooks/useItems';
import { ItemCard } from '@/components/feature/ItemCard';
import { SummaryStrip } from '@/components/feature/SummaryStrip';
import { getExpiryStatus, GroceryItem } from '@/services/storageService';
import { CATEGORIES } from '@/constants/config';
import { Colors, Fonts, Spacing, Radius, Shadow } from '@/constants/theme';

type FilterStatus = 'all' | 'expired' | 'critical' | 'soon' | 'fresh';

const STATUS_FILTERS: { id: FilterStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'expired', label: '🔴 Expired' },
  { id: 'critical', label: '🟠 Critical' },
  { id: 'soon', label: '🟡 Soon' },
  { id: 'fresh', label: '🟢 Fresh' },
];

export default function PantryScreen() {
  const router = useRouter();
  const { items, isLoading, refresh } = useItems();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedCategory !== 'all') {
      result = result.filter(i => i.category === selectedCategory);
    }
    if (selectedStatus !== 'all') {
      result = result.filter(i => getExpiryStatus(i.expiryDate) === selectedStatus);
    }
    return result;
  }, [items, selectedCategory, selectedStatus]);

  const urgentCount = useMemo(() => {
    return items.filter(i => {
      const s = getExpiryStatus(i.expiryDate);
      return s === 'expired' || s === 'critical';
    }).length;
  }, [items]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Pantry</Text>
          <Text style={styles.headerSubtitle}>
            {items.length} item{items.length !== 1 ? 's' : ''} tracked
          </Text>
        </View>
        {urgentCount > 0 ? (
          <View style={styles.urgentBadge}>
            <MaterialIcons name="warning" size={14} color={Colors.expired} />
            <Text style={styles.urgentText}>{urgentCount} urgent</Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Summary Strip */}
        {items.length > 0 ? <SummaryStrip items={items} /> : null}

        {/* Status Filter */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {STATUS_FILTERS.map(f => (
              <Pressable
                key={f.id}
                style={[styles.filterChip, selectedStatus === f.id && styles.filterChipActive]}
                onPress={() => setSelectedStatus(f.id)}
              >
                <Text style={[styles.filterText, selectedStatus === f.id && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Category Filter */}
        <View style={styles.categorySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat.id}
                style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <Text style={[styles.catLabel, selectedCategory === cat.id && styles.catLabelActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            {items.length === 0 ? (
              <>
                <Image
                  source={require('@/assets/images/empty-pantry.png')}
                  style={styles.emptyImage}
                  contentFit="contain"
                  transition={200}
                />
                <Text style={styles.emptyTitle}>Your pantry is empty</Text>
                <Text style={styles.emptySubtitle}>
                  Add groceries to start tracking their expiry dates
                </Text>
                <Pressable
                  style={styles.addButton}
                  onPress={() => router.push('/(tabs)/add')}
                >
                  <MaterialIcons name="add" size={18} color={Colors.textOnPrimary} />
                  <Text style={styles.addButtonText}>Add First Item</Text>
                </Pressable>
              </>
            ) : (
              <>
                <MaterialIcons name="filter-list-off" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No items match</Text>
                <Text style={styles.emptySubtitle}>Try changing your filters</Text>
              </>
            )}
          </View>
        ) : (
          <View style={styles.itemsList}>
            {filteredItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: Fonts.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.expiredBg,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.expiredBorder,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: Fonts.semibold,
    color: Colors.expired,
  },
  scroll: {
    flex: 1,
  },
  filterSection: {
    height: 52,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: Fonts.medium,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.textOnPrimary,
  },
  categorySection: {
    height: 52,
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  catEmoji: {
    fontSize: 14,
  },
  catLabel: {
    fontSize: 12,
    fontWeight: Fonts.medium,
    color: Colors.textSecondary,
  },
  catLabelActive: {
    color: Colors.primaryDark,
  },
  itemsList: {
    paddingTop: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  emptyImage: {
    width: 220,
    height: 165,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: Fonts.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.full,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: Fonts.semibold,
    color: Colors.textOnPrimary,
  },
});
