# ProfitFirst - Frontend Application

React-based frontend for the ProfitFirst AI-powered e-commerce analytics platform.

## 🚀 Features

- **Dashboard** - Real-time business metrics and KPIs
- **Marketing Analytics** - Campaign performance, ROAS, POAS tracking
- **AI Chatbot** - Conversational analytics assistant
- **AI Predictions** - 3-month forecasts with LangChain
- **AI Growth Insights** - Growth recommendations and trends
- **Responsive Design** - Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Highcharts** - Advanced charts
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Toastify** - Notifications

## 📦 Installation

1. **Install dependencies**
```bash
cd client
npm install
```

2. **Configure API endpoint**

Edit `axios.js` to set your backend URL:

```javascript
const axiosInstance = axios.create({
  baseURL: '/api',  // For production with proxy
  // baseURL: 'http://localhost:6000/api',  // For local development
});
```

3. **Start development server**
```bash
npm run dev
```

The app will run on `http://localhost:5173`

## 🏗️ Project Structure

```
client/
├── src/
│   ├── components/        # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Pricing.jsx
│   │   └── ...
│   ├── pages/            # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Marketing.jsx
│   │   ├── ChatBot.jsx
│   │   ├── Aiprediction.jsx
│   │   ├── AIGrowth.jsx
│   │   └── ...
│   ├── utils/            # Utility functions
│   │   └── auth.js       # Authentication helpers
│   ├── public/           # Static assets
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── axios.js              # Axios configuration
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
└── package.json          # Dependencies
```

## 📄 Pages

### Dashboard
- Revenue, orders, profit overview
- Marketing metrics (ROAS, POAS, AOV)
- Customer analytics
- Shipping performance
- Interactive charts and graphs

### Marketing
- Campaign performance
- Ad spend tracking
- ROAS/POAS analysis
- Click-through rates
- Cost per purchase

### AI Chatbot
- Natural language queries
- Conversational analytics
- Real-time insights
- Industry benchmarks
- Date-specific queries

### AI Predictions
- 3-month revenue forecasts
- Order predictions
- Profit projections
- Historical data analysis
- Confidence intervals

### AI Growth
- Growth recommendations
- Trend analysis
- Performance insights
- Actionable suggestions

## 🔧 Configuration

### API Endpoint

Update `axios.js` with your backend URL:

```javascript
// For production (with reverse proxy)
baseURL: '/api'

// For local development
baseURL: 'http://localhost:6000/api'

// For production server
baseURL: 'https://your-domain.com/api'
```

### Authentication

The app uses JWT tokens stored in localStorage:
- Token is automatically attached to all API requests
- Auto-logout on token expiration
- Redirect to login on unauthorized access

## 🚀 Build for Production

```bash
# Build the app
npm run build

# Preview production build
npm run preview
```

The build output will be in the `dist/` directory.

## 📱 Responsive Design

The app is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1366px - 1920px)
- Tablet (768px - 1366px)
- Mobile (320px - 768px)

## 🎨 Styling

- **Tailwind CSS** for utility-first styling
- **Custom CSS** for specific components
- **Responsive breakpoints** for all screen sizes
- **Dark mode ready** (can be enabled)

## 🔒 Security

- JWT token authentication
- Secure API communication
- No credentials in code
- Environment-based configuration
- Auto-logout on token expiration

## 📊 Charts & Visualizations

### Recharts
- Line charts for trends
- Bar charts for comparisons
- Area charts for cumulative data
- Pie charts for distributions

### Highcharts
- Advanced interactive charts
- Real-time data updates
- Export functionality
- Responsive design

## 🧪 Development

### Run dev server
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

### Lint code
```bash
npm run lint
```

## 🌐 Deployment

### With Backend (Recommended)

1. Build the frontend:
```bash
npm run build
```

2. Copy `dist/` contents to backend's `public/` folder

3. Backend serves frontend at root URL

### Standalone Deployment

1. Build the app:
```bash
npm run build
```

2. Deploy `dist/` folder to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Any static hosting

3. Configure API endpoint in `axios.js`

## 🔗 API Integration

The frontend communicates with the backend API:

### Authentication
```javascript
POST /api/auth/login
POST /api/auth/register
```

### Data
```javascript
GET /api/data/dashboard/:userId
GET /api/metrics?userId=...&startDate=...&endDate=...
```

### AI Chat
```javascript
POST /api/chat
{
  "userId": "USER_ID",
  "message": "Your question"
}
```

### Predictions
```javascript
GET /api/predictions/:userId
```

## 🐛 Troubleshooting

### API Connection Issues
- Check `axios.js` baseURL configuration
- Verify backend is running
- Check CORS settings on backend
- Verify network connectivity

### Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`
- Update dependencies: `npm update`

### Authentication Issues
- Clear localStorage: `localStorage.clear()`
- Check token expiration
- Verify JWT secret matches backend

## 📚 Dependencies

### Core
- react: ^18.3.1
- react-dom: ^18.3.1
- react-router-dom: ^7.0.2
- axios: ^1.7.9

### UI Components
- recharts: ^2.15.0
- highcharts: ^11.4.8
- highcharts-react-official: ^3.2.1
- lucide-react: ^0.468.0
- react-icons: ^5.3.0

### Utilities
- date-fns: ^4.1.0
- react-toastify: ^11.0.2
- jwt-decode: ^4.0.0

### Styling
- tailwindcss: ^3.4.17

## 📄 License

Private project - All rights reserved

## 🆘 Support

For issues or questions:
1. Check backend API is running
2. Verify API endpoint configuration
3. Check browser console for errors
4. Review network tab for failed requests

---

**Built with ❤️ for e-commerce businesses**
