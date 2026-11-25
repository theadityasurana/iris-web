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
  { name: 'Shopify', domain: 'shopify.com' },
  { name: 'Twilio', domain: 'twilio.com' },
  { name: 'Okta', domain: 'okta.com' },
  { name: 'Atlassian', domain: 'atlassian.com' },
  { name: 'GitHub', domain: 'github.com' },
  { name: 'Replit', domain: 'replit.com' },
  { name: 'Vercel', domain: 'vercel.com' },
  { name: 'Linear', domain: 'linear.app' },
  { name: 'Airtable', domain: 'airtable.com' },
  { name: 'Webflow', domain: 'webflow.com' },
  { name: 'HubSpot', domain: 'hubspot.com' },
  { name: 'Sentry', domain: 'sentry.io' },
  { name: 'Twitch', domain: 'twitch.tv' },
  { name: 'Pinterest', domain: 'pinterest.com' },
  { name: 'DoorDash', domain: 'doordash.com' },
  { name: 'Coursera', domain: 'coursera.org' },
  { name: 'Visa', domain: 'visa.com' },
  { name: 'PayPal', domain: 'paypal.com' },
  { name: 'Palantir', domain: 'palantir.com' },
  { name: 'SpaceX', domain: 'spacex.com' },
  { name: 'Anduril', domain: 'anduril.com' },
  { name: 'Groq', domain: 'groq.com' },
  { name: 'ElevenLabs', domain: 'elevenlabs.io' },
  { name: 'Supabase', domain: 'supabase.com' },
  { name: 'GitLab', domain: 'gitlab.com' },
  { name: 'Calendly', domain: 'calendly.com' },
  { name: 'Postman', domain: 'postman.com' },
  { name: 'Binance', domain: 'binance.com' },
  { name: 'Jane Street', domain: 'janestreet.com' },
  { name: 'Neuralink', domain: 'neuralink.com' },
  { name: 'IBM', domain: 'ibm.com' },
  { name: 'Oracle', domain: 'oracle.com' },
  { name: 'SAP', domain: 'sap.com' },
  { name: 'Intel', domain: 'intel.com' },
];

function chunk<T>(arr: T[], n: number): T[][] {
  const size = Math.ceil(arr.length / n);
  return Array.from({ length: n }, (_, i) => arr.slice(i * size, i * size + size));
}

const ROWS = chunk(COMPANIES, 4);
const SPEEDS = ['38s', '44s', '40s', '42s'];

function logoUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function CarouselRow({ companies, reverse, speed }: { companies: typeof COMPANIES; reverse: boolean; speed: string }) {
  const items = [...companies, ...companies];
  return (
    <div className="hc-row">
      <div className="hc-track" style={{ animationDuration: speed, animationDirection: reverse ? 'reverse' : 'normal' }}>
        {items.map((c, i) => (
          <span key={`${c.domain}-${i}`} className="hc-item">
            <img src={logoUrl(c.domain)} alt="" width={16} height={16} loading="lazy" />
            {c.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HiringCarousel() {
  return (
    <div className="hc-wrap">
      <p className="hc-eyebrow">Iris users have been hired at</p>
      <div className="hc-rows">
        {ROWS.map((row, i) => (
          <CarouselRow key={i} companies={row} reverse={i % 2 === 1} speed={SPEEDS[i]} />
        ))}
      </div>
    </div>
  );
}
