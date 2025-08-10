// Simple test to verify RTO classification logic
console.log('Testing RTO Classification...');

// Simulate the classification logic
const metroCities = new Set([
  'MUMBAI', 'DELHI', 'BANGALORE', 'BENGALURU', 'HYDERABAD', 'AHMEDABAD',
  'CHENNAI', 'KOLKATA', 'PUNE', 'SURAT', 'JAIPUR', 'LUCKNOW',
  'KANPUR', 'NAGPUR', 'INDORE', 'THANE', 'BHOPAL', 'VISAKHAPATNAM'
]);

const urbanCities = new Set([
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

function testClassifyRTO(rtoName, city, district, state) {
  const cityUpper = (city || '').toUpperCase().trim();
  const districtUpper = (district || '').toUpperCase().trim();
  const rtoUpper = (rtoName || '').toUpperCase().trim();

  console.log(`\nTesting: ${rtoName}`);
  console.log(`City: ${city}, District: ${district}, State: ${state}`);
  console.log(`Upper case values - RTO: "${rtoUpper}", City: "${cityUpper}", District: "${districtUpper}"`);

  // Check for Metro cities
  for (const metro of metroCities) {
    if (cityUpper.includes(metro) || districtUpper.includes(metro) || rtoUpper.includes(metro)) {
      console.log(`Matched Metro: ${metro}`);
      return 'Metro';
    }
  }

  // Check for Urban cities
  for (const urban of urbanCities) {
    if (cityUpper.includes(urban) || districtUpper.includes(urban) || rtoUpper.includes(urban)) {
      console.log(`Matched Urban: ${urban}`);
      return 'Urban';
    }
  }

  console.log('No match found - defaulting to Rural');
  return 'Rural';
}

// Test Mangalore RTO
const result = testClassifyRTO('MANGALORE RTO', 'MANGALURU', 'DAKSHINA KANNADA', 'KARNATAKA');
console.log(`\nFinal classification: ${result}`);

// Test if the string matching works correctly
console.log(`\nTesting string matching:`);
console.log(`'MANGALORE RTO'.includes('MANGALORE'): ${'MANGALORE RTO'.includes('MANGALORE')}`);
console.log(`urbanCities.has('MANGALORE'): ${urbanCities.has('MANGALORE')}`);

// Test the exact logic
const testRtoUpper = 'MANGALORE RTO';
let found = false;
for (const urban of urbanCities) {
  if (testRtoUpper.includes(urban)) {
    console.log(`Found match with urban city: ${urban}`);
    found = true;
    break;
  }
}
if (!found) {
  console.log('No urban cities found in RTO name');
}