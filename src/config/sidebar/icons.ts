import {
  LayoutDashboard,
  Building2,
  Car,
  CarFront,
  AlertTriangle,
  Calendar,
  DollarSign,
  Star,
  Users,
  UserCheck,
  Clock,
  FileText,
  Shield,
  Bubbles,
} from "lucide-react";

export const sidebarIcons = {
  overview: LayoutDashboard,

  // rentals
  providers: Building2,
  addProvider: Bubbles,
  pendingProviders: Clock,
  cars: CarFront,
  flaggedCars: AlertTriangle,
  bookings: Calendar,
  pricing: DollarSign,
  reviews: Star,
  reports: FileText,
  settings: Shield,
  category: Car,
  brand: UserCheck,

  // common
  users: Users,
  policies: FileText,
  claims: AlertTriangle,
  insurance: Shield,
};
