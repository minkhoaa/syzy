import React from 'react';
import Image from 'next/image';

interface SolIconProps {
  className?: string;
  size?: number;
}

export function SolIcon({ className = "", size = 20 }: SolIconProps) {
  return (
    <Image
      src="/stellar/stellar.png"
      alt="Stellar"
      width={size}
      height={size}
      className={`inline-block rounded-full bg-white ${className}`}
    />
  );
}
