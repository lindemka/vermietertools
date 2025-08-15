// Database Types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  description?: string;
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  units?: Unit[];
  user?: User;
}

export interface Unit {
  id: string;
  name: string;
  type: string;
  size: string;
  description?: string;
  monthlyRent: number;
  monthlyUtilities: number;
  isActive: boolean;
  propertyId: string;
  createdAt: Date;
  updatedAt: Date;
  property?: Property;
  rentals?: Rental[];
}

export interface Rental {
  id: string;
  month: number;
  year: number;
  amount: number;
  rentAmount: number;
  utilitiesAmount: number;
  isPaid: boolean;
  notes?: string;
  unitId: string;
  createdAt: Date;
  updatedAt: Date;
  unit?: Unit;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  propertyRoles?: PropertyPerson[];
  unitRoles?: UnitPerson[];
}

export interface PropertyPerson {
  id: string;
  personId: string;
  propertyId: string;
  role: 'owner' | 'tenant' | 'manager';
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  person?: Person;
  property?: Property;
}

export interface UnitPerson {
  id: string;
  personId: string;
  unitId: string;
  role: 'tenant' | 'co-tenant' | 'subtenant';
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  person?: Person;
  unit?: Unit;
}

export interface PropertySettings {
  id: string;
  propertyId: string;
  grossRentMultiplier: number;
  operatingExpenseRatio: number;
  valueAdjustment: number;
  propertyAppreciation: number;
  etfReturn: number;
  years: number;
  createdAt: Date;
  updatedAt: Date;
  property?: Property;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  user: User;
  message: string;
}

export interface PropertyEvaluation {
  property: Property;
  estimatedValue: number;
  totalYearlyRent: number;
  grossRentMultiplier: number;
  operatingExpenseRatio: number;
  capRate: number;
  valueAdjustment: number;
}

export interface InvestmentComparison {
  propertyScenario: {
    totalValue: number;
    rentalIncome: number;
    appreciation: number;
  };
  etfScenario: {
    totalValue: number;
    investmentReturn: number;
  };
  difference: number;
  percentageDifference: number;
}

export interface RentalsOverview {
  property: Property;
  monthlyData: {
    month: number;
    year: number;
    totalRent: number;
    totalUtilities: number;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
  }[];
  yearlyTotals: {
    totalRent: number;
    totalUtilities: number;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
  };
}

export interface YearlyOverview {
  unit: Unit;
  monthlyData: {
    month: number;
    year: number;
    amount: number;
    rentAmount: number;
    utilitiesAmount: number;
    isPaid: boolean;
    notes?: string;
  }[];
  yearlyTotals: {
    totalAmount: number;
    totalRent: number;
    totalUtilities: number;
    paidAmount: number;
    unpaidAmount: number;
  };
}

// Form Types
export interface PropertyFormData {
  name: string;
  address: string;
  description?: string;
}

export interface UnitFormData {
  name: string;
  type: string;
  size: string;
  description?: string;
  monthlyRent: number;
  monthlyUtilities: number;
}

export interface PersonFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface RentalFormData {
  month: number;
  year: number;
  amount: number;
  rentAmount: number;
  utilitiesAmount: number;
  isPaid: boolean;
  notes?: string;
}

export interface SettingsFormData {
  grossRentMultiplier: number;
  operatingExpenseRatio: number;
  valueAdjustment: number;
  propertyAppreciation: number;
  etfReturn: number;
  years: number;
}

// UI Types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

export interface Theme {
  name: 'light' | 'dark';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Utility Types
export type WithId<T> = T & { id: string };
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
