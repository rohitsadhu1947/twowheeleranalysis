import { rtoClassifier } from './rto-classifier';

export interface VehicleRecord {
  vehicleMake: string;
  vehicleModel: string;
  vehicleVariant: string;
  vehicleCount: number;
  vehicleFuel: string;
  vehicleCC: string;
  vehicleClass: string;
  monthOfSales: number;
  yearOfSales: string;
  codeOfRTO: string;
  nameOfRTO: string;
  nameOfCity: string;
  nameOfDistrict: string;
  codeOfState: string;
  nameOfState: string;
  rtoClassification?: string; // Metro, Urban, Rural
}

export interface AggregatedData {
  totalVehicles: number;
  totalManufacturers: number;
  totalStates: number;
  totalCities: number;
  totalRTOs: number;
  totalFuelTypes: number;
  manufacturers: Array<{
    name: string;
    count: number;
    percentage: number;
    topModels: Array<{ model: string; count: number }>;
    fuelDistribution: Array<{ fuel: string; count: number }>;
    stateDistribution: Array<{ state: string; count: number }>;
  }>;
  fuelTypes: Array<{
    fuel: string;
    count: number;
    percentage: number;
    manufacturers: Array<{ manufacturer: string; count: number }>;
    topModels: Array<{ model: string; count: number }>;
    stateDistribution: Array<{ state: string; count: number }>;
  }>;
  states: Array<{
    name: string;
    count: number;
    percentage: number;
    topCities: Array<{ city: string; count: number }>;
    topManufacturers: Array<{ manufacturer: string; count: number }>;
  }>;
  cities: Array<{
    name: string;
    count: number;
    percentage: number;
    state: string;
    topManufacturers: Array<{ manufacturer: string; count: number }>;
  }>;
  rtos: Array<{
    name: string;
    count: number;
    percentage: number;
    city: string;
    state: string;
    topManufacturers: Array<{ manufacturer: string; count: number }>;
    fuelDistribution: Array<{ fuel: string; count: number }>;
    topModels: Array<{ model: string; count: number }>;
  }>;
  topModels: Array<{ model: string; count: number; manufacturer: string }>;
  topCities: Array<{ city: string; count: number; state: string }>;
  monthlyTrends: Array<{
    month: number;
    monthName: string;
    count: number;
    percentage: number;
    topManufacturers: Array<{ manufacturer: string; count: number }>;
    topFuelTypes: Array<{ fuel: string; count: number }>;
  }>;
}

export class TwoWheelerDataProcessor {
  private data: VehicleRecord[] = [];
  private monthlyData: Map<number, VehicleRecord[]> = new Map();

  async loadData(csvContent: string, month?: number): Promise<void> {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const records: VehicleRecord[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      if (values.length >= headers.length) {
        // Classify RTO based on official Government of India definitions
        const rtoInfo = rtoClassifier.classifyRTO({
          codeOfRTO: values[9]?.trim() || '',
          nameOfRTO: values[10]?.trim() || '',
          nameOfCity: values[11]?.trim() || '',
          nameOfDistrict: values[12]?.trim() || '',
          nameOfState: values[14]?.trim() || ''
        });



        const record: VehicleRecord = {
          vehicleMake: values[0]?.trim() || '',
          vehicleModel: values[1]?.trim() || '',
          vehicleVariant: values[2]?.trim() || '',
          vehicleCount: parseInt(values[3]?.trim() || '0') || 0,
          vehicleFuel: values[4]?.trim() || '',
          vehicleCC: values[5]?.trim() || '',
          vehicleClass: values[6]?.trim() || '',
          monthOfSales: parseInt(values[7]?.trim() || '0') || 0,
          yearOfSales: values[8]?.trim() || '',
          codeOfRTO: values[9]?.trim() || '',
          nameOfRTO: values[10]?.trim() || '',
          nameOfCity: values[11]?.trim() || '',
          nameOfDistrict: values[12]?.trim() || '',
          codeOfState: values[13]?.trim() || '',
          nameOfState: values[14]?.trim() || '',
          rtoClassification: rtoInfo.classification
        };
        
        records.push(record);
        
        // Group by month for monthly analysis
        if (month) {
          if (!this.monthlyData.has(month)) {
            this.monthlyData.set(month, []);
          }
          this.monthlyData.get(month)!.push(record);
        }
      }
    }
    
    if (month) {
      this.monthlyData.set(month, records);
    } else {
      this.data = records;
    }
  }

  async loadMultipleMonths(monthlyData: { month: number; csvContent: string }[]): Promise<void> {
    this.data = [];
    this.monthlyData.clear();
    
    for (const { month, csvContent } of monthlyData) {
      await this.loadData(csvContent, month);
    }
    
    // Combine all monthly data
    for (const records of this.monthlyData.values()) {
      this.data.push(...records);
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  getAggregatedData(): AggregatedData {
    if (this.data.length === 0) {
      throw new Error('No data loaded');
    }

    // Basic counts
    const totalVehicles = this.data.reduce((sum, record) => sum + record.vehicleCount, 0);
    const uniqueManufacturers = new Set(this.data.map(r => r.vehicleMake));
    const uniqueStates = new Set(this.data.map(r => r.nameOfState));
    const uniqueCities = new Set(this.data.map(r => r.nameOfCity));
    const uniqueRTOs = new Set(this.data.map(r => r.nameOfRTO));
    const uniqueFuelTypes = new Set(this.data.map(r => r.vehicleFuel));

    // Manufacturer analysis
    const manufacturerMap = new Map<string, number>();
    const manufacturerModels = new Map<string, Map<string, number>>();
    const manufacturerFuel = new Map<string, Map<string, number>>();
    const manufacturerStates = new Map<string, Map<string, number>>();

    this.data.forEach(record => {
      const make = record.vehicleMake;
      const count = record.vehicleCount;
      
      manufacturerMap.set(make, (manufacturerMap.get(make) || 0) + count);
      
      // Track models per manufacturer
      if (!manufacturerModels.has(make)) {
        manufacturerModels.set(make, new Map());
      }
      const models = manufacturerModels.get(make)!;
      models.set(record.vehicleModel, (models.get(record.vehicleModel) || 0) + count);
      
      // Track fuel distribution per manufacturer
      if (!manufacturerFuel.has(make)) {
        manufacturerFuel.set(make, new Map());
      }
      const fuel = manufacturerFuel.get(make)!;
      fuel.set(record.vehicleFuel, (fuel.get(record.vehicleFuel) || 0) + count);
      
      // Track state distribution per manufacturer
      if (!manufacturerStates.has(make)) {
        manufacturerStates.set(make, new Map());
      }
      const states = manufacturerStates.get(make)!;
      states.set(record.nameOfState, (states.get(record.nameOfState) || 0) + count);
    });

    const manufacturers = Array.from(manufacturerMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / totalVehicles) * 100,
        topModels: Array.from(manufacturerModels.get(name)?.entries() || [])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([model, count]) => ({ model, count })),
        fuelDistribution: Array.from(manufacturerFuel.get(name)?.entries() || [])
          .sort((a, b) => b[1] - a[1])
          .map(([fuel, count]) => ({ fuel, count })),
        stateDistribution: Array.from(manufacturerStates.get(name)?.entries() || [])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([state, count]) => ({ state, count }))
      }))
      .sort((a, b) => b.count - a.count);

    // Fuel type analysis
    const fuelMap = new Map<string, number>();
    const fuelManufacturers = new Map<string, Map<string, number>>();
    const fuelModels = new Map<string, Map<string, number>>();
    const fuelStates = new Map<string, Map<string, number>>();

    this.data.forEach(record => {
      const fuel = record.vehicleFuel;
      const count = record.vehicleCount;
      
      fuelMap.set(fuel, (fuelMap.get(fuel) || 0) + count);
      
      // Track manufacturers per fuel type
      if (!fuelManufacturers.has(fuel)) {
        fuelManufacturers.set(fuel, new Map());
      }
      const manufacturers = fuelManufacturers.get(fuel)!;
      manufacturers.set(record.vehicleMake, (manufacturers.get(record.vehicleMake) || 0) + count);
      
      // Track models per fuel type
      if (!fuelModels.has(fuel)) {
        fuelModels.set(fuel, new Map());
      }
      const models = fuelModels.get(fuel)!;
      models.set(record.vehicleModel, (models.get(record.vehicleModel) || 0) + count);
      
      // Track states per fuel type
      if (!fuelStates.has(fuel)) {
        fuelStates.set(fuel, new Map());
      }
      const states = fuelStates.get(fuel)!;
      states.set(record.nameOfState, (states.get(record.nameOfState) || 0) + count);
    });

    const fuelTypes = Array.from(fuelMap.entries())
      .map(([fuel, count]) => ({
        fuel,
        count,
        percentage: (count / totalVehicles) * 100,
        manufacturers: Array.from(fuelManufacturers.get(fuel)?.entries() || [])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([manufacturer, count]) => ({ manufacturer, count })),
        topModels: Array.from(fuelModels.get(fuel)?.entries() || [])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([model, count]) => ({ model, count })),
        stateDistribution: Array.from(fuelStates.get(fuel)?.entries() || [])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([state, count]) => ({ state, count }))
      }))
      .sort((a, b) => b.count - a.count);

    // State analysis
    const stateMap = new Map<string, number>();
    const stateCities = new Map<string, Map<string, number>>();
    const stateManufacturers = new Map<string, Map<string, number>>();

    this.data.forEach(record => {
      const state = record.nameOfState;
      const count = record.vehicleCount;
      
      stateMap.set(state, (stateMap.get(state) || 0) + count);
      
      // Track cities per state
      if (!stateCities.has(state)) {
        stateCities.set(state, new Map());
      }
      const cities = stateCities.get(state)!;
      cities.set(record.nameOfCity, (cities.get(record.nameOfCity) || 0) + count);
      
      // Track manufacturers per state
      if (!stateManufacturers.has(state)) {
        stateManufacturers.set(state, new Map());
      }
      const manufacturers = stateManufacturers.get(state)!;
      manufacturers.set(record.vehicleMake, (manufacturers.get(record.vehicleMake) || 0) + count);
    });

    const states = Array.from(stateMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / totalVehicles) * 100,
        topCities: Array.from(stateCities.get(name)?.entries() || [])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([city, count]) => ({ city, count })),
        topManufacturers: Array.from(stateManufacturers.get(name)?.entries() || [])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([manufacturer, count]) => ({ manufacturer, count }))
      }))
      .sort((a, b) => b.count - a.count);

    // City analysis
    const cityMap = new Map<string, number>();
    const cityStates = new Map<string, string>();
    const cityManufacturers = new Map<string, Map<string, number>>();

    this.data.forEach(record => {
      const city = record.nameOfCity;
      const count = record.vehicleCount;
      
      cityMap.set(city, (cityMap.get(city) || 0) + count);
      cityStates.set(city, record.nameOfState);
      
      // Track manufacturers per city
      if (!cityManufacturers.has(city)) {
        cityManufacturers.set(city, new Map());
      }
      const manufacturers = cityManufacturers.get(city)!;
      manufacturers.set(record.vehicleMake, (manufacturers.get(record.vehicleMake) || 0) + count);
    });

    const cities = Array.from(cityMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / totalVehicles) * 100,
        state: cityStates.get(name) || '',
        topManufacturers: Array.from(cityManufacturers.get(name)?.entries() || [])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([manufacturer, count]) => ({ manufacturer, count }))
      }))
      .sort((a, b) => b.count - a.count);

    // RTO analysis
    const rtoMap = new Map<string, number>();
    const rtoCities = new Map<string, string>();
    const rtoStates = new Map<string, string>();
    const rtoManufacturers = new Map<string, Map<string, number>>();
    const rtoFuel = new Map<string, Map<string, number>>();
    const rtoModels = new Map<string, Map<string, number>>();

    this.data.forEach(record => {
      const rto = record.nameOfRTO;
      const count = record.vehicleCount;
      
      rtoMap.set(rto, (rtoMap.get(rto) || 0) + count);
      rtoCities.set(rto, record.nameOfCity);
      rtoStates.set(rto, record.nameOfState);
      
      // Track manufacturers per RTO
      if (!rtoManufacturers.has(rto)) {
        rtoManufacturers.set(rto, new Map());
      }
      const manufacturers = rtoManufacturers.get(rto)!;
      manufacturers.set(record.vehicleMake, (manufacturers.get(record.vehicleMake) || 0) + count);
      
      // Track fuel distribution per RTO
      if (!rtoFuel.has(rto)) {
        rtoFuel.set(rto, new Map());
      }
      const fuel = rtoFuel.get(rto)!;
      fuel.set(record.vehicleFuel, (fuel.get(record.vehicleFuel) || 0) + count);
      
      // Track models per RTO
      if (!rtoModels.has(rto)) {
        rtoModels.set(rto, new Map());
      }
      const models = rtoModels.get(rto)!;
      models.set(record.vehicleModel, (models.get(record.vehicleModel) || 0) + count);
    });

    const rtos = Array.from(rtoMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / totalVehicles) * 100,
        city: rtoCities.get(name) || '',
        state: rtoStates.get(name) || '',
        topManufacturers: Array.from(rtoManufacturers.get(name)?.entries() || [])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([manufacturer, count]) => ({ manufacturer, count })),
        fuelDistribution: Array.from(rtoFuel.get(name)?.entries() || [])
          .sort((a, b) => b[1] - a[1])
          .map(([fuel, count]) => ({ fuel, count })),
        topModels: Array.from(rtoModels.get(name)?.entries() || [])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([model, count]) => ({ model, count }))
      }))
      .sort((a, b) => b.count - a.count);

    // Top models across all manufacturers
    const modelMap = new Map<string, { count: number; manufacturer: string }>();
    this.data.forEach(record => {
      const model = record.vehicleModel;
      const count = record.vehicleCount;
      const manufacturer = record.vehicleMake;
      
      if (modelMap.has(model)) {
        modelMap.get(model)!.count += count;
      } else {
        modelMap.set(model, { count, manufacturer });
      }
    });

    const topModels = Array.from(modelMap.entries())
      .map(([model, { count, manufacturer }]) => ({ model, count, manufacturer }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Top cities
    const topCities = cities.slice(0, 20);

    // Monthly trends
    const monthlyTrends = Array.from(this.monthlyData.entries())
      .map(([month, records]) => {
        const monthCount = records.reduce((sum, record) => sum + record.vehicleCount, 0);
        const monthManufacturers = new Map<string, number>();
        const monthFuelTypes = new Map<string, number>();
        
        records.forEach(record => {
          monthManufacturers.set(record.vehicleMake, 
            (monthManufacturers.get(record.vehicleMake) || 0) + record.vehicleCount);
          monthFuelTypes.set(record.vehicleFuel, 
            (monthFuelTypes.get(record.vehicleFuel) || 0) + record.vehicleCount);
        });
        
        return {
          month,
          monthName: this.getMonthName(month),
          count: monthCount,
          percentage: (monthCount / totalVehicles) * 100,
          topManufacturers: Array.from(monthManufacturers.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([manufacturer, count]) => ({ manufacturer, count })),
          topFuelTypes: Array.from(monthFuelTypes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([fuel, count]) => ({ fuel, count }))
        };
      })
      .sort((a, b) => a.month - b.month);

    return {
      totalVehicles,
      totalManufacturers: uniqueManufacturers.size,
      totalStates: uniqueStates.size,
      totalCities: uniqueCities.size,
      totalRTOs: uniqueRTOs.size,
      totalFuelTypes: uniqueFuelTypes.size,
      manufacturers,
      fuelTypes,
      states,
      cities,
      rtos,
      topModels,
      topCities,
      monthlyTrends
    };
  }

  private getMonthName(month: number): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1] || `Month ${month}`;
  }

  getManufacturerAnalysis(): Array<{
    name: string;
    count: number;
    percentage: number;
    topModels: Array<{ model: string; count: number }>;
    fuelDistribution: Array<{ fuel: string; count: number }>;
    stateDistribution: Array<{ state: string; count: number }>;
  }> {
    const aggregated = this.getAggregatedData();
    return aggregated.manufacturers;
  }

  getRTODetails(): Array<{
    name: string;
    count: number;
    percentage: number;
    city: string;
    state: string;
    topManufacturers: Array<{ manufacturer: string; count: number }>;
    fuelDistribution: Array<{ fuel: string; count: number }>;
    topModels: Array<{ model: string; count: number }>;
  }> {
    const aggregated = this.getAggregatedData();
    return aggregated.rtos;
  }

  getFuelTypeAnalysis(): Array<{
    fuel: string;
    count: number;
    percentage: number;
    manufacturers: Array<{ manufacturer: string; count: number }>;
    topModels: Array<{ model: string; count: number }>;
    stateDistribution: Array<{ state: string; count: number }>;
  }> {
    const aggregated = this.getAggregatedData();
    return aggregated.fuelTypes;
  }

  getMonthlyTrends(): Array<{
    month: number;
    monthName: string;
    count: number;
    percentage: number;
    topManufacturers: Array<{ manufacturer: string; count: number }>;
    topFuelTypes: Array<{ fuel: string; count: number }>;
  }> {
    const aggregated = this.getAggregatedData();
    return aggregated.monthlyTrends;
  }

  getData(): VehicleRecord[] {
    return this.data;
  }

  getFilteredData(filters: {
    manufacturer?: string;
    fuelType?: string;
    state?: string;
    city?: string;
    rto?: string;
    month?: number;
    make?: string;
    model?: string;
    variant?: string;
    rtoClassification?: string;
  }): VehicleRecord[] {
    return this.data.filter(record => {
      if (filters.manufacturer && record.vehicleMake !== filters.manufacturer) return false;
      if (filters.fuelType && record.vehicleFuel !== filters.fuelType) return false;
      if (filters.state && record.nameOfState !== filters.state) return false;
      if (filters.city && record.nameOfCity !== filters.city) return false;
      if (filters.rto && record.nameOfRTO !== filters.rto) return false;
      if (filters.month && record.monthOfSales !== filters.month) return false;
      if (filters.make && record.vehicleMake !== filters.make) return false;
      if (filters.model && record.vehicleModel !== filters.model) return false;
      if (filters.variant && record.vehicleVariant !== filters.variant) return false;
      if (filters.rtoClassification && record.rtoClassification !== filters.rtoClassification) return false;
      return true;
    });
  }

  getDataByMonth(month: number): VehicleRecord[] {
    return this.monthlyData.get(month) || [];
  }

  getAvailableMonths(): number[] {
    return Array.from(this.monthlyData.keys()).sort();
  }
} 