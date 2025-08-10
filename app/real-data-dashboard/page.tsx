"use client"

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Users, MapPin, Zap, Target, DollarSign, Activity, AlertTriangle, Calendar, Award, Factory, Filter, Search, BarChart3, Database, RefreshCw, TrendingUpIcon, CalendarDays, BarChart4 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { dataLoader } from '@/lib/data-loader';
import { TwoWheelerDataProcessor } from '@/lib/data-processor';

const RealDataDashboard = () => {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aggregatedData, setAggregatedData] = useState<any>(null);
  const [filters, setFilters] = useState({
    manufacturer: 'all',
    fuelType: 'all',
    ccCapacity: 'all',
    state: 'all',
    city: 'all',
    month: 'all',
    make: 'all',
    model: 'all',
    variant: 'all',
    rto: 'all',
    rtoClassification: 'all'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await dataLoader.loadData();
      const data = dataLoader.getAggregatedData();
      setAggregatedData(data);
      setDataLoaded(true);
      console.log('Available months after loading:', dataLoader.getAvailableMonths());
      console.log('Total records in dataset:', dataLoader.getDataProcessor().getData().length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterType]: value };
      
      // Implement cascading filter reset logic
      if (filterType === 'manufacturer') {
        // When manufacturer changes, reset model and variant
        newFilters.model = 'all';
        newFilters.variant = 'all';
      } else if (filterType === 'model') {
        // When model changes, reset variant
        newFilters.variant = 'all';
      }
      
      return newFilters;
    });
  };

  const getFilteredData = () => {
    if (!dataLoaded) return [];
    const filterCriteria = {
      manufacturer: filters.manufacturer !== 'all' ? filters.manufacturer : undefined,
      fuelType: filters.fuelType !== 'all' ? filters.fuelType : undefined,
      ccCapacity: filters.ccCapacity !== 'all' ? filters.ccCapacity : undefined,
      state: filters.state !== 'all' ? filters.state : undefined,
      city: filters.city !== 'all' ? filters.city : undefined,
      month: filters.month !== 'all' ? parseInt(filters.month) : undefined,
      make: filters.make !== 'all' ? filters.make : undefined,
      model: filters.model !== 'all' ? filters.model : undefined,
      variant: filters.variant !== 'all' ? filters.variant : undefined,
      rto: filters.rto !== 'all' ? filters.rto : undefined,
      rtoClassification: filters.rtoClassification !== 'all' ? filters.rtoClassification : undefined
    };
    
    console.log('Filter criteria being passed:', filterCriteria);
    return dataLoader.getDataProcessor().getFilteredData(filterCriteria);
  };

  const getFilteredAggregatedData = () => {
    if (!dataLoaded) return null;
    
    // If no filters are applied, return the original aggregated data
    if (Object.values(filters).every(f => f === 'all')) {
      return aggregatedData;
    }
    
    // Get filtered data and calculate aggregated metrics
    const filteredData = getFilteredData();
    console.log('Filters applied:', filters);
    console.log('Filtered data length:', filteredData.length);
    if (filteredData.length > 0) {
      console.log('Sample filtered record:', filteredData[0]);
    }
    
    if (filteredData.length === 0) return null;
    
    // Calculate filtered totals
    const totalVehicles = filteredData.reduce((sum: number, record: any) => sum + record.vehicleCount, 0);
    const uniqueStates = new Set(filteredData.map((record: any) => record.nameOfState));
    const uniqueCities = new Set(filteredData.map((record: any) => record.nameOfCity));
    const uniqueRTOs = new Set(filteredData.map((record: any) => record.nameOfRTO));
    const uniqueManufacturers = new Set(filteredData.map((record: any) => record.vehicleMake));
    const uniqueFuelTypes = new Set(filteredData.map((record: any) => record.vehicleFuel));
    
    // Group by month for trends
    const monthlyData = filteredData.reduce((acc: any, record: any) => {
      const month = record.monthOfSales;
      if (!acc[month]) {
        acc[month] = { month, count: 0, monthName: ['Apr', 'May', 'Jun', 'Jul'][month-4] };
      }
      acc[month].count += record.vehicleCount;
      return acc;
    }, {});
    
    const monthlyTrends = Object.values(monthlyData).sort((a: any, b: any) => a.month - b.month);
    
    // Calculate manufacturers data
    const manufacturersData = filteredData.reduce((acc: any, record: any) => {
      const manufacturer = record.vehicleMake;
      if (!acc[manufacturer]) {
        acc[manufacturer] = { name: manufacturer, count: 0 };
      }
      acc[manufacturer].count += record.vehicleCount;
      return acc;
    }, {});
    const manufacturers = Object.values(manufacturersData)
      .map((item: any) => ({
        ...item,
        percentage: (item.count / totalVehicles) * 100
      }))
      .filter((manufacturer: any) => manufacturer.percentage >= 0.5) // Filter out manufacturers with <0.5% market share
      .sort((a: any, b: any) => b.count - a.count);
    
    // Calculate fuel types data
    const fuelTypesData = filteredData.reduce((acc: any, record: any) => {
      const fuelType = record.vehicleFuel;
      if (!acc[fuelType]) {
        acc[fuelType] = { fuel: fuelType, count: 0 };
      }
      acc[fuelType].count += record.vehicleCount;
      return acc;
    }, {});
    const fuelTypes = Object.values(fuelTypesData).map((item: any) => ({
      ...item,
      percentage: (item.count / totalVehicles) * 100
    }));
    
    // Calculate states data
    const statesData = filteredData.reduce((acc: any, record: any) => {
      const state = record.nameOfState;
      if (!acc[state]) {
        acc[state] = { name: state, count: 0 };
      }
      acc[state].count += record.vehicleCount;
      return acc;
    }, {});
    const states = Object.values(statesData).sort((a: any, b: any) => b.count - a.count);
    
    // Calculate top models data
    const modelsData = filteredData.reduce((acc: any, record: any) => {
      const model = record.vehicleModel;
      if (!acc[model]) {
        acc[model] = { model, manufacturer: record.vehicleMake, count: 0 };
      }
      acc[model].count += record.vehicleCount;
      return acc;
    }, {});
    const topModels = Object.values(modelsData).sort((a: any, b: any) => b.count - a.count);
    
    // Calculate top cities data
    const citiesData = filteredData.reduce((acc: any, record: any) => {
      const city = record.nameOfCity;
      if (!acc[city]) {
        acc[city] = { name: city, state: record.nameOfState, count: 0 };
      }
      acc[city].count += record.vehicleCount;
      return acc;
    }, {});
    const topCities = Object.values(citiesData).sort((a: any, b: any) => b.count - a.count);
    
    return {
      totalVehicles,
      totalStates: uniqueStates.size,
      totalCities: uniqueCities.size,
      totalRTOs: uniqueRTOs.size,
      totalManufacturers: uniqueManufacturers.size,
      fuelTypes: Array.from(uniqueFuelTypes),
      monthlyTrends,
      manufacturers,
      states,
      topModels,
      topCities
    };
  };

  // Get context-aware unique values for cascading filters
  const getContextualUniqueValues = () => {
    if (!dataLoaded) return {
      manufacturers: [],
      fuelTypes: [],
      ccCapacities: [],
      states: [],
      cities: [],
      rtos: [],
      models: [],
      variants: [],
      rtoClassifications: []
    };

    // For manufacturers - always show all manufacturers
    const allValues = dataLoader.getUniqueValues();
    
    // For models - filter by selected manufacturer (if any)
    const modelContext = filters.manufacturer !== 'all' ? { manufacturer: filters.manufacturer } : undefined;
    const modelValues = dataLoader.getUniqueValues(modelContext);
    
    // For variants - filter by selected manufacturer and model (if any)
    const variantContext: any = {};
    if (filters.manufacturer !== 'all') variantContext.manufacturer = filters.manufacturer;
    if (filters.model !== 'all') variantContext.model = filters.model;
    const variantValues = Object.keys(variantContext).length > 0 ? dataLoader.getUniqueValues(variantContext) : dataLoader.getUniqueValues();

    return {
      manufacturers: allValues.manufacturers,
      fuelTypes: allValues.fuelTypes,
      ccCapacities: allValues.ccCapacities,
      states: allValues.states,
      cities: allValues.cities,
      rtos: allValues.rtos,
      models: modelValues.models,
      variants: variantValues.variants,
      rtoClassifications: allValues.rtoClassifications
    };
  };

  const uniqueValues = getContextualUniqueValues();

  const availableMonths = dataLoaded ? dataLoader.getAvailableMonths() : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Loading Two Wheeler Analytics...</h2>
          <p className="text-gray-500 mt-2">Processing 345,000+ vehicle records</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Error Loading Data</h2>
          <p className="text-red-500 mt-2">{error}</p>
          <Button onClick={loadData} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  if (!dataLoaded || !aggregatedData) {
    return null;
  }

  const filteredData = getFilteredData();
  const totalFiltered = filteredData.reduce((sum: number, record: any) => sum + record.vehicleCount, 0);
  const filteredAggregatedData = getFilteredAggregatedData();
  const hasFiltersApplied = !Object.values(filters).every(f => f === 'all');
  
  // If filters are applied but no data matches, show empty state instead of falling back to all data
  const displayData = hasFiltersApplied 
    ? (filteredAggregatedData || {
        totalVehicles: 0,
        totalStates: 0,
        totalCities: 0,
        totalRTOs: 0,
        totalManufacturers: 0,
        totalFuelTypes: 0,
        monthlyTrends: [],
        manufacturers: [],
        fuelTypes: [],
        states: [],
        topModels: [],
        topCities: []
      })
    : aggregatedData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Two Wheeler Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive analysis of {displayData.totalVehicles.toLocaleString()} vehicle registrations across {displayData.totalStates} states</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <CalendarDays className="h-3 w-3 mr-1" />
                              {availableMonths.map(m => ['Apr', 'May', 'Jun', 'Jul'][m-4]).join(' - ')} 2025
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Database className="h-3 w-3 mr-1" />
              {displayData.totalVehicles.toLocaleString()} Records
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Data Filters
            </CardTitle>
            <CardDescription>Filter the data to focus on specific segments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Manufacturer</label>
                <Select value={filters.manufacturer} onValueChange={(value) => handleFilterChange('manufacturer', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Manufacturers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Manufacturers</SelectItem>
                    {uniqueValues.manufacturers.filter(manufacturer => manufacturer && manufacturer.trim() !== '').map(manufacturer => (
                      <SelectItem key={manufacturer} value={manufacturer}>{manufacturer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Fuel Type</label>
                <Select value={filters.fuelType} onValueChange={(value) => handleFilterChange('fuelType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Fuel Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fuel Types</SelectItem>
                    {uniqueValues.fuelTypes.filter(fuel => fuel && fuel.trim() !== '').map(fuel => (
                      <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">CC Capacity</label>
                <Select value={filters.ccCapacity} onValueChange={(value) => handleFilterChange('ccCapacity', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All CC Capacities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All CC Capacities</SelectItem>
                    {uniqueValues.ccCapacities.filter(cc => cc && cc.trim() !== '').map(cc => (
                      <SelectItem key={cc} value={cc}>{cc}cc</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">State</label>
                <Select value={filters.state} onValueChange={(value) => handleFilterChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {uniqueValues.states.filter(state => state && state.trim() !== '').map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">City</label>
                <Select value={filters.city} onValueChange={(value) => handleFilterChange('city', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {uniqueValues.cities.filter(city => city && city.trim() !== '').map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Month</label>
                <Select value={filters.month} onValueChange={(value) => handleFilterChange('month', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {availableMonths.map(month => (
                      <SelectItem key={month} value={month.toString()}>
                        {['Apr', 'May', 'Jun', 'Jul'][month-4]} 2025
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">RTO Classification</label>
                <Select value={filters.rtoClassification} onValueChange={(value) => handleFilterChange('rtoClassification', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classifications" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classifications</SelectItem>
                    <SelectItem value="Metro">Metro</SelectItem>
                    <SelectItem value="Urban">Urban</SelectItem>
                    <SelectItem value="Rural">Rural</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Additional Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Model</label>
                <Select value={filters.model} onValueChange={(value) => handleFilterChange('model', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {uniqueValues.models.filter(model => model && model.trim() !== '').map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Variant</label>
                <Select value={filters.variant} onValueChange={(value) => handleFilterChange('variant', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Variants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Variants</SelectItem>
                    {uniqueValues.variants.filter(variant => variant && variant.trim() !== '').map(variant => (
                      <SelectItem key={variant} value={variant}>{variant}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">RTO</label>
                <Select value={filters.rto} onValueChange={(value) => handleFilterChange('rto', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All RTOs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All RTOs</SelectItem>
                    {uniqueValues.rtos.filter(rto => rto && rto.trim() !== '').map(rto => (
                      <SelectItem key={rto} value={rto}>{rto}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Make</label>
                <Select value={filters.make} onValueChange={(value) => handleFilterChange('make', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Makes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Makes</SelectItem>
                    {uniqueValues.manufacturers.filter(make => make && make.trim() !== '').map(make => (
                      <SelectItem key={make} value={make}>{make}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {Object.values(filters).some(f => f !== 'all') && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Filtered Results:</strong> {totalFiltered.toLocaleString()} vehicles 
                  ({((totalFiltered / aggregatedData.totalVehicles) * 100).toFixed(1)}% of total)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayData.totalVehicles.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across {displayData.totalStates} states
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active RTOs</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayData.totalRTOs.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                In {displayData.totalCities} cities
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manufacturers</CardTitle>
              <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayData.totalManufacturers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {displayData.fuelTypes.length} fuel types
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">States Covered</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayData.totalStates.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Union Territories included
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              Monthly Trends (Apr - Jul 2025)
            </CardTitle>
            <CardDescription>Vehicle registration trends across four months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={displayData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthName" />
                <YAxis />
                <Tooltip formatter={(value) => [value.toLocaleString(), 'Vehicles']} />
                <Legend />
                <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Manufacturers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Manufacturers by Market Share
              </CardTitle>
              <CardDescription>Leading manufacturers and their market presence</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={displayData.manufacturers.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => [value.toLocaleString(), 'Vehicles']} />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Fuel Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Fuel Type Distribution
              </CardTitle>
              <CardDescription>Breakdown by fuel type and technology</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={displayData.fuelTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ fuel, percentage }) => `${fuel} (${percentage.toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {displayData.fuelTypes.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value.toLocaleString(), 'Vehicles']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* State-wise Distribution */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              State-wise Vehicle Distribution
            </CardTitle>
            <CardDescription>Geographic distribution across Indian states and UTs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
                              <BarChart data={displayData.states.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => [value.toLocaleString(), 'Vehicles']} />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Vehicle Models */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Vehicle Models
              </CardTitle>
              <CardDescription>Most popular models {Object.values(filters).every(f => f === 'all') ? 'across all manufacturers' : 'for selected filters'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayData.topModels.slice(0, 15).map((model: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{model.model}</span>
                      <span className="text-sm text-gray-500 ml-2">({model.manufacturer})</span>
                    </div>
                    <Badge variant="secondary">{model.count.toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Cities by Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Top Cities by Sales
              </CardTitle>
              <CardDescription>Leading cities {Object.values(filters).every(f => f === 'all') ? 'in vehicle registrations' : 'for selected filters'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayData.topCities.slice(0, 15).map((city: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{city.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({city.state})</span>
                    </div>
                    <Badge variant="secondary">{city.count.toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dataset Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Dataset Summary
            </CardTitle>
            <CardDescription>Comprehensive overview of the analytics dataset</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{displayData.totalVehicles.toLocaleString()}</div>
                <div className="text-sm text-blue-800">Total Vehicles</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{displayData.totalManufacturers}</div>
                <div className="text-sm text-green-800">Manufacturers</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{displayData.totalStates}</div>
                <div className="text-sm text-purple-800">States/UTs</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{displayData.totalRTOs}</div>
                <div className="text-sm text-orange-800">RTO Offices</div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Data Coverage</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Geographic Coverage:</strong> {displayData.totalStates} states and union territories
                </div>
                <div>
                  <strong>Time Period:</strong> April to July 2025 (4 months)
                </div>
                <div>
                  <strong>Data Quality:</strong> {displayData.totalCities} cities, {displayData.totalRTOs} RTOs
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RealDataDashboard; 