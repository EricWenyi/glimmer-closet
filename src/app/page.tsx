'use client';

import { useEffect, useMemo, useState } from 'react';
import ClothCard from '@/components/ClothCard';
import FilterBar from '@/components/FilterBar';
import UploadModal from '@/components/UploadModal';
import TodaysLookTab from '@/components/TodaysLookTab';
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

  type Tab = 'closet' | 'today';
  const [activeTab, setActiveTab] = useState<Tab>('closet');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
    [category, colors, seasons, occasions, searchText]
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
          setError('加载失败，请检查网络连接');
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
  }, [filters, refreshKey]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (category) count++;
    count += colors.length;
    count += seasons.length;
    count += occasions.length;
    return count;
  }, [category, colors, seasons, occasions]);

  return (
    <main className="closet-page">
      <header className="closet-header">
        <h1>Glimmer Closet</h1>
        <p className="subtitle">智能衣柜 · 轻松管理每一件衣服</p>
      </header>

      {/* Tab bar */}
      <div className="tab-bar">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'closet' ? 'active' : ''}`}
          onClick={() => setActiveTab('closet')}
        >
          我的衣橱
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          今日穿搭
        </button>
      </div>

      {/* My Closet tab */}
      {activeTab === 'closet' && (
        <>
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
            activeFiltersCount={activeFiltersCount}
            onCategoryChange={setCategory}
            onSearchChange={setSearchText}
            onToggleColor={(value) =>
              setColors((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
            }
            onToggleSeason={(value) =>
              setSeasons((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
            }
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

          <div className="results-count">
            {loading ? (
              '加载中...'
            ) : error ? null : (
              <>
                共 <span>{items.length}</span> 件衣物
              </>
            )}
          </div>

          <section className="closet-grid">
            {loading ? (
              <>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-image" />
                    <div className="skeleton-content">
                      <div className="skeleton-line short" />
                      <div className="skeleton-line" />
                    </div>
                  </div>
                ))}
              </>
            ) : error ? (
              <div className="state-text state-error">{error}</div>
            ) : items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👗</div>
                <h3>还没有找到衣物</h3>
                <p>点击右下角 + 按钮上传新衣服</p>
              </div>
            ) : (
              items.map((cloth) => (
                <ClothCard
                  key={cloth.shortCode}
                  cloth={cloth}
                  categoryLabel={CATEGORY_LABELS[cloth.category]}
                  colorLabels={cloth.colors.map((color) => COLOR_LABELS[color])}
                  seasonLabels={cloth.seasons.map((season) => SEASON_LABELS[season])}
                  occasionLabels={cloth.occasions.map((occasion) => OCCASION_LABELS[occasion])}
                />
              ))
            )}
          </section>
        </>
      )}

      {activeTab === 'today' && <TodaysLookTab />}

      {/* Upload FAB */}
      <button
        type="button"
        className="upload-fab"
        onClick={() => setUploadOpen(true)}
        aria-label="上传新衣服"
      >
        +
      </button>

      {/* Upload Modal */}
      {uploadOpen && (
        <>
          <div className="modal-backdrop" onClick={() => setUploadOpen(false)} />
          <UploadModal
            onClose={() => setUploadOpen(false)}
            onUploaded={() => {
              // Re-trigger the wardrobe fetch by bumping a counter
              setRefreshKey((k) => k + 1);
            }}
          />
        </>
      )}
    </main>
  );
}
