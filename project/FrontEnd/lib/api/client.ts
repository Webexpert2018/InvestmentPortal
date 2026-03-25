const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      cache: 'no-store',
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || data.error || 'An error occurred';
      throw new Error(errorMsg);
    }

    return data;
  }

  async signup(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dob?: string;
    role?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    taxId?: string;
  })
 {
    return this.request<{ user: any; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string, role?: string) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  }

  async getProfile() {
    return this.request<any>('/users/profile');
  }

  async updateProfile(data: any) {
    return this.request<any>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getSettings() {
    return this.request<any>('/users/settings');
  }

  async updateSettings(data: any) {
    return this.request<any>('/users/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAllUsers() {
    return this.request<any[]>('/users/all');
  }

  async updateUserStatus(userId: string, status: string) {
    return this.request<any>(`/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getMyPortfolio() {
    return this.request<any>('/portfolios/my');
  }

  async getPortfolioPerformance() {
    return this.request<any[]>('/portfolios/performance');
  }

  async getAllPortfolios() {
    return this.request<any[]>('/portfolios/all');
  }

  async updatePortfolioNav(userId: string, bitcoinPrice: number) {
    return this.request<any>('/portfolios/update-nav', {
      method: 'PUT',
      body: JSON.stringify({ userId, bitcoinPrice }),
    });
  }

  async createTransaction(data: any) {
    return this.request<any>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyTransactions(limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    return this.request<any[]>(`/transactions/my?${params.toString()}`);
  }

  async getAllTransactions(limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    return this.request<any[]>(`/transactions/all?${params.toString()}`);
  }

  async updateTransaction(id: string, data: any) {
    return this.request<any>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadDocument(data: any) {
    return this.request<any>('/documents/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyDocuments() {
    return this.request<any[]>('/documents/my');
  }

  async getAllDocuments(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request<any[]>(`/documents/all${params}`);
  }

  async verifyDocument(id: string, status: string, rejectionReason?: string) {
    return this.request<any>(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, rejectionReason }),
    });
  }

  async getMyAuditLogs(limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    return this.request<any[]>(`/audit-logs/my?${params.toString()}`);
  }

  async getAllAuditLogs(filters?: any) {
    const params = new URLSearchParams(filters);
    return this.request<any[]>(`/audit-logs/all?${params.toString()}`);
  }

  async createIRAAccount(data: any) {
    return this.request<any>('/ira-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyIRAAccount() {
    return this.request<any>('/ira-accounts/my');
  }

  async updateIRAAccount(data: any) {
    return this.request<any>('/ira-accounts', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAllIRAAccounts() {
    return this.request<any[]>('/ira-accounts/all');
  }

  async generateComplianceReport(data: any) {
    return this.request<any>('/compliance/report', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyComplianceReports() {
    return this.request<any[]>('/compliance/my');
  }

  async getAllComplianceReports() {
    return this.request<any[]>('/compliance/all');
  }

  async forgotPassword(email: string, role?: string) {
    return this.request<any>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async verifyOtp(email: string, otp: string) {
    return this.request<any>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async resetPassword(data: any) {
    return this.request<any>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: { oldPassword: string; newPassword: string }) {
    return this.request<any>('/users/change-password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_URL}/users/profile-image`, {
      method: 'POST',
      body: formData,
      headers: headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'An error occurred during upload');
    }
    return data;
  }
}

export const apiClient = new ApiClient();
