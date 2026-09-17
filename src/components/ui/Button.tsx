import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'subtle' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

/**
 * Global Button Component for SECOND BRAIN
 * Defaults to the rich metallic Liquid Gold style for primary interactive actions.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled = false,
      children,
      className = '',
      style,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isPrimary = variant === 'primary' || variant === 'gold';
    const isSecondary = variant === 'secondary' || variant === 'subtle';
    const isDanger = variant === 'danger';
    const isOutline = variant === 'outline';
    const isGhost = variant === 'ghost';

    // Base variant class mapping
    let variantClass = 'neu-btn-primary';
    if (isPrimary) {
      variantClass = 'neu-btn-primary neu-btn-gold';
    } else if (isSecondary) {
      variantClass = 'neu-btn-secondary';
    } else if (isDanger) {
      variantClass = 'neu-btn-danger';
    } else if (isOutline) {
      variantClass = 'neu-btn-outline';
    } else if (isGhost) {
      variantClass = 'neu-btn-ghost';
    }

    // Size styling
    const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
      sm: {
        padding: size === 'icon' ? '0' : '0.4rem 0.85rem',
        fontSize: '0.8125rem',
        minHeight: '34px',
        borderRadius: 'var(--radius-sm)'
      },
      md: {
        padding: size === 'icon' ? '0' : '0.65rem 1.35rem',
        fontSize: '0.9375rem',
        minHeight: '44px',
        borderRadius: 'var(--radius-md)'
      },
      lg: {
        padding: size === 'icon' ? '0' : '0.85rem 1.75rem',
        fontSize: '1rem',
        minHeight: '52px',
        borderRadius: 'var(--radius-md)'
      },
      icon: {
        padding: '0',
        width: '44px',
        height: '44px',
        minHeight: '44px',
        borderRadius: 'var(--radius-md)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    };

    const combinedStyle: React.CSSProperties = {
      ...sizeStyles[size],
      width: fullWidth ? '100%' : undefined,
      ...style
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading ? 'true' : undefined}
        className={`${variantClass} ${className}`.trim()}
        style={combinedStyle}
        {...props}
      >
        {loading ? (
          <>
            <Loader2
              size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16}
              className="animate-spin"
              style={{ flexShrink: 0 }}
            />
            {children && <span>{children}</span>}
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                {icon}
              </span>
            )}
            {children && <span>{children}</span>}
            {icon && iconPosition === 'right' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                {icon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
