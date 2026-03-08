'use client';
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { EncryptedValue } from '@/components/ui/EncryptedValue';
import { useEmployees } from '@/hooks/useEmployees';
import { encryptSalary } from '@/lib/fhevm';
import { CONTRACT_ADDRESSES, PaymentFrequency } from '@/lib/contracts';
import { shortAddress, frequencyLabel, formatDate } from '@/lib/utils';
import { useAccount } from 'wagmi';

interface AddEmployeeForm {
  wallet: string;
  name: string;
  role: string;
  salary: string;
  paymentToken: string;
  frequency: string;
}

const DEFAULT_FORM: AddEmployeeForm = {
  wallet: '',
  name: '',
  role: '',
  salary: '',
  paymentToken: CONTRACT_ADDRESSES.payrollToken ?? '',
  frequency: '0',
};

export default function EmployeesPage() {
  const { address } = useAccount();
  const { employees, loading, addEmployee, removeEmployee } = useEmployees();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AddEmployeeForm>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase()) ||
      e.wallet.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setSubmitting(true);
    setError(null);
    try {
      const { handle, inputProof } = await encryptSalary(
        CONTRACT_ADDRESSES.employeeRegistry,
        address,
        Number(form.salary)
      );
      await addEmployee({
        wallet: form.wallet,
        name: form.name,
        role: form.role,
        encryptedSalary: handle,
        inputProof,
        paymentToken: form.paymentToken,
        frequency: Number(form.frequency),
      });
      setForm(DEFAULT_FORM);
      setShowModal(false);
    } catch (err: any) {
      setError(err.message ?? 'Failed to add employee');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content fade-in">
          <div className="page-header">
            <div>
              <h1 className="page-title">Employees</h1>
              <p className="page-subtitle">
                {employees.filter((e) => e.isActive).length} active employees · Salaries encrypted with FHE
              </p>
            </div>
            <Button onClick={() => setShowModal(true)}>➕ Add Employee</Button>
          </div>

          {/* Search */}
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Search by name, role, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 400 }}
            />
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Encrypted Salary</th>
                  <th>Frequency</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                      <span className="spinner" style={{ margin: '0 auto', display: 'block' }} />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      {employees.length === 0 ? 'No employees yet. Add your first employee.' : 'No results found.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((emp) => (
                    <tr key={emp.wallet}>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{emp.name}</div>
                        <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          {shortAddress(emp.wallet)}
                        </div>
                      </td>
                      <td>{emp.role}</td>
                      <td>
                        <EncryptedValue
                          handle={emp.encryptedSalaryHandle}
                          contractAddress={CONTRACT_ADDRESSES.employeeRegistry}
                        />
                      </td>
                      <td>{frequencyLabel(emp.frequency ?? 0)}</td>
                      <td>
                        <Badge variant={emp.isActive ? 'success' : 'danger'} dot>
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>{formatDate(emp.addedAt * 1000)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Button variant="ghost" size="sm">✏️</Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeEmployee(emp.wallet)}
                          >
                            🗑️
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add Employee Modal */}
          <Modal
            isOpen={showModal}
            onClose={() => { setShowModal(false); setError(null); }}
            title="➕ Add Employee"
            footer={
              <>
                <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button form="add-employee-form" type="submit" loading={submitting}>
                  Add Employee
                </Button>
              </>
            }
          >
            <form id="add-employee-form" onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: 'var(--accent-danger)' }}>
                    {error}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Wallet Address</label>
                  <input
                    className="form-input"
                    placeholder="0x..."
                    value={form.wallet}
                    onChange={(e) => setForm({ ...form, wallet: e.target.value })}
                    required
                    pattern="^0x[0-9a-fA-F]{40}$"
                  />
                </div>
                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      className="form-input"
                      placeholder="Alice Smith"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role / Department</label>
                    <input
                      className="form-input"
                      placeholder="Senior Engineer"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Monthly Salary (USD) — <span style={{ color: 'var(--accent-primary-hover)' }}>🔐 Will be encrypted automatically</span>
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="5000"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    required
                    min={1}
                  />
                </div>
                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Payment Frequency</label>
                    <select
                      className="form-select"
                      value={form.frequency}
                      onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    >
                      <option value="0">Monthly</option>
                      <option value="1">Biweekly</option>
                      <option value="2">Weekly</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Token</label>
                    <select className="form-select" value={form.paymentToken} onChange={(e) => setForm({ ...form, paymentToken: e.target.value })}>
                      <option value={CONTRACT_ADDRESSES.payrollToken ?? ''}>CPT (Payroll Token)</option>
                    </select>
                  </div>
                </div>
                <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid var(--border-accent)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  🔒 The salary amount is encrypted client-side using Zama FHE before being sent to the blockchain. Nobody except you and the employee can see the value.
                </div>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}
