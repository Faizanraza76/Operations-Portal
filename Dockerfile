import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Customer {
  id: string;
  name: string;
  mobile: string;
  businessName?: string;
  customerType: string;
  status: string;
  followUpDate?: string;
}

const emptyForm = {
  name: "",
  mobile: "",
  email: "",
  businessName: "",
  gstNumber: "",
  customerType: "RETAIL",
  address: "",
  status: "LEAD",
  notes: "",
};

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = user?.role === "ADMIN" || user?.role === "SALES";

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/customers", {
        params: { search: search || undefined, status: statusFilter || undefined },
      });
      setCustomers(res.data.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/customers", form);
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not create customer");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Customers</h2>
        {canManage && (
          <button className="btn" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ Add customer"}
          </button>
        )}
      </div>

      {showForm && (
        <form className="card" onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="form-row">
              <label>Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Mobile</label>
              <input required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Business name</label>
              <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
            </div>
            <div className="form-row">
              <label>GST number</label>
              <input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Customer type</label>
              <select value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value })}>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
            <div className="form-row">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="form-row" style={{ gridColumn: "1 / -1" }}>
              <label>Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="form-row" style={{ gridColumn: "1 / -1" }}>
              <label>Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="btn" type="submit">Save customer</button>
        </form>
      )}

      <div className="toolbar">
        <input
          placeholder="Search by name, mobile, business, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>Business</th>
              <th>Type</th>
              <th>Status</th>
              <th>Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link to={`/customers/${c.id}`}>{c.name}</Link>
                </td>
                <td>{c.mobile}</td>
                <td>{c.businessName || "-"}</td>
                <td>{c.customerType}</td>
                <td>
                  <span className={`badge ${c.status.toLowerCase()}`}>{c.status}</span>
                </td>
                <td>{c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={6} className="muted" style={{ padding: 20 }}>
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
