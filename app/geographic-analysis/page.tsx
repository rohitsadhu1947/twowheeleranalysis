'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, MapPin, Zap, Target, Activity, Filter, Map, Navigation, Layers, Globe, Calendar, Building2, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dataLoader } from '@/lib/data-loader';

// Advanced Mapbox Integration for RTO Visualization
const MapboxSalesMap = ({ salesData, filters, onRTOClick, rtoCoordinates, selectedTimeRange, drillDownLevel }) => {
  const mapContainer = React.useRef(null);
  const map = React.useRef(null);
  const [mapboxLoaded, setMapboxLoaded] = React.useState(false);
  
  React.useEffect(() => {
    if (window.mapboxgl) {
      initializeMap();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.onload = () => {
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      
      window.mapboxgl.accessToken = 'pk.eyJ1Ijoicm9oaXRzYWRodSIsImEiOiJjbWR5ZjQ3MTMwMWRlMmpxeGZ6cWp0dDZmIn0.hj4cy3FKyoYsvPhiarVxGQ';
      setMapboxLoaded(true);
      initializeMap();
    };
    document.head.appendChild(script);
  }, []);

  const initializeMap = () => {
    if (map.current || !window.mapboxgl) return;
    
    map.current = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [78.9629, 20.5937], // Center of India
      zoom: 4.5,
      maxBounds: [[68.0, 6.0], [97.0, 37.0]] // India bounds
    });

    map.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right');
    map.current.on('load', addMarkers);
  };

  const addMarkers = () => {
    if (!map.current || !salesData?.length || !rtoCoordinates) return;
    
    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());
    
    const getColor = (classification) => {
      switch (classification) {
        case 'Metro': return '#2563eb';
        case 'Urban': return '#7c3aed';
        case 'Rural': return '#ea580c';
        default: return '#6b7280';
      }
    };

    salesData.forEach(rto => {
      const coords = rtoCoordinates[rto.name];
      if (!coords) return;
      
      const el = document.createElement('div');
      const size = Math.max(15, Math.min(35, Math.sqrt(rto.sales) / 50));
      
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.backgroundColor = getColor(rto.classification);
      el.style.border = '2px solid white';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.transition = 'transform 0.2s ease';

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      // Enhanced popup with more detailed information
      const manufacturerInfo = rto.manufacturerBreakdown ? 
        rto.manufacturerBreakdown.slice(0, 3).map(m => 
          '<div style="display: flex; justify-content: space-between; margin: 2px 0;"><span>' + m.name + ':</span><span>' + m.sales + '</span></div>'
        ).join('') : '';

      const popup = new window.mapboxgl.Popup({ offset: 25 }).setHTML(
        '<div style="padding: 15px; min-width: 250px; font-family: Arial, sans-serif;">' +
          '<h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold; color: #1f2937;">' + rto.name + '</h3>' +
          '<div style="background: #f3f4f6; padding: 8px; border-radius: 6px; margin-bottom: 10px;">' +
            '<div style="display: flex; justify-content: space-between; margin: 4px 0;"><strong>Classification:</strong> <span style="color: ' + getColor(rto.classification) + '; font-weight: bold;">' + rto.classification + '</span></div>' +
            '<div style="display: flex; justify-content: space-between; margin: 4px 0;"><strong>State:</strong> <span>' + (rto.state || 'N/A') + '</span></div>' +
            '<div style="display: flex; justify-content: space-between; margin: 4px 0;"><strong>Total Sales:</strong> <span style="font-weight: bold;">' + rto.sales.toLocaleString() + '</span></div>' +
            '<div style="display: flex; justify-content: space-between; margin: 4px 0;"><strong>Market Share:</strong> <span>' + (rto.percentage?.toFixed(2) || 0) + '%</span></div>' +
            '<div style="display: flex; justify-content: space-between; margin: 4px 0;"><strong>Manufacturers:</strong> <span>' + (rto.manufacturerCount || 0) + '</span></div>' +
            '<div style="display: flex; justify-content: space-between; margin: 4px 0;"><strong>Time Period:</strong> <span>' + (selectedTimeRange || 'All') + '</span></div>' +
          '</div>' +
          (manufacturerInfo ? '<div style="margin-top: 10px;"><strong style="font-size: 12px;">Top Manufacturers:</strong>' + manufacturerInfo + '</div>' : '') +
          '<div style="margin-top: 10px; font-size: 10px; color: #6b7280;">Click marker for detailed analysis</div>' +
        '</div>'
      );

      el.addEventListener('click', () => {
        onRTOClick(rto);
      });

      new window.mapboxgl.Marker(el)
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map.current);
    });
  };

  React.useEffect(() => {
    if (mapboxLoaded && map.current) {
      addMarkers();
    }
  }, [salesData, mapboxLoaded, rtoCoordinates]);

  return React.createElement('div', {
    style: { position: 'relative', width: '100%', height: '100%' }
  }, [
    React.createElement('div', {
      key: 'map',
      ref: mapContainer,
      style: { width: '100%', height: '100%' }
    }),
    !mapboxLoaded && React.createElement('div', {
      key: 'loading',
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255,255,255,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }
    }, [
      React.createElement('div', {
        key: 'text',
        style: { fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }
      }, 'Loading Interactive Map...'),
      React.createElement('div', {
        key: 'powered',
        style: { fontSize: '14px', color: '#666' }
      }, 'Powered by Mapbox GL JS')
    ])
  ]);
};

const GeographicAnalysisPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [aggregatedData, setAggregatedData] = useState(null);
  const [selectedRTO, setSelectedRTO] = useState(null);
  const [rtoCoordinates, setRtoCoordinates] = useState({});
  const [drillDownLevel, setDrillDownLevel] = useState('rto'); // 'rto', 'manufacturer', 'model'
  
  const [filters, setFilters] = useState({
    timeRange: 'all', // 'all', 'current_month', 'last_month', 'quarter', 'custom'
    classification: 'all',
    state: 'all',
    manufacturer: 'all',
    fuelType: 'all',
    specificRTO: 'all',
    month: 'all'
  });

  useEffect(() => {
    loadData();
    loadRTOCoordinates();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await dataLoader.loadData();
      const data = dataLoader.getAggregatedData();
      setAggregatedData(data);
      setDataLoaded(true);
      console.log('Geographic data loaded:', {
        totalRecords: data.totalVehicles,
        months: dataLoader.getAvailableMonths(),
        rtosCount: data.topCities?.length || 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadRTOCoordinates = async () => {
    try {
      const response = await fetch('/data/rto-coordinates.csv');
      const csvText = await response.text();
      
      const coordinates = {};
      const lines = csvText.split('\n');
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const [rto, lat, lng] = line.split(',');
          if (rto && lat && lng) {
            coordinates[rto.trim()] = [parseFloat(lng), parseFloat(lat)];
          }
        }
      }
      
      setRtoCoordinates(coordinates);
      console.log('RTO coordinates loaded:', Object.keys(coordinates).length, 'RTOs');
    } catch (err) {
      console.error('Failed to load RTO coordinates:', err);
    }
  };

  const getFilteredData = () => {
    if (!dataLoaded) return [];
    
    const filterCriteria = {
      manufacturer: filters.manufacturer !== 'all' ? filters.manufacturer : undefined,
      fuelType: filters.fuelType !== 'all' ? filters.fuelType : undefined,
      state: filters.state !== 'all' ? filters.state : undefined,
      rtoClassification: filters.classification !== 'all' ? filters.classification : undefined,
      rto: filters.specificRTO !== 'all' ? filters.specificRTO : undefined
    };

    // Apply time range filtering
    if (filters.timeRange !== 'all') {
      const availableMonths = dataLoader.getAvailableMonths();
      switch (filters.timeRange) {
        case 'current_month':
          filterCriteria.month = Math.max(...availableMonths);
          break;
        case 'last_month':
          const sortedMonths = availableMonths.sort((a, b) => b - a);
          filterCriteria.month = sortedMonths[1] || sortedMonths[0];
          break;
        case 'quarter':
          // Use all available months as they represent the quarter
          break;
        default:
          if (filters.month !== 'all') {
            filterCriteria.month = parseInt(filters.month);
          }
      }
    } else if (filters.month !== 'all') {
      filterCriteria.month = parseInt(filters.month);
    }
    
    return dataLoader.getDataProcessor().getFilteredData(filterCriteria);
  };

  const getEnhancedRTOData = () => {
    if (!dataLoaded) return [];
    
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return [];
    
    // Enhanced RTO-level aggregation with manufacturer breakdown
    const rtoData = filteredData.reduce((acc, record) => {
      const rtoName = record.nameOfRTO;
      if (!acc[rtoName]) {
        acc[rtoName] = {
          name: rtoName,
          state: record.nameOfState,
          classification: record.rtoClassification || 'Rural',
          sales: 0,
          manufacturers: {},
          fuelTypes: {},
          models: {},
          monthlyData: {}
        };
      }
      
      acc[rtoName].sales += record.vehicleCount;
      
      // Manufacturer breakdown
      const manufacturer = record.vehicleMake;
      if (!acc[rtoName].manufacturers[manufacturer]) {
        acc[rtoName].manufacturers[manufacturer] = 0;
      }
      acc[rtoName].manufacturers[manufacturer] += record.vehicleCount;
      
      // Fuel type breakdown
      const fuelType = record.vehicleFuel;
      if (!acc[rtoName].fuelTypes[fuelType]) {
        acc[rtoName].fuelTypes[fuelType] = 0;
      }
      acc[rtoName].fuelTypes[fuelType] += record.vehicleCount;
      
      // Model breakdown
      const model = record.vehicleModel;
      if (!acc[rtoName].models[model]) {
        acc[rtoName].models[model] = 0;
      }
      acc[rtoName].models[model] += record.vehicleCount;
      
      return acc;
    }, {});

    const totalSales = Object.values(rtoData).reduce((sum, rto) => sum + rto.sales, 0);
    
    // Convert to array and enhance with additional metrics
    return Object.values(rtoData).map((rto) => {
      // Top manufacturers for this RTO
      const manufacturerBreakdown = Object.entries(rto.manufacturers)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales);
      
      const fuelBreakdown = Object.entries(rto.fuelTypes)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales);
      
      const modelBreakdown = Object.entries(rto.models)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales);
      
      return {
        ...rto,
        percentage: (rto.sales / totalSales) * 100,
        manufacturerCount: Object.keys(rto.manufacturers).length,
        fuelTypeCount: Object.keys(rto.fuelTypes).length,
        modelCount: Object.keys(rto.models).length,
        manufacturerBreakdown,
        fuelBreakdown,
        modelBreakdown,
        topManufacturer: manufacturerBreakdown[0]?.name || 'N/A',
        dominantFuel: fuelBreakdown[0]?.name || 'N/A'
      };
    }).sort((a, b) => b.sales - a.sales);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    
    // Reset drill-down when filters change
    setSelectedRTO(null);
  };

  const handleRTOClick = (rto) => {
    setSelectedRTO(rto);
    console.log('Selected RTO:', rto);
  };

  const handleDrillDownChange = (level) => {
    setDrillDownLevel(level);
  };

  const uniqueValues = useMemo(() => {
    if (!dataLoaded) return { states: [], manufacturers: [], fuelTypes: [], classifications: [], rtos: [] };
    
    const allValues = dataLoader.getUniqueValues();
    return {
      states: allValues.states,
      manufacturers: allValues.manufacturers,
      fuelTypes: allValues.fuelTypes,
      classifications: allValues.rtoClassifications,
      rtos: allValues.rtos || []
    };
  }, [dataLoaded]);

  const displayData = getEnhancedRTOData();
  const availableMonths = dataLoaded ? dataLoader.getAvailableMonths() : [];
  const mappableRTOs = displayData.filter(rto => rtoCoordinates[rto.name]);

  // Calculate aggregate metrics
  const aggregateMetrics = useMemo(() => {
    const totalSales = displayData.reduce((sum, rto) => sum + rto.sales, 0);
    const totalRTOs = displayData.length;
    const mappedRTOs = mappableRTOs.length;
    const classificationBreakdown = displayData.reduce((acc, rto) => {
      acc[rto.classification] = (acc[rto.classification] || 0) + rto.sales;
      return acc;
    }, {});
    
    return {
      totalSales,
      totalRTOs,
      mappedRTOs,
      coverage: totalRTOs > 0 ? ((mappedRTOs / totalRTOs) * 100).toFixed(1) : 0,
      avgPerRTO: totalRTOs > 0 ? Math.round(totalSales / totalRTOs) : 0,
      classificationBreakdown
    };
  }, [displayData, mappableRTOs]);

  const getTimeRangeLabel = () => {
    switch (filters.timeRange) {
      case 'current_month': return 'Current Month';
      case 'last_month': return 'Last Month';
      case 'quarter': return 'Quarter (Apr-Jul 2025)';
      case 'all': return 'All Months (Apr-Jul 2025)';
      default: return 'Custom Period';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <div className="text-xl font-semibold text-gray-900 mb-2">Loading Geographic Data...</div>
          <div className="text-gray-600">Preparing interactive maps and RTO analytics</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-xl font-semibold mb-4">Error Loading Data</div>
          <div className="text-gray-600 mb-6">{error}</div>
          <Button onClick={loadData} className="bg-blue-600 hover:bg-blue-700">
            <Activity className="w-4 h-4 mr-2" />
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Globe className="h-10 w-10 mr-4 text-blue-600" />
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Geographic Analysis Dashboard</h1>
                <p className="text-gray-600 mt-2">Interactive mapping and regional insights for two-wheeler sales across India</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Analysis Period</div>
              <div className="text-lg font-semibold text-blue-600">{getTimeRangeLabel()}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
              <Map className="h-4 w-4 mr-2" />
              {Object.keys(rtoCoordinates).length} RTOs Mapped
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
              <Navigation className="h-4 w-4 mr-2" />
              Powered by Mapbox
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 px-3 py-1">
              <Building2 className="h-4 w-4 mr-2" />
              Drill-down: {drillDownLevel.charAt(0).toUpperCase() + drillDownLevel.slice(1)}
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 px-3 py-1">
              <Users className="h-4 w-4 mr-2" />
              {aggregateMetrics.totalSales.toLocaleString()} Total Sales
            </Badge>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  <Layers className="h-5 w-5 mr-2" />
                  Interactive Sales Density Map
                </CardTitle>
                <CardDescription>
                  Geographic distribution of two-wheeler sales across India • Click markers for detailed RTO information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '600px' }}>
              <MapboxSalesMap 
                salesData={[]}
                filters={filters}
                onRTOClick={() => {}}
                rtoCoordinates={rtoCoordinates}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GeographicAnalysisPage;
