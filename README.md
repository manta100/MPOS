# MPOS - Modern Point of Sale System

A comprehensive, full-featured POS system inspired by Loyverse POS, built with React, Node.js, and MySQL.

![MPOS Logo](https://via.placeholder.com/120x40/3B82F6/FFFFFF?text=MPOS)

## 🎯 Features

MPOS includes 100+ features covering all aspects of retail and restaurant POS operations:

### Core POS
- ✅ Grid layout for items with category navigation
- ✅ Shopping cart with quantity management
- ✅ Real-time search with barcode scanning
- ✅ Customer assignment to tickets
- ✅ Favorites and quick access items
- ✅ Customizable layout arrangement
- ✅ Quick Service Mode for fast transactions
- ✅ Weight-based item selling
- ✅ Volume-based pricing (liquids)

### Items & Modifiers
- ✅ Full CRUD with image uploads
- ✅ Item variants (size, color, style)
- ✅ Item modifiers (toppings, customizations)
- ✅ SKU and barcode generation
- ✅ CSV import/export
- ✅ Combo meals (bundled items)
- ✅ Production tracking
- ✅ Box-to-piece sales
- ✅ Composite items (kits/packages)

### Tickets & Sales
- ✅ Open ticket management
- ✅ Hold and recall tickets
- ✅ Merge two tickets into one
- ✅ Split tickets into multiple
- ✅ Print intermediate bills
- ✅ Cancel receipts (void sales)
- ✅ Customer identification by phone

### Payments
- ✅ Multiple payment methods
- ✅ Split payments
- ✅ Cash rounding
- ✅ Tip handling
- ✅ Gift cards
- ✅ Card reader integration

### Customer Management (CRM)
- ✅ Customer profiles
- ✅ Loyalty points system
- ✅ Customer tags and segmentation
- ✅ Age verification
- ✅ Customer import/export

### Inventory
- ✅ Real-time stock tracking
- ✅ Low stock alerts
- ✅ Purchase orders
- ✅ Store-to-store transfers
- ✅ Inventory valuation

### Restaurant
- ✅ Kitchen Display System (KDS)
- ✅ Kitchen printer support
- ✅ Dining options (dine-in/takeout/delivery)
- ✅ Table management
- ✅ Customer display

### Reports & Analytics
- ✅ Daily sales summary
- ✅ Sales by item, category, employee
- ✅ Tax reports
- ✅ Shift reports
- ✅ CSV/PDF export

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | MySQL 8.0 + Prisma ORM |
| Real-time | Socket.io |
| Auth | JWT |
| State | Zustand |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Option 1: Local Development

```bash
# 1. Clone the repository
git clone <repository-url>
cd MPOS

# 2. Setup Backend
cd backend
npm install
cp .env.example .env  # Edit .env with your MySQL credentials
npx prisma generate
npx prisma db push
npm run db:seed  # Seed demo data
npm run dev

# 3. Setup Frontend (in new terminal)
cd frontend
npm install
npm run dev
```

### Option 2: Docker

```bash
# Start all services
docker-compose up -d

# Backend: http://localhost:3001
# Frontend: http://localhost:5173
# MySQL: localhost:3306
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mpos.com | password |
| Manager | manager@mpos.com | password |
| Cashier | cashier@mpos.com | password |

## 📁 Project Structure

```
MPOS/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, validation
│   │   ├── routes/           # API routes
│   │   ├── socket/           # Real-time handlers
│   │   └── utils/            # Helpers
│   └── prisma/
│       └── schema.prisma      # Database schema
│
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/            # Page components
│   │   ├── stores/           # Zustand stores
│   │   ├── services/         # API services
│   │   └── types/            # TypeScript types
│   └── package.json
│
├── prisma/
│   └── seed.ts               # Database seeder
│
└── docker/
    └── docker-compose.yml    # Docker setup
```

## 📡 API Documentation

### Authentication
```
POST   /api/auth/login         - Login with email/password
POST   /api/auth/pin-login     - Login with PIN
GET    /api/auth/me            - Get current user
POST   /api/auth/logout        - Logout
```

### Categories
```
GET    /api/categories         - List all categories
POST   /api/categories         - Create category
PUT    /api/categories/:id      - Update category
DELETE /api/categories/:id    - Delete category
```

### Items
```
GET    /api/items              - List items
POST   /api/items              - Create item
GET    /api/items/:id          - Get item details
GET    /api/items/barcode/:code - Lookup by barcode
PUT    /api/items/:id          - Update item
DELETE /api/items/:id          - Delete item
```

### Tickets
```
GET    /api/tickets            - List tickets
POST   /api/tickets            - Create ticket
POST   /api/tickets/:id/items - Add item to ticket
POST   /api/tickets/:id/pay    - Process payment
POST   /api/tickets/:id/hold  - Hold ticket
POST   /api/tickets/:id/split - Split ticket
```

## 🗄️ Database Schema

The database includes 22 tables:
- `stores` - Multi-store locations
- `users` - Employee accounts
- `categories` - Item categories
- `items` - Products
- `item_variants` - Size/color variants
- `modifier_groups` - Modifier groups
- `modifiers` - Individual modifiers
- `tickets` - Orders
- `ticket_items` - Items in tickets
- `ticket_payments` - Payment records
- `payments` - Payment methods
- `discounts` - Discount rules
- `taxes` - Tax rates
- `customers` - Customer profiles
- `inventory_logs` - Stock movement
- `shifts` - Shift tracking
- And more...

## 📱 PWA Support

MPOS supports offline mode via Progressive Web App (PWA):

1. Service worker caches static assets
2. IndexedDB stores offline data
3. Sync queue for offline operations
4. Auto-sync when connection restored

## 🔒 Security

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Rate limiting
- CORS protection
- Helmet security headers

## 📈 Performance

- React Query for data fetching/caching
- Optimistic updates
- Lazy loading
- Code splitting
- Debounced search

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 📞 Support

- Documentation: /docs
- Issues: GitHub Issues
- Email: support@mpos.com

---

Built with ❤️ by the MPOS Team
