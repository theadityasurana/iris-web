// Location mappings for country → city → keyword variants
// Used for the location filter to match against raw location strings in the DB

export interface CityMapping {
  name: string;
  keywords: string[];
}

export interface CountryMapping {
  name: string;
  keywords: string[]; // keywords that match the country itself
  cities: CityMapping[];
}

export const LOCATION_MAPPINGS: CountryMapping[] = [
  {
    name: 'United States',
    keywords: ['United States', 'USA', 'US', 'AMER', 'America', 'United States of America'],
    cities: [
      { name: 'San Francisco', keywords: ['San Francisco', 'SF', 'SFO', 'San Franciso', 'San Francissco', 'Bay Area', 'SoCal'] },
      { name: 'New York', keywords: ['New York', 'NYC', 'NY', 'Manhattan'] },
      { name: 'Seattle', keywords: ['Seattle', 'SEA', 'Bellevue', 'Woodinville', 'Redmond'] },
      { name: 'Los Angeles', keywords: ['Los Angeles', 'LA', 'Long Beach', 'Irvine', 'Southern California'] },
      { name: 'Chicago', keywords: ['Chicago', 'CHI'] },
      { name: 'Boston', keywords: ['Boston', 'MA', 'Massachusetts'] },
      { name: 'Austin', keywords: ['Austin', 'TX', 'Texas'] },
      { name: 'Denver', keywords: ['Denver', 'Colorado', 'CO'] },
      { name: 'Atlanta', keywords: ['Atlanta', 'ATL', 'Georgia'] },
      { name: 'Washington DC', keywords: ['Washington', 'DC', 'D.C.', 'McLean', 'Virginia', 'Reston', 'Crystal City'] },
      { name: 'Miami', keywords: ['Miami', 'Fort Lauderdale', 'Florida', 'FL'] },
      { name: 'Dallas', keywords: ['Dallas', 'TX'] },
      { name: 'Portland', keywords: ['Portland', 'OR', 'Oregon'] },
      { name: 'Minneapolis', keywords: ['Minneapolis', 'Minnesota', 'MN'] },
      { name: 'San Diego', keywords: ['San Diego'] },
      { name: 'Palo Alto', keywords: ['Palo Alto', 'Menlo Park', 'Mountain View', 'Sunnyvale', 'Cupertino', 'Santa Clara', 'San Jose', 'Silicon Valley'] },
      { name: 'Philadelphia', keywords: ['Philadelphia', 'PA', 'Pennsylvania'] },
      { name: 'Phoenix', keywords: ['Phoenix', 'Arizona', 'AZ'] },
      { name: 'Salt Lake City', keywords: ['Salt Lake City', 'Sandy', 'UT', 'Utah'] },
      { name: 'Raleigh', keywords: ['Raleigh', 'Morrisville', 'North Carolina', 'NC', 'Charlotte'] },
      { name: 'Pittsburgh', keywords: ['Pittsburgh'] },
      { name: 'Detroit', keywords: ['Detroit', 'Michigan', 'MI'] },
      { name: 'Orlando', keywords: ['Orlando', 'Winter Garden'] },
      { name: 'Las Vegas', keywords: ['Las Vegas', 'Nevada', 'NV'] },
      { name: 'St. Louis', keywords: ['St. Louis', 'Missouri', 'MO'] },
      { name: 'Columbus', keywords: ['Columbus', 'Ohio', 'OH', 'Cleveland'] },
      { name: 'Houston', keywords: ['Houston'] },
      { name: 'Omaha', keywords: ['Omaha', 'Nebraska', 'NE'] },
      { name: 'Tampa', keywords: ['Tampa'] },
      { name: 'Memphis', keywords: ['Memphis', 'TN', 'Tennessee'] },
      { name: 'Oakland', keywords: ['Oakland'] },
      { name: 'Hawthorne', keywords: ['Hawthorne', 'Bastrop', 'Starbase', 'McGregor', 'Vandenberg', 'Cape Canaveral', 'SpaceX'] },
      { name: 'South San Francisco', keywords: ['South San Francisco'] },
      { name: 'Kansas City', keywords: ['Kansas City', 'Kansas', 'KS'] },
      { name: 'Madison', keywords: ['Madison', 'Wisconsin', 'WI'] },
      { name: 'Honolulu', keywords: ['Honolulu', 'Hawaii', 'HI'] },
      { name: 'Baltimore', keywords: ['Baltimore', 'Maryland', 'MD'] },
      { name: 'Newark', keywords: ['Newark', 'New Jersey', 'NJ', 'Hamilton'] },
      { name: 'Colorado Springs', keywords: ['Colorado Springs'] },
      { name: 'Pleasanton', keywords: ['Pleasanton', 'Foster City', 'Redwood City'] },
    ],
  },
  {
    name: 'India',
    keywords: ['India', 'IND', 'APAC'],
    cities: [
      { name: 'Bangalore', keywords: ['Bangalore', 'Bengaluru', 'BLR', 'Karnataka', 'Banglore'] },
      { name: 'Mumbai', keywords: ['Mumbai', 'Bombay', 'Maharashtra'] },
      { name: 'Delhi', keywords: ['Delhi', 'New Delhi', 'Noida', 'Gurugram', 'Gurgaon', 'NCR'] },
      { name: 'Hyderabad', keywords: ['Hyderabad', 'Telangana', 'Hyderbad'] },
      { name: 'Pune', keywords: ['Pune'] },
      { name: 'Chennai', keywords: ['Chennai', 'Tamil Nadu'] },
      { name: 'Kolkata', keywords: ['Kolkata', 'Calcutta'] },
      { name: 'Kochi', keywords: ['Kochi', 'Cochin', 'Trivandrum', 'Kerala'] },
      { name: 'Ahmedabad', keywords: ['Ahmedabad', 'Gujarat', 'Gandhinagar', 'Surat'] },
      { name: 'Jaipur', keywords: ['Jaipur', 'Rajasthan'] },
      { name: 'Lucknow', keywords: ['Lucknow', 'Uttar Pradesh'] },
      { name: 'Mohali', keywords: ['Mohali', 'Chandigarh', 'Punjab'] },
    ],
  },
  {
    name: 'United Kingdom',
    keywords: ['United Kingdom', 'UK', 'GBR', 'Britain', 'England', 'Wales', 'Scotland'],
    cities: [
      { name: 'London', keywords: ['London', 'LON', 'UK2', 'Westminster', 'Reading'] },
      { name: 'Manchester', keywords: ['Manchester'] },
      { name: 'Edinburgh', keywords: ['Edinburgh'] },
      { name: 'Cambridge', keywords: ['Cambridge'] },
      { name: 'Bristol', keywords: ['Bristol'] },
    ],
  },
  {
    name: 'Canada',
    keywords: ['Canada', 'CAN', 'CA-'],
    cities: [
      { name: 'Toronto', keywords: ['Toronto', 'Ontario', 'CAN'] },
      { name: 'Vancouver', keywords: ['Vancouver', 'British Columbia'] },
      { name: 'Montreal', keywords: ['Montreal', 'Montréal', 'Quebec', 'Québec'] },
      { name: 'Calgary', keywords: ['Calgary', 'Alberta', 'Edmonton'] },
      { name: 'Waterloo', keywords: ['Waterloo'] },
    ],
  },
  {
    name: 'Germany',
    keywords: ['Germany', 'DEU', 'DE-', 'Deutschland'],
    cities: [
      { name: 'Berlin', keywords: ['Berlin'] },
      { name: 'Munich', keywords: ['Munich', 'München', 'Munchen'] },
      { name: 'Frankfurt', keywords: ['Frankfurt'] },
      { name: 'Hamburg', keywords: ['Hamburg'] },
      { name: 'Aachen', keywords: ['Aachen'] },
      { name: 'Düsseldorf', keywords: ['Duesseldorf', 'Düsseldorf', 'Dusseldorf'] },
    ],
  },
  {
    name: 'France',
    keywords: ['France', 'FRA', 'FR-'],
    cities: [
      { name: 'Paris', keywords: ['Paris', 'Ville de Paris'] },
      { name: 'Lyon', keywords: ['Lyon'] },
      { name: 'Bordeaux', keywords: ['Bordeaux'] },
      { name: 'Grenoble', keywords: ['Grenoble'] },
      { name: 'Montpellier', keywords: ['Montpellier'] },
      { name: 'Nantes', keywords: ['Nantes'] },
      { name: 'Nice', keywords: ['Nice', 'Sophia Antipolis'] },
    ],
  },
  {
    name: 'Ireland',
    keywords: ['Ireland', 'IE'],
    cities: [
      { name: 'Dublin', keywords: ['Dublin', 'Dubin'] },
      { name: 'Cork', keywords: ['Cork'] },
    ],
  },
  {
    name: 'Netherlands',
    keywords: ['Netherlands', 'NLD', 'NL-', 'NL,', ', NL', 'Dutch', 'Benelux'],
    cities: [
      { name: 'Amsterdam', keywords: ['Amsterdam', 'The Netherlands'] },
      { name: 'Eindhoven', keywords: ['Eindhoven'] },
      { name: 'Utrecht', keywords: ['Utrecht'] },
      { name: 'Rotterdam', keywords: ['Rotterdam'] },
      { name: 'The Hague', keywords: ['The Hague', 'Den Haag'] },
    ],
  },
  {
    name: 'Australia',
    keywords: ['Australia', 'AUS', 'AU-'],
    cities: [
      { name: 'Sydney', keywords: ['Sydney', 'New South Wales'] },
      { name: 'Melbourne', keywords: ['Melbourne', 'Victoria'] },
      { name: 'Brisbane', keywords: ['Brisbane'] },
      { name: 'Canberra', keywords: ['Canberra'] },
      { name: 'Perth', keywords: ['Perth'] },
    ],
  },
  {
    name: 'Singapore',
    keywords: ['Singapore', 'SGP', 'SG-'],
    cities: [
      { name: 'Singapore', keywords: ['Singapore'] },
    ],
  },
  {
    name: 'Japan',
    keywords: ['Japan', 'JPN', 'JP-'],
    cities: [
      { name: 'Tokyo', keywords: ['Tokyo'] },
      { name: 'Osaka', keywords: ['Osaka', 'Ôsaka'] },
    ],
  },
  {
    name: 'South Korea',
    keywords: ['South Korea', 'Korea', 'KR-'],
    cities: [
      { name: 'Seoul', keywords: ['Seoul'] },
    ],
  },
  {
    name: 'Israel',
    keywords: ['Israel', 'ISR', 'IL-'],
    cities: [
      { name: 'Tel Aviv', keywords: ['Tel Aviv', 'Tel Aviv-Yafo', 'Herzliya', 'Petah Tikva'] },
      { name: 'Jerusalem', keywords: ['Jerusalem'] },
    ],
  },
  {
    name: 'United Arab Emirates',
    keywords: ['United Arab Emirates', 'UAE', 'AE-'],
    cities: [
      { name: 'Dubai', keywords: ['Dubai'] },
      { name: 'Abu Dhabi', keywords: ['Abu Dhabi'] },
    ],
  },
  {
    name: 'Brazil',
    keywords: ['Brazil', 'BR'],
    cities: [
      { name: 'São Paulo', keywords: ['São Paulo', 'Sao Paulo', 'Sao Paolo'] },
      { name: 'Rio de Janeiro', keywords: ['Rio de Janeiro'] },
    ],
  },
  {
    name: 'Mexico',
    keywords: ['Mexico', 'MX', 'CDMX'],
    cities: [
      { name: 'Mexico City', keywords: ['Mexico City', 'CDMX'] },
    ],
  },
  {
    name: 'Spain',
    keywords: ['Spain', 'ESP'],
    cities: [
      { name: 'Madrid', keywords: ['Madrid'] },
      { name: 'Barcelona', keywords: ['Barcelona'] },
      { name: 'Galicia', keywords: ['Galicia'] },
    ],
  },
  {
    name: 'Italy',
    keywords: ['Italy', 'ITA'],
    cities: [
      { name: 'Milan', keywords: ['Milan', 'Milano'] },
      { name: 'Rome', keywords: ['Rome', 'Roma'] },
    ],
  },
  {
    name: 'Poland',
    keywords: ['Poland', 'PL-'],
    cities: [
      { name: 'Warsaw', keywords: ['Warsaw'] },
    ],
  },
  {
    name: 'Sweden',
    keywords: ['Sweden', 'SE-'],
    cities: [
      { name: 'Stockholm', keywords: ['Stockholm'] },
    ],
  },
  {
    name: 'Denmark',
    keywords: ['Denmark', 'DK-'],
    cities: [
      { name: 'Copenhagen', keywords: ['Copenhagen'] },
    ],
  },
  {
    name: 'Norway',
    keywords: ['Norway', 'NO-'],
    cities: [
      { name: 'Oslo', keywords: ['Oslo'] },
    ],
  },
  {
    name: 'Finland',
    keywords: ['Finland', 'FI-'],
    cities: [
      { name: 'Helsinki', keywords: ['Helsinki'] },
    ],
  },
  {
    name: 'Switzerland',
    keywords: ['Switzerland', 'CH-'],
    cities: [
      { name: 'Zurich', keywords: ['Zurich', 'Zürich'] },
    ],
  },
  {
    name: 'Belgium',
    keywords: ['Belgium', 'BE-'],
    cities: [
      { name: 'Brussels', keywords: ['Brussels'] },
    ],
  },
  {
    name: 'Portugal',
    keywords: ['Portugal'],
    cities: [
      { name: 'Lisbon', keywords: ['Lisbon'] },
      { name: 'Porto', keywords: ['Porto'] },
    ],
  },
  {
    name: 'Austria',
    keywords: ['Austria'],
    cities: [
      { name: 'Vienna', keywords: ['Vienna', 'Wien'] },
    ],
  },
  {
    name: 'China',
    keywords: ['China', 'CN-'],
    cities: [
      { name: 'Beijing', keywords: ['Beijing'] },
      { name: 'Shanghai', keywords: ['Shanghai'] },
      { name: 'Shenzhen', keywords: ['Shenzhen'] },
      { name: 'Hong Kong', keywords: ['Hong Kong'] },
    ],
  },
  {
    name: 'Taiwan',
    keywords: ['Taiwan'],
    cities: [
      { name: 'Taipei', keywords: ['Taipei', 'Taiwan'] },
    ],
  },
  {
    name: 'Thailand',
    keywords: ['Thailand'],
    cities: [
      { name: 'Bangkok', keywords: ['Bangkok'] },
    ],
  },
  {
    name: 'Indonesia',
    keywords: ['Indonesia', 'ID-'],
    cities: [
      { name: 'Jakarta', keywords: ['Jakarta'] },
    ],
  },
  {
    name: 'Malaysia',
    keywords: ['Malaysia'],
    cities: [
      { name: 'Kuala Lumpur', keywords: ['Kuala Lumpur'] },
    ],
  },
  {
    name: 'Vietnam',
    keywords: ['Vietnam'],
    cities: [
      { name: 'Ho Chi Minh City', keywords: ['Ho Chi Minh'] },
    ],
  },
  {
    name: 'Philippines',
    keywords: ['Philippines', 'PH-'],
    cities: [
      { name: 'Manila', keywords: ['Manila'] },
    ],
  },
  {
    name: 'New Zealand',
    keywords: ['New Zealand', 'NZ-'],
    cities: [
      { name: 'Auckland', keywords: ['Auckland'] },
    ],
  },
  {
    name: 'Saudi Arabia',
    keywords: ['Saudi Arabia', 'SA-'],
    cities: [
      { name: 'Riyadh', keywords: ['Riyadh'] },
    ],
  },
  {
    name: 'Qatar',
    keywords: ['Qatar'],
    cities: [
      { name: 'Doha', keywords: ['Doha'] },
    ],
  },
  {
    name: 'Egypt',
    keywords: ['Egypt'],
    cities: [
      { name: 'Cairo', keywords: ['Cairo'] },
    ],
  },
  {
    name: 'South Africa',
    keywords: ['South Africa'],
    cities: [
      { name: 'Cape Town', keywords: ['Cape Town'] },
      { name: 'Johannesburg', keywords: ['Johannesburg'] },
    ],
  },
  {
    name: 'Nigeria',
    keywords: ['Nigeria'],
    cities: [
      { name: 'Lagos', keywords: ['Lagos'] },
    ],
  },
  {
    name: 'Kenya',
    keywords: ['Kenya'],
    cities: [
      { name: 'Nairobi', keywords: ['Nairobi'] },
    ],
  },
  {
    name: 'Argentina',
    keywords: ['Argentina'],
    cities: [
      { name: 'Buenos Aires', keywords: ['Buenos Aires'] },
    ],
  },
  {
    name: 'Colombia',
    keywords: ['Colombia', 'Columbia'],
    cities: [
      { name: 'Bogota', keywords: ['Bogota', 'Bogotá'] },
    ],
  },
  {
    name: 'Chile',
    keywords: ['Chile'],
    cities: [
      { name: 'Santiago', keywords: ['Santiago', 'Chile'] },
    ],
  },
  {
    name: 'Costa Rica',
    keywords: ['Costa Rica', 'CRI', 'CR-'],
    cities: [
      { name: 'San Jose', keywords: ['San Jose', 'Escazu'] },
    ],
  },
  {
    name: 'Russia',
    keywords: ['Russia', 'Russian Federation'],
    cities: [
      { name: 'Moscow', keywords: ['Moscow'] },
      { name: 'St. Petersburg', keywords: ['St. Petersburg', 'Saint Petersburg'] },
    ],
  },
  {
    name: 'Ukraine',
    keywords: ['Ukraine'],
    cities: [
      { name: 'Kyiv', keywords: ['Kyiv', 'Kiev'] },
    ],
  },
  {
    name: 'Romania',
    keywords: ['Romania'],
    cities: [
      { name: 'Bucharest', keywords: ['Bucharest'] },
      { name: 'Cluj', keywords: ['Cluj'] },
      { name: 'Iași', keywords: ['Iași', 'Iasi'] },
    ],
  },
  {
    name: 'Czech Republic',
    keywords: ['Czech Republic', 'Czech'],
    cities: [
      { name: 'Prague', keywords: ['Prague'] },
    ],
  },
  {
    name: 'Croatia',
    keywords: ['Croatia'],
    cities: [
      { name: 'Zagreb', keywords: ['Zagreb'] },
    ],
  },
  {
    name: 'Serbia',
    keywords: ['Serbia'],
    cities: [
      { name: 'Belgrade', keywords: ['Belgrade'] },
      { name: 'Novi Sad', keywords: ['Novi Sad'] },
    ],
  },
  {
    name: 'Greece',
    keywords: ['Greece'],
    cities: [
      { name: 'Athens', keywords: ['Athens'] },
      { name: 'Thessaloniki', keywords: ['Thessaloniki'] },
    ],
  },
  {
    name: 'Turkey',
    keywords: ['Turkey', 'Türkiye', 'TR-'],
    cities: [
      { name: 'Istanbul', keywords: ['Istanbul'] },
    ],
  },
  {
    name: 'Pakistan',
    keywords: ['Pakistan'],
    cities: [
      { name: 'Islamabad', keywords: ['Islamabad'] },
    ],
  },
  {
    name: 'Bangladesh',
    keywords: ['Bangladesh'],
    cities: [
      { name: 'Dhaka', keywords: ['Dhaka'] },
    ],
  },
  {
    name: 'Latvia',
    keywords: ['Latvia'],
    cities: [
      { name: 'Riga', keywords: ['Riga'] },
    ],
  },
  {
    name: 'Lithuania',
    keywords: ['Lithuania'],
    cities: [
      { name: 'Vilnius', keywords: ['Vilnius'] },
    ],
  },
  {
    name: 'Estonia',
    keywords: ['Estonia'],
    cities: [
      { name: 'Tallinn', keywords: ['Tallinn'] },
    ],
  },
  {
    name: 'Hungary',
    keywords: ['Hungary'],
    cities: [
      { name: 'Budapest', keywords: ['Budapest'] },
    ],
  },
  {
    name: 'Bulgaria',
    keywords: ['Bulgaria'],
    cities: [
      { name: 'Sofia', keywords: ['Sofia'] },
    ],
  },
  {
    name: 'Slovakia',
    keywords: ['Slovakia'],
    cities: [
      { name: 'Bratislava', keywords: ['Bratislava'] },
    ],
  },
  {
    name: 'Slovenia',
    keywords: ['Slovenia'],
    cities: [
      { name: 'Ljubljana', keywords: ['Ljubljana'] },
    ],
  },
  {
    name: 'Malta',
    keywords: ['Malta'],
    cities: [
      { name: 'Valletta', keywords: ['Valetta', 'Valletta', "Ta' Xbiex"] },
    ],
  },
  {
    name: 'Luxembourg',
    keywords: ['Luxembourg'],
    cities: [
      { name: 'Luxembourg City', keywords: ['Luxembourg'] },
    ],
  },
  {
    name: 'Iceland',
    keywords: ['Iceland'],
    cities: [
      { name: 'Reykjavik', keywords: ['Reykjavik'] },
    ],
  },
  {
    name: 'Georgia',
    keywords: ['Georgia', 'Tbilisi', 'GEO'],
    cities: [
      { name: 'Tbilisi', keywords: ['Tbilisi', 'Georgia'] },
    ],
  },
  {
    name: 'Armenia',
    keywords: ['Armenia'],
    cities: [
      { name: 'Yerevan', keywords: ['Yerevan'] },
    ],
  },
  {
    name: 'Kazakhstan',
    keywords: ['Kazakhstan'],
    cities: [
      { name: 'Almaty', keywords: ['Almaty'] },
      { name: 'Astana', keywords: ['Astana'] },
    ],
  },
  {
    name: 'Kyrgyzstan',
    keywords: ['Kyrgyzstan'],
    cities: [
      { name: 'Bishkek', keywords: ['Bishkek'] },
    ],
  },
  {
    name: 'Uzbekistan',
    keywords: ['Uzbekistan'],
    cities: [
      { name: 'Tashkent', keywords: ['Tashkent'] },
    ],
  },
  {
    name: 'Peru',
    keywords: ['Peru'],
    cities: [
      { name: 'Lima', keywords: ['Lima'] },
    ],
  },
  {
    name: 'Dominican Republic',
    keywords: ['Dominican'],
    cities: [
      { name: 'Santo Domingo', keywords: ['Santo Domingo'] },
    ],
  },
  {
    name: 'Cambodia',
    keywords: ['Cambodia'],
    cities: [
      { name: 'Phnom Penh', keywords: ['Phnom Penh'] },
    ],
  },
  {
    name: 'Bahrain',
    keywords: ['Bahrain'],
    cities: [
      { name: 'Manama', keywords: ['Manama'] },
    ],
  },
  {
    name: 'Mongolia',
    keywords: ['Mongolia'],
    cities: [],
  },
  {
    name: 'Cyprus',
    keywords: ['Cyprus', 'CY_'],
    cities: [
      { name: 'Limassol', keywords: ['Limassol'] },
    ],
  },
];

// Get all keywords for a given country (country keywords + all its city keywords)
export function getCountryKeywords(countryName: string): string[] {
  const country = LOCATION_MAPPINGS.find(c => c.name === countryName);
  if (!country) return [countryName];
  const allKeywords = [...country.keywords];
  country.cities.forEach(city => {
    allKeywords.push(...city.keywords);
  });
  return allKeywords;
}

// Get keywords for a given city
export function getCityKeywords(cityName: string): string[] {
  for (const country of LOCATION_MAPPINGS) {
    const city = country.cities.find(c => c.name === cityName);
    if (city) return city.keywords;
  }
  return [cityName];
}

// Get cities for selected countries (or all cities if no countries selected)
export function getCitiesForCountries(selectedCountries: string[]): CityMapping[] {
  if (selectedCountries.length === 0) {
    return LOCATION_MAPPINGS.flatMap(c => c.cities);
  }
  return LOCATION_MAPPINGS
    .filter(c => selectedCountries.includes(c.name))
    .flatMap(c => c.cities);
}

// Get all country names
export function getAllCountries(): string[] {
  return LOCATION_MAPPINGS.map(c => c.name);
}

// Get all city names (optionally filtered by countries)
export function getAllCities(selectedCountries?: string[]): string[] {
  const cities = selectedCountries && selectedCountries.length > 0
    ? getCitiesForCountries(selectedCountries)
    : LOCATION_MAPPINGS.flatMap(c => c.cities);
  return [...new Set(cities.map(c => c.name))];
}

// Build location filter keywords from selected countries and cities
export function buildLocationFilterKeywords(countries: string[], cities: string[]): string[] {
  const keywords: string[] = [];

  // Add country-level keywords AND all city keywords for selected countries
  // This ensures "Amsterdam, NL" matches when user selects Netherlands,
  // since the city name alone is the only identifier in many DB location strings.
  countries.forEach(countryName => {
    const country = LOCATION_MAPPINGS.find(c => c.name === countryName);
    if (country) {
      keywords.push(...country.keywords);
      // Also add all city keywords for this country
      country.cities.forEach(city => keywords.push(...city.keywords));
    }
  });

  // Add explicitly selected city keywords
  cities.forEach(cityName => {
    const cityKeywords = getCityKeywords(cityName);
    keywords.push(...cityKeywords);
  });

  return [...new Set(keywords)];
}
