import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Compass,
  Quote,
  BookOpen,
  Activity,
  Coins,
  CheckSquare,
  CheckCircle2,
  Clock,
  Target,
  Sun,
  Moon,
  LogOut,
  User,
  Sliders,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Layers,
  Sparkles
} from 'lucide-react';

const ICONS = {
  LayoutDashboard,
  Calendar,
  Compass,
  Quote,
  BookOpen,
  Activity,
  Coins,
  CheckSquare,
  CheckCircle2,
  Clock,
  Target,
  Sun,
  Moon,
  LogOut,
  User,
  Sliders,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Layers,
  Sparkles
};

interface IconRendererProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function IconRenderer({ name, size = 18, className, style }: IconRendererProps) {
  const Component = ICONS[name as keyof typeof ICONS] || Sparkles;
  return <Component size={size} className={className} style={style} />;
}
