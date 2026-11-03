export const MAJOR_CITIES = [
  'Remote',
  // India
  'Bangalore, India', 'Hyderabad, India', 'Mumbai, India', 'Gurugram, India', 'Delhi NCR, India',
  'Pune, India', 'Chennai, India', 'Noida, India', 'Kolkata, India', 'Ahmedabad, India',
  'Jaipur, India', 'Chandigarh, India', 'Kochi, India', 'Indore, India', 'Coimbatore, India',
  // United States
  'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Boston, MA',
  'Los Angeles, CA', 'Chicago, IL', 'Denver, CO', 'Miami, FL', 'Atlanta, GA',
  'Dallas, TX', 'Houston, TX', 'Phoenix, AZ', 'San Diego, CA', 'Philadelphia, PA',
  'Washington, DC', 'Portland, OR', 'Nashville, TN', 'Detroit, MI', 'Minneapolis, MN',
  // United Kingdom
  'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Edinburgh, UK', 'Bristol, UK',
  'Leeds, UK', 'Glasgow, UK', 'Liverpool, UK', 'Cambridge, UK', 'Oxford, UK',
  // Europe
  'Berlin, Germany', 'Munich, Germany', 'Frankfurt, Germany', 'Hamburg, Germany', 'Cologne, Germany',
  'Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'The Hague, Netherlands', 'Utrecht, Netherlands',
  'Paris, France', 'Lyon, France', 'Marseille, France', 'Toulouse, France', 'Nice, France',
  'Barcelona, Spain', 'Madrid, Spain', 'Lisbon, Portugal', 'Porto, Portugal',
  'Rome, Italy', 'Milan, Italy', 'Stockholm, Sweden', 'Copenhagen, Denmark',
  'Oslo, Norway', 'Helsinki, Finland', 'Vienna, Austria', 'Zurich, Switzerland',
  'Geneva, Switzerland', 'Brussels, Belgium', 'Prague, Czech Republic', 'Warsaw, Poland',
  'Dublin, Ireland', 'Athens, Greece', 'Budapest, Hungary',
  // Middle East
  'Dubai, UAE', 'Abu Dhabi, UAE', 'Riyadh, Saudi Arabia', 'Jeddah, Saudi Arabia',
  'Doha, Qatar', 'Kuwait City, Kuwait', 'Muscat, Oman', 'Manama, Bahrain',
  'Tel Aviv, Israel', 'Jerusalem, Israel', 'Amman, Jordan', 'Beirut, Lebanon',
  // Canada
  'Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada', 'Calgary, Canada',
  'Ottawa, Canada', 'Edmonton, Canada', 'Winnipeg, Canada',
  // Southeast Asia
  'Singapore', 'Bangkok, Thailand', 'Jakarta, Indonesia', 'Kuala Lumpur, Malaysia',
  'Manila, Philippines', 'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam',
  'Yangon, Myanmar', 'Phnom Penh, Cambodia', 'Bali, Indonesia',
  // Australia & Others
  'Sydney, Australia', 'Melbourne, Australia', 'Tokyo, Japan', 'Seoul, South Korea',
];
  
  export const CURRENCIES = [
    { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
    { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
    { code: 'EUR', symbol: '€', label: 'Euro (€)' },
    { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
    { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar (C$)' },
    { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (A$)' },
    { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (S$)' },
    { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham (د.إ)' },
    { code: 'JPY', symbol: '¥', label: 'Japanese Yen (¥)' },
    { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc (CHF)' },
  ];
  
  export interface SalaryConfig {
    min: number;
    max: number;
    step: number;
  }
  
  export function getSalaryConfig(currencyCode: string): SalaryConfig {
    switch (currencyCode) {
      case 'INR':
        return { min: 0, max: 10000000, step: 500000 };
      case 'EUR':
        return { min: 0, max: 500000, step: 5000 };
      case 'GBP':
        return { min: 0, max: 500000, step: 5000 };
      case 'JPY':
        return { min: 0, max: 50000000, step: 500000 };
      case 'AED':
        return { min: 0, max: 2000000, step: 10000 };
      default:
        return { min: 0, max: 1000000, step: 10000 };
    }
  }
  
  export function formatSalaryForCurrency(value: number, currencyCode: string, symbol: string): string {
    if (currencyCode === 'INR') {
      if (value >= 10000000) return `${symbol}${(value / 10000000).toFixed(1)} Cr`;
      if (value >= 100000) return `${symbol}${(value / 100000).toFixed(1)} L`;
      if (value >= 1000) return `${symbol}${(value / 1000).toFixed(0)}k`;
      return `${symbol}${value}`;
    }
    if (currencyCode === 'JPY') {
      if (value >= 10000000) return `${symbol}${(value / 10000000).toFixed(1)}千万`;
      if (value >= 10000) return `${symbol}${(value / 10000).toFixed(0)}万`;
      return `${symbol}${value}`;
    }
    if (value >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${symbol}${(value / 1000).toFixed(0)}k`;
    return `${symbol}${value}`;
  }
  