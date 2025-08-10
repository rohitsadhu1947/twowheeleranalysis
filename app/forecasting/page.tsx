'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dataLoader } from '@/lib/data-loader';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Activity, Calendar, BarChart3, AlertCircle } from 'lucide-react';

const ForecastingDashboard = () => {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState('all');
  const [selectedFuelType, setSelectedFuelType] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [forecastPeriod, setForecastPeriod] = useState('6'); // months
  const [forecastData, setForecastData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (dataLoaded) {
      calculateForecasts();
    }
  }, [dataLoaded, selectedManufacturer, selectedFuelType, selectedRegion, forecastPeriod]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await dataLoader.loadData();
      
      const testData = dataLoader.getDataProcessor().getData();
      console.log('Forecasting data loaded:', testData.length, 'records');
      
      if (testData.length > 0) {
        setDataLoaded(true);
      } else {
        throw new Error('No data was loaded for forecasting analysis');
      }
      
    } catch (err) {
      console.error('Error loading forecasting data:', err);
      setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateForecasts = () => {
    if (!dataLoaded) return;

    const data = dataLoader.getDataProcessor().getData();
    const uniqueValues = dataLoader.getUniqueValues();

    // Apply filters
    let filteredData = data;
    if (selectedManufacturer !== 'all') {
      filteredData = filteredData.filter(record => record.vehicleMake === selectedManufacturer);
    }
    if (selectedFuelType !== 'all') {
      filteredData = filteredData.filter(record => record.vehicleFuel === selectedFuelType);
    }
    if (selectedRegion !== 'all') {
      filteredData = filteredData.filter(record => record.nameOfState === selectedRegion);
    }

    // Historical monthly data
    const monthlyData = filteredData.reduce((acc: any, record: any) => {
      const month = record.monthOfSales;
      if (!acc[month]) {
        acc[month] = { month, volume: 0, count: 0 };
      }
      acc[month].volume += record.vehicleCount;
      acc[month].count += 1;
      return acc;
    }, {});

    const historicalTrend = Object.values(monthlyData).sort((a: any, b: any) => a.month - b.month);

    // Simple linear trend forecasting
    const forecastMonths = parseInt(forecastPeriod);
    const trendCalculation = calculateTrend(historicalTrend);
    const volumeForecasts = generateVolumeForecasts(historicalTrend, forecastMonths, trendCalculation);

    // Market share forecasting for manufacturers
    const marketShareForecasts = calculateMarketShareForecasts(filteredData, forecastMonths);

    // Regional growth forecasting
    const regionalForecasts = calculateRegionalForecasts(filteredData, forecastMonths);

    // Fuel type trend forecasting
    const fuelTypeForecasts = calculateFuelTypeForecasts(filteredData, forecastMonths);

    // Growth rate predictions
    const growthPredictions = calculateGrowthPredictions(historicalTrend, forecastMonths);

    setForecastData({
      historicalTrend,
      volumeForecasts,
      marketShareForecasts,
      regionalForecasts,
      fuelTypeForecasts,
      growthPredictions,
      trendCalculation,
      uniqueValues,
      totalHistoricalVolume: historicalTrend.reduce((sum: number, item: any) => sum + item.volume, 0)
    });
  };

  const calculateTrend = (data: any[]) => {
    if (data.length < 2) return { slope: 0, intercept: 0, r2: 0, method: 'insufficient_data' };

    const n = data.length;
    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum, item) => sum + item.volume, 0);
    const sumXY = data.reduce((sum, item, i) => sum + i * item.volume, 0);
    const sumXX = data.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = data.reduce((sum, item) => sum + Math.pow(item.volume - yMean, 2), 0);
    const ssResidual = data.reduce((sum, item, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(item.volume - predicted, 2);
    }, 0);
    const r2 = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

    // Enhanced forecasting approach
    const avgVolume = yMean;
    const recentAvg = data.slice(-2).reduce((sum, item) => sum + item.volume, 0) / Math.min(2, data.length);
    const growth = data.length > 1 ? (data[data.length - 1].volume - data[0].volume) / data[0].volume : 0;
    
    return { 
      slope, 
      intercept, 
      r2: Math.max(0, Math.min(1, r2)), 
      avgVolume,
      recentAvg,
      growth,
      method: 'enhanced_linear'
    };
  };

  const generateVolumeForecasts = (historical: any[], months: number, trend: any) => {
    const forecasts = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Use multiple forecasting approaches for better accuracy
    const baseVolume = trend.recentAvg || trend.avgVolume;
    const monthlyGrowthRate = historical.length > 1 ? 
      Math.pow(historical[historical.length - 1].volume / historical[0].volume, 1 / (historical.length - 1)) - 1 : 0;
    
    // Limit growth rate to reasonable bounds (-10% to +20% monthly)
    const boundedGrowthRate = Math.max(-0.1, Math.min(0.2, monthlyGrowthRate));
    
    for (let i = 1; i <= months; i++) {
      let forecastVolume;
      
      // Use different methods based on trend quality
      if (trend.r2 > 0.7 && Math.abs(trend.slope) > 0) {
        // High confidence in linear trend
        forecastVolume = Math.max(baseVolume * 0.3, trend.intercept + trend.slope * (historical.length + i - 1));
      } else {
        // Use exponential smoothing with seasonal adjustment
        const seasonalMultiplier = 1 + 0.1 * Math.sin((i * Math.PI) / 6); // Simple seasonal pattern
        const growthAdjustedVolume = baseVolume * Math.pow(1 + boundedGrowthRate, i);
        forecastVolume = growthAdjustedVolume * seasonalMultiplier;
      }
      
      // Ensure minimum realistic volume (at least 20% of recent average)
      forecastVolume = Math.max(baseVolume * 0.2, forecastVolume);
      
      // Calculate confidence based on data quality and forecast distance
      const baseConfidence = Math.max(0.5, trend.r2) * 100;
      const distanceDecay = Math.max(0.3, 1 - (i * 0.05)); // Confidence decreases with distance
      const confidence = Math.round(baseConfidence * distanceDecay);
      
      const currentMonth = (6 + i) % 12; // Starting from July (6)
      const currentYear = 2025 + Math.floor((6 + i) / 12);
      
      forecasts.push({
        period: `${monthNames[currentMonth]} ${currentYear}`,
        volume: Math.round(forecastVolume),
        confidence: Math.max(30, confidence), // Minimum 30% confidence
        type: 'forecast'
      });
    }
    
    return forecasts;
  };

  const calculateMarketShareForecasts = (data: any[], months: number) => {
    const manufacturerData = data.reduce((acc: any, record: any) => {
      const month = record.monthOfSales;
      if (!acc[record.vehicleMake]) {
        acc[record.vehicleMake] = {};
      }
      if (!acc[record.vehicleMake][month]) {
        acc[record.vehicleMake][month] = 0;
      }
      acc[record.vehicleMake][month] += record.vehicleCount;
      return acc;
    }, {});

    const forecasts = Object.entries(manufacturerData)
      .map(([manufacturer, monthlyData]: [string, any]) => {
        const volumes = Object.values(monthlyData);
        if (volumes.length < 2) return null;

        const trend = calculateTrend(volumes.map((v, i) => ({ volume: v, month: i })));
        const lastVolume = volumes[volumes.length - 1] as number;
        const projectedVolume = Math.max(0, trend.intercept + trend.slope * volumes.length);
        
        return {
          manufacturer,
          currentVolume: lastVolume,
          projectedVolume: Math.round(projectedVolume),
          growth: ((projectedVolume - lastVolume) / lastVolume * 100).toFixed(1),
          confidence: Math.round(Math.max(0.4, trend.r2) * 100)
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.projectedVolume - a.projectedVolume)
      .slice(0, 10);

    return forecasts;
  };

  const calculateRegionalForecasts = (data: any[], months: number) => {
    const regionalData = data.reduce((acc: any, record: any) => {
      const state = record.nameOfState;
      const month = record.monthOfSales;
      if (!acc[state]) {
        acc[state] = {};
      }
      if (!acc[state][month]) {
        acc[state][month] = 0;
      }
      acc[state][month] += record.vehicleCount;
      return acc;
    }, {});

    const forecasts = Object.entries(regionalData)
      .map(([state, monthlyData]: [string, any]) => {
        const volumes = Object.values(monthlyData);
        if (volumes.length < 2) return null;

        const trend = calculateTrend(volumes.map((v, i) => ({ volume: v, month: i })));
        const lastVolume = volumes[volumes.length - 1] as number;
        const projectedVolume = Math.max(0, trend.intercept + trend.slope * volumes.length);
        
        return {
          state,
          currentVolume: lastVolume,
          projectedVolume: Math.round(projectedVolume),
          growth: ((projectedVolume - lastVolume) / lastVolume * 100).toFixed(1),
          trend: trend.slope > 0 ? 'growing' : trend.slope < 0 ? 'declining' : 'stable'
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.projectedVolume - a.projectedVolume)
      .slice(0, 8);

    return forecasts;
  };

  const calculateFuelTypeForecasts = (data: any[], months: number) => {
    const fuelData = data.reduce((acc: any, record: any) => {
      const fuel = record.vehicleFuel;
      const month = record.monthOfSales;
      if (!acc[fuel]) {
        acc[fuel] = {};
      }
      if (!acc[fuel][month]) {
        acc[fuel][month] = 0;
      }
      acc[fuel][month] += record.vehicleCount;
      return acc;
    }, {});

    const forecasts = Object.entries(fuelData)
      .map(([fuelType, monthlyData]: [string, any]) => {
        const volumes = Object.values(monthlyData);
        if (volumes.length < 2) return null;

        const trend = calculateTrend(volumes.map((v, i) => ({ volume: v, month: i })));
        const lastVolume = volumes[volumes.length - 1] as number;
        const projectedVolume = Math.max(0, trend.intercept + trend.slope * volumes.length);
        
        return {
          fuelType,
          currentVolume: lastVolume,
          projectedVolume: Math.round(projectedVolume),
          growth: ((projectedVolume - lastVolume) / lastVolume * 100).toFixed(1),
          marketTrend: trend.slope > 5 ? 'accelerating' : trend.slope > 0 ? 'growing' : 'declining'
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.projectedVolume - a.projectedVolume);

    return forecasts;
  };

  const calculateGrowthPredictions = (historical: any[], months: number) => {
    if (historical.length < 2) return { monthlyGrowth: 0, annualizedGrowth: 0, volatility: 0 };

    const monthlyGrowthRates = [];
    for (let i = 1; i < historical.length; i++) {
      const growth = ((historical[i].volume - historical[i-1].volume) / historical[i-1].volume) * 100;
      monthlyGrowthRates.push(growth);
    }

    const avgMonthlyGrowth = monthlyGrowthRates.reduce((sum, rate) => sum + rate, 0) / monthlyGrowthRates.length;
    const annualizedGrowth = Math.pow(1 + avgMonthlyGrowth / 100, 12) - 1;
    
    // Calculate volatility (standard deviation)
    const variance = monthlyGrowthRates.reduce((sum, rate) => sum + Math.pow(rate - avgMonthlyGrowth, 2), 0) / monthlyGrowthRates.length;
    const volatility = Math.sqrt(variance);

    return {
      monthlyGrowth: avgMonthlyGrowth.toFixed(1),
      annualizedGrowth: (annualizedGrowth * 100).toFixed(1),
      volatility: volatility.toFixed(1)
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading forecasting data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadData} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Market Forecasting Dashboard
          </h1>
          <p className="text-gray-600">
            Predictive analytics and trend projections for strategic planning
          </p>
        </div>

        {/* Control Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Forecasting Parameters</CardTitle>
            <CardDescription>Configure your forecasting analysis settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Manufacturer</label>
                <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Manufacturers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Manufacturers</SelectItem>
                    {forecastData?.uniqueValues.manufacturers.map((manufacturer: string) => (
                      <SelectItem key={manufacturer} value={manufacturer}>
                        {manufacturer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Fuel Type</label>
                <Select value={selectedFuelType} onValueChange={setSelectedFuelType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Fuel Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fuel Types</SelectItem>
                    {forecastData?.uniqueValues.fuelTypes.map((fuel: string) => (
                      <SelectItem key={fuel} value={fuel}>
                        {fuel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Region</label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {forecastData?.uniqueValues.states.map((state: string) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Forecast Period</label>
                <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                    <SelectItem value="24">24 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {forecastData && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Trend Strength</CardTitle>
                  <Activity className="h-4 w-4 ml-auto text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(forecastData.trendCalculation.r2 * 100).toFixed(0)}%</div>
                  <p className="text-xs text-gray-600">Model confidence level</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
                  <TrendingUp className="h-4 w-4 ml-auto text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{forecastData.growthPredictions.monthlyGrowth}%</div>
                  <p className="text-xs text-gray-600">Average monthly change</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Annual Projection</CardTitle>
                  <Target className="h-4 w-4 ml-auto text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{forecastData.growthPredictions.annualizedGrowth}%</div>
                  <p className="text-xs text-gray-600">Annualized growth rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Market Volatility</CardTitle>
                  <AlertCircle className="h-4 w-4 ml-auto text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{forecastData.growthPredictions.volatility}%</div>
                  <p className="text-xs text-gray-600">Risk assessment</p>
                </CardContent>
              </Card>
            </div>

            {/* Volume Forecasting Chart */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Volume Forecasting</CardTitle>
                <CardDescription>
                  Historical trends and projected volumes for the next {forecastPeriod} months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={[
                    ...forecastData.historicalTrend.map((item: any, index: number) => ({
                      period: ['Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025'][index] || `Month ${index + 1}`,
                      historical: item.volume,
                      forecast: null,
                      confidence: null
                    })),
                    ...forecastData.volumeForecasts.map((item: any) => ({
                      period: item.period,
                      historical: null,
                      forecast: item.volume,
                      confidence: item.confidence
                    }))
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="historical" 
                      fill="#3B82F6" 
                      stroke="#3B82F6" 
                      fillOpacity={0.3}
                      name="Historical Volume"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="forecast" 
                      stroke="#10B981" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      name="Forecasted Volume"
                    />
                    <Bar 
                      dataKey="confidence" 
                      fill="#F59E0B" 
                      fillOpacity={0.6}
                      name="Confidence %"
                      yAxisId="right"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Manufacturer Forecasts */}
              <Card>
                <CardHeader>
                  <CardTitle>Manufacturer Projections</CardTitle>
                  <CardDescription>Expected performance by brand</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {forecastData.marketShareForecasts.map((forecast: any, index: number) => (
                      <div key={forecast.manufacturer} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm font-medium">{index + 1}</div>
                          <div>
                            <div className="font-medium">{forecast.manufacturer}</div>
                            <div className="text-sm text-gray-600">
                              Current: {forecast.currentVolume.toLocaleString()} → 
                              Projected: {forecast.projectedVolume.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${parseFloat(forecast.growth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {forecast.growth}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {forecast.confidence}% confidence
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Fuel Type Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Fuel Type Forecasts</CardTitle>
                  <CardDescription>Technology adoption projections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {forecastData.fuelTypeForecasts.map((forecast: any, index: number) => (
                      <div key={forecast.fuelType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{forecast.fuelType}</div>
                          <div className="text-sm text-gray-600">
                            {forecast.currentVolume.toLocaleString()} → {forecast.projectedVolume.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${parseFloat(forecast.growth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {forecast.growth}%
                          </div>
                          <Badge variant={
                            forecast.marketTrend === 'accelerating' ? 'default' : 
                            forecast.marketTrend === 'growing' ? 'secondary' : 'destructive'
                          }>
                            {forecast.marketTrend}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Regional Forecasts */}
            <Card>
              <CardHeader>
                <CardTitle>Regional Growth Projections</CardTitle>
                <CardDescription>State-wise market expansion forecasts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {forecastData.regionalForecasts.map((forecast: any) => (
                    <div key={forecast.state} className="p-4 border rounded-lg">
                      <div className="font-medium mb-2">{forecast.state}</div>
                      <div className="text-2xl font-bold mb-1">
                        {forecast.projectedVolume.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        From {forecast.currentVolume.toLocaleString()}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          parseFloat(forecast.growth) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {forecast.growth}%
                        </span>
                        <Badge variant={
                          forecast.trend === 'growing' ? 'default' : 
                          forecast.trend === 'declining' ? 'destructive' : 'secondary'
                        }>
                          {forecast.trend}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ForecastingDashboard;