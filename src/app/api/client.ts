export type AppointmentStatus = 'waiting' | 'completed' | 'cancelled';
export type InvoiceStatus = 'draft' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card';

export interface PatientDto {
  id: string;
  fullName: string;
  phoneNumber: string;
  birthYear?: number;
  address?: string;
  medicalHistory?: string;
}

export interface AppointmentDto {
  id: string;
  patientName: string;
  phone: string;
  reason: string;
  status: AppointmentStatus;
  date: string;
  time: string;
  notes?: string;
}

export interface ServiceDto {
  id: string;
  serviceId: string;
  serviceName: string;
  unitPrice: number;
  description: string;
  status: boolean;
}

export interface InvoiceServiceDto {
  key: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  date: string;
  patient: {
    id: string;
    name: string;
    phone: string;
  };
  services: InvoiceServiceDto[];
  doctorNotes: string;
  existingDebt: number;
  amountPaid: number;
  status: InvoiceStatus;
}

export interface DebtPaymentDto {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  notes: string;
}

export interface DebtDto {
  id: string;
  patientName: string;
  phoneNumber: string;
  totalInvoiced: number;
  totalPaid: number;
  remainingDebt: number;
  paymentHistory: DebtPaymentDto[];
}

export interface DashboardSummaryDto {
  selectedDate: string;
  revenue: {
    day: number;
    month: number;
    year: number;
  };
  debt: {
    totalOutstanding: number;
  };
  appointments: {
    day: number;
    month: number;
    year: number;
    total: number;
  };
  monthlyRevenueByDay: Array<{
    day: number;
    revenue: number;
  }>;
  yearlyRevenueByMonth: Array<{
    month: number;
    revenue: number;
  }>;
}

export interface LoginResponseDto {
  token: string;
  tokenType: string;
  username: string;
  fullName: string;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://patientmanage-api.onrender.com';
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7143';
const TOKEN_STORAGE_KEY = 'pm_access_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_STORAGE_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_STORAGE_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_STORAGE_KEY),
};

type RequestOptions = RequestInit & { includeAuth?: boolean };

function createHeaders(options?: RequestOptions): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  const shouldAttachAuth = options?.includeAuth ?? true;
  if (shouldAttachAuth) {
    const token = authStorage.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

function parseErrorMessage(rawText: string, status: number): string {
  if (!rawText) {
    return `Request failed: ${status}`;
  }

  try {
    const parsed = JSON.parse(rawText) as { message?: string; title?: string };
    return parsed.message || parsed.title || rawText;
  } catch {
    return rawText;
  }
}

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: createHeaders(options),
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();

    if (response.status === 401) {
      authStorage.clearToken();
    }

    throw new ApiError(parseErrorMessage(text, response.status), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  login: (payload: { username: string; password: string }) =>
    request<LoginResponseDto>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      includeAuth: false,
    }),

  getPatients: () => request<PatientDto[]>('/api/patients'),
  createPatient: (payload: Omit<PatientDto, 'id'>) => request<PatientDto>('/api/patients', { method: 'POST', body: JSON.stringify(payload) }),
  updatePatient: (id: string, payload: Omit<PatientDto, 'id'>) => request<PatientDto>(`/api/patients/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePatient: (id: string) => request<void>(`/api/patients/${id}`, { method: 'DELETE' }),

  getAppointments: () => request<AppointmentDto[]>('/api/appointments'),
  createAppointment: (payload: Omit<AppointmentDto, 'id'>) => request<AppointmentDto>('/api/appointments', { method: 'POST', body: JSON.stringify(payload) }),
  updateAppointment: (id: string, payload: Omit<AppointmentDto, 'id'>) => request<AppointmentDto>(`/api/appointments/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteAppointment: (id: string) => request<void>(`/api/appointments/${id}`, { method: 'DELETE' }),

  getServices: () => request<ServiceDto[]>('/api/services'),
  createService: (payload: Omit<ServiceDto, 'id'>) => request<ServiceDto>('/api/services', { method: 'POST', body: JSON.stringify(payload) }),
  updateService: (id: string, payload: Omit<ServiceDto, 'id'>) => request<ServiceDto>(`/api/services/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteService: (id: string) => request<void>(`/api/services/${id}`, { method: 'DELETE' }),

  getInvoices: () => request<InvoiceDto[]>('/api/invoices'),
  createInvoice: (payload: {
    patientId: string;
    date: string;
    services: Array<{ serviceId: string; serviceName: string; quantity: number; unitPrice: number }>;
    doctorNotes: string;
    existingDebt: number;
    amountPaid: number;
    status: InvoiceStatus;
  }) => request<InvoiceDto>('/api/invoices', { method: 'POST', body: JSON.stringify(payload) }),
  updateInvoice: (id: string, payload: {
    patientId: string;
    date: string;
    services: Array<{ serviceId: string; serviceName: string; quantity: number; unitPrice: number }>;
    doctorNotes: string;
    existingDebt: number;
    amountPaid: number;
    status: InvoiceStatus;
  }) => request<InvoiceDto>(`/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteInvoice: (id: string) => request<void>(`/api/invoices/${id}`, { method: 'DELETE' }),

  getDebts: () => request<DebtDto[]>('/api/debts'),
  createPayment: (patientId: string, payload: { paymentDate: string; amount: number; paymentMethod: PaymentMethod; notes?: string }) =>
    request<void>(`/api/debts/${patientId}/payments`, { method: 'POST', body: JSON.stringify(payload) }),

  getDashboardSummary: (date: string) => request<DashboardSummaryDto>(`/api/dashboard?date=${date}`),

  downloadRevenueReport: async (fromDate?: string, toDate?: string) => {
    const params = new URLSearchParams();
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);

    const token = authStorage.getToken();

    const response = await fetch(`${API_BASE_URL}/api/reports/revenue/excel?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      const text = await response.text();

      if (response.status === 401) {
        authStorage.clearToken();
      }

      throw new ApiError(parseErrorMessage(text, response.status), response.status);
    }

    return response.blob();
  },
};
