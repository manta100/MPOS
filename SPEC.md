# MPOS - Modern Point of Sale System

## Complete Specification Document
### A full-featured POS system inspired by Loyverse POS

---

## 🎯 Overview

MPOS (Modern Point of Sale) is a comprehensive, cloud-based POS system designed for retail and restaurant businesses. It provides complete feature parity with Loyverse POS while offering a modern, responsive web interface.

### Tech Stack
- **Frontend:** React.js 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** MySQL with Prisma ORM
- **Real-time:** Socket.io
- **Auth:** JWT with refresh tokens

---

## 📊 Complete Feature List (100+ Features)

### Core POS Screen
- Grid layout for items with category navigation
- Shopping cart with quantity management
- Real-time search with barcode scanning
- Customer assignment to tickets
- Favorites and quick access items
- Customizable layout arrangement
- Quick Service Mode for fast transactions
- Weight-based item selling with scale integration
- Volume-based pricing (liquids)

### Items & Modifiers
- Full CRUD operations with image uploads
- Item variants (size, color, style)
- Item modifiers (toppings, customizations)
- SKU and barcode generation
- CSV import/export for bulk operations
- Combo meals (bundled items)
- Production tracking (manufacturing)
- Box-to-piece sales (buy bulk, sell individual)
- Composite items (kits/packages)
- Item notes and special instructions
- Scale integration for weight barcodes

### Tickets & Sales
- Open ticket management (create, save)
- Hold and recall tickets
- Reopen closed tickets
- Merge two tickets into one
- Split tickets into multiple
- Print intermediate bills
- Cancel receipts (void sales)
- Customer identification by phone number

### Payments
- Multiple payment methods configuration
- Split payments between methods
- Automatic change calculation
- Cash rounding to nearest denomination
- Tip handling for card payments
- Gift cards (sale and redemption)
- Card reader integration (payment gateway)
- Paid services and premium add-ons

### Refunds & Discounts
- Partial refunds (item-level)
- Full refunds
- Percentage-based discounts
- Fixed amount discounts
- Item-level discount application
- Loyalty points redemption
- Automatic discount rules

### Taxes & Receipts
- Multiple tax rates
- Tax inclusive/exclusive pricing
- Tax-exempt customer handling
- Print receipts
- Email receipts to customers
- Invoice generation (B2B)
- Custom receipt logos
- Receipt custom text/footer
- QR codes in receipts
- Tax rates by dining option

### Customer Management (CRM)
- Customer profiles with contact info
- Purchase history tracking
- Loyalty points system
- Customer notes
- Customer tags and segmentation
- Age verification for restricted items
- Loyalty card barcode lookup
- Customer deletion
- Customer import/export (CSV)

### Employee Management
- Role-based access control (admin/manager/cashier)
- Time clock (clock in/out)
- Shift management
- Sales tracking per employee
- PIN code login
- Employee performance reports
- Font size accessibility settings

### Operations
- Cash drawer management
- Safe drops
- Shift reports
- Cash shortage/surplus tracking
- Full shift lifecycle management

### Restaurant Features
- Kitchen Display System (KDS)
- Kitchen printer support
- Dining options (dine-in/takeout/delivery)
- Table management
- Customer-facing display
- Kitchen station assignment
- Kitchen bell/buzzer alerts
- Multiple kitchen printers per station
- Predefined tickets for tables

### Inventory Management
- Real-time stock tracking
- Low stock alerts
- Negative stock warnings
- Purchase orders to suppliers
- Auto-fill purchase orders from sales
- Additional PO costs (shipping, handling)
- Vendor management
- Store-to-store transfers
- Stock adjustments
- Inventory counts
- Inventory valuation
- Complete inventory history

### Reports & Analytics
- Daily sales summary
- Sales by item
- Sales by payment type
- Sales by employee
- Sales by hour
- Sales by category
- Tax reports
- Shift reports
- Receipt history
- CSV export
- PDF export

### Settings & Configuration
- Store configuration
- Multi-currency support
- Multi-language interface (i18n)
- Dark theme
- Receipt customization
- Tax configuration
- Hardware settings
- User preferences

### Technical Features
- Progressive Web App (PWA)
- Offline mode with sync
- REST API
- WebSocket real-time updates
- Multi-store support
- Hardware integration (printers, scanners, cash drawers)

---

## 🗄️ Database Schema (22 Tables)

### Authentication & Users
```sql
stores - Multi-store locations
users - Employee accounts with roles
sessions - JWT session tracking
```

### Items & Categories
```sql
categories - Item categories with nesting
items - Products with pricing
item_variants - Size/color variants
modifier_groups - Groups of modifiers
modifiers - Individual modifiers
item_modifier_groups - Items to modifiers mapping
combo_meals - Bundle deals
combo_items - Items in combos
composite_items - Kit items
```

### Tickets & Sales
```sql
tickets - Orders with status
ticket_items - Items in tickets
ticket_payments - Payment records
refunds - Refund tracking
gift_cards - Gift card balances
gift_card_transactions - Gift card usage
```

### Payments & Discounts
```sql
payments - Payment method configuration
discounts - Discount rules
taxes - Tax rate configuration
```

### Customers
```sql
customers - Customer profiles
customer_tags - Customer segmentation
loyalty_transactions - Points history
```

### Inventory
```sql
inventory_logs - Stock movement history
purchase_orders - Supplier orders
purchase_order_items - PO line items
vendors - Supplier management
transfers - Store transfers
transfer_items - Transfer details
```

### Operations
```sql
shifts - Shift tracking
cash_events - Cash movements
time_clock - Clock in/out
safe_drops - Cash deposits
```

### Kitchen
```sql
kitchen_orders - Kitchen queue
kitchen_order_items - Order items
table_layouts - Restaurant tables
kitchen_stations - Kitchen zones
```

### Reports & Settings
```sql
reports_cache - Pre-computed reports
sales_by_hour - Hourly aggregates
audit_logs - Activity tracking
settings - Store configuration
receipt_templates - Receipt design
user_settings - User preferences
```

---

## 📡 API Endpoints (100+)

### Authentication
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/pin-login
- GET /api/auth/me
- PUT /api/auth/password

### Stores
- GET/POST /api/stores
- GET/PUT/DELETE /api/stores/:id

### Users
- GET/POST /api/users
- GET/PUT/DELETE /api/users/:id
- PUT /api/users/:id/role

### Time Clock
- POST /api/time-clock/clock-in
- POST /api/time-clock/clock-out
- GET /api/time-clock/status

### Shifts
- GET/POST /api/shifts
- POST /api/shifts/:id/close
- GET /api/shifts/:id/report

### Categories
- GET/POST /api/categories
- GET/PUT/DELETE /api/categories/:id

### Items
- GET/POST /api/items
- GET/PUT/DELETE /api/items/:id
- GET /api/items/barcode/:code
- GET /api/items/search
- POST /api/items/import
- GET /api/items/export

### Variants & Modifiers
- GET/POST /api/items/:id/variants
- PUT/DELETE /api/variants/:id
- GET/POST /api/modifier-groups
- GET/POST /api/modifiers

### Combo Meals
- GET/POST /api/combo-meals
- PUT/DELETE /api/combo-meals/:id

### Tickets
- GET/POST /api/tickets
- GET/PUT/DELETE /api/tickets/:id
- POST /api/tickets/:id/hold
- POST /api/tickets/:id/reopen
- POST /api/tickets/:id/pay
- POST /api/tickets/:id/split
- POST /api/tickets/:id/merge

### Ticket Items
- POST /api/tickets/:id/items
- PUT /api/tickets/:id/items/:itemId
- DELETE /api/tickets/:id/items/:itemId

### Payments & Refunds
- GET/POST /api/payments
- POST /api/tickets/:id/refund
- GET /api/refunds

### Gift Cards
- GET/POST /api/gift-cards
- POST /api/gift-cards/:id/redeem
- POST /api/gift-cards/:id/load

### Discounts
- GET/POST /api/discounts
- POST /api/tickets/:id/discount

### Taxes
- GET/POST /api/taxes
- PUT /api/taxes/:id

### Customers
- GET/POST /api/customers
- GET/PUT/DELETE /api/customers/:id
- GET /api/customers/search
- GET /api/customers/phone/:number
- GET /api/customers/:id/history

### Loyalty
- GET /api/loyalty/points/:customerId
- POST /api/loyalty/earn
- POST /api/loyalty/redeem

### Inventory
- GET /api/inventory
- PUT /api/inventory/:itemId
- GET /api/inventory/low-stock
- POST /api/inventory/count

### Purchase Orders
- GET/POST /api/purchase-orders
- POST /api/purchase-orders/:id/send
- POST /api/purchase-orders/:id/receive

### Vendors
- GET/POST /api/vendors
- PUT/DELETE /api/vendors/:id

### Transfers
- GET/POST /api/transfers
- POST /api/transfers/:id/send
- POST /api/transfers/:id/receive

### Kitchen
- GET /api/kitchen/orders
- POST /api/kitchen/orders/:id/status
- GET/POST /api/kitchen/stations

### Tables
- GET/POST /api/tables
- PUT/DELETE /api/tables/:id

### Reports
- GET /api/reports/sales
- GET /api/reports/sales-by-item
- GET /api/reports/sales-by-category
- GET /api/reports/sales-by-payment
- GET /api/reports/sales-by-employee
- GET /api/reports/sales-by-hour
- GET /api/reports/tax
- GET /api/reports/shift
- GET /api/reports/receipts
- GET /api/reports/export

### Settings
- GET/PUT /api/settings
- GET/PUT /api/settings/store
- GET/PUT /api/settings/receipt
- GET/PUT /api/settings/tax

### Receipts
- POST /api/receipts/print
- POST /api/receipts/email
- GET /api/receipts/:id

---

## 🎨 UI/UX Design System

### Color Palette
```
Primary:    #3B82F6 (Blue)
Secondary:  #10B981 (Green)
Accent:     #F59E0B (Amber)
Danger:     #EF4444 (Red)
Sidebar:    #1F2937 (Dark Gray)
Content:    #F9FAFB (Light Gray)
Cards:      #FFFFFF (White)
```

### Typography
- Primary Font: Inter (system fallback: -apple-system, BlinkMacSystemFont, sans-serif)
- Monospace: JetBrains Mono (for prices, codes)

### Spacing System
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64

### Layout
- Sidebar: 280px fixed width
- Content area: Fluid
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

---

## 🏗️ Project Structure

```
MPOS/
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── context/         # React Context
│   │   ├── services/        # API services
│   │   ├── stores/          # State management
│   │   ├── types/          # TypeScript types
│   │   └── utils/           # Utilities
│   └── package.json
│
├── backend/                  # Node.js + Express
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Prisma models
│   │   ├── routes/         # API routes
│   │   ├── middleware/      # Auth, validation
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   └── package.json
│
├── prisma/
│   └── schema.prisma        # Database schema
│
└── docs/
    └── README.md
```

---

## ⏱️ Implementation Phases

| Phase | Features | Timeline |
|-------|----------|----------|
| 1 | Foundation + Auth | 2-3 days |
| 2 | POS Screen | 3-4 days |
| 3 | Items + Modifiers | 3-4 days |
| 4 | Tickets + Payments | 2-3 days |
| 5 | Refunds + Receipts | 2-3 days |
| 6 | Inventory + PO | 3-4 days |
| 7 | Customers + Loyalty | 2-3 days |
| 8 | Shifts + Cash | 2-3 days |
| 9 | Kitchen Display | 2-3 days |
| 10 | Reports | 2-3 days |
| 11 | Settings | 2 days |
| 12 | Polish + i18n | 2-3 days |

**Total: 27-36 days**

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 👥 Authors

MPOS Development Team

---

## 🔗 Links

- Documentation: /docs
- API Reference: /api-docs
- Support: support@mpos.com
