import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View, Pressable } from 'react-native';
import type { Item } from '@pickle/core';
import { extractMinutes, hostLabel, savedAgo, BUILTIN_COLLECTIONS } from '@pickle/core';
import { colors } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';
import { openUrl } from '../data/links';
import { useStore, suggestFor } from '../data/store';

interface Props {
  item: Item;
  onDelete: () => void;
  onSort: () => void;
  onRemind: () => void;
}

const THRESHOLD = 110;

/** The top inbox card. Swipe left to delete, up to sort, right to remind. */
export function InboxCard({ item, onDelete, onSort, onRemind }: Props) {
  const history = useStore((s) => s.history);
  const markOpened = useStore((s) => s.markOpened);
  const pan = useRef(new Animated.ValueXY()).current;
  const handlers = useRef({ onDelete, onSort, onRemind });
  handlers.current = { onDelete, onSort, onRemind };

  useEffect(() => { pan.setValue({ x: 0, y: 0 }); }, [item.id]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8,
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
        onPanResponderRelease: (_, g) => {
          const back = () => Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          if (g.dx < -THRESHOLD) { handlers.current.onDelete(); back(); }
          else if (g.dy < -THRESHOLD) { handlers.current.onSort(); back(); }
          else if (g.dx > THRESHOLD) { handlers.current.onRemind(); back(); }
          else back();
        },
      }),
    [pan],
  );

  const suggestionKey = suggestFor(item, history);
  const suggestion = BUILTIN_COLLECTIONS.find((c) => c.builtinKey === suggestionKey);
  const minutes = item.caption ? extractMinutes(item.caption) : null;

  const rotate = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-7deg', '0deg', '7deg'] });
  const del = pan.x.interpolate({ inputRange: [-THRESHOLD, -30], outputRange: [1, 0], extrapolate: 'clamp' });
  const rem = pan.x.interpolate({ inputRange: [30, THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const srt = pan.y.interpolate({ inputRange: [-THRESHOLD, -30], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={[styles.under, { left: 16, right: 16, bottom: -9, backgroundColor: '#8E9370' }]} />
      <View style={[styles.under, { left: 8, right: 8, bottom: -4, backgroundColor: '#B9BE96' }]} />
      <Animated.View {...responder.panHandlers} style={[styles.card, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }]}>
        <View style={styles.cover}>
          <Icon name={item.sourceType === 'youtube' ? 'yt' : item.sourceType === 'github' ? 'code' : 'link'} size={44} color={colors.noteInk} strokeWidth={1.5} />
          <View style={styles.src}><Text style={{ fontSize: 11, lineHeight: 15 }} color={colors.text} bold>{item.sourceUrl ? hostLabel(item.sourceUrl) : 'manual'}</Text></View>
          <Animated.View style={[styles.stamp, { opacity: del, left: 14, borderColor: '#A8354A' }]}><Text bold color="#A8354A" style={{ fontSize: 13 }}>DELETE</Text></Animated.View>
          <Animated.View style={[styles.stamp, { opacity: rem, right: 14, borderColor: '#3E4A12' }]}><Text bold color="#3E4A12" style={{ fontSize: 13 }}>REMIND</Text></Animated.View>
          <Animated.View style={[styles.stamp, { opacity: srt, alignSelf: 'center', borderColor: '#1A1A18' }]}><Text bold color="#1A1A18" style={{ fontSize: 13 }}>SORT</Text></Animated.View>
        </View>
        <View style={{ paddingHorizontal: 6, paddingTop: 14 }}>
          <Text style={{ fontSize: 12 }} color={colors.noteMuted}>Saved {savedAgo(item.sharedAt)}</Text>
          <Text numberOfLines={3} bold style={{ fontSize: 19, lineHeight: 25, marginVertical: 2, marginBottom: 12 }} color={colors.noteInk}>{item.title ?? 'Untitled'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {suggestion ? <View style={[styles.pill, { backgroundColor: colors.noteInk }]}><Text style={{ fontSize: 11, lineHeight: 15 }} color={colors.accent} bold>Looks like {suggestion.name}</Text></View> : null}
            {minutes ? <View style={[styles.pill, { backgroundColor: 'rgba(26,26,24,0.09)' }]}><Text style={{ fontSize: 11, lineHeight: 15 }} color={colors.noteInk}>{minutes} min</Text></View> : null}
            <View style={{ flex: 1 }} />
            <Pressable accessibilityRole="link" onPress={() => { markOpened(item.id); openUrl(item.sourceUrl); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 }}>
              <Text bold style={{ fontSize: 12 }} color={colors.noteInk}>Open link</Text>
              <Icon name="ext" size={14} color={colors.noteInk} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  under: { position: 'absolute', height: 32, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  card: { backgroundColor: colors.note, borderRadius: 28, padding: 12, paddingBottom: 16 },
  cover: { height: 196, borderRadius: 20, backgroundColor: '#C3CB8F', alignItems: 'center', justifyContent: 'center' },
  src: { position: 'absolute', left: 12, top: 12, backgroundColor: colors.noteInk, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 3 },
  stamp: { position: 'absolute', top: 14, borderWidth: 2, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2 },
  pill: { borderRadius: 99, paddingHorizontal: 11, paddingVertical: 3 },
});
