declare module 'lottie-react-native' {
  import { ViewStyle } from 'react-native';
  import { Component } from 'react';

  interface LottieViewProps {
    source: string | object;
    progress?: number;
    speed?: number;
    loop?: boolean;
    autoPlay?: boolean;
    style?: ViewStyle;
    resizeMode?: 'cover' | 'contain' | 'center';
    renderMode?: 'AUTOMATIC' | 'HARDWARE' | 'SOFTWARE';
    onAnimationFinish?: () => void;
  }

  export default class LottieView extends Component<LottieViewProps> {
    play(): void;
    reset(): void;
    pause(): void;
    resume(): void;
  }
}