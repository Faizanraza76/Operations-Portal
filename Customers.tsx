import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface ChallanItem {
  id: string;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  unitPriceSnapshot: string;
  quantity: number;
}

interface ChallanFull {
  id: string;
  challanNumber: string;
  status: string;
  totalQuantity: number;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  customer: { id: string; name: string; mobile: string };
  items: ChallanItem[];
}

export default function ChallanDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [challan, setChallan] = useState<ChallanFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canManage = user?.role === "ADMIN" || user?.role === "SALES";

  async function load() {
    const res = await api.get(`/challans/${id}`);
    setChallan(res.data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleConfirm() {
    setError(null);
    setBusy(true);
    try {
      await api.post(`/challans/${id}/confirm`);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not confirm challan");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setError(null);
    setBusy(true);
    try {
      await api.post(`/challans/${id}/cancel`);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not cancel challan");
    } finally {
      setBusy(false);
    }
  }

  if (!challan) return <p className="muted">Loading...</p>;

  const total = challan.items.reduce((sum, i) => sum + Number(i.unitPriceSnapshot) * i.quantity, 0);

  return (
    <div>
      <div className="page-header">
        <h2>Challan {challan.challanNumber}</h2>
        <Link to="/challans" className="btn secondary">Back to challans</Link>
      </div>

      <div className="card">
        <div className="form-grid">
          <div>
            <label>Customer</label>
            <Link to={`/customers/${challan.customer.id}`}>{challan.customer.name}</Link>
          </div>
          <div><label>Status</label><span className={`badge ${challan.status.toLowerCase()}`}>{challan.status}</span></div>
          <div><label>Created</label>{new Date(challan.createdAt).toLocaleString()}</div>
          <div><label>Total quantity</label>{challan.totalQuantity}</div>
        </div>

        {error && <div className="error-text" style={{ marginTop: 12 }}>{error}</div>}

        {canManage && challan.status === "DRAFT" && (
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn" disabled={busy} onClick={handleConfirm}>
              Confirm (reduces stock)
            </button>
            <button className="btn danger" disabled={busy} onClick={handleCancel}>
              Cancel challan
            </button>
          </div>
        )}
        {canManage && challan.status === "CONFIRMED" && (
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn danger" disabled={busy} onClick={handleCancel}>
              Cancel &amp; restore stock
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Unit price (snapshot)</th><th>Qty</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            {challan.items.map((item) => (
              <tr key={item.id}>
                <td>{item.productNameSnapshot}</td>
                <td>{item.productSkuSnapshot}</td>
                <td>₹{item.unitPriceSnapshot}</td>
                <td>{item.quantity}</td>
                <td>₹{(Number(item.unitPriceSnapshot) * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: "right", fontWeight: 600 }}>Total</td>
              <td style={{ fontWeight: 600 }}>₹{total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
