import React from 'react';
import { Landmark, Wallet, PiggyBank, CreditCard, Banknote, Coins, DollarSign, Bitcoin, Smartphone, Building2, Briefcase, Gem, TrendingUp, HandCoins, Receipt, ShoppingBag, ShoppingCart, Car, Home, Plane, GraduationCap, Heart, Gift, Shield, Award, FileText, HeartPulse, Tv, Utensils, HelpCircle, type LucideIcon } from 'lucide-react';
const icons: Record<string, LucideIcon> = { Landmark, Wallet, PiggyBank, CreditCard, Banknote, Coins, DollarSign, Bitcoin, Smartphone, Building2, Briefcase, Gem, TrendingUp, HandCoins, Receipt, ShoppingBag, ShoppingCart, Car, Home, Plane, GraduationCap, Heart, Gift, Shield, Award, FileText, HeartPulse, Tv, Utensils, HelpCircle };

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-5 h-5', size = 20 }) => {
  const IconComponent = icons[name] || HelpCircle;
  return <IconComponent className={className} size={size} />;
};
