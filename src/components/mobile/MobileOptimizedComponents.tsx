/**
 * Mobile-Optimized UI Components
 * Touch-friendly, gesture-enabled, and responsive components for mobile devices
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Animated,
  PanGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  State,
  Dimensions,
  Platform,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TouchableNativeFeedback,
  TouchableHighlight
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

// Types
export interface MobileCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: any;
  disabled?: boolean;
  elevation?: number;
  ripple?: boolean;
  haptic?: boolean;
  testID?: string;
}

export interface SwipeActionProps {
  children: React.ReactNode;
  leftActions?: Array<{
    title: string;
    icon?: any;
    color: string;
    onPress: () => void;
  }>;
  rightActions?: Array<{
    title: string;
    icon?: any;
    color: string;
    onPress: () => void;
  }>;
  onSwipe?: (direction: 'left' | 'right') => void;
  threshold?: number;
}

export interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  children: React.ReactNode;
  colors?: string[];
  tintColor?: string;
}

export interface InfiniteScrollProps {
  data: any[];
  renderItem: ({ item, index }: { item: any; index: number }) => React.ReactNode;
  keyExtractor: (item: any, index: number) => string;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore?: boolean;
  ListHeaderComponent?: React.ReactNode;
  ListFooterComponent?: React.ReactNode;
  ListEmptyComponent?: React.ReactNode;
  contentContainerStyle?: any;
}

export interface MobileModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: 'slide' | 'fade' | 'none';
  presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
  backdropOpacity?: number;
  dismissOnBackdrop?: boolean;
  hapticOnClose?: boolean;
}

export interface FloatingActionProps {
  actions: Array<{
    icon: any;
    label: string;
    onPress: () => void;
    color?: string;
  }>;
  position?: 'bottomRight' | 'bottomLeft' | 'centerRight';
  icon?: any;
  color?: string;
  size?: number;
}

export interface QuickActionsProps {
  actions: Array<{
    id: string;
    title: string;
    icon?: any;
    color?: string;
    onPress: () => void;
    disabled?: boolean;
  }>;
  columns?: number;
  style?: any;
}

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  showCancel?: boolean;
  onCancel?: () => void;
  clearButtonMode?: 'never' | 'while-editing' | 'unless-editing' | 'always';
}

// Utility functions
const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const getTouchTargetSize = (minimum: number = 44) => Math.max(minimum, isTablet ? minimum * 1.2 : minimum);

/**
 * Mobile Card - Touch-optimized card component
 */
export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  onPress,
  onLongPress,
  style,
  disabled = false,
  elevation = 2,
  ripple = true,
  haptic = true,
  testID
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (disabled) return;

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true
      })
    ]).start();

    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [disabled, haptic, scaleAnim, opacityAnim]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      })
    ]).start();
  }, [disabled, scaleAnim, opacityAnim]);

  const handlePress = useCallback(() => {
    if (disabled || !onPress) return;

    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onPress();
  }, [disabled, haptic, onPress]);

  const handleLongPress = useCallback(() => {
    if (disabled || !onLongPress) return;

    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    onLongPress();
  }, [disabled, haptic, onLongPress]);

  const TouchableComponent = Platform.OS === 'android' && ripple
    ? TouchableNativeFeedback
    : TouchableHighlight;

  return (
    <View style={[styles.cardContainer, { elevation }, style]}>
      <TouchableComponent
        testID={testID}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        underlayColor={ripple ? 'rgba(0,0,0,0.05)' : 'transparent'}
        background={Platform.OS === 'android' && ripple
          ? TouchableNativeFeedback.Ripple('rgba(0,0,0,0.1)', false)
          : undefined
        }
        style={{ borderRadius: 12 }}
      >
        <Animated.View
          style={[
            styles.cardContent,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim
            }
          ]}
        >
          {children}
        </Animated.View>
      </TouchableComponent>
    </View>
  );
};

/**
 * Swipe Action - Swipeable list item with actions
 */
export const SwipeAction: React.FC<SwipeActionProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onSwipe,
  threshold = 100
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);
  const swipeRef = useRef<any>(null);

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const handleHandlerStateChange = useCallback((event: any) => {
    const { nativeEvent } = event;
    const { translationX, state } = nativeEvent;

    if (state === State.END) {
      let shouldReset = true;

      if (translationX > threshold && leftActions.length > 0) {
        // Swiped right
        shouldReset = false;
        onSwipe?.('right');
        leftActions[0].onPress();

        if (Platform.OS !== 'android') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else if (translationX < -threshold && rightActions.length > 0) {
        // Swiped left
        shouldReset = false;
        onSwipe?.('left');
        rightActions[0].onPress();

        if (Platform.OS !== 'android') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      if (shouldReset) {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8
        }).start();
      } else {
        lastOffset.current = translationX;
      }
    }
  }, [translateX, threshold, leftActions, rightActions, onSwipe]);

  const renderLeftActions = () => {
    if (leftActions.length === 0) return null;

    return (
      <View style={styles.leftActions}>
        {leftActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionButton, { backgroundColor: action.color }]}
            onPress={action.onPress}
          >
            {action.icon && <View style={styles.actionIcon}>{action.icon}</View>}
            <Text style={styles.actionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRightActions = () => {
    if (rightActions.length === 0) return null;

    return (
      <View style={styles.rightActions}>
        {rightActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionButton, { backgroundColor: action.color }]}
            onPress={action.onPress}
          >
            <Text style={styles.actionText}>{action.title}</Text>
            {action.icon && <View style={styles.actionIcon}>{action.icon}</View>}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.swipeContainer}>
      {renderLeftActions()}
      <PanGestureHandler
        ref={swipeRef}
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.swipeContent,
            {
              transform: [{ translateX }]
            }
          ]}
        >
          {renderRightActions()}
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

/**
 * Pull to Refresh - Custom pull-to-refresh component
 */
export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  refreshing,
  children,
  colors = ['#007AFF'],
  tintColor = '#007AFF'
}) => {
  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={colors}
          tintColor={tintColor}
          progressBackgroundColor="transparent"
        />
      }
      contentContainerStyle={styles.refreshContainer}
    >
      {children}
    </ScrollView>
  );
};

/**
 * Infinite Scroll - Optimized infinite scrolling list
 */
export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  data,
  renderItem,
  keyExtractor,
  onLoadMore,
  hasMore,
  loadingMore = false,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  contentContainerStyle
}) => {
  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore) {
      onLoadMore();
    }
  }, [hasMore, loadingMore, onLoadMore]);

  const renderFooter = useCallback(() => {
    if (ListFooterComponent) {
      return ListFooterComponent;
    }

    if (loadingMore) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }

    if (!hasMore && data.length > 0) {
      return (
        <View style={styles.endOfList}>
          <Text style={styles.endOfListText}>End of list</Text>
        </View>
      );
    }

    return null;
  }, [ListFooterComponent, loadingMore, hasMore, data.length]);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={contentContainerStyle}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
      getItemLayout={undefined}
      showsVerticalScrollIndicator={false}
    />
  );
};

/**
 * Mobile Modal - Responsive modal component
 */
export const MobileModal: React.FC<MobileModalProps> = ({
  visible,
  onClose,
  children,
  animationType = 'slide',
  presentationStyle = isTablet ? 'pageSheet' : 'overFullScreen',
  backdropOpacity = 0.5,
  dismissOnBackdrop = true,
  hapticOnClose = true
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [visible, fadeAnim]);

  const handleBackdropPress = useCallback(() => {
    if (dismissOnBackdrop) {
      if (hapticOnClose && Platform.OS !== 'android') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onClose();
    }
  }, [dismissOnBackdrop, hapticOnClose, onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      presentationStyle={presentationStyle}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: backdropOpacity }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleBackdropPress}
        />
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ scale: fadeAnim }],
              opacity: fadeAnim
            }
          ]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

/**
 * Floating Action Button - Quick action FAB
 */
export const FloatingActionButton: React.FC<FloatingActionProps> = ({
  actions,
  position = 'bottomRight',
  icon,
  color = '#007AFF',
  size = 56
}) => {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleExpanded = useCallback(() => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);

    Animated.spring(rotateAnim, {
      toValue: newExpanded ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8
    }).start();

    if (Platform.OS !== 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [expanded, rotateAnim]);

  const getPositionStyle = useCallback(() => {
    const baseStyle = {
      position: 'absolute' as const,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color
    };

    const positions = {
      bottomRight: { right: 20, bottom: 20 },
      bottomLeft: { left: 20, bottom: 20 },
      centerRight: { right: 20, bottom: height / 2 - size / 2 }
    };

    return { ...baseStyle, ...positions[position] };
  }, [position, color, size]);

  const renderAction = (action: any, index: number) => {
    const translateY = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -(index + 1) * 70]
    });

    const opacity = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1]
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.fabAction,
          getPositionStyle(),
          {
            transform: [{ translateY }],
            opacity,
            backgroundColor: action.color || color
          }
        ]}
      >
        <TouchableOpacity
          style={styles.fabActionButton}
          onPress={() => {
            action.onPress();
            setExpanded(false);
          }}
        >
          <Text style={styles.fabActionText}>{action.label[0]}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.fabContainer}>
      {expanded && actions.map((action, index) => renderAction(action, index))}

      <Animated.View
        style={[
          styles.fab,
          getPositionStyle(),
          {
            transform: [
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '45deg']
                })
              }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={toggleExpanded}
        >
          {icon || (
            <Text style={[styles.fabIcon, { color: 'white' }]}>
              {expanded ? '×' : '+'}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

/**
 * Quick Actions Grid - Touch-friendly action grid
 */
export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  columns = isTablet ? 4 : 3,
  style
}) => {
  const handlePress = useCallback((action: any) => {
    if (action.disabled) return;

    if (Platform.OS !== 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    action.onPress();
  }, []);

  const renderAction = (action: any, index: number) => (
    <MobileCard
      key={action.id}
      style={[styles.quickAction, { width: `${100 / columns}%` }]}
      onPress={() => handlePress(action)}
      disabled={action.disabled}
    >
      <View style={styles.quickActionContent}>
        {action.icon && (
          <View style={[styles.quickActionIcon, { backgroundColor: action.color || '#007AFF' }]}>
            {action.icon}
          </View>
        )}
        <Text style={styles.quickActionText}>{action.title}</Text>
      </View>
    </MobileCard>
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.quickActionsContainer, style]}
    >
      {actions.map(renderAction)}
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 16,
    borderRadius: 12,
  },
  swipeContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  swipeContent: {
    flex: 1,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    minWidth: 80,
    height: '100%',
  },
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshContainer: {
    flexGrow: 1,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  endOfList: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  endOfListText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  fabContainer: {
    position: 'absolute',
    ...StyleSheet.absoluteFillObject,
  },
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  fabButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  fabAction: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 999,
  },
  fabActionButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickAction: {
    marginRight: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  quickActionContent: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
});

export default {
  MobileCard,
  SwipeAction,
  PullToRefresh,
  InfiniteScroll,
  MobileModal,
  FloatingActionButton,
  QuickActions,
};