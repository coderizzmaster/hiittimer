import React from 'react';
import { Platform, Text, Image } from 'react-native';

const EMOJI_IMAGES = {
  '⏱': require('../../assets/emoji/23f1.png'),
  '🕐': require('../../assets/emoji/1f550.png'),
  '⚙️': require('../../assets/emoji/2699.png'),
  '📊': require('../../assets/emoji/1f4ca.png'),
  '⚡': require('../../assets/emoji/26a1.png'),
  '🎯': require('../../assets/emoji/1f3af.png'),
  '🔖': require('../../assets/emoji/1f516.png'),
  '🏆': require('../../assets/emoji/1f3c6.png'),
};

export default function EmojiIcon({ emoji, size = 22, style }) {
  if (Platform.OS === 'android' && EMOJI_IMAGES[emoji]) {
    return <Image source={EMOJI_IMAGES[emoji]} style={[{ width: size, height: size }, style]} />;
  }
  return <Text style={[{ fontSize: size }, style]}>{emoji}</Text>;
}
