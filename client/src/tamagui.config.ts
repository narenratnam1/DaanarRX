import { config } from '@tamagui/config/v3'
import { createTamagui } from 'tamagui'

const tamaguiConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,
      background: '#f3f4f6',
      backgroundHover: '#e5e7eb',
      backgroundPress: '#d1d5db',
      backgroundFocus: '#e5e7eb',
      borderColor: '#d1d5db',
      borderColorHover: '#9ca3af',
      borderColorFocus: '#3b82f6',
      color: '#111827',
      colorHover: '#000000',
      colorPress: '#000000',
      colorFocus: '#000000',
      placeholderColor: '#6b7280',
      blue: '#3b82f6',
      green: '#10b981',
      red: '#ef4444',
      yellow: '#f59e0b',
      gray: '#6b7280',
    },
  },
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  },
})

export type Conf = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default tamaguiConfig

