import {
  // Structural
  LayoutDashboard,
  LayoutGrid,
  Settings,
  Cog,
  Bell,
  BellRing,
  HelpCircle,
  Users,
  UsersRound,
  UserCog,
  UserPlus,
  UserCheck,
  Building,
  Building2,
  ClipboardList,
  MapPin,
  Globe,
  Tag,
  ScrollText,
  Database,
  Key,
  Plug,
  Smartphone,
  Radio,
  MessageSquare,
  Mail,
  Palette,
  Images,
  Image,
  LogIn,
  Share2,
  Sparkles,
  Inbox,
  Award,
  Megaphone,
  Ticket,
  Crown,
  // Fleet
  Car,
  CarFront,
  Wrench,
  Shield,
  ShieldCheck,
  Fuel,
  Package,
  CirclePlus,
  Clock,
  // Bookings / Calendar
  Calendar,
  CalendarCheck,
  CalendarClock,
  // Money
  Wallet,
  CreditCard,
  DollarSign,
  CircleDollarSign,
  BadgeDollarSign,
  Landmark,
  Percent,
  Receipt,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3,
  // Post-rental
  AlertTriangle,
  AlertOctagon,
  RotateCcw,
  Star,
  Flag,
} from "lucide-react";

/**
 * Named icons for the sidebar. Each key maps to a distinct lucide icon so
 * every menu item reads at a glance — no more three rows in a row all
 * showing the same generic cog. Keys are semantic (finance, cars, refunds)
 * so we can swap the actual icon without touching every menu file.
 */
export const sidebarIcons = {
  // ── Layout ────────────────────────────────────────────────────────────
  overview: LayoutDashboard,
  notifications: Bell,
  pushNotifications: BellRing,
  settings: Settings,
  cog: Cog,
  help: HelpCircle,

  // ── People ────────────────────────────────────────────────────────────
  users: Users,
  addUser: UserPlus,
  team: UsersRound,
  employee: UserCog,
  employeeRole: ShieldCheck,
  userCheck: UserCheck,

  // ── Providers ─────────────────────────────────────────────────────────
  providers: Building2,
  addProvider: CirclePlus,
  pendingProviders: Clock,
  providerRequests: ClipboardList,
  locations: MapPin,

  // ── Fleet ─────────────────────────────────────────────────────────────
  cars: CarFront,
  car: Car,
  addCar: CirclePlus,
  maintenance: Wrench,
  fuel: Fuel,
  category: LayoutGrid,
  brand: Award,
  feature: Sparkles,
  modelRequests: Inbox,
  flaggedCars: AlertTriangle,
  insurance: Shield,

  // ── Bookings ──────────────────────────────────────────────────────────
  bookings: CalendarCheck,
  rentals: Calendar,
  availability: CalendarClock,

  // ── Money ─────────────────────────────────────────────────────────────
  finance: Wallet,
  payments: CreditCard,
  invoices: FileText,
  fines: Receipt,
  expenses: TrendingDown,
  credits: CircleDollarSign,
  earnings: TrendingUp,
  analytics: BarChart3,
  payouts: Landmark,
  pricing: DollarSign,
  cashback: BadgeDollarSign,
  tax: Percent,

  // ── Post-rental ───────────────────────────────────────────────────────
  damages: AlertOctagon,
  refunds: RotateCcw,
  reviews: Star,
  claims: Flag,
  addons: Package,

  // ── Business ──────────────────────────────────────────────────────────
  business: Building,
  emailTemplate: Mail,
  theme: Palette,
  gallery: Images,
  loginSetup: LogIn,
  social: Share2,

  // ── Promotions ────────────────────────────────────────────────────────
  campaigns: Megaphone,
  coupons: Ticket,
  banners: Image,
  limousine: Crown,

  // ── Platform ──────────────────────────────────────────────────────────
  thirdParty: Plug,
  appSettings: Smartphone,
  notificationChannels: Radio,
  notificationMessages: MessageSquare,
  landingPage: Globe,
  meta: Tag,
  database: Database,
  auditLog: ScrollText,
  license: Key,

  // ── Reports ───────────────────────────────────────────────────────────
  reports: FileText,

  // ── Legacy aliases (kept for older menu files that haven't been renamed) ─
  policies: FileText,
};
