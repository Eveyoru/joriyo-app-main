// Font configuration for Okra fonts
export const Fonts = {
  regular: 'Okra-Regular',
  medium: 'Okra-Medium',
  mediumLight: 'Okra-MediumLight',
  bold: 'Okra-Bold',
  extraBold: 'Okra-ExtraBold',
};

// Font weight mapping for easier use in styles
export const FontWeights = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
};

// Helpers
export const applyFontFamily = (weight: 'regular' | 'medium' | 'mediumLight' | 'bold' | 'extraBold') => {
  return Fonts[weight];
};
