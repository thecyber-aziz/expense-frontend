import {
  ArrowLeftRight, UtensilsCrossed, ShoppingBag, Car,
  HeartPulse, Gamepad2, Briefcase, Home, User, ShoppingCart, Zap,
} from "lucide-react";

export const CATEGORIES = [
  { label: "food",           icon: UtensilsCrossed, color: "bg-orange-500" },
  { label: "transport",      icon: Car,             color: "bg-blue-500"   },
  { label: "entertainment",  icon: Gamepad2,        color: "bg-purple-500" },
  { label: "utilities",      icon: Briefcase,       color: "bg-gray-500"   },
  { label: "shopping",       icon: ShoppingBag,     color: "bg-pink-500"   },
  { label: "health",         icon: HeartPulse,      color: "bg-green-500"  },
  { label: "money transfer", icon: ArrowLeftRight,  color: "bg-indigo-500" },
  { label: "home",           icon: Home,            color: "bg-red-500"    },
  { label: "self",           icon: User,            color: "bg-cyan-500"   },
  { label: "grocery",        icon: ShoppingCart,    color: "bg-lime-500"   },
  { label: "recharge",       icon: Zap,             color: "bg-yellow-500" },
  { label: "other",          icon: Briefcase,       color: "bg-gray-400"   },
];