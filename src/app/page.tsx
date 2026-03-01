'use client';

import { useEffect, useMemo, useState } from 'react';
import ClothCard from '@/components/ClothCard';
import FilterBar from '@/components/FilterBar';
import {
  type Cloth,
  type ClothCategory,
  type ClothColor,
  type ClothOccasion,
  type ClothSeason,
  fetchClothes,
} from '@/lib/api';

const CATEGORY_OPTIONS: Array<{ value: ClothCategory; label: string }> = [
  { value: 'top', label: '上衣' },
  { value: 'bottom', label: '裤子' },
  { value: 'dress', label: '裙子' },
  { value: 'outerwear', label: '外套' },
  { value: 'shoes', label: '鞋子' },
  { value: 'accessory', label: '配饰' },
  { value: 'bag', label: '包包' },
];

const COLOR_OPTIONS: Array<{ value: ClothColor; label: string }> = [
  { value: 'black', label: '黑' },
  { value: 'white', label: '白' },
  { value: 'gray', label: '灰' },
  { value: 'red', label: '红' },
  { value: 'blue', label: '蓝' },
  { value: 'green', label: '绿' },
  { value: 'yellow', label: '黄' },
  { value: 'pink', label: '粉' },
  { value: 'purple', label: '紫' },
  { value: 'brown', label: '棕' },
  { value: 'beige', label: '米色' },
  { value: 'multicolor', label: '花色' },
];

const SEASON_OPTIONS: Array<{ value: ClothSeason; label: string }> = [
  { value: 'spring', label: '春' },
  { value: 'summer', label: '夏' },
  { value: 'autumn', label: '秋' },
  { value: 'winter', label: '冬' },
  { value: 'all-season', label: '四季' },
];

const OCCASION_OPTIONS: Array<{ value: ClothOccasion; label: string }> = [
  { value: 'daily', label: '日常' },
  { value: 'work', label: '工作' },
  { value: 'sport', label: '运动' },
  { value: 'formal', label: '正式' },
  { value: 'casual', label: '休闲' },
];

const CATEGORY_LABELS = Object.fromEntries(CATEGORY_OPTIONS.map((option) => [option.value, option.label])) as Record<
  ClothCategory,
  string
>;
const COLOR_LABELS = Object.fromEntries(COLOR_OPTIONS.map((option) => [option.value, option.label])) as Record<ClothColor, string>;
const SEASON_LABELS = Object.fromEntries(SEASON_OPTIONS.map((option) => [option.value, option.label])) as Record<
  ClothSeason,
  string
>;
const OCCASION_LABELS = Object.fromEntries(OCCASION_OPTIONS.map((option) => [option.value, option.label])) as Record<
  ClothOccasion,
  string
>;

export default function Home() {
  const [category, setCategory] = useState<ClothCategory | undefined>(undefined);
  const [colors, setColors] = useState<ClothColor[]>([]);
  const [seasons, setSeasons] = useState<ClothSeason[]>([]);
  const [occasions, setOccasions] = useState<ClothOccasion[]>([]);
  const [searchText, setSearchText] = useState('');

  const [items, setItems] = useState<Cloth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      category,
      colors,
      seasons,
      occasions,
      q: searchText,
    }),
    [category, colors, seasons, occasions, searchText],
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchClothes(filters);
        if (!cancelled) {
          setItems(data);
        }
      } catch {
        if (!cancelled) {
          setError('加载衣柜失败，请检查 API 服务和 Tunnel。');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  return (
    <main className="closet-page">
      <header className="closet-header">
        <p className="eyebrow">Glimmer Closet</p>
        <h1>智能衣柜</h1>
        <p className="subtitle">通过 WhatsApp 上传，自动归档你的每一件衣服。</p>
      </header>

      <FilterBar
        categoryOptions={CATEGORY_OPTIONS}
        colorOptions={COLOR_OPTIONS}
        seasonOptions={SEASON_OPTIONS}
        occasionOptions={OCCASION_OPTIONS}
        selectedCategory={category}
        selectedColors={colors}
        selectedSeasons={seasons}
        selectedOccasions={occasions}
        searchText={searchText}
        onCategoryChange={setCategory}
        onSearchChange={setSearchText}
        onToggleColor={(value) => setColors((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))}
        onToggleSeason={(value) => setSeasons((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))}
        onToggleOccasion={(value) =>
          setOccasions((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
        }
        onReset={() => {
          setCategory(undefined);
          setColors([]);
          setSeasons([]);
          setOccasions([]);
          setSearchText('');
        }}
      />

      {loading && <p className="state-text">正在加载衣柜...</p>}
      {error && <p className="state-text state-error">{error}</p>}

      {!loading && !error && (
        <section className="closet-grid">
          {items.length === 0 && <p className="state-text">没有匹配的衣服，试试调整筛选条件。</p>}
          {items.map((cloth) => (
            <ClothCard
              key={cloth.shortCode}
              cloth={cloth}
              categoryLabel={CATEGORY_LABELS[cloth.category]}
              colorLabels={cloth.colors.map((color) => COLOR_LABELS[color])}
              seasonLabels={cloth.seasons.map((season) => SEASON_LABELS[season])}
              occasionLabels={cloth.occasions.map((occasion) => OCCASION_LABELS[occasion])}
            />
          ))}
        </section>
      )}
    </main>
  );
}
