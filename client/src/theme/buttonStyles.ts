// Standardized button styles for consistent UI across the application
// Using Tamagui theme tokens for color consistency

import type { ButtonStyles, IconButtonStyles, ButtonVariant, IconButtonVariant } from '../types';

export const buttonStyles: ButtonStyles = {
  // Primary action buttons (main CTAs like submit, save, proceed)
  primary: {
    backgroundColor: "$blue9",
    color: "white",
    hoverStyle: { backgroundColor: "$blue10", opacity: 0.9 },
    pressStyle: { backgroundColor: "$blue11", scale: 0.98 },
    focusStyle: { borderColor: "$blue8", borderWidth: 2 },
  },

  // Secondary action buttons (cancel, back, neutral actions)
  secondary: {
    backgroundColor: "$gray8",
    color: "white",
    hoverStyle: { backgroundColor: "$gray9", opacity: 0.9 },
    pressStyle: { backgroundColor: "$gray10", scale: 0.98 },
    focusStyle: { borderColor: "$gray7", borderWidth: 2 },
  },

  // Destructive/warning action buttons (delete, remove, discard)
  destructive: {
    backgroundColor: "$red9",
    color: "white",
    hoverStyle: { backgroundColor: "$red10", opacity: 0.9 },
    pressStyle: { backgroundColor: "$red11", scale: 0.98 },
    focusStyle: { borderColor: "$red8", borderWidth: 2 },
  },

  // Success/confirm action buttons (confirm, approve)
  success: {
    backgroundColor: "$green9",
    color: "white",
    hoverStyle: { backgroundColor: "$green10", opacity: 0.9 },
    pressStyle: { backgroundColor: "$green11", scale: 0.98 },
    focusStyle: { borderColor: "$green8", borderWidth: 2 },
  },

  // Warning action buttons (caution, proceed with care)
  warning: {
    backgroundColor: "$yellow9",
    color: "white",
    hoverStyle: { backgroundColor: "$yellow10", opacity: 0.9 },
    pressStyle: { backgroundColor: "$yellow11", scale: 0.98 },
    focusStyle: { borderColor: "$yellow8", borderWidth: 2 },
  },

  // Ghost/outline buttons (subtle secondary actions)
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "$borderColor",
    color: "$color",
    hoverStyle: { backgroundColor: "$backgroundHover", opacity: 0.9 },
    pressStyle: { backgroundColor: "$backgroundPress", scale: 0.98 },
    focusStyle: { borderColor: "$blue8", borderWidth: 2 },
  },

  // Disabled state (applies to all button types)
  disabled: {
    backgroundColor: "$gray5",
    color: "$gray9",
    opacity: 0.6,
    cursor: "not-allowed",
    hoverStyle: { opacity: 0.6 },
    pressStyle: { scale: 1 },
  },
};

// Icon button styles (circular, compact)
export const iconButtonStyles: IconButtonStyles = {
  primary: {
    size: "$3",
    circular: true,
    backgroundColor: "$blue9",
    color: "white",
    hoverStyle: { backgroundColor: "$blue10" },
    pressStyle: { backgroundColor: "$blue11", scale: 0.95 },
    focusStyle: { borderColor: "$blue8", borderWidth: 2 },
  },

  destructive: {
    size: "$3",
    circular: true,
    backgroundColor: "$red9",
    color: "white",
    hoverStyle: { backgroundColor: "$red10" },
    pressStyle: { backgroundColor: "$red11", scale: 0.95 },
    focusStyle: { borderColor: "$red8", borderWidth: 2 },
  },

  warning: {
    size: "$3",
    circular: true,
    backgroundColor: "$orange9",
    color: "white",
    hoverStyle: { backgroundColor: "$orange10" },
    pressStyle: { backgroundColor: "$orange11", scale: 0.95 },
    focusStyle: { borderColor: "$orange8", borderWidth: 2 },
  },
};

// Helper function to merge button styles with custom props
export const getButtonProps = (
  variant: ButtonVariant,
  customProps: Record<string, any> = {}
): Record<string, any> => {
  const baseStyle = buttonStyles[variant];
  return {
    ...baseStyle,
    ...customProps,
    // Ensure accessibility
    accessible: true,
    accessibilityRole: 'button',
  };
};

// Helper function for icon buttons
export const getIconButtonProps = (
  variant: IconButtonVariant,
  customProps: Record<string, any> = {}
): Record<string, any> => {
  const baseStyle = iconButtonStyles[variant];
  return {
    ...baseStyle,
    ...customProps,
    accessible: true,
    accessibilityRole: 'button',
  };
};

