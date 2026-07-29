import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Challan {
  id: string;
  challanNumber: string;
  status: string;
  totalQuantity: number;
  createdAt: string;
  customer: { name: string };
}

export default function Challans() {
  const { user } = useAuth();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const canManage = user?.role === "ADMIN" || user?.role === "SALES";

  async function load() {
    const res = await api.get("/challans", { params: { status: statusFilter || undefined } });
    setChallans(res.data.items);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div>
      <div className="page-header">
        <h2>Sales Challans</h2>
        {canManage && (
          <Link to="/challans/new" className="btn">+ New challan</Link>
        )}
      </div>

      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr><th>Challan #</th><th>Customer</th><th>Total qty</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            {challans.map((c) => (
              <tr key={c.id}>
                <td><Link to={`/challans/${c.id}`}>{c.challanNumber}</Link></td>
                <td>{c.customer.name}</td>
                <td>{c.totalQuantity}</td>
                <td><span className={`badge ${c.status.toLowerCase()}`}>{c.status}</span></td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {challans.length === 0 && (
              <tr><td colSpan={5} className="muted" style={{ padding: 20 }}>No challans found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
