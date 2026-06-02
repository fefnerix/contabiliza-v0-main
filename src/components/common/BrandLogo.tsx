import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCompanyName?: boolean;
  className?: string;
  /** Classe extra no texto da marca */
  textClassName?: string;
}

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl sm:text-3xl',
};

const DEFAULT_BRAND_NAME = 'Contabiliza';

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showCompanyName = true,
  className = '',
  textClassName = '',
}) => {
  const { companyName, isLoading } = useBrandingConfig();
  const displayName = companyName?.trim() || DEFAULT_BRAND_NAME;

  if (isLoading) {
    return (
      <div className={cn('flex items-center', className)}>
        <Skeleton className={cn('h-6', size === 'xl' ? 'w-36' : 'w-24')} />
      </div>
    );
  }

  if (!showCompanyName) {
    return null;
  }

  return (
    <div className={cn('flex items-center', className)}>
      <span
        className={cn(
          textSizeClasses[size],
          'font-bold text-primary tracking-tight',
          textClassName
        )}
      >
        {displayName}
      </span>
    </div>
  );
};
