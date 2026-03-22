import {
  ArrowLeftRight, UtensilsCrossed, ShoppingBag, Car,
  HeartPulse, Gamepad2, Briefcase,
} from "lucide-react";

export const CATEGORIES = [
  { label: "Food",           icon: UtensilsCrossed, color: "bg-orange-500" },
  { label: "Money Transfer", icon: ArrowLeftRight,  color: "bg-red-500"    },
  { label: "Shopping",       icon: ShoppingBag,     color: "bg-pink-500"   },
  { label: "Transport",      icon: Car,             color: "bg-blue-500"   },
  { label: "Health",         icon: HeartPulse,      color: "bg-green-500"  },
  { label: "Entertainment",  icon: Gamepad2,        color: "bg-purple-500" },
  { label: "Other",          icon: Briefcase,       color: "bg-gray-500"   },
];