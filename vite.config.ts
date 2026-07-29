import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

interface Customer { id: string; name: string; mobile: string; }
interface Product { id: string; name: string; sku: string; currentStock: number; unitPrice: string; }

interface LineItem { productId: string; quantity: number; }

export default function ChallanCreate() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ productId: "", quantity: 1 }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/customers", { params: { pageSize: 100 } }).then((res) => setCustomers(res.data.items));
    api.get("/products", { params: { pageSize: 100 } }).then((res) => setProducts(res.data.items));
  }, []);

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function addItemRow() {
    setItems((prev) => [...prev, { productId: "", quantity: 1 }]);
  }

  function removeItemRow(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(status: "DRAFT" | "CONFIRMED") {
    setError(null);
    if (!customerId) {
      setError("Please select a customer");
      return;
    }
    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      setError("Add at least one product with a quantity");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/challans", { customerId, items: validItems, status });
      navigate(`/challans/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not create challan");
    } finally {
      setSubmitting(false);
    }
  }

  function productFor(id: string) {
    return products.find((p) => p.id === id);
  }

  return (
    <div>
      <div className="page-header">
        <h2>New Sales Challan</h2>
      </div>

      <div className="card">
        <div className="form-row">
          <label>Customer</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select a customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>
            ))}
          </select>
        </div>

        <label style={{ marginTop: 16, display: "block" }}>Products</label>
        {items.map((item, idx) => {
          const product = productFor(item.productId);
          return (
            <div className="item-row" key={idx}>
              <div>
                <select value={item.productId} onChange={(e) => updateItem(idx, { productId: e.target.value })}>
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — stock: {p.currentStock}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                />
                {product && item.quantity > product.currentStock && (
                  <div className="error-text">Exceeds available stock ({product.currentStock})</div>
                )}
              </div>
              <button type="button" className="btn secondary" onClick={() => removeItemRow(idx)}>
                Remove
              </button>
            </div>
          );
        })}
        <button type="button" className="btn secondary" onClick={addItemRow} style={{ marginBottom: 16 }}>
          + Add product line
        </button>

        {error && <div className="error-text">{error}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button className="btn secondary" disabled={submitting} onClick={() => handleSubmit("DRAFT")}>
            Save as Draft
          </button>
          <button className="btn" disabled={submitting} onClick={() => handleSubmit("CONFIRMED")}>
            Save &amp; Confirm (reduces stock)
          </button>
        </div>
      </div>
    </div>
  );
}
