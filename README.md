# 🧀 Akshaya Dairy - Admin Panel

Admin panel frontend application for Akshaya Dairy Management System built with React, TypeScript, and Bootstrap.

## 📋 Features

- **Dashboard** - Real-time statistics and analytics
- **Driver Management** - View and manage drivers
- **Dairy Center Management** - Manage dairy centers
- **Milk Collections** - View all milk collection records
- **Payments** - Manage payments and transactions
- **Responsive Design** - Fully responsive Bootstrap UI

## 🛠 Technology Stack

- **React 18** with **TypeScript**
- **Vite** (Build tool)
- **React Router** (Routing)
- **Bootstrap 5** (UI Framework)
- **Axios** (HTTP Client)
- **React Toastify** (Notifications)
- **React Icons** (Icons)

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v18+)
- npm or yarn

### 1. Install Dependencies

```bash
cd frontend-admin
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The application will start on http://localhost:3001

### 3. Build for Production

```bash
npm run build
```

## 🔧 Configuration

The frontend is configured to proxy API requests to the backend server running on `http://localhost:3000`.

To change the API URL, update `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

Or update the base URL in `src/contexts/AuthContext.tsx`:

```typescript
axios.defaults.baseURL = 'http://your-api-url/api';
```

## 📁 Project Structure

```
frontend-admin/
├── src/
│   ├── components/       # Reusable components
│   │   ├── Layout.tsx
│   │   └── PrivateRoute.tsx
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx
│   ├── pages/            # Page components
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Drivers.tsx
│   │   ├── DairyCenters.tsx
│   │   ├── MilkCollections.tsx
│   │   └── Payments.tsx
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🔑 Authentication

The admin panel requires admin role authentication. Users with other roles will be redirected to login.

Default admin credentials:
- **Mobile/Email**: `9876543210` or `admin@akshayadairy.com`
- **Password**: `password123`

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎨 UI Components

The application uses Bootstrap 5 for styling with custom components:
- Navigation sidebar
- Dashboard cards
- Data tables
- Forms
- Modals
- Toast notifications

## 📞 Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ for Akshaya Dairy**

