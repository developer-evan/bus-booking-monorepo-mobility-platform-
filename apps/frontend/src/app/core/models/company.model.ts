export type CompanyStatus = 'active' | 'suspended';

export interface Company {
  _id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  status: CompanyStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCompanyRequest {
  name: string;
  email: string;
  phone: string;
  slug?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  email?: string;
  phone?: string;
  status?: CompanyStatus;
}

export interface CreateInviteRequest {
  email?: string;
  phone?: string;
  role: 'admin' | 'operator';
}

export interface InviteOtpResponse {
  message: string;
  otp: string;
  otpExpiresAt: string;
  role?: string;
  email?: string;
  phone?: string;
}

export interface InviteResult {
  inviteId: string;
  companyId: string;
  email?: string;
  phone?: string;
  role: string;
  expiresAt: string;
  message: string;
  otp: string;
  otpExpiresAt: string;
}
