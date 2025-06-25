import { Text, type TextProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Fonts } from '@/constants/Fonts';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  const fontStyles = StyleSheet.create({
    defaultText: {
      fontFamily: Fonts.regular,
      color,
    },
    default: {
      fontSize: 16,
      lineHeight: 24,
    },
    defaultSemiBold: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600',
      fontFamily: Fonts.medium,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 32,
      fontFamily: Fonts.bold,
    },
    subtitle: {
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: Fonts.medium,
    },
    link: {
      lineHeight: 30,
      fontSize: 16,
      color: '#0a7ea4',
    },
  });

  return (
    <Text
      style={[
        fontStyles.defaultText,
        type === 'default' ? fontStyles.default : undefined,
        type === 'title' ? fontStyles.title : undefined,
        type === 'defaultSemiBold' ? fontStyles.defaultSemiBold : undefined,
        type === 'subtitle' ? fontStyles.subtitle : undefined,
        type === 'link' ? fontStyles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

export default ThemedText;
