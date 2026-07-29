# PostgreSQL connection string
# Local:      postgresql://postgres:postgres@localhost:5432/erp_crm
# Neon/Supabase/Render: use the connection string they give you
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/erp_crm"

# JWT
JWT_SECRET="change-this-to-a-long-random-string"
JWT_EXPIRES_IN="8h"

# Server
PORT=4000
CORS_ORIGIN="http://localhost:5173"
