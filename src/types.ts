/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ClientType = 'Salaried' | 'Business Individual' | 'AOP' | 'Company';
export type ATLStatus = 'Active' | 'Inactive';

export interface Client {
  id: string;
  name: string;
  cnic: string; // Pakistani CNIC e.g. 35201-1234567-9
  ntn: string;  // National Tax Number e.g. 1234567-8
  strn?: string; // Sales Tax Registration Number (optional) e.g. 1234567890123
  client_type: ClientType;
  phone: string;
  email: string;
  address: string;
  atl_status: ATLStatus;
  notes?: string;
  created_at: string;
}

export type FilingType = 'Income Tax Return' | 'Wealth Statement' | 'Sales Tax Return' | 'Withholding Statement';
export type FilingStatus = 'Not Started' | 'Documents Pending' | 'In Progress' | 'Filed' | 'Acknowledged';

export interface Filing {
  id: string;
  client_id: string;
  filing_type: FilingType;
  tax_period: string; // e.g. "Tax Year 2025", "June 2026"
  deadline: string; // ISO date string
  status: FilingStatus;
  filed_date?: string; // ISO date string
  iris_ack_number?: string; // 15-digit IRIS number
}

export type FeeType = 'Per-Return' | 'Retainer' | 'Extra Charge';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Cheque' | 'Unpaid';

export interface Fee {
  id: string;
  client_id: string;
  fee_type: FeeType;
  amount: number; // in PKR
  amount_paid: number; // in PKR
  balance_due: number; // in PKR
  due_date: string; // ISO date string
  payment_method?: PaymentMethod;
  payment_date?: string; // ISO date string
}

export interface Document {
  id: string;
  client_id: string;
  filing_id?: string; // optional link to a specific filing
  file_name: string;
  file_type: string; // e.g. "CNIC", "Salary Certificate", "Bank Statement", "Rent Agreement", "Tax Challan", "Other"
  file_url: string; // Mock url or base64 representation
  uploaded_at: string;
}

export type NoticeStatus = 'Pending' | 'Responded' | 'Closed';

export interface Notice {
  id: string;
  client_id: string;
  notice_type: string; // e.g. "Section 122 (Amendment)", "Section 114 (Notice to File Return)", "Audit Notice"
  date_received: string; // ISO date string
  response_deadline: string; // ISO date string
  status: NoticeStatus;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  client_id?: string;
  client_name?: string;
  action: string; // e.g. "Filing marked Filed", "Client added"
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  totalActiveClients: number;
  filingsDueThisMonth: number;
  overdueFilings: number;
  totalFeesOutstanding: number; // in PKR
}
