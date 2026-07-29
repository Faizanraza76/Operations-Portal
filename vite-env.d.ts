:root {
  --bg: #f4f6f8;
  --surface: #ffffff;
  --border: #e2e5e9;
  --text: #1f2430;
  --text-muted: #6b7280;
  --primary: #2f5fdb;
  --primary-dark: #2447ad;
  --danger: #d84343;
  --success: #1f9d55;
  --warning: #b8860b;
  --radius: 8px;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
}

.app-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #171d2b;
  color: #fff;
  padding: 20px 0;
  flex-shrink: 0;
}

.sidebar h1 {
  font-size: 16px;
  padding: 0 20px 20px;
  margin: 0;
  border-bottom: 1px solid #2b3346;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
}

.sidebar nav a {
  color: #c6cbd8;
  text-decoration: none;
  padding: 10px 20px;
  font-size: 14px;
}

.sidebar nav a.active,
.sidebar nav a:hover {
  background: #232b3d;
  color: #fff;
}

.sidebar .user-box {
  padding: 16px 20px;
  border-top: 1px solid #2b3346;
  margin-top: 20px;
  font-size: 13px;
  color: #9aa1b3;
}

.main-content {
  flex: 1;
  padding: 28px 32px;
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 20px;
}

.btn {
  display: inline-block;
  padding: 8px 16px;
  border-radius: var(--radius);
  border: 1px solid var(--primary);
  background: var(--primary);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
}

.btn:hover { background: var(--primary-dark); }
.btn.secondary { background: transparent; color: var(--primary); }
.btn.danger { background: var(--danger); border-color: var(--danger); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th, td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}

th { color: var(--text-muted); font-weight: 600; font-size: 12px; text-transform: uppercase; }

tr:hover td { background: #fafbfc; }

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.badge.lead { background: #fdf1d6; color: var(--warning); }
.badge.active { background: #e3f7e9; color: var(--success); }
.badge.inactive { background: #f0f0f0; color: var(--text-muted); }
.badge.draft { background: #eef1f6; color: var(--text-muted); }
.badge.confirmed { background: #e3f7e9; color: var(--success); }
.badge.cancelled { background: #fbe4e4; color: var(--danger); }

input, select, textarea {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  width: 100%;
}

label { font-size: 13px; color: var(--text-muted); display: block; margin-bottom: 4px; }
.form-row { margin-bottom: 14px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.toolbar { display: flex; gap: 10px; margin-bottom: 16px; align-items: center; }

.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #171d2b, #2f5fdb);
}

.login-card {
  background: #fff;
  padding: 32px;
  border-radius: 12px;
  width: 340px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}

.login-card h1 { font-size: 18px; margin: 0 0 6px; }
.login-card p.sub { color: var(--text-muted); font-size: 13px; margin: 0 0 20px; }

.error-text { color: var(--danger); font-size: 13px; margin-top: 6px; }
.muted { color: var(--text-muted); font-size: 13px; }

.item-row {
  display: grid;
  grid-template-columns: 2fr 1fr auto;
  gap: 10px;
  align-items: end;
  margin-bottom: 10px;
}

.stock-low { color: var(--danger); font-weight: 600; }
