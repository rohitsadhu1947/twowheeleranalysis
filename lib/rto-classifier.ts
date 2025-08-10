export interface RTOClassification {
  classification: 'Metro' | 'Urban' | 'Rural';
  tier: string;
  definition: string;
  authority: string;
}

export interface RTOInfo {
  rtoCode: string;
  rtoName: string;
  city: string;
  district: string;
  state: string;
  classification: string;
  tier: string;
  definitionSource: string;
}

export class IndiaRTOClassification {
  private metroCities: Set<string>;
  private urbanCities: Set<string>;
  private urbanCriteria: {
    minPopulation: number;
    minDensityPerSqKm: number;
    minNonAgriculturalWorkersPct: number;
  };

  constructor() {
    // Official Metro Cities as per Government of India
    this.metroCities = new Set([
      'MUMBAI', 'DELHI', 'BANGALORE', 'BENGALURU', 'HYDERABAD', 'AHMEDABAD',
      'CHENNAI', 'KOLKATA', 'PUNE', 'SURAT', 'JAIPUR', 'LUCKNOW',
      'KANPUR', 'NAGPUR', 'INDORE', 'THANE', 'BHOPAL', 'VISAKHAPATNAM',
      'PIMPRI-CHINCHWAD', 'PATNA', 'VADODARA', 'GHAZIABAD', 'LUDHIANA',
      'AGRA', 'NASHIK', 'FARIDABAD', 'MEERUT', 'RAJKOT', 'KALYAN-DOMBIVALI',
      'VASAI-VIRAR', 'VARANASI', 'SRINAGAR', 'AURANGABAD', 'DHANBAD',
      'AMRITSAR', 'NAVI MUMBAI', 'ALLAHABAD', 'PRAYAGRAJ', 'HOWRAH',
      'RANCHI', 'GWALIOR', 'JABALPUR', 'COIMBATORE', 'VIJAYAWADA',
      'JODHPUR', 'MADURAI', 'RAIPUR', 'KOTA', 'CHANDIGARH'
    ]);

    // Official Urban Agglomerations (Tier-1 & Tier-2)
    this.urbanCities = new Set([
      'GUWAHATI', 'CHANDIGARH', 'THIRUVANANTHAPURAM', 'SOLAPUR', 'HUBLI-DHARWAD',
      'BAREILLY', 'MORADABAD', 'MYSORE', 'GURGAON', 'GURUGRAM', 'ALIGARH',
      'JALANDHAR', 'TIRUCHIRAPPALLI', 'BHUBANESWAR', 'SALEM', 'WARANGAL',
      'MIRA-BHAYANDAR', 'THIRUVANANTHAPURAM', 'BHIWANDI', 'SAHARANPUR',
      'GORAKHPUR', 'BIKANER', 'AMRAVATI', 'NOIDA', 'JAMSHEDPUR', 'BHILAI',
      'CUTTACK', 'FIROZABAD', 'KOCHI', 'ERNAKULAM', 'BHAVNAGAR', 'DEHRADUN',
      'DURGAPUR', 'ASANSOL', 'NANDED', 'KOLHAPUR', 'AJMER', 'GULBARGA',
      'JAMNAGAR', 'UJJAIN', 'LONI', 'SILIGURI', 'JHANSI', 'ULHASNAGAR',
      'JAMMU', 'SANGLI-MIRAJ-KUPWAD', 'MANGALORE', 'ERODE', 'BELGAUM',
      'AMBATTUR', 'TIRUNELVELI', 'MALEGAON', 'GAYA', 'JALGAON', 'UDAIPUR'
    ]);

    // Census 2011 definitions for Urban areas
    this.urbanCriteria = {
      minPopulation: 5000,
      minDensityPerSqKm: 400,
      minNonAgriculturalWorkersPct: 75
    };
  }

  /**
   * Official classification based on Government of India definitions
   */
  classifyRTOOfficial(
    rtoName: string,
    city: string,
    district: string,
    state: string,
    population?: number
  ): RTOClassification {
    const cityUpper = (city || '').toUpperCase().trim();
    const districtUpper = (district || '').toUpperCase().trim();
    const rtoUpper = (rtoName || '').toUpperCase().trim();

    // Check for Metro cities (Million Plus Urban Agglomerations)
    for (const metro of this.metroCities) {
      if (cityUpper.includes(metro) || districtUpper.includes(metro) || rtoUpper.includes(metro)) {
        return {
          classification: 'Metro',
          tier: 'Tier-1',
          definition: 'Million Plus Urban Agglomeration',
          authority: 'Census of India 2011'
        };
      }
    }

    // Check for Urban cities (Class I & II cities)
    for (const urban of this.urbanCities) {
      if (cityUpper.includes(urban) || districtUpper.includes(urban) || rtoUpper.includes(urban)) {
        return {
          classification: 'Urban',
          tier: 'Tier-2',
          definition: 'Class I/II City or Urban Agglomeration',
          authority: 'Census of India 2011'
        };
      }
    }

    // Default to Rural for smaller towns/villages
    return {
      classification: 'Rural',
      tier: 'Tier-3/Rural',
      definition: 'Areas not classified as Urban by Census',
      authority: 'Census of India 2011'
    };
  }

  /**
   * Get state-wise development tier mapping based on economic indicators
   */
  getStateTierMapping(): Record<string, string[]> {
    return {
      'Tier-1 States': [
        'MAHARASHTRA', 'TAMIL NADU', 'KARNATAKA', 'GUJARAT', 'HARYANA',
        'PUNJAB', 'KERALA', 'DELHI', 'GOAS'
      ],
      'Tier-2 States': [
        'UTTAR PRADESH', 'WEST BENGAL', 'RAJASTHAN', 'MADHYA PRADESH',
        'ANDHRA PRADESH', 'TELANGANA', 'ODISHA', 'JHARKHAND'
      ],
      'Tier-3 States': [
        'BIHAR', 'ASSAM', 'CHHATTISGARH', 'HIMACHAL PRADESH',
        'UTTARAKHAND', 'TRIPURA', 'MEGHALAYA', 'MANIPUR',
        'NAGALAND', 'MIZORAM', 'ARUNACHAL PRADESH', 'SIKKIM'
      ]
    };
  }

  /**
   * Census of India 2011 official urban definition
   */
  classifyByCensusDefinition(
    population: number,
    densityPerSqKm: number,
    nonAgriWorkersPct: number,
    hasMunicipality: boolean = false
  ): string {
    if (hasMunicipality) {
      return 'Urban (Statutory)';
    }

    if (
      population >= this.urbanCriteria.minPopulation &&
      densityPerSqKm >= this.urbanCriteria.minDensityPerSqKm &&
      nonAgriWorkersPct >= this.urbanCriteria.minNonAgriculturalWorkersPct
    ) {
      return 'Urban (Census)';
    }

    return 'Rural';
  }

  /**
   * Apply correct classification to RTO based on the vehicle record
   */
  classifyRTO(record: {
    codeOfRTO: string;
    nameOfRTO: string;
    nameOfCity: string;
    nameOfDistrict: string;
    nameOfState: string;
  }): RTOInfo {
    const classification = this.classifyRTOOfficial(
      record.nameOfRTO,
      record.nameOfCity,
      record.nameOfDistrict,
      record.nameOfState
    );

    return {
      rtoCode: record.codeOfRTO,
      rtoName: record.nameOfRTO,
      city: record.nameOfCity,
      district: record.nameOfDistrict,
      state: record.nameOfState,
      classification: classification.classification,
      tier: classification.tier,
      definitionSource: classification.authority
    };
  }

  /**
   * Get all unique classifications
   */
  getAvailableClassifications(): string[] {
    return ['Metro', 'Urban', 'Rural'];
  }
}

// Singleton instance
export const rtoClassifier = new IndiaRTOClassification();