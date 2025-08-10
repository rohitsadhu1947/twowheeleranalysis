# Two Wheeler Analytics Dashboard

A comprehensive analytics dashboard for two-wheeler vehicle registrations built with Next.js, TypeScript, and real RTO (Regional Transport Office) data.

## 🚀 Features

### 📊 **Real Data Integration**
- **Live RTO Data**: Processes actual vehicle registration data from Indian RTOs
- **115,000+ Records**: Analyzes over 115,000 vehicle registrations from May 2025
- **Real-time Analytics**: Dynamic filtering and analysis of live data

### 🎯 **Comprehensive Analytics**
- **Market Share Analysis**: Manufacturer-wise market share and performance
- **Geographic Insights**: State-wise, city-wise, and RTO-wise distribution
- **Fuel Type Analysis**: Breakdown by fuel type (Petrol, Electric, etc.)
- **Model Performance**: Top-performing vehicle models and variants
- **Trend Analysis**: Sales patterns and market dynamics

### 🛠️ **Advanced Features**
- **Interactive Filters**: Filter by manufacturer, fuel type, state, city, and RTO
- **Dynamic Charts**: Responsive charts using Recharts library
- **Real-time Updates**: Live data processing and visualization
- **Mobile Responsive**: Optimized for all device sizes

## 🏗️ **Architecture**

### **Frontend**
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible UI components
- **Recharts**: Data visualization library

### **Data Processing**
- **CSV Parser**: Handles large RTO datasets efficiently
- **Data Aggregation**: Real-time data processing and analysis
- **Memory Optimization**: Efficient handling of 100k+ records
- **Filtering Engine**: Dynamic data filtering capabilities

## 📁 **Project Structure**

```
twowheeleranalysis/
├── app/
│   ├── page.tsx                    # Original demo dashboard
│   ├── real-data-dashboard/        # Live data dashboard
│   ├── layout.tsx                  # Root layout with navigation
│   └── globals.css                 # Global styles
├── components/
│   ├── ui/                         # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── select.tsx
│   └── navigation.tsx              # Main navigation component
├── lib/
│   ├── data-processor.ts           # Core data processing logic
│   ├── data-loader.ts              # Data loading and caching
│   └── utils.ts                    # Utility functions
├── data/
│   └── 2W_May_2025.csv            # Real RTO dataset
├── public/
│   └── data/                       # Public data access
└── package.json                     # Dependencies and scripts
```

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- pnpm (recommended) or npm

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/rohitsadhu1947/twowheeleranalysis.git
   cd twowheeleranalysis
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Use the navigation to switch between dashboards

## 📊 **Data Sources**

### **RTO Dataset (2W_May_2025.csv)**
- **Source**: Indian Regional Transport Offices
- **Records**: 115,340 vehicle registrations
- **Period**: May 2025
- **Fields**: 
  - Vehicle details (Make, Model, Variant, Fuel, CC)
  - Sales information (Count, Month/Year)
  - Geographic data (RTO, City, District, State)

### **Data Fields**
- `Vehicle Make`: Manufacturer brand
- `Vehicle Model`: Specific model name
- `Vehicle Variant`: Model variant/trim
- `Vehicle Count`: Number of registrations
- `Vehicle Fuel`: Fuel type (Petrol, Electric, etc.)
- `Vehicle CC`: Engine capacity
- `Name of RTO`: RTO office name
- `Name of City`: City name
- `Name of State`: State/UT name

## 🎯 **Dashboard Features**

### **1. Original Dashboard (`/`)**
- Demo dashboard with sample data
- Advanced filtering and visualization
- Mapbox integration for geographic insights

### **2. Real Data Dashboard (`/real-data-dashboard`)**
- **Live Data Processing**: Real-time analysis of RTO data
- **Interactive Filters**: Dynamic filtering by multiple criteria
- **KPI Cards**: Key performance indicators
- **Charts & Graphs**: 
  - Manufacturer market share
  - Fuel type distribution
  - Geographic breakdown
  - Top models and cities
- **Data Summary**: Comprehensive dataset overview

## 🔧 **Customization**

### **Adding New Data Sources**
1. Place CSV files in the `data/` directory
2. Update the data processor for new field mappings
3. Modify the dashboard components as needed

### **Extending Analytics**
1. Add new analysis methods in `data-processor.ts`
2. Create new chart components
3. Integrate additional visualization libraries

## 📈 **Performance Features**

- **Lazy Loading**: Data loaded on-demand
- **Memory Management**: Efficient handling of large datasets
- **Caching**: Aggregated data caching for better performance
- **Responsive Design**: Optimized for all screen sizes

## 🌐 **Deployment**

### **Vercel (Recommended)**
```bash
pnpm build
vercel --prod
```

### **Other Platforms**
```bash
pnpm build
pnpm start
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

This project is open source and available under the [MIT License](LICENSE).

## 🔗 **Links**

- **Live Demo**: [Vercel Deployment](https://vercel.com/rohitsadhu-ensureditcos-projects/v0-two-wheeler-analytics)
- **GitHub**: [Repository](https://github.com/rohitsadhu1947/twowheeleranalysis)
- **v0.dev**: [Project Builder](https://v0.dev/chat/projects/1ymMwt1E2pK)

## 📞 **Support**

For questions or support, please open an issue on GitHub or contact the maintainers.

---

**Built with ❤️ using Next.js, TypeScript, and real RTO data**