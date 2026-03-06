export type ClothCategory = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory' | 'bag';
export type ClothColor = 'black' | 'white' | 'gray' | 'red' | 'blue' | 'green' | 'yellow' | 'pink' | 'purple' | 'brown' | 'beige' | 'multicolor';
export type ClothSeason = 'spring' | 'summer' | 'autumn' | 'winter' | 'all-season';
export type ClothOccasion = 'daily' | 'work' | 'sport' | 'formal' | 'casual';

export type Cloth = {
  shortCode: string;
  name: string;
  category: ClothCategory;
  colors: ClothColor[];
  seasons: ClothSeason[];
  occasions: ClothOccasion[];
  description: string | null;
  imageUrl: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
};

export type ClothFilters = {
  category?: ClothCategory;
  colors?: ClothColor[];
  seasons?: ClothSeason[];
  occasions?: ClothOccasion[];
  q?: string;
};

// ── Weather ──────────────────────────────────────────────────────────────────

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy';

export type WeatherData = {
  temperature: number; // celsius
  condition: WeatherCondition;
};

// ── AI Analyze ───────────────────────────────────────────────────────────────

export type AnalyzeResult = {
  category: ClothCategory;
  colors: ClothColor[];
  suggestedName: string;
};

// ── Outfit Recommendation ─────────────────────────────────────────────────────

export type OutfitItemRole = 'top' | 'bottom' | 'outerwear' | 'shoes' | 'accessory';

export type OutfitItem = {
  shortCode: string;
  role: OutfitItemRole;
};

export type OutfitRecommendation = {
  label: string;
  items: OutfitItem[];
};

// ── Weather fetch (real — Open-Meteo, no key required) ───────────────────────

function wmoToCondition(code: number): WeatherCondition {
  if (code === 0) return 'sunny';
  if (code <= 3) return 'cloudy';
  if (code <= 48) return 'cloudy'; // fog/haze
  if (code <= 67) return 'rainy';
  if (code <= 77) return 'snowy';
  if (code <= 82) return 'rainy';
  if (code <= 86) return 'snowy';
  return 'stormy';
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Weather fetch failed');
  const data = (await res.json()) as {
    current: { temperature_2m: number; weather_code: number };
  };
  return {
    temperature: Math.round(data.current.temperature_2m),
    condition: wmoToCondition(data.current.weather_code),
  };
}

// ── Mock: analyze clothing image ──────────────────────────────────────────────
// Replace this with real POST /v1/clothes/analyze call in Phase 2

export async function analyzeCloth(_image: File): Promise<AnalyzeResult> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return {
    category: 'top',
    colors: ['white', 'beige'],
    suggestedName: '白色休闲上衣',
  };
}

// ── Mock: weather-based outfit recommendation ─────────────────────────────────
// Replace with real POST /v1/outfits/recommend call in Phase 2

export async function recommendOutfits(
  _weather: WeatherData,
  items: Cloth[],
): Promise<OutfitRecommendation[]> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Pick first available item of each role for demo purposes
  const top = items.find((c) => c.category === 'top');
  const bottom = items.find((c) => c.category === 'bottom');
  const outerwear = items.find((c) => c.category === 'outerwear');
  const shoes = items.find((c) => c.category === 'shoes');

  const outfit1: OutfitItem[] = [
    ...(top ? [{ shortCode: top.shortCode, role: 'top' as OutfitItemRole }] : []),
    ...(bottom ? [{ shortCode: bottom.shortCode, role: 'bottom' as OutfitItemRole }] : []),
    ...(outerwear ? [{ shortCode: outerwear.shortCode, role: 'outerwear' as OutfitItemRole }] : []),
    ...(shoes ? [{ shortCode: shoes.shortCode, role: 'shoes' as OutfitItemRole }] : []),
  ];

  const outfit2: OutfitItem[] = [
    ...(bottom ? [{ shortCode: bottom.shortCode, role: 'bottom' as OutfitItemRole }] : []),
    ...(top ? [{ shortCode: top.shortCode, role: 'top' as OutfitItemRole }] : []),
    ...(shoes ? [{ shortCode: shoes.shortCode, role: 'shoes' as OutfitItemRole }] : []),
  ];

  const results: OutfitRecommendation[] = [];
  if (outfit1.length >= 2) results.push({ label: '今日通勤', items: outfit1 });
  if (outfit2.length >= 2) results.push({ label: '周末休闲', items: outfit2 });
  return results;
}

const baseUrl = (process.env.NEXT_PUBLIC_CONTENT_API_BASE_URL || process.env.CONTENT_API_BASE_URL || 'http://localhost:4001').replace(/\/$/, '');

export async function fetchClothes(filters: ClothFilters): Promise<Cloth[]> {
  const query = new URLSearchParams();
  if (filters.category) query.set('category', filters.category);
  if (filters.colors && filters.colors.length > 0) query.set('colors', filters.colors.join(','));
  if (filters.seasons && filters.seasons.length > 0) query.set('seasons', filters.seasons.join(','));
  if (filters.occasions && filters.occasions.length > 0) query.set('occasions', filters.occasions.join(','));
  if (filters.q?.trim()) query.set('q', filters.q.trim());

  const endpoint = `${baseUrl}/v1/clothes?${query.toString()}`;
  const response = await fetch(endpoint, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch clothes');
  }

  const payload = (await response.json()) as { items?: Cloth[] };
  return payload.items || [];
}
