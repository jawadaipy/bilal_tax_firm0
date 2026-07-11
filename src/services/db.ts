/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Dexie, { type EntityTable } from 'dexie';
import { Client, Filing, Fee, Document, Notice, ActivityLog, DashboardStats } from '../types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Helper to check if a date is overdue
export const isOverdue = (deadlineStr: string, status: string): boolean => {
  if (status === 'Filed' || status === 'Acknowledged' || status === 'Responded' || status === 'Closed') {
    return false;
  }
  const deadline = new Date(deadlineStr);
  const now = new Date();
  // Clear times to compare just dates
  deadline.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return deadline < now;
};

// --- DEXIE INITIALIZATION ---
// IndexedDB is a powerful in-browser database ideal for offline PoCs.
const dexieDb = new Dexie('BilalTaxFirmPoCDB') as Dexie & {
  clients: EntityTable<Client, 'id'>;
  filings: EntityTable<Filing, 'id'>;
  fees: EntityTable<Fee, 'id'>;
  documents: EntityTable<Document, 'id'>;
  notices: EntityTable<Notice, 'id'>;
  activityLogs: EntityTable<ActivityLog, 'id'>;
};

// Define the database schema (indexed properties)
dexieDb.version(1).stores({
  clients: 'id, name, cnic, ntn, atl_status',
  filings: 'id, client_id, status, deadline',
  fees: 'id, client_id, due_date',
  documents: 'id, client_id',
  notices: 'id, client_id, status',
  activityLogs: 'id, client_id, timestamp'
});

// Initial Seed Data
const SEED_CLIENTS: Client[] = [
  { id: 'c1', name: 'Muhammad Ali Khan', cnic: '35201-8765432-1', ntn: '4321098-7', client_type: 'Business Individual', phone: '+92 300 1234567', email: 'ali.khan@gmail.com', address: 'Phase 5 DHA, Lahore, Punjab', atl_status: 'Active', notes: 'Retailer of textiles. Needs income tax and monthly sales tax returns.', created_at: '2026-01-15T10:00:00-05:00' },
  { id: 'c2', name: 'Ayesha Rahman', cnic: '42101-1234567-2', ntn: '7654321-0', client_type: 'Salaried', phone: '+92 321 9876543', email: 'ayesha.r@outlook.com', address: 'Clifton Block 5, Karachi, Sindh', atl_status: 'Active', notes: 'Software Engineer at an international firm. Only income tax return + wealth statement.', created_at: '2026-02-10T11:30:00-05:00' },
  { id: 'c3', name: 'Zubair Enterprises Pvt Ltd', cnic: '35202-9988776-5', ntn: '9876543-2', strn: '1234567890123', client_type: 'Company', phone: '+92 42 35789123', email: 'finance@zubairent.com', address: 'Gulberg III, Lahore, Punjab', atl_status: 'Inactive', notes: 'Manufacturer of auto parts. Requires full corporate income tax return, withholding audits, and monthly sales tax returns.', created_at: '2025-11-20T09:00:00-05:00' },
  { id: 'c4', name: 'Hassan & Co. Partners', cnic: '37405-1122334-3', ntn: '5432109-8', client_type: 'AOP', phone: '+92 333 5556677', email: 'hassan.co@yahoo.com', address: 'Saddar, Rawalpindi, Punjab', atl_status: 'Active', notes: 'Partnership firm managing real estate advisory. Complex income tax distribution filings.', created_at: '2026-03-01T14:15:00-05:00' },
  { id: 'c5', name: 'Fatima Jamil', cnic: '35201-1122334-4', ntn: '2345678-9', client_type: 'Salaried', phone: '+92 301 4445566', email: 'fatima.jamil@gmail.com', address: 'Model Town, Lahore, Punjab', atl_status: 'Active', notes: 'Senior medical practitioner. Foreign source income components included.', created_at: '2026-04-18T16:20:00-05:00' }
];

const SEED_FILINGS: Filing[] = [
  { id: 'f1', client_id: 'c1', filing_type: 'Income Tax Return', tax_period: 'Tax Year 2025', deadline: '2026-09-30T23:59:59', status: 'In Progress' },
  { id: 'f2', client_id: 'c1', filing_type: 'Sales Tax Return', tax_period: 'June 2026', deadline: '2026-07-18T23:59:59', status: 'Documents Pending' },
  { id: 'f3', client_id: 'c2', filing_type: 'Income Tax Return', tax_period: 'Tax Year 2025', deadline: '2026-09-30T23:59:59', status: 'Acknowledged', filed_date: '2026-07-02T11:00:00', iris_ack_number: '100000087463529' },
  { id: 'f4', client_id: 'c2', filing_type: 'Wealth Statement', tax_period: 'Tax Year 2025', deadline: '2026-09-30T23:59:59', status: 'Acknowledged', filed_date: '2026-07-02T11:15:00', iris_ack_number: '100000087463530' },
  { id: 'f5', client_id: 'c3', filing_type: 'Income Tax Return', tax_period: 'Tax Year 2025', deadline: '2025-12-31T23:59:59', status: 'Not Started' },
  { id: 'f6', client_id: 'c3', filing_type: 'Withholding Statement', tax_period: 'Q4 2025', deadline: '2026-07-05T23:59:59', status: 'In Progress' },
  { id: 'f7', client_id: 'c4', filing_type: 'Income Tax Return', tax_period: 'Tax Year 2025', deadline: '2026-09-30T23:59:59', status: 'Documents Pending' },
  { id: 'f8', client_id: 'c5', filing_type: 'Income Tax Return', tax_period: 'Tax Year 2025', deadline: '2026-09-30T23:59:59', status: 'Filed', filed_date: '2026-07-09T17:45:00', iris_ack_number: '100000089837482' }
];

const SEED_FEES: Fee[] = [
  { id: 'fe1', client_id: 'c1', fee_type: 'Per-Return', amount: 15000, amount_paid: 5000, balance_due: 10000, due_date: '2026-07-15T23:59:59', payment_method: 'Cash', payment_date: '2026-07-01T12:00:00' },
  { id: 'fe2', client_id: 'c2', fee_type: 'Per-Return', amount: 12000, amount_paid: 12000, balance_due: 0, due_date: '2026-07-10T23:59:59', payment_method: 'Bank Transfer', payment_date: '2026-07-03T10:30:00' },
  { id: 'fe3', client_id: 'c3', fee_type: 'Retainer', amount: 150000, amount_paid: 50000, balance_due: 100000, due_date: '2026-06-30T23:59:59', payment_method: 'Cheque', payment_date: '2026-06-25T15:00:00' },
  { id: 'fe4', client_id: 'c4', fee_type: 'Per-Return', amount: 25000, amount_paid: 0, balance_due: 25000, due_date: '2026-07-25T23:59:59' },
  { id: 'fe5', client_id: 'c5', fee_type: 'Per-Return', amount: 15000, amount_paid: 15000, balance_due: 0, due_date: '2026-07-10T23:59:59', payment_method: 'Bank Transfer', payment_date: '2026-07-09T18:00:00' }
];

const SEED_DOCUMENTS: Document[] = [
  { id: 'd1', client_id: 'c1', file_name: 'CNIC_Ali_Khan.pdf', file_type: 'CNIC', file_url: '#', uploaded_at: '2026-01-15T10:15:00' },
  { id: 'd2', client_id: 'c1', file_name: 'FBR_Registration_Certificate_Ali_Khan.pdf', file_type: 'Tax Challan', file_url: '#', uploaded_at: '2026-01-15T10:20:00' },
  { id: 'd3', client_id: 'c2', file_name: 'Salary_Certificate_FY25_Ayesha.pdf', file_type: 'Salary Certificate', file_url: '#', uploaded_at: '2026-06-15T14:00:00' },
  { id: 'd4', client_id: 'c2', file_name: 'Standard_Chartered_Bank_Statement_2025.pdf', file_type: 'Bank Statement', file_url: '#', uploaded_at: '2026-06-16T09:30:00' },
  { id: 'd5', client_id: 'c3', file_name: 'Company_Incorporation_SECP_Zubair.pdf', file_type: 'Other', file_url: '#', uploaded_at: '2025-11-20T09:45:00' }
];

const SEED_NOTICES: Notice[] = [
  { id: 'n1', client_id: 'c3', notice_type: 'Section 122 (Amendment of Assessment)', date_received: '2026-06-20T10:00:00', response_deadline: '2026-07-05T23:59:59', status: 'Pending', notes: 'FBR alleging under-reported sales of 5.5 Million PKR in FY 2024 audits. Extremely critical response required.' },
  { id: 'n2', client_id: 'c1', notice_type: 'Section 114 (Notice to File Return for 2025)', date_received: '2026-07-01T11:00:00', response_deadline: '2026-07-20T23:59:59', status: 'Pending', notes: 'Standard notice to file income tax return. Link with filing f1.' },
  { id: 'n3', client_id: 'c4', notice_type: 'Section 177 (Audit Notice)', date_received: '2026-05-10T12:00:00', response_deadline: '2026-06-10T23:59:59', status: 'Responded', notes: 'Provided ledger and expense bank statements for Hassan & Co. FBR auditor has acknowledged the documents. Awaiting final order.' }
];

const SEED_ACTIVITY: ActivityLog[] = [
  { id: 'a1', client_id: 'c5', client_name: 'Fatima Jamil', action: 'Filing marked Filed', details: 'Income Tax Return for Tax Year 2025 marked as Filed. IRIS Ack: 100000089837482', timestamp: '2026-07-09T17:45:00' },
  { id: 'a2', client_id: 'c5', client_name: 'Fatima Jamil', action: 'Payment Logged', details: 'Logged payment of 15,000 PKR via Bank Transfer.', timestamp: '2026-07-09T18:00:00' },
  { id: 'a3', client_id: 'c1', client_name: 'Muhammad Ali Khan', action: 'Notice Logged', details: 'New FBR Section 114 Notice logged with response deadline 2026-07-20.', timestamp: '2026-07-01T11:05:00' },
  { id: 'a4', client_id: 'c2', client_name: 'Ayesha Rahman', action: 'Return Acknowledged', details: 'Tax return for Tax Year 2025 acknowledged by FBR system.', timestamp: '2026-07-02T11:15:00' },
  { id: 'a5', client_id: 'c3', client_name: 'Zubair Enterprises Pvt Ltd', action: 'Client Created', details: 'New Company client Zubair Enterprises registered into Bilal Tax Firm CRM.', timestamp: '2025-11-20T09:00:00' }
];

// Populate database on creation
dexieDb.on('populate', async () => {
  await dexieDb.clients.bulkAdd(SEED_CLIENTS);
  await dexieDb.filings.bulkAdd(SEED_FILINGS);
  await dexieDb.fees.bulkAdd(SEED_FEES);
  await dexieDb.documents.bulkAdd(SEED_DOCUMENTS);
  await dexieDb.notices.bulkAdd(SEED_NOTICES);
  await dexieDb.activityLogs.bulkAdd(SEED_ACTIVITY);
});

// Database Wrapper implementing the same interface expected by the application
class BilalTaxFirmDB {

  // LOG helper
  async addLog(client_id: string | undefined, action: string, details: string) {
    let clientName = undefined;
    if (client_id) {
      const client = await dexieDb.clients.get(client_id);
      if (client) clientName = client.name;
    }
    const log: ActivityLog = {
      id: generateId(),
      client_id,
      client_name: clientName,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    await dexieDb.activityLogs.add(log);

    // Enforce 100 max logs (cleanup old ones if necessary)
    const count = await dexieDb.activityLogs.count();
    if (count > 100) {
      const excess = count - 100;
      const oldestLogs = await dexieDb.activityLogs.orderBy('timestamp').limit(excess).toArray();
      const idsToDelete = oldestLogs.map(l => l.id);
      await dexieDb.activityLogs.bulkDelete(idsToDelete);
    }
    return log;
  }

  // --- CLIENTS ---
  async getClients(): Promise<Client[]> {
    const clients = await dexieDb.clients.toArray();
    return clients.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getClientById(id: string): Promise<Client | undefined> {
    return await dexieDb.clients.get(id);
  }

  async createClient(clientData: Omit<Client, 'id' | 'created_at'>): Promise<Client> {
    const client: Client = {
      ...clientData,
      id: generateId(),
      created_at: new Date().toISOString()
    };
    await dexieDb.clients.add(client);
    await this.addLog(client.id, 'Client Created', `Client ${client.name} (${client.client_type}) registered into CRM.`);
    return client;
  }

  async updateClient(id: string, updatedData: Partial<Client>): Promise<Client> {
    await dexieDb.clients.update(id, updatedData);
    const client = await dexieDb.clients.get(id);
    if (!client) throw new Error('Client not found');

    const changes: string[] = [];
    if (updatedData.name) changes.push(`Name changed to ${updatedData.name}`);
    if (updatedData.atl_status) changes.push(`ATL status changed to ${updatedData.atl_status}`);
    
    await this.addLog(id, 'Client Updated', changes.length > 0 ? changes.join(', ') : 'Details updated.');
    return client;
  }

  async deleteClient(id: string): Promise<boolean> {
    const client = await dexieDb.clients.get(id);
    if (!client) return false;
    
    // Transaction for atomic deletion
    await dexieDb.transaction('rw', dexieDb.clients, dexieDb.filings, dexieDb.fees, dexieDb.documents, dexieDb.notices, dexieDb.activityLogs, async () => {
      await dexieDb.clients.delete(id);
      await dexieDb.filings.where('client_id').equals(id).delete();
      await dexieDb.fees.where('client_id').equals(id).delete();
      await dexieDb.documents.where('client_id').equals(id).delete();
      await dexieDb.notices.where('client_id').equals(id).delete();
    });

    await this.addLog(undefined, 'Client Deleted', `Client ${client.name} and all linked filings, fees, and docs deleted.`);
    return true;
  }

  // --- FILINGS ---
  async getFilings(): Promise<Filing[]> {
    const filings = await dexieDb.filings.toArray();
    return filings.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }

  async getFilingsByClient(clientId: string): Promise<Filing[]> {
    return await dexieDb.filings.where('client_id').equals(clientId).toArray();
  }

  async createFiling(filingData: Omit<Filing, 'id'>): Promise<Filing> {
    const filing: Filing = {
      ...filingData,
      id: generateId()
    };
    await dexieDb.filings.add(filing);
    await this.addLog(filing.client_id, 'Filing Created', `${filing.filing_type} return added for ${filing.tax_period}.`);
    return filing;
  }

  async updateFiling(id: string, updatedData: Partial<Filing>): Promise<Filing> {
    const oldFiling = await dexieDb.filings.get(id);
    if (!oldFiling) throw new Error('Filing not found');
    await dexieDb.filings.update(id, updatedData);
    const filing = await dexieDb.filings.get(id);
    if (!filing) throw new Error('Filing missing after update');

    if (updatedData.status && updatedData.status !== oldFiling.status) {
      await this.addLog(
        filing.client_id,
        'Filing Status Updated',
        `${filing.filing_type} (${filing.tax_period}) status changed from ${oldFiling.status} to ${updatedData.status}.${
          updatedData.iris_ack_number ? ` IRIS Ack: ${updatedData.iris_ack_number}` : ''
        }`
      );
    } else {
      await this.addLog(filing.client_id, 'Filing Details Updated', `${filing.filing_type} details adjusted.`);
    }
    return filing;
  }

  async deleteFiling(id: string): Promise<boolean> {
    const filing = await dexieDb.filings.get(id);
    if (!filing) return false;
    await dexieDb.filings.delete(id);
    await this.addLog(filing.client_id, 'Filing Deleted', `${filing.filing_type} return for ${filing.tax_period} deleted.`);
    return true;
  }

  // --- FEES ---
  async getFees(): Promise<Fee[]> {
    const fees = await dexieDb.fees.toArray();
    return fees.sort((a,b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
  }

  async getFeesByClient(clientId: string): Promise<Fee[]> {
    return await dexieDb.fees.where('client_id').equals(clientId).toArray();
  }

  async createFee(feeData: Omit<Fee, 'id' | 'balance_due'>): Promise<Fee> {
    const balance_due = feeData.amount - feeData.amount_paid;
    const fee: Fee = {
      ...feeData,
      id: generateId(),
      balance_due
    };
    await dexieDb.fees.add(fee);
    await this.addLog(fee.client_id, 'Fee Invoiced', `Invoice created for ${fee.fee_type}: PKR ${fee.amount.toLocaleString()}.`);
    return fee;
  }

  async updateFee(id: string, updatedData: Partial<Fee>): Promise<Fee> {
    const oldFee = await dexieDb.fees.get(id);
    if (!oldFee) throw new Error('Fee invoice not found');
    
    const amount = updatedData.amount !== undefined ? updatedData.amount : oldFee.amount;
    const amount_paid = updatedData.amount_paid !== undefined ? updatedData.amount_paid : oldFee.amount_paid;
    const balance_due = amount - amount_paid;

    await dexieDb.fees.update(id, { ...updatedData, balance_due });
    const fee = await dexieDb.fees.get(id);
    if (!fee) throw new Error('Fee missing after update');

    if (updatedData.amount_paid !== undefined && updatedData.amount_paid !== oldFee.amount_paid) {
      const addedPayment = updatedData.amount_paid - oldFee.amount_paid;
      await this.addLog(
        fee.client_id,
        'Payment Logged',
        `Logged payment of PKR ${addedPayment.toLocaleString()} for ${fee.fee_type}. Remaining Balance: PKR ${balance_due.toLocaleString()}.`
      );
    } else {
      await this.addLog(fee.client_id, 'Fee Updated', `Invoice amount/details adjusted.`);
    }

    return fee;
  }

  async deleteFee(id: string): Promise<boolean> {
    const fee = await dexieDb.fees.get(id);
    if (!fee) return false;
    await dexieDb.fees.delete(id);
    await this.addLog(fee.client_id, 'Fee Cancelled', `Invoice of PKR ${fee.amount.toLocaleString()} for ${fee.fee_type} was deleted.`);
    return true;
  }

  // --- DOCUMENTS ---
  async getDocuments(): Promise<Document[]> {
    const docs = await dexieDb.documents.toArray();
    return docs.sort((a,b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  }

  async getDocumentsByClient(clientId: string): Promise<Document[]> {
    return await dexieDb.documents.where('client_id').equals(clientId).toArray();
  }

  async createDocument(docData: Omit<Document, 'id' | 'uploaded_at'>): Promise<Document> {
    const doc: Document = {
      ...docData,
      id: generateId(),
      uploaded_at: new Date().toISOString()
    };
    await dexieDb.documents.add(doc);
    await this.addLog(doc.client_id, 'Document Uploaded', `Document "${doc.file_name}" (${doc.file_type}) uploaded.`);
    return doc;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const doc = await dexieDb.documents.get(id);
    if (!doc) return false;
    await dexieDb.documents.delete(id);
    await this.addLog(doc.client_id, 'Document Deleted', `Document "${doc.file_name}" deleted.`);
    return true;
  }

  // --- NOTICES ---
  async getNotices(): Promise<Notice[]> {
    const notices = await dexieDb.notices.toArray();
    return notices.sort((a,b) => new Date(a.date_received).getTime() - new Date(b.date_received).getTime());
  }

  async getNoticesByClient(clientId: string): Promise<Notice[]> {
    return await dexieDb.notices.where('client_id').equals(clientId).toArray();
  }

  async createNotice(noticeData: Omit<Notice, 'id'>): Promise<Notice> {
    const notice: Notice = {
      ...noticeData,
      id: generateId()
    };
    await dexieDb.notices.add(notice);
    await this.addLog(notice.client_id, 'Notice Logged', `Received notice ${notice.notice_type} from FBR. Response deadline: ${notice.response_deadline.split('T')[0]}.`);
    return notice;
  }

  async updateNotice(id: string, updatedData: Partial<Notice>): Promise<Notice> {
    const oldNotice = await dexieDb.notices.get(id);
    if (!oldNotice) throw new Error('Notice not found');
    await dexieDb.notices.update(id, updatedData);
    const notice = await dexieDb.notices.get(id);
    if (!notice) throw new Error('Notice missing after update');

    if (updatedData.status && updatedData.status !== oldNotice.status) {
      await this.addLog(
        notice.client_id,
        'Notice Status Updated',
        `FBR Notice status changed from ${oldNotice.status} to ${updatedData.status}.`
      );
    } else {
      await this.addLog(notice.client_id, 'Notice Details Updated', `FBR Notice response/notes updated.`);
    }
    return notice;
  }

  async deleteNotice(id: string): Promise<boolean> {
    const notice = await dexieDb.notices.get(id);
    if (!notice) return false;
    await dexieDb.notices.delete(id);
    await this.addLog(notice.client_id, 'Notice Deleted', `FBR Notice ${notice.notice_type} deleted from records.`);
    return true;
  }

  // --- ACTIVITY LOGS ---
  async getActivityLogs(): Promise<ActivityLog[]> {
    const logs = await dexieDb.activityLogs.orderBy('timestamp').reverse().toArray();
    return logs;
  }

  // --- STATS ---
  async getDashboardStats(): Promise<DashboardStats> {
    const clients = await dexieDb.clients.toArray();
    const filings = await dexieDb.filings.toArray();
    const fees = await dexieDb.fees.toArray();

    const totalActiveClients = clients.filter(c => c.atl_status === 'Active').length;
    
    // Determine current month in UTC (or local YYYY-MM)
    const currentYearMonth = new Date().toISOString().substring(0, 7); // e.g. "2026-07"
    
    const filingsDueThisMonth = filings.filter(f => {
      const isUnfiled = f.status !== 'Filed' && f.status !== 'Acknowledged';
      const isThisMonth = f.deadline.startsWith(currentYearMonth);
      return isUnfiled && isThisMonth;
    }).length;

    const overdueFilings = filings.filter(f => isOverdue(f.deadline, f.status)).length;

    const totalFeesOutstanding = fees.reduce((sum, fe) => sum + fe.balance_due, 0);

    return {
      totalActiveClients,
      filingsDueThisMonth,
      overdueFilings,
      totalFeesOutstanding
    };
  }

  // Reset to seeds
  async resetToDefaults() {
    await dexieDb.transaction('rw', dexieDb.clients, dexieDb.filings, dexieDb.fees, dexieDb.documents, dexieDb.notices, dexieDb.activityLogs, async () => {
      await dexieDb.clients.clear();
      await dexieDb.filings.clear();
      await dexieDb.fees.clear();
      await dexieDb.documents.clear();
      await dexieDb.notices.clear();
      await dexieDb.activityLogs.clear();

      await dexieDb.clients.bulkAdd(SEED_CLIENTS);
      await dexieDb.filings.bulkAdd(SEED_FILINGS);
      await dexieDb.fees.bulkAdd(SEED_FEES);
      await dexieDb.documents.bulkAdd(SEED_DOCUMENTS);
      await dexieDb.notices.bulkAdd(SEED_NOTICES);
      await dexieDb.activityLogs.bulkAdd(SEED_ACTIVITY);
    });
    return true;
  }
}

export const db = new BilalTaxFirmDB();

