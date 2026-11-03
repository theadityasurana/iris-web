import { supabase } from './supabase';
import { majorCities } from '@/constants/onboarding';
import * as Location from 'expo-location';

/** A selectable location, always stored as `label` ("City, Country"). */
export interface PlaceSuggestion {
  label: string;
  /** State / region, shown to tell same-named cities apart; never stored. */
  region?: string;
}

const remoteCache = new Map<string, PlaceSuggestion[]>();

/** Instant matches from the built-in list of major cities (works offline). */
export function localPlaceMatches(query: string, limit = 6): PlaceSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return majorCities.slice(0, limit).map(label => ({ label }));
  const starts = majorCities.filter(c => c.toLowerCase().startsWith(q));
  const contains = majorCities.filter(c => !c.toLowerCase().startsWith(q) && c.toLowerCase().includes(q));
  return [...starts, ...contains].slice(0, limit).map(label => ({ label }));
}

/**
 * Worldwide city suggestions via the place-search edge function (Photon /
 * OpenStreetMap, normalised to "City, Country" server-side). Cached per
 * query for the session; returns [] on any failure so callers fall back to
 * the local list.
 */
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hit = remoteCache.get(q);
  if (hit) return hit;
  try {
    const { data, error } = await supabase.functions.invoke('place-search', { body: { q } });
    if (error || !Array.isArray(data?.places)) return [];
    const places: PlaceSuggestion[] = data.places.map((p: any) => ({ label: String(p.label), region: p.region || undefined }));
    remoteCache.set(q, places);
    return places;
  } catch {
    return [];
  }
}

/** Local matches first (instant, familiar names like "Bangalore"), then remote, de-duplicated. */
export function mergePlaces(local: PlaceSuggestion[], remote: PlaceSuggestion[], limit = 10): PlaceSuggestion[] {
  const seen = new Set(local.map(p => p.label.toLowerCase()));
  return [...local, ...remote.filter(p => !seen.has(p.label.toLowerCase()))].slice(0, limit);
}

// Local names people know, for what the OS geocoder returns.
const CITY_ALIASES: Record<string, string> = { bengaluru: 'Bangalore', gurgaon: 'Gurugram', 'new delhi': 'Delhi', bombay: 'Mumbai' };

export type DetectCityResult =
  | { ok: true; place: PlaceSuggestion }
  | { ok: false; reason: 'denied' | 'unavailable' };

/**
 * The user's current city as "City, Country", from one coarse location fix
 * reverse-geocoded on the device. Asks for when-in-use permission; never
 * tracks. Prefers the built-in city list's spelling ("Bangalore, India") so
 * it matches what search shows.
 */
export async function detectCurrentCity(): Promise<DetectCityResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { ok: false, reason: 'denied' };
    const pos = await Location.getLastKnownPositionAsync({ maxAge: 30 * 60 * 1000 })
      ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    if (!pos) return { ok: false, reason: 'unavailable' };
    const [geo] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    const rawCity = geo?.city || geo?.subregion || geo?.district || geo?.region;
    if (!rawCity || !geo?.country) return { ok: false, reason: 'unavailable' };
    const city = CITY_ALIASES[rawCity.toLowerCase()] ?? rawCity;
    const known = majorCities.find(c => c.toLowerCase().startsWith(`${city.toLowerCase()},`));
    return { ok: true, place: { label: known ?? `${city}, ${geo.country}`, region: geo.region ?? undefined } };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
