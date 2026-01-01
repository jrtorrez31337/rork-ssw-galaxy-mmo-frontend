import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { tokens } from '@/ui/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
// Account for left rail width (72px) and padding
const LCARS_CONTENT_WIDTH = SCREEN_WIDTH - 72 - 16;

interface SwipeableLCARSContainerProps {
  pages: React.ReactNode[];
  /** Color for active page dot (defaults to rail color) */
  activeColor?: string;
}

/**
 * SwipeableLCARSContainer - Horizontal paging container for LCARS bar content
 *
 * Takes an array of page components and renders them in a horizontally
 * swipeable container with page indicator dots at the bottom.
 *
 * Each page takes the full width of the LCARS bar content area.
 */
export function SwipeableLCARSContainer({
  pages,
  activeColor = tokens.colors.lcars.orange,
}: SwipeableLCARSContainerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const page = Math.round(offsetX / LCARS_CONTENT_WIDTH);
      if (page !== currentPage && page >= 0 && page < pages.length) {
        setCurrentPage(page);
      }
    },
    [currentPage, pages.length]
  );

  if (pages.length === 0) {
    return null;
  }

  // Single page - no swiping needed
  if (pages.length === 1) {
    return (
      <View style={styles.container}>
        <View style={styles.singlePage}>{pages[0]}</View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={LCARS_CONTENT_WIDTH}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
      >
        {pages.map((page, index) => (
          <View
            key={index}
            style={[styles.page, { width: LCARS_CONTENT_WIDTH }]}
          >
            {page}
          </View>
        ))}
      </ScrollView>

      {/* Page indicator dots */}
      <View style={styles.dotsContainer}>
        {pages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentPage === index
                ? [styles.dotActive, { backgroundColor: activeColor }]
                : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'stretch',
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  singlePage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    // backgroundColor set dynamically
  },
  dotInactive: {
    backgroundColor: tokens.colors.text.muted,
    opacity: 0.4,
  },
});
