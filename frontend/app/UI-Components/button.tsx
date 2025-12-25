import { cva, VariantProps } from "class-variance-authority";
import React from "react";

const buttonVariants = cva(
  'button inline-flex',
  {
    variants: {
      variant: {
        primary: 'button--primary bg-blue-700 text-amber-50 hover:bg-blue-800 focus:ring-blue-600',
        secondary: 'button--secondary bg-gray-300 text-gray-800 hover:bg-gray-400 focus:ring-gray-200',
        buy: 'button--buy bg-green-700 text-white hover:bg-green-800 focus:ring-green-600',
        ghost: 'button--ghost text-blue-700 hover:bg-blue-600 focus:ring-blue-600',
        danger: 'button--danger bg-red-600 text-white hover:bg-red-600 focus: ring-red-500',
        minimal: 'button--minimal bg-black text-white hover:bg-gray-900',
        opaque: 'button-transparent bg-transparent text-black hover:bg-gray-200',
      },
      size: {
        sm: 'button--sm text-sm px-3 py-1.5 rounded-sm',
        md: 'button--md text-md px-4 py-2 rounded-md',
        lg: 'button--lg text-lg px-6 py-3 rounded-lg',
        xl: 'button-xl text-xl px-8 py-4 rounded-xl',
      },
      fullwidth: {
        true: 'button--full-width w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

// eslint-disable-next-line react/display-name
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    fullwidth,
    leftIcon,
    rightIcon,
    isLoading,
    disabled,
    children,
    ...props
  },
    ref
  ) => {
    return (
      <button ref={ref}
        className={buttonVariants({ variant, size, fullwidth, className })}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="button__spinner mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
        )}

        {!isLoading && leftIcon && (
          <span className="button__icon button__icon--left mr-2">{leftIcon}</span>
        )}

        {!isLoading && rightIcon && (
          <span className="button__icon button__icon--right mr-2">{rightIcon}</span>
        )}
        <span className="button__text">{children}</span>
      </button>
    )
  });

Button.displayName = 'Button';