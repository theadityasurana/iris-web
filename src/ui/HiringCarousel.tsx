const COMPANIES: { name: string; domain: string }[] = [
  { name: 'Google', domain: 'google.com' },
  { name: 'Microsoft', domain: 'microsoft.com' },
  { name: 'Apple', domain: 'apple.com' },
  { name: 'Amazon', domain: 'amazon.com' },
  { name: 'Meta', domain: 'meta.com' },
  { name: 'Netflix', domain: 'netflix.com' },
  { name: 'Stripe', domain: 'stripe.com' },
  { name: 'Airbnb', domain: 'airbnb.com' },
  { name: 'Uber', domain: 'uber.com' },
  { name: 'Figma', domain: 'figma.com' },
  { name: 'Notion', domain: 'notion.so' },
  { name: 'Snowflake', domain: 'snowflake.com' },
  { name: 'Datadog', domain: 'datadoghq.com' },
  { name: 'Cloudflare', domain: 'cloudflare.com' },
  { name: 'OpenAI', domain: 'openai.com' },
  { name: 'Anthropic', domain: 'anthropic.com' },
  { name: 'Perplexity', domain: 'perplexity.ai' },
  { name: 'Duolingo', domain: 'duolingo.com' },
  { name: 'Ramp', domain: 'ramp.com' },
  { name: 'Rippling', domain: 'rippling.com' },
  { name: 'Robinhood', domain: 'robinhood.com' },
  { name: 'Coinbase', domain: 'coinbase.com' },
  { name: 'Spotify', domain: 'spotify.com' },
  { name: 'Salesforce', domain: 'salesforce.com' },
  { name: 'Adobe', domain: 'adobe.com' },
  { name: 'Nvidia', domain: 'nvidia.com' },
  { name: 'Intel', domain: 'intel.com' },
  { name: 'IBM', domain: 'ibm.com' },
  { name: 'Oracle', domain: 'oracle.com' },
  { name: 'SAP', domain: 'sap.com' },
  { name: 'Shopify', domain: 'shopify.com' },
  { name: 'Twilio', domain: 'twilio.com' },
  { name: 'Okta', domain: 'okta.com' },
  { name: 'Atlassian', domain: 'atlassian.com' },
  { name: 'GitHub', domain: 'github.com' },
  { name: 'GitLab', domain: 'gitlab.com' },
  { name: 'Replit', domain: 'replit.com' },
  { name: 'Supabase', domain: 'supabase.com' },
  { name: 'Vercel', domain: 'vercel.com' },
  { name: 'Linear', domain: 'linear.app' },
  { name: 'Airtable', domain: 'airtable.com' },
  { name: 'Webflow', domain: 'webflow.com' },
  { name: 'HubSpot', domain: 'hubspot.com' },
  { name: 'Calendly', domain: 'calendly.com' },
  { name: 'Postman', domain: 'postman.com' },
  { name: 'Sentry', domain: 'sentry.io' },
  { name: 'Twitch', domain: 'twitch.tv' },
  { name: 'Pinterest', domain: 'pinterest.com' },
  { name: 'DoorDash', domain: 'doordash.com' },
  { name: 'Coursera', domain: 'coursera.org' },
  { name: 'Visa', domain: 'visa.com' },
  { name: 'PayPal', domain: 'paypal.com' },
  { name: 'Binance', domain: 'binance.com' },
  { name: 'Jane Street', domain: 'janestreet.com' },
  { name: 'Palantir', domain: 'palantir.com' },
  { name: 'SpaceX', domain: 'spacex.com' },
  { name: 'Neuralink', domain: 'neuralink.com' },
  { name: 'Anduril', domain: 'anduril.com' },
  { name: 'Groq', domain: 'groq.com' },
  { name: 'ElevenLabs', domain: 'elevenlabs.io' },
];

// Split into 4 roughly equal rows
function chunk<T>(arr: T[], n: number): T[][] {
  const size = Math.ceil(arr.length / n);
  return Array.from({ length: n }, (_, i) => arr.slice(i * size, i * size + size));
}

const ROWS = chunk(COMPANIES, 4);

function logoUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function CarouselRow({ companies, reverse }: { companies: typeof COMPANIES; reverse: boolean }) {
  // Duplicate for seamless loop
  const items = [...companies, ...companies];
  return (
    <div className="hc-row-wrap">
      <div className={`hc-track ${reverse ? 'hc-reverse' : ''}`}>
        {items.map((c, i) => (
          <div key={`${c.domain}-${i}`} className="hc-item">
            <img src={logoUrl(c.domain)} alt={c.name} width={28} height={28} loading="lazy" />
            <span>{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HiringCarousel() {
  return (
    <div className="hc-wrap">
      <p className="hc-label">Our users got hired at these companies</p>
      <div className="hc-rows">
        {ROWS.map((row, i) => (
          <CarouselRow key={i} companies={row} reverse={i % 2 === 1} />
        ))}
      </div>
    </div>
  );
}
