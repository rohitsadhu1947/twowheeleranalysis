import { TwoWheelerDataProcessor, AggregatedData } from './data-processor';

export class DataLoader {
  private static instance: DataLoader;
  private dataProcessor: TwoWheelerDataProcessor;
  private dataLoaded: boolean = false;
  private aggregatedData: AggregatedData | null = null;
  private availableMonths: number[] = [];

  private constructor() {
    this.dataProcessor = new TwoWheelerDataProcessor();
  }

  static getInstance(): DataLoader {
    if (!DataLoader.instance) {
      DataLoader.instance = new DataLoader();
    }
    return DataLoader.instance;
  }

  async loadData(): Promise<void> {
    if (this.dataLoaded) return;

    try {
      // Load all four months of data
      const monthlyData = [
        { month: 4, csvContent: await this.fetchCSV('/data/2W_April_2025.csv') },
        { month: 5, csvContent: await this.fetchCSV('/data/2W_May_2025.csv') },
        { month: 6, csvContent: await this.fetchCSV('/data/2W_June_2025.csv') },
        { month: 7, csvContent: await this.fetchCSV('/data/2W_July_2025.csv') }
      ];

      await this.dataProcessor.loadMultipleMonths(monthlyData);
      
      // Pre-compute aggregated data
      this.aggregatedData = this.dataProcessor.getAggregatedData();
      this.availableMonths = this.dataProcessor.getAvailableMonths();
      this.dataLoaded = true;
      
      console.log('Data loaded successfully:', {
        totalRecords: this.aggregatedData.totalVehicles,
        months: this.availableMonths,
        manufacturers: this.aggregatedData.totalManufacturers,
        states: this.aggregatedData.totalStates
      });
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  private async fetchCSV(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return await response.text();
  }

  getDataProcessor(): TwoWheelerDataProcessor {
    if (!this.dataLoaded) {
      throw new Error('Data not loaded yet. Call loadData() first.');
    }
    return this.dataProcessor;
  }

  getAggregatedData(): AggregatedData {
    if (!this.dataLoaded || !this.aggregatedData) {
      throw new Error('Data not loaded yet. Call loadData() first.');
    }
    return this.aggregatedData;
  }

  isDataLoaded(): boolean {
    return this.dataLoaded;
  }

  getAvailableMonths(): number[] {
    return this.availableMonths;
  }

  getUniqueValues(filterContext?: {
    manufacturer?: string;
    model?: string;
    fuelType?: string;
    ccCapacity?: string;
    state?: string;
    city?: string;
    rto?: string;
    rtoClassification?: string;
    month?: number;
  }): {
    manufacturers: string[];
    fuelTypes: string[];
    ccCapacities: string[];
    states: string[];
    cities: string[];
    rtos: string[];
    models: string[];
    variants: string[];
    rtoClassifications: string[];
  } {
    if (!this.dataLoaded) {
      return {
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
    }

    let data = this.dataProcessor.getData();
    
    // Apply filter context for dependent filtering
    if (filterContext) {
      data = data.filter(record => {
        if (filterContext.manufacturer && record.vehicleMake !== filterContext.manufacturer) return false;
        if (filterContext.model && record.vehicleModel !== filterContext.model) return false;
        if (filterContext.fuelType && record.vehicleFuel !== filterContext.fuelType) return false;
        if (filterContext.ccCapacity && record.vehicleCC !== filterContext.ccCapacity) return false;
        if (filterContext.state && record.nameOfState !== filterContext.state) return false;
        if (filterContext.city && record.nameOfCity !== filterContext.city) return false;
        if (filterContext.rto && record.nameOfRTO !== filterContext.rto) return false;
        if (filterContext.rtoClassification && record.rtoClassification !== filterContext.rtoClassification) return false;
        if (filterContext.month && record.monthOfSales !== filterContext.month) return false;
        return true;
      });
    }
    
    return {
      manufacturers: [...new Set(data.map(r => r.vehicleMake))].sort(),
      fuelTypes: [...new Set(data.map(r => r.vehicleFuel))].sort(),
      ccCapacities: [...new Set(data.map(r => r.vehicleCC).filter(Boolean))].sort((a, b) => {
        // Sort CC values numerically
        const aNum = parseInt(a);
        const bNum = parseInt(b);
        return isNaN(aNum) || isNaN(bNum) ? a.localeCompare(b) : aNum - bNum;
      }),
      states: [...new Set(data.map(r => r.nameOfState))].sort(),
      cities: [...new Set(data.map(r => r.nameOfCity))].sort(),
      rtos: [...new Set(data.map(r => r.nameOfRTO))].sort(),
      models: [...new Set(data.map(r => r.vehicleModel))].sort(),
      variants: [...new Set(data.map(r => r.vehicleVariant))].sort(),
      rtoClassifications: [...new Set(data.map(r => r.rtoClassification).filter(Boolean))].sort()
    };
  }

  getDataByMonth(month: number): any[] {
    if (!this.dataLoaded) {
      throw new Error('Data not loaded yet. Call loadData() first.');
    }
    return this.dataProcessor.getDataByMonth(month);
  }

  getMonthlyTrends(): any[] {
    if (!this.dataLoaded) {
      throw new Error('Data not loaded yet. Call loadData() first.');
    }
    return this.dataProcessor.getMonthlyTrends();
  }
}

export const dataLoader = DataLoader.getInstance(); 