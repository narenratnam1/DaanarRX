/**
 * Theme and styling-related type definitions
 */

import { ButtonProps as TamaguiButtonProps } from 'tamagui';

// Button style configuration
export interface ButtonStyleConfig {
  backgroundColor: string;
  color: string;
  borderWidth?: number;
  borderColor?: string;
  hoverStyle: {
    backgroundColor?: string;
    opacity?: number;
  };
  pressStyle: {
    backgroundColor?: string;
    scale?: number;
    opacity?: number;
  };
  focusStyle: {
    borderColor: string;
    borderWidth: number;
  };
}

export interface IconButtonStyleConfig extends Omit<ButtonStyleConfig, 'size'> {
  size: string;
  circular: boolean;
}

export interface DisabledButtonStyle {
  backgroundColor: string;
  color: string;
  opacity: number;
  cursor: string;
  hoverStyle: {
    opacity: number;
  };
  pressStyle: {
    scale: number;
  };
}

// Theme button styles
export interface ButtonStyles {
  primary: ButtonStyleConfig;
  secondary: ButtonStyleConfig;
  destructive: ButtonStyleConfig;
  success: ButtonStyleConfig;
  warning: ButtonStyleConfig;
  ghost: ButtonStyleConfig;
  disabled: DisabledButtonStyle;
}

export interface IconButtonStyles {
  primary: IconButtonStyleConfig;
  destructive: IconButtonStyleConfig;
  warning: IconButtonStyleConfig;
}

// Extended Tamagui button props with our custom variants
export interface CustomButtonProps extends Omit<Partial<TamaguiButtonProps>, 'variant'> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'success' | 'warning' | 'ghost';
  'aria-label'?: string;
  accessibilityLabel?: string;
}

// Color tokens
export type ColorToken = 
  | '$blue' | '$blue8' | '$blue9' | '$blue10' | '$blue11'
  | '$gray' | '$gray5' | '$gray7' | '$gray8' | '$gray9' | '$gray10' | '$gray11'
  | '$red' | '$red8' | '$red9' | '$red10' | '$red11' | '$red2'
  | '$green' | '$green2' | '$green8' | '$green9' | '$green10' | '$green11'
  | '$yellow' | '$yellow8' | '$yellow9' | '$yellow10' | '$yellow11'
  | '$orange' | '$orange8' | '$orange9' | '$orange10' | '$orange11'
  | '$purple' | '$purple10'
  | '$background' | '$backgroundHover' | '$backgroundPress'
  | '$borderColor' | '$color' | '$shadowColor';

// Size tokens
export type SizeToken = '$1' | '$2' | '$3' | '$4' | '$5' | '$6' | '$7' | '$8' | '$9' | '$10';

// Space tokens
export type SpaceToken = SizeToken;

// Responsive breakpoints
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'gtSm' | 'gtMd';

// Responsive prop helper type
export type ResponsiveProp<T> = T | {
  [key in Breakpoint]?: T;
};

