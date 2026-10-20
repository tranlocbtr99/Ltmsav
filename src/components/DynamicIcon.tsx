import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-5 h-5', size = 20 }) => {
  // @ts-ignore
  const IconComponent = (LucideIcons as Record<string, any>)[name] || LucideIcons.HelpCircle;
  return <IconComponent className={className} size={size} />;
};
