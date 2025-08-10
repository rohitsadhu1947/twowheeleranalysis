'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dataLoader } from '@/lib/data-loader';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Award, AlertTriangle, Crown, BarChart3 } from 'lucide-react';

const CompetitorAnalysis = () => {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [comparisonCompanies, setComparisonCompanies] = useState({
    company1: 'all',
    company2: 'all', 
    company3: 'all'
  });
  const [showComparison, setShowComparison] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('marketShare');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedFuelType, setSelectedFuelType] = useState('all');
  const [selectedCCCapacity, setSelectedCCCapacity] = useState('all');
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await dataLoader.loadData();
      
      // Check if data is actually loaded
      const testData = dataLoader.getDataProcessor().getData();
      console.log('Test data check:', testData.length, 'records loaded');
      
      if (testData.length > 0) {
        setDataLoaded(true);
        // Calculate competitive analysis data immediately after loading
        calculateCompetitiveMetrics(true);
      } else {
        throw new Error('No data was loaded from CSV files');
      }
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompetitiveMetrics = (forceCalculate = false) => {
    if (!forceCalculate && !dataLoaded) return;

    const data = dataLoader.getDataProcessor().getData();
    const uniqueValues = dataLoader.getUniqueValues();

    console.log('Data loaded:', data.length, 'records');
    console.log('Unique manufacturers:', uniqueValues.manufacturers.length);

    if (data.length === 0) {
      console.error('No data available for analysis');
      setError('No data available for analysis. Please check if the data files are loaded properly.');
      return;
    }

    // Market Share Analysis
    const manufacturerTotals = data.reduce((acc: any, record: any) => {
      acc[record.vehicleMake] = (acc[record.vehicleMake] || 0) + record.vehicleCount;
      return acc;
    }, {});

    const totalMarket = Object.values(manufacturerTotals).reduce((sum: number, count: any) => sum + count, 0);
    
    const marketShareData = Object.entries(manufacturerTotals)
      .map(([manufacturer, count]: [string, any]) => ({
        manufacturer,
        volume: count,
        marketShare: ((count / totalMarket) * 100).toFixed(2),
        rank: 0
      }))
      .filter(item => parseFloat(item.marketShare) >= 0.5) // Filter out manufacturers with <0.5% market share
      .sort((a, b) => b.volume - a.volume)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    // Monthly Growth Analysis
    const monthlyData = data.reduce((acc: any, record: any) => {
      const key = `${record.monthOfSales}-${record.vehicleMake}`;
      if (!acc[key]) {
        acc[key] = {
          month: record.monthOfSales,
          manufacturer: record.vehicleMake,
          volume: 0
        };
      }
      acc[key].volume += record.vehicleCount;
      return acc;
    }, {});

    const monthlyTrends = Object.values(monthlyData).reduce((acc: any, record: any) => {
      const monthName = ['Apr', 'May', 'Jun'][record.month - 4];
      if (!acc[record.manufacturer]) {
        acc[record.manufacturer] = {};
      }
      acc[record.manufacturer][monthName] = record.volume;
      return acc;
    }, {});

    // Calculate growth rates - only for manufacturers that meet 0.5% market share threshold
    const validManufacturers = new Set(marketShareData.map(item => item.manufacturer));
    const growthAnalysis = Object.entries(monthlyTrends)
      .filter(([manufacturer]) => validManufacturers.has(manufacturer))
      .map(([manufacturer, months]: [string, any]) => {
        const aprToMay = months.May && months.Apr ? ((months.May - months.Apr) / months.Apr * 100) : 0;
        const mayToJun = months.Jun && months.May ? ((months.Jun - months.May) / months.May * 100) : 0;
        const overallGrowth = months.Jun && months.Apr ? ((months.Jun - months.Apr) / months.Apr * 100) : 0;
        
        return {
          manufacturer,
          aprToMayGrowth: aprToMay.toFixed(1),
          mayToJunGrowth: mayToJun.toFixed(1),
          overallGrowth: overallGrowth.toFixed(1),
          aprilVolume: months.Apr || 0,
          mayVolume: months.May || 0,
          juneVolume: months.Jun || 0,
          trend: overallGrowth > 0 ? 'up' : overallGrowth < 0 ? 'down' : 'stable'
        };
      });

    // Regional Market Analysis - only for manufacturers that meet 0.5% market share threshold
    const regionalData = data
      .filter(record => validManufacturers.has(record.vehicleMake))
      .reduce((acc: any, record: any) => {
        const key = `${record.nameOfState}-${record.vehicleMake}`;
        if (!acc[key]) {
          acc[key] = {
            state: record.nameOfState,
            manufacturer: record.vehicleMake,
            volume: 0,
            rtoClassification: record.rtoClassification
          };
        }
        acc[key].volume += record.vehicleCount;
        return acc;
      }, {});

    // Fuel Type Competition - only for manufacturers that meet 0.5% market share threshold
    const fuelTypeData = data
      .filter(record => validManufacturers.has(record.vehicleMake))
      .reduce((acc: any, record: any) => {
        const key = `${record.vehicleFuel}-${record.vehicleMake}`;
        if (!acc[key]) {
          acc[key] = {
            fuelType: record.vehicleFuel,
            manufacturer: record.vehicleMake,
            volume: 0
          };
        }
        acc[key].volume += record.vehicleCount;
        return acc;
      }, {});

    // Top Performing Models by Manufacturer - only for manufacturers that meet 0.5% market share threshold
    const modelPerformance = data
      .filter(record => validManufacturers.has(record.vehicleMake))
      .reduce((acc: any, record: any) => {
        const key = `${record.vehicleMake}-${record.vehicleModel}`;
        if (!acc[key]) {
          acc[key] = {
            manufacturer: record.vehicleMake,
            model: record.vehicleModel,
            volume: 0
          };
        }
        acc[key].volume += record.vehicleCount;
        return acc;
      }, {});

    const topModels = Object.values(modelPerformance)
      .sort((a: any, b: any) => b.volume - a.volume)
      .slice(0, 20);

    setAnalysisData({
      marketShare: marketShareData,
      growthAnalysis: growthAnalysis.sort((a: any, b: any) => parseFloat(b.overallGrowth) - parseFloat(a.overallGrowth)),
      regionalData: Object.values(regionalData),
      fuelTypeData: Object.values(fuelTypeData),
      topModels,
      uniqueValues,
      totalMarket
    });
  };

  const getCompetitorInsights = (dataToAnalyze = analysisData) => {
    if (!dataToAnalyze || !dataToAnalyze.marketShare || !dataToAnalyze.growthAnalysis) return [];

    const insights = [];
    
    // Check if we have market share data
    if (dataToAnalyze.marketShare.length > 0) {
      const topManufacturer = dataToAnalyze.marketShare[0];
      insights.push({
        type: 'market_leader',
        title: 'Market Leader',
        description: `${topManufacturer.manufacturer} dominates with ${topManufacturer.marketShare}% market share`,
        value: topManufacturer.marketShare + '%',
        icon: Crown,
        trend: 'neutral'
      });
    }

    // Check if we have growth analysis data
    if (dataToAnalyze.growthAnalysis.length > 0) {
      const fastestGrowth = dataToAnalyze.growthAnalysis[0];
      const slowestGrowth = dataToAnalyze.growthAnalysis[dataToAnalyze.growthAnalysis.length - 1];

      insights.push({
        type: 'fastest_growth',
        title: 'Fastest Growing',
        description: `${fastestGrowth.manufacturer} showing ${fastestGrowth.overallGrowth}% growth`,
        value: fastestGrowth.overallGrowth + '%',
        icon: TrendingUp,
        trend: 'up'
      });

      insights.push({
        type: 'market_decline',
        title: 'Market Challenge',
        description: `${slowestGrowth.manufacturer} facing ${Math.abs(parseFloat(slowestGrowth.overallGrowth))}% decline`,
        value: slowestGrowth.overallGrowth + '%',
        icon: TrendingDown,
        trend: 'down'
      });
    }

    // If no data available, show a default insight
    if (insights.length === 0) {
      insights.push({
        type: 'no_data',
        title: 'No Data Available',
        description: 'No manufacturers meet the minimum market share threshold',
        value: 'N/A',
        icon: AlertTriangle,
        trend: 'neutral'
      });
    }

    return insights;
  };

  const getCompanyBenchmark = (company: string) => {
    if (!analysisData || company === 'all') return null;

    // Use filtered data if available, otherwise use full dataset
    const dataToUse = filteredAnalysisData || analysisData;
    
    const companyData = dataToUse.marketShare.find((item: any) => item.manufacturer === company);
    const companyGrowth = dataToUse.growthAnalysis.find((item: any) => item.manufacturer === company);
    
    if (!companyData || !companyGrowth) return null;

    // Calculate market average based on the filtered data context
    const marketAverage = dataToUse.growthAnalysis.reduce((sum: number, item: any) => 
      sum + parseFloat(item.overallGrowth), 0) / dataToUse.growthAnalysis.length;

    return {
      marketShare: companyData.marketShare,
      rank: companyData.rank,
      growth: companyGrowth.overallGrowth,
      marketAverage: marketAverage.toFixed(1),
      performance: parseFloat(companyGrowth.overallGrowth) > marketAverage ? 'above' : 'below',
      context: (() => {
        const filters = [];
        if (selectedRegion !== 'all') filters.push(selectedRegion);
        if (selectedFuelType !== 'all') filters.push(selectedFuelType);
        if (selectedCCCapacity !== 'all') filters.push(`${selectedCCCapacity}cc`);
        return filters.length > 0 ? `${filters.join(', ')} segment` : 'overall market';
      })()
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading competitor analysis data...</p>
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

  // Apply filtering based on selected region, fuel type, and CC capacity
  const getFilteredAnalysisData = () => {
    if (!analysisData) return null;

    let filteredData = { ...analysisData };

    // Apply filters by getting the raw data and filtering it first
    const hasFilters = selectedRegion !== 'all' || selectedFuelType !== 'all' || selectedCCCapacity !== 'all';
    
    if (hasFilters) {
      // Get raw data and apply filters
      const rawData = dataLoader.getDataProcessor().getData();
      const filteredRawData = rawData.filter(record => {
        if (selectedRegion !== 'all' && record.nameOfState !== selectedRegion) return false;
        if (selectedFuelType !== 'all' && record.vehicleFuel !== selectedFuelType) return false;
        if (selectedCCCapacity !== 'all' && record.vehicleCC !== selectedCCCapacity) return false;
        return true;
      });

      // Recalculate everything from filtered raw data
      if (filteredRawData.length > 0) {
        // Recalculate market share
        const manufacturerTotals = filteredRawData.reduce((acc: any, record: any) => {
          acc[record.vehicleMake] = (acc[record.vehicleMake] || 0) + record.vehicleCount;
          return acc;
        }, {});

        const totalFilteredMarket = Object.values(manufacturerTotals).reduce((sum: number, count: any) => sum + count, 0);
        
        filteredData.marketShare = Object.entries(manufacturerTotals)
          .map(([manufacturer, volume]: [string, any]) => ({
            manufacturer,
            volume,
            marketShare: ((volume / totalFilteredMarket) * 100).toFixed(2),
            rank: 0
          }))
          .filter(item => parseFloat(item.marketShare) >= 0.5) // Filter out manufacturers with <0.5% market share
          .sort((a, b) => b.volume - a.volume)
          .map((item, index) => ({ ...item, rank: index + 1 }));

        // Recalculate regional data
        const filteredRegionalData = filteredRawData.reduce((acc: any, record: any) => {
          const key = `${record.nameOfState}-${record.vehicleMake}`;
          if (!acc[key]) {
            acc[key] = {
              state: record.nameOfState,
              manufacturer: record.vehicleMake,
              volume: 0
            };
          }
          acc[key].volume += record.vehicleCount;
          return acc;
        }, {});

        filteredData.regionalData = Object.values(filteredRegionalData);

        // Recalculate growth analysis for filtered data
        const monthlyFilteredData = filteredRawData.reduce((acc: any, record: any) => {
          const key = `${record.monthOfSales}-${record.vehicleMake}`;
          if (!acc[key]) {
            acc[key] = {
              month: record.monthOfSales,
              manufacturer: record.vehicleMake,
              volume: 0
            };
          }
          acc[key].volume += record.vehicleCount;
          return acc;
        }, {});

        const monthlyTrends = Object.values(monthlyFilteredData).reduce((acc: any, record: any) => {
          const monthName = ['Apr', 'May', 'Jun'][record.month - 4];
          if (!acc[record.manufacturer]) {
            acc[record.manufacturer] = {};
          }
          acc[record.manufacturer][monthName] = record.volume;
          return acc;
        }, {});

        // Calculate growth rates for filtered data
        const growthAnalysis = Object.entries(monthlyTrends).map(([manufacturer, trends]: [string, any]) => {
          const aprVol = trends.Apr || 0;
          const mayVol = trends.May || 0;
          const junVol = trends.Jun || 0;

          const aprMayGrowth = aprVol > 0 ? (((mayVol - aprVol) / aprVol) * 100).toFixed(1) : '0.0';
          const mayJunGrowth = mayVol > 0 ? (((junVol - mayVol) / mayVol) * 100).toFixed(1) : '0.0';
          const overallGrowth = aprVol > 0 ? (((junVol - aprVol) / aprVol) * 100).toFixed(1) : '0.0';

          return {
            manufacturer,
            aprilVolume: aprVol,
            mayVolume: mayVol,
            juneVolume: junVol,
            aprilGrowth: '0.0',
            mayGrowth: aprMayGrowth,
            juneGrowth: mayJunGrowth,
            overallGrowth,
            trend: parseFloat(overallGrowth) > 0 ? 'up' : parseFloat(overallGrowth) < 0 ? 'down' : 'stable'
          };
        });

        filteredData.growthAnalysis = growthAnalysis.sort((a: any, b: any) => parseFloat(b.overallGrowth) - parseFloat(a.overallGrowth));
      } else {
        // No data matches filters - return empty state
        filteredData.marketShare = [];
        filteredData.regionalData = [];
        filteredData.growthAnalysis = [];
      }
    }

    // Legacy region-only filtering (keeping for backward compatibility)
    else if (selectedRegion !== 'all') {
      // Filter regional data
      filteredData.regionalData = analysisData.regionalData.filter((item: any) => 
        item.state === selectedRegion
      );

      // Recalculate market share for the selected region
      const regionRecords = filteredData.regionalData;
      const regionTotals = regionRecords.reduce((acc: any, record: any) => {
        acc[record.manufacturer] = (acc[record.manufacturer] || 0) + record.volume;
        return acc;
      }, {});

      const totalRegionMarket = Object.values(regionTotals).reduce((sum: number, count: any) => sum + count, 0);
      
      if (totalRegionMarket > 0) {
        filteredData.marketShare = Object.entries(regionTotals)
          .map(([manufacturer, volume]: [string, any]) => ({
            manufacturer,
            volume,
            marketShare: ((volume / totalRegionMarket) * 100).toFixed(2),
            rank: 0
          }))
          .filter(item => parseFloat(item.marketShare) >= 0.5) // Filter out manufacturers with <0.5% market share
          .sort((a, b) => b.volume - a.volume)
          .map((item, index) => ({ ...item, rank: index + 1 }));

        // Also filter growth analysis to only include manufacturers present in this region
        const regionalManufacturers = new Set(Object.keys(regionTotals));
        filteredData.growthAnalysis = analysisData.growthAnalysis.filter((item: any) => 
          regionalManufacturers.has(item.manufacturer)
        );
      }
    }

    return filteredData;
  };

  const filteredAnalysisData = getFilteredAnalysisData();
  const insights = getCompetitorInsights(filteredAnalysisData);
  const benchmark = getCompanyBenchmark(selectedCompany);

  // Get data to display based on selected metric and filtering
  const getDisplayData = () => {
    const dataToUse = filteredAnalysisData || analysisData;
    if (!dataToUse || !dataToUse.marketShare || !dataToUse.growthAnalysis) return {
      primaryChart: [],
      secondaryChart: [],
      tableData: []
    };

    switch (selectedMetric) {
      case 'marketShare':
        return {
          primaryChart: dataToUse.marketShare ? dataToUse.marketShare.slice(0, 8) : [],
          secondaryChart: dataToUse.growthAnalysis ? dataToUse.growthAnalysis.slice(0, 10) : [],
          tableData: dataToUse.marketShare ? dataToUse.marketShare.slice(0, 15) : []
        };
      case 'growth':
        return {
          primaryChart: dataToUse.growthAnalysis ? dataToUse.growthAnalysis.slice(0, 8).map((item: any) => ({
            manufacturer: item.manufacturer,
            value: parseFloat(item.overallGrowth),
            marketShare: parseFloat(item.overallGrowth).toFixed(1) + '%'
          })) : [],
          secondaryChart: dataToUse.growthAnalysis ? dataToUse.growthAnalysis.slice(0, 10) : [],
          tableData: dataToUse.growthAnalysis ? dataToUse.growthAnalysis.slice(0, 15) : []
        };
      case 'volume':
        return {
          primaryChart: dataToUse.marketShare ? dataToUse.marketShare.slice(0, 8).map((item: any) => ({
            manufacturer: item.manufacturer,
            value: item.volume,
            marketShare: item.volume.toLocaleString()
          })) : [],
          secondaryChart: dataToUse.growthAnalysis ? dataToUse.growthAnalysis.slice(0, 10) : [],
          tableData: dataToUse.marketShare ? dataToUse.marketShare.slice(0, 15) : []
        };
      case 'regional':
        if (!dataToUse.regionalData || dataToUse.regionalData.length === 0) {
          return {
            primaryChart: [],
            secondaryChart: dataToUse.growthAnalysis ? dataToUse.growthAnalysis.slice(0, 10) : [],
            tableData: dataToUse.marketShare ? dataToUse.marketShare.slice(0, 15) : []
          };
        }
        
        const regionalChart = dataToUse.regionalData
          .reduce((acc: any, item: any) => {
            const key = item.manufacturer;
            acc[key] = (acc[key] || 0) + item.volume;
            return acc;
          }, {});
        
        const regionalData = Object.entries(regionalChart)
          .map(([manufacturer, volume]: [string, any]) => ({
            manufacturer,
            value: volume,
            marketShare: volume.toLocaleString()
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8);

        return {
          primaryChart: regionalData,
          secondaryChart: dataToUse.growthAnalysis ? dataToUse.growthAnalysis.slice(0, 10) : [],
          tableData: dataToUse.marketShare ? dataToUse.marketShare.slice(0, 15) : []
        };
      default:
        return {
          primaryChart: dataToUse.marketShare ? dataToUse.marketShare.slice(0, 8) : [],
          secondaryChart: dataToUse.growthAnalysis ? dataToUse.growthAnalysis.slice(0, 10) : [],
          tableData: dataToUse.marketShare ? dataToUse.marketShare.slice(0, 15) : []
        };
    }
  };

  const displayData = getDisplayData();

  // Three-company comparison functions
  const getCompanyMetrics = (companyName: string) => {
    if (!analysisData || companyName === 'all') return null;
    
    const dataToUse = filteredAnalysisData || analysisData;
    const marketShareData = dataToUse.marketShare.find((item: any) => item.manufacturer === companyName);
    const growthData = dataToUse.growthAnalysis.find((item: any) => item.manufacturer === companyName);
    
    if (!marketShareData || !growthData) return null;

    // Get regional performance
    const regionalPerformance = dataToUse.regionalData
      .filter((item: any) => item.manufacturer === companyName)
      .reduce((acc: any, item: any) => {
        acc[item.state] = (acc[item.state] || 0) + item.volume;
        return acc;
      }, {});

    const topStates = Object.entries(regionalPerformance)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 3)
      .map(([state, volume]) => ({ state, volume }));

    return {
      name: companyName,
      marketShare: parseFloat(marketShareData.marketShare),
      rank: marketShareData.rank,
      volume: marketShareData.volume,
      growth: parseFloat(growthData.overallGrowth),
      monthlyGrowth: {
        april: parseFloat(growthData.aprilGrowth || '0'),
        may: parseFloat(growthData.mayGrowth || '0'),
        june: parseFloat(growthData.juneGrowth || '0')
      },
      topStates,
      stateCount: Object.keys(regionalPerformance).length
    };
  };

  const handleComparisonCompanyChange = (position: string, company: string) => {
    setComparisonCompanies(prev => ({
      ...prev,
      [position]: company
    }));
  };

  const getComparisonData = () => {
    return {
      company1: getCompanyMetrics(comparisonCompanies.company1),
      company2: getCompanyMetrics(comparisonCompanies.company2),
      company3: getCompanyMetrics(comparisonCompanies.company3)
    };
  };

  const comparisonData = getComparisonData();
  const hasValidComparison = Object.values(comparisonCompanies).filter(c => c !== 'all').length >= 2;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Competitor Analysis Dashboard
          </h1>
          <p className="text-gray-600">
            Strategic insights and benchmarking for competitive intelligence
          </p>
        </div>

        {/* Control Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Analysis Controls</CardTitle>
            <CardDescription>Configure your competitive analysis parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Select Company</label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {analysisData?.uniqueValues.manufacturers.map((manufacturer: string) => (
                      <SelectItem key={manufacturer} value={manufacturer}>{manufacturer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Analysis Metric</label>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketShare">Market Share</SelectItem>
                    <SelectItem value="growth">Growth Rate</SelectItem>
                    <SelectItem value="volume">Sales Volume</SelectItem>
                    <SelectItem value="regional">Regional Performance</SelectItem>
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
                    {analysisData?.uniqueValues.states.slice(0, 10).map((state: string) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
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
                    {analysisData?.uniqueValues.fuelTypes.map((fuel: string) => (
                      <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">CC Capacity</label>
                <Select value={selectedCCCapacity} onValueChange={setSelectedCCCapacity}>
                  <SelectTrigger>
                    <SelectValue placeholder="All CC Capacities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All CC Capacities</SelectItem>
                    {analysisData?.uniqueValues.ccCapacities.map((cc: string) => (
                      <SelectItem key={cc} value={cc}>{cc}cc</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-center pt-4 border-t mt-4">
              <Button 
                onClick={() => setShowComparison(!showComparison)}
                variant={showComparison ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                {showComparison ? 'Hide' : 'Show'} 3-Company Comparison
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 3-Company Comparison Section */}
        {showComparison && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                3-Company Comparison
              </CardTitle>
              <CardDescription>Select up to 3 companies for detailed side-by-side analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Company Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {['company1', 'company2', 'company3'].map((position, index) => (
                  <div key={position}>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Company {index + 1}
                    </label>
                    <Select 
                      value={comparisonCompanies[position as keyof typeof comparisonCompanies]} 
                      onValueChange={(value) => handleComparisonCompanyChange(position, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select Company ${index + 1}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">None Selected</SelectItem>
                        {analysisData?.uniqueValues.manufacturers.map((manufacturer: string) => (
                          <SelectItem key={manufacturer} value={manufacturer}>
                            {manufacturer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* Comparison Results */}
              {hasValidComparison && (
                <div className="space-y-6">
                  {/* Key Metrics Comparison */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Key Metrics Comparison</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {Object.entries(comparisonData).map(([key, company]) => (
                        company && (
                          <Card key={key} className="p-4">
                            <div className="text-center">
                              <h4 className="font-bold text-lg text-blue-600 mb-3">{company.name}</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="text-2xl font-bold text-green-600">{company.marketShare.toFixed(2)}%</div>
                                  <div className="text-gray-600">Market Share</div>
                                  <Badge variant="outline">#{company.rank}</Badge>
                                </div>
                                <div>
                                  <div className={`text-2xl font-bold ${company.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {company.growth.toFixed(1)}%
                                  </div>
                                  <div className="text-gray-600">Growth Rate</div>
                                  <Badge variant={company.growth >= 0 ? "default" : "destructive"}>
                                    {company.growth >= 0 ? 'Growing' : 'Declining'}
                                  </Badge>
                                </div>
                                <div>
                                  <div className="text-xl font-bold text-gray-700">{company.volume.toLocaleString()}</div>
                                  <div className="text-gray-600">Total Volume</div>
                                </div>
                                <div>
                                  <div className="text-xl font-bold text-purple-600">{company.stateCount}</div>
                                  <div className="text-gray-600">States Present</div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        )
                      ))}
                    </div>
                  </div>

                  {/* Monthly Growth Comparison */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Monthly Growth Trends</h3>
                    <Card className="p-4">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={[
                          {
                            month: 'April',
                            ...(comparisonData.company1 && { [comparisonData.company1.name]: comparisonData.company1.monthlyGrowth.april }),
                            ...(comparisonData.company2 && { [comparisonData.company2.name]: comparisonData.company2.monthlyGrowth.april }),
                            ...(comparisonData.company3 && { [comparisonData.company3.name]: comparisonData.company3.monthlyGrowth.april })
                          },
                          {
                            month: 'May',
                            ...(comparisonData.company1 && { [comparisonData.company1.name]: comparisonData.company1.monthlyGrowth.may }),
                            ...(comparisonData.company2 && { [comparisonData.company2.name]: comparisonData.company2.monthlyGrowth.may }),
                            ...(comparisonData.company3 && { [comparisonData.company3.name]: comparisonData.company3.monthlyGrowth.may })
                          },
                          {
                            month: 'June',
                            ...(comparisonData.company1 && { [comparisonData.company1.name]: comparisonData.company1.monthlyGrowth.june }),
                            ...(comparisonData.company2 && { [comparisonData.company2.name]: comparisonData.company2.monthlyGrowth.june }),
                            ...(comparisonData.company3 && { [comparisonData.company3.name]: comparisonData.company3.monthlyGrowth.june })
                          }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => [`${value}%`, 'Growth Rate']} />
                          {comparisonData.company1 && (
                            <Line type="monotone" dataKey={comparisonData.company1.name} stroke="#3B82F6" strokeWidth={2} />
                          )}
                          {comparisonData.company2 && (
                            <Line type="monotone" dataKey={comparisonData.company2.name} stroke="#10B981" strokeWidth={2} />
                          )}
                          {comparisonData.company3 && (
                            <Line type="monotone" dataKey={comparisonData.company3.name} stroke="#F59E0B" strokeWidth={2} />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                  </div>

                  {/* Regional Performance Comparison */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Top Regional Markets</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {Object.entries(comparisonData).map(([key, company]) => (
                        company && (
                          <Card key={key} className="p-4">
                            <h4 className="font-semibold text-center mb-3">{company.name}</h4>
                            <div className="space-y-2">
                              {company.topStates.map((state: any, index: number) => (
                                <div key={state.state} className="flex justify-between items-center">
                                  <span className="text-sm">{index + 1}. {state.state}</span>
                                  <span className="text-sm font-medium">{state.volume.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </Card>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!hasValidComparison && (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select at least 2 companies to see comparison analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {insights.map((insight, index) => {
            const IconComponent = insight.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
                  <IconComponent className={`h-4 w-4 ml-auto ${
                    insight.trend === 'up' ? 'text-green-600' : 
                    insight.trend === 'down' ? 'text-red-600' : 'text-blue-600'
                  }`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{insight.value}</div>
                  <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Company Benchmark (if company is selected) */}
        {benchmark && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{selectedCompany} - Performance Benchmark</CardTitle>
              <CardDescription>How {selectedCompany} compares to market</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{benchmark.marketShare}%</div>
                  <div className="text-sm text-gray-600">Market Share</div>
                  <Badge variant="outline" className="mt-1">#{benchmark.rank} Position</Badge>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${parseFloat(benchmark.growth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {benchmark.growth}%
                  </div>
                  <div className="text-sm text-gray-600">Growth Rate</div>
                  <Badge variant={parseFloat(benchmark.growth) >= 0 ? "default" : "destructive"} className="mt-1">
                    {parseFloat(benchmark.growth) >= 0 ? 'Growing' : 'Declining'}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">{benchmark.marketAverage}%</div>
                  <div className="text-sm text-gray-600">Market Average</div>
                  <Badge variant="outline" className="mt-1 capitalize">{benchmark.context}</Badge>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${benchmark.performance === 'above' ? 'text-green-600' : 'text-red-600'}`}>
                    {benchmark.performance === 'above' ? '↑' : '↓'}
                  </div>
                  <div className="text-sm text-gray-600">vs Market</div>
                  <Badge variant={benchmark.performance === 'above' ? "default" : "destructive"} className="mt-1">
                    {benchmark.performance === 'above' ? 'Above Avg' : 'Below Avg'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Primary Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedMetric === 'marketShare' && 'Market Share Distribution'}
                {selectedMetric === 'growth' && 'Growth Rate Analysis'}
                {selectedMetric === 'volume' && 'Sales Volume Analysis'}
                {selectedMetric === 'regional' && 'Regional Performance'}
              </CardTitle>
              <CardDescription>
                {(() => {
                  const filters = [];
                  if (selectedRegion !== 'all') filters.push(selectedRegion);
                  if (selectedFuelType !== 'all') filters.push(selectedFuelType);
                  if (selectedCCCapacity !== 'all') filters.push(`${selectedCCCapacity}cc`);
                  return filters.length > 0 ? `Analysis for ${filters.join(', ')} segment` : 'Overall market analysis';
                })()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {selectedMetric === 'growth' ? (
                  <BarChart data={displayData?.primaryChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="manufacturer" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${value}%`, 'Growth Rate']} />
                    <Bar dataKey="value" fill="#10B981" />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={displayData?.primaryChart}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#3B82F6"
                      dataKey={selectedMetric === 'volume' ? 'value' : 'volume'}
                      label={({ manufacturer, marketShare }) => `${manufacturer}: ${marketShare}`}
                    >
                      {displayData?.primaryChart.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any, name: any, props: any) => [
                      selectedMetric === 'volume' ? `${value.toLocaleString()} units` : `${value} units (${props.payload.marketShare}%)`,
                      props.payload.manufacturer
                    ]} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Secondary Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Growth Performance</CardTitle>
              <CardDescription>
                {(() => {
                  const filters = [];
                  if (selectedRegion !== 'all') filters.push(selectedRegion);
                  if (selectedFuelType !== 'all') filters.push(selectedFuelType);
                  if (selectedCCCapacity !== 'all') filters.push(`${selectedCCCapacity}cc`);
                  return filters.length > 0 ? `Growth trends for ${filters.join(', ')} segment` : 'Monthly growth trends by manufacturer';
                })()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={displayData?.secondaryChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="manufacturer" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`${value}%`, 'Growth Rate']} />
                  <Bar dataKey="overallGrowth" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends Comparison */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Monthly Sales Trends - Top Competitors</CardTitle>
            <CardDescription>Month-over-month sales performance comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={(filteredAnalysisData || analysisData)?.growthAnalysis.slice(0, 8).map((item: any) => ({
                manufacturer: item.manufacturer,
                Apr: item.aprilVolume,
                May: item.mayVolume,
                Jun: item.juneVolume
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="manufacturer" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value?.toLocaleString()} units`, '']} />
                <Legend />
                <Line type="monotone" dataKey="Apr" stroke="#EF4444" strokeWidth={2} />
                <Line type="monotone" dataKey="May" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="Jun" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Competitive Rankings */}
        <Card>
          <CardHeader>
            <CardTitle>Competitive Rankings</CardTitle>
            <CardDescription>Current market position and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Rank</th>
                    <th className="text-left p-2">Manufacturer</th>
                    <th className="text-right p-2">Market Share</th>
                    <th className="text-right p-2">Volume</th>
                    <th className="text-right p-2">Growth Rate</th>
                    <th className="text-center p-2">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData?.tableData.map((company: any, index: number) => {
                    const growth = (filteredAnalysisData || analysisData)?.growthAnalysis.find((g: any) => g.manufacturer === company.manufacturer);
                    return (
                      <tr key={company.manufacturer} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">#{company.rank}</td>
                        <td className="p-2">
                          <div className="flex items-center">
                            {company.rank <= 3 && <Crown className="h-4 w-4 text-yellow-500 mr-2" />}
                            {company.manufacturer}
                          </div>
                        </td>
                        <td className="p-2 text-right font-medium">{company.marketShare}%</td>
                        <td className="p-2 text-right">{company.volume?.toLocaleString() || 'N/A'}</td>
                        <td className={`p-2 text-right font-medium ${
                          parseFloat(growth?.overallGrowth || '0') >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {growth?.overallGrowth || 'N/A'}%
                        </td>
                        <td className="p-2 text-center">
                          {growth?.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600 mx-auto" />}
                          {growth?.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600 mx-auto" />}
                          {growth?.trend === 'stable' && <div className="h-4 w-4 bg-gray-400 rounded-full mx-auto"></div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompetitorAnalysis;