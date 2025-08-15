import { ApiResponse } from './types';

// Base API configuration
const API_BASE = '/api';

// Generic API client
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
export const api = new ApiClient();

// Auth API functions
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  logout: () => api.post('/auth/logout'),
  
  me: () => api.get('/auth/me'),
  
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
};

// Properties API functions
export const propertiesApi = {
  getAll: () => api.get('/properties'),
  
  getById: (id: string) => api.get(`/properties/${id}`),
  
  create: (data: any) => api.post('/properties', data),
  
  update: (id: string, data: any) => api.put(`/properties/${id}`, data),
  
  delete: (id: string) => api.delete(`/properties/${id}`),
  
  getEvaluation: (id: string) => api.get(`/properties/${id}/evaluation`),
  
  getInvestmentComparison: (id: string) => 
    api.get(`/properties/${id}/investment-comparison`),
  
  getRentalsOverview: (id: string, year?: number) => {
    const params = year ? `?year=${year}` : '';
    return api.get(`/properties/${id}/rentals-overview${params}`);
  },
  
  getSettings: (id: string) => api.get(`/properties/${id}/settings`),
  
  updateSettings: (id: string, data: any) => 
    api.post(`/properties/${id}/settings`, data),
};

// Units API functions
export const unitsApi = {
  getAll: () => api.get('/units'),
  
  getById: (id: string) => api.get(`/units/${id}`),
  
  create: (data: any) => api.post('/units', data),
  
  update: (id: string, data: any) => api.put(`/units/${id}`, data),
  
  delete: (id: string) => api.delete(`/units/${id}`),
  
  getYearlyOverview: (id: string, year?: number) => {
    const params = year ? `?year=${year}` : '';
    return api.get(`/units/${id}/yearly-overview${params}`);
  },
  
  getStandardRent: (id: string) => api.get(`/units/${id}/standard-rent`),
  
  updateStandardRent: (id: string, data: any) => 
    api.post(`/units/${id}/standard-rent`, data),
};

// People API functions
export const peopleApi = {
  getAll: () => api.get('/people'),
  
  getById: (id: string) => api.get(`/people/${id}`),
  
  create: (data: any) => api.post('/people', data),
  
  update: (id: string, data: any) => api.put(`/people/${id}`, data),
  
  delete: (id: string) => api.delete(`/people/${id}`),
};

// Property People API functions
export const propertyPeopleApi = {
  getAll: (propertyId: string) => 
    api.get(`/properties/${propertyId}/people`),
  
  assign: (propertyId: string, data: any) => 
    api.post(`/properties/${propertyId}/people`, data),
  
  update: (propertyId: string, personId: string, data: any) => 
    api.put(`/properties/${propertyId}/people/${personId}`, data),
  
  remove: (propertyId: string, personId: string) => 
    api.delete(`/properties/${propertyId}/people/${personId}`),
};

// Unit People API functions
export const unitPeopleApi = {
  getAll: (unitId: string) => api.get(`/units/${unitId}/people`),
  
  assign: (unitId: string, data: any) => 
    api.post(`/units/${unitId}/people`, data),
  
  update: (unitId: string, personId: string, data: any) => 
    api.put(`/units/${unitId}/people/${personId}`, data),
  
  remove: (unitId: string, personId: string) => 
    api.delete(`/units/${unitId}/people/${personId}`),
};

// Rentals API functions
export const rentalsApi = {
  getAll: () => api.get('/rentals'),
  
  create: (data: any) => api.post('/rentals', data),
  
  update: (id: string, data: any) => api.put(`/rentals/${id}`, data),
  
  delete: (id: string) => api.delete(`/rentals/${id}`),
};
