import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string;
  unitPrice: string;
  currentStock: number;
  minStock: number;
  location?: string;
}

const emptyForm = { name: "", sku: "", category: "", unitPrice: 0, minStock: 0, location: "" };

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [movementFor, setMovementFor] = useState<Product | null>(null);
  const [movement, setMovement] = useState({ quantity: 1, movementType: "IN", reason: "" });

  const canManage = user?.role === "ADMIN" || user?.role === "WAREHOUSE";

  async function load() {
    const res = await api.get("/products", {
      params: { search: search || undefined, lowStockOnly: lowStockOnly || undefined },
    });
    setProducts(res.data.items);
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, lowStockOnly]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/products", { ...form, unitPrice: Number(form.unitPrice), minStock: Number(form.minStock) });
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not create product");
    }
  }

  async function handleMovement(e: React.FormEvent) {
    e.preventDefault();
    if (!movementFor) return;
    setError(null);
    try {
      await api.post(`/products/${movementFor.id}/stock-movements`, {
        ...movement,
        quantity: Number(movement.quantity),
      });
      setMovementFor(null);
      setMovement({ quantity: 1, movementType: "IN", reason: "" });
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not record stock movement");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Products &amp; Inventory</h2>
        {canManage && (
          <button className="btn" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ Add product"}
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
              <label>SKU / code</label>
              <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Unit price</label>
              <input type="number" step="0.01" required value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} />
            </div>
            <div className="form-row">
              <label>Minimum stock alert qty</label>
              <input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} />
            </div>
            <div className="form-row">
              <label>Location / warehouse</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="btn" type="submit">Save product</button>
        </form>
      )}

      {movementFor && (
        <form className="card" onSubmit={handleMovement}>
          <h3 style={{ marginTop: 0 }}>Stock movement — {movementFor.name}</h3>
          <div className="form-grid">
            <div className="form-row">
              <label>Movement type</label>
              <select value={movement.movementType} onChange={(e) => setMovement({ ...movement, movementType: e.target.value })}>
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </select>
            </div>
            <div className="form-row">
              <label>Quantity</label>
              <input type="number" min={1} required value={movement.quantity} onChange={(e) => setMovement({ ...movement, quantity: Number(e.target.value) })} />
            </div>
            <div className="form-row" style={{ gridColumn: "1 / -1" }}>
              <label>Reason</label>
              <input required value={movement.reason} onChange={(e) => setMovement({ ...movement, reason: e.target.value })} placeholder="e.g. Purchase order received, damaged stock write-off..." />
            </div>
          </div>
          {error && <div className="error-text">{error}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" type="submit">Record movement</button>
            <button className="btn secondary" type="button" onClick={() => setMovementFor(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, width: "auto" }}>
          <input type="checkbox" style={{ width: "auto" }} checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th><th>SKU</th><th>Category</th><th>Unit price</th><th>Stock</th><th>Location</th>{canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.sku}</td>
                <td>{p.category || "-"}</td>
                <td>₹{p.unitPrice}</td>
                <td className={p.currentStock <= p.minStock ? "stock-low" : ""}>
                  {p.currentStock} {p.currentStock <= p.minStock && "(low)"}
                </td>
                <td>{p.location || "-"}</td>
                {canManage && (
                  <td>
                    <button className="btn secondary" onClick={() => setMovementFor(p)}>
                      Adjust stock
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={7} className="muted" style={{ padding: 20 }}>No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
