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
