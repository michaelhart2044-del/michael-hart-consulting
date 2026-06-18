import Image from 'next/image';
import { site } from '@/lib/site';

const sizes = {
  nav: { width: 40, height: 40, className: 'h-10 w-10' },
  hero: { width: 176, height: 176, className: 'h-44 w-44' },
  auth: { width: 56, height: 56, className: 'h-14 w-14' },
} as const;

export type BrandLogoSize = keyof typeof sizes;

interface BrandLogoProps {
  size?: BrandLogoSize;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
}

export default function BrandLogo({
  size = 'nav',
  className = '',
  priority = false,
  decorative = false,
}: BrandLogoProps) {
  const dimensions = sizes[size];

  return (
    <Image
      src={site.logo}
      alt={decorative ? '' : `${site.name} logo`}
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      className={`${dimensions.className} object-contain shrink-0 ${className}`}
    />
  );
}
