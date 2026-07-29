import { Routes, Route, Navigate, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Products from "./pages/Products";
import Challans from "./pages/Challans";
import ChallanCreate from "./pages/ChallanCreate";
import ChallanDetail from "./pages/ChallanDetail";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>ERP / CRM Portal</h1>
        <nav>
          <NavLink to="/customers" className={({ isActive }) => (isActive ? "active" : "")}>
            Customers
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => (isActive ? "active" : "")}>
            Products &amp; Inventory
          </NavLink>
          <NavLink to="/challans" className={({ isActive }) => (isActive ? "active" : "")}>
            Sales Challans
          </NavLink>
        </nav>
        <div className="user-box">
          <div>{user.name}</div>
          <div>{user.role}</div>
          <a href="#" onClick={handleLogout} style={{ color: "#fff", marginTop: 8, display: "inline-block" }}>
            Log out
          </a>
        </div>
      </aside>
      <div className="main-content">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/customers"
        element={
          <ProtectedLayout>
            <Customers />
          </ProtectedLayout>
        }
      />
      <Route
        path="/customers/:id"
        element={
          <ProtectedLayout>
            <CustomerDetail />
          </ProtectedLayout>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedLayout>
            <Products />
          </ProtectedLayout>
        }
      />
      <Route
        path="/challans"
        element={
          <ProtectedLayout>
            <Challans />
          </ProtectedLayout>
        }
      />
      <Route
        path="/challans/new"
        element={
          <ProtectedLayout>
            <ChallanCreate />
          </ProtectedLayout>
        }
      />
      <Route
        path="/challans/:id"
        element={
          <ProtectedLayout>
            <ChallanDetail />
          </ProtectedLayout>
        }
      />
      <Route path="/" element={<Navigate to="/customers" replace />} />
      <Route path="*" element={<Navigate to="/customers" replace />} />
    </Routes>
  );
}
