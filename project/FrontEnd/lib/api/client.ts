// API Configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

const API_URL = `${BASE_URL}/api`;

export { BASE_URL, API_URL };

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
    
    // Handle empty body responses (e.g. 204 No Content)
    const text = await response.text();
    let data: any = null;
    
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.warn('⚠️ Response is not valid JSON:', text);
        if (!response.ok) {
          throw new Error(`Server Error: ${response.status} ${response.statusText}`);
        }
        return text as unknown as T;
      }
    }

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `Error: ${response.status} ${response.statusText}`;
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

  // Funds
  async getFunds() {
    return this.request<any[]>('/funds');
  }

  async getIraAccountTypes() {
    return this.request<any[]>('/ira-accounts/types');
  }

  async getFundById(id: string) {
    return this.request<any>(`/funds/${id}`);
  }

  async createFund(data: any) {
    return this.request<any>('/funds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadFundImage(fundId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_URL}/funds/${fundId}/image`, {
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

  async updateFund(id: string, data: any) {
    return this.request<any>(`/funds/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteFund(id: string) {
    return this.request<any>(`/funds/${id}`, {
      method: 'DELETE',
    });
  }

  // Fund Flows
  async createFundFlow(data: { fundId: string; accountId: string; amount: number; status?: string }) {
    return this.request<any>('/fund-flows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyFundFlows() {
    return this.request<any[]>('/fund-flows');
  }

  // Investments
  async createInvestment(data: { 
    fundId: string; 
    accountId?: string; 
    accountType: string; 
    investmentAmount: number; 
    unitPrice: number;
    status?: string;
    documentSigned?: boolean;
  }) {
    return this.request<any>('/investments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInvestmentStatus(id: string, data: { status: string; documentSigned?: boolean }) {
    return this.request<any>(`/investments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Fund Documents
  async getFundDocuments(fundId: string) {
    return this.request<any[]>(`/documents/fund/${fundId}`);
  }

  async getDocumentById(id: string) {
    return this.request<any>(`/documents/${id}`);
  }

  async uploadFundDocument(fundId: string, data: {
    file: File;
    document_type: string;
    tax_year?: number;
    description?: string;
    note?: string;
  }) {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('document_type', data.document_type || '');
    if (data.tax_year) formData.append('tax_year', data.tax_year.toString());
    if (data.description) formData.append('description', data.description);
    if (data.note) formData.append('note', data.note);

    const headers: HeadersInit = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_URL}/documents/fund/${fundId}/upload`, {
      method: 'POST',
      body: formData,
      headers: headers,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || result.message || 'An error occurred during upload');
    }
    return result;
  }

  async updateDocument(id: string, data: {
    document_type?: string;
    tax_year?: number;
    description?: string;
    note?: string;
  }) {
    return this.request<any>(`/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async updateDocumentWithFile(id: string, formData: FormData) {
    const headers: HeadersInit = {};
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_URL}/documents/${id}/with-file`, {
      method: "PATCH",
      body: formData,
      headers: headers,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(
        result.error || result.message || "An error occurred during update"
      );
    }
    return result;
  }

  async deleteDocument(id: string) {
    return this.request<any>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  getDocumentDownloadUrl(id: string) {
    return `${API_URL}/documents/${id}/download`;
  }

  async getSubscriptionDocuments() {
    return this.request<string[]>('/documents/subscription/list');
  }

  getSubscriptionDocumentUrl(filename: string) {
    return `/documents/subscription/${filename}`;
  }
}

export const apiClient = new ApiClient();
