import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

interface AnimationViewProps {
  source: string | any;
  autoPlay?: boolean;
  loop?: boolean;
  style?: ViewStyle;
  onAnimationFinish?: () => void;
}

export const AnimationView: React.FC<AnimationViewProps> = ({ 
  source, 
  autoPlay = true, 
  loop = true, 
  style,
  onAnimationFinish 
}) => {
  // Use proper type for the ref
  const animationRef = React.useRef<LottieView | null>(null);

  return (
    <View style={[styles.container, style]}>
      <LottieView
        ref={animationRef}
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        style={styles.animation}
        onAnimationFinish={onAnimationFinish}
        renderMode="AUTOMATIC"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  }
});

export default AnimationView;
