'use client';

import type { ClothCategory, ClothColor, ClothOccasion, ClothSeason } from '@/lib/api';

type Option<T extends string> = {
  value: T;
  label: string;
};

type FilterBarProps = {
  categoryOptions: Option<ClothCategory>[];
  colorOptions: Option<ClothColor>[];
  seasonOptions: Option<ClothSeason>[];
  occasionOptions: Option<ClothOccasion>[];
  selectedCategory?: ClothCategory;
  selectedColors: ClothColor[];
  selectedSeasons: ClothSeason[];
  selectedOccasions: ClothOccasion[];
  searchText: string;
  activeFiltersCount: number;
  onCategoryChange: (value?: ClothCategory) => void;
  onToggleColor: (value: ClothColor) => void;
  onToggleSeason: (value: ClothSeason) => void;
  onToggleOccasion: (value: ClothOccasion) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
};

// Clean color palette
const colorDotMap: Record<string, string> = {
  black: '#1a1a1a',
  white: '#ffffff',
  gray: '#8e8e93',
  red: '#ff3b30',
  blue: '#007aff',
  green: '#34c759',
  yellow: '#ffcc00',
  pink: '#ff2d55',
  purple: '#af52de',
  brown: '#a2845e',
  beige: '#e5d4b8',
  multicolor: 'conic-gradient(from 0deg, #ff3b30, #ffcc00, #34c759, #007aff, #af52de, #ff3b30)',
};

const colorCodeMap: Record<string, string> = {
  黑: 'black',
  白: 'white',
  灰: 'gray',
  红: 'red',
  蓝: 'blue',
  绿: 'green',
  黄: 'yellow',
  粉: 'pink',
  紫: 'purple',
  棕: 'brown',
  米色: 'beige',
  花色: 'multicolor',
};

export default function FilterBar(props: FilterBarProps) {
  const {
    categoryOptions,
    colorOptions,
    seasonOptions,
    occasionOptions,
    selectedCategory,
    selectedColors,
    selectedSeasons,
    selectedOccasions,
    searchText,
    activeFiltersCount,
    onCategoryChange,
    onToggleColor,
    onToggleSeason,
    onToggleOccasion,
    onSearchChange,
    onReset,
  } = props;

  const getColorDotStyle = (label: string) => {
    const colorKey = colorCodeMap[label];
    const color = colorDotMap[colorKey] || '#ccc';
    const isLight = ['白', '米色'].includes(label);
    return {
      background: color,
      border: isLight ? '1px solid rgba(0,0,0,0.15)' : 'none',
      boxShadow: isLight ? 'inset 0 0 0 1px rgba(0,0,0,0.05)' : 'none',
    };
  };

  return (
    <section className="filter-bar">
      <div className="filter-top-row">
        <input
          type="text"
          value={searchText}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="搜索衣服..."
          className="search-input"
        />
        <button type="button" className="reset-btn" onClick={onReset}>
          {activeFiltersCount > 0 ? `清空 (${activeFiltersCount})` : '清空筛选'}
        </button>
      </div>

      <div className="filter-sections">
        <div className="filter-section">
          <span className="filter-label">分类</span>
          <div className="option-wrap">
            <button
              type="button"
              className={`tag-btn ${selectedCategory ? '' : 'active'}`}
              onClick={() => onCategoryChange(undefined)}
            >
              全部
            </button>
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`tag-btn ${selectedCategory === option.value ? 'active' : ''}`}
                onClick={() => onCategoryChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <span className="filter-label">颜色</span>
          <div className="option-wrap">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`tag-btn ${selectedColors.includes(option.value) ? 'active' : ''}`}
                onClick={() => onToggleColor(option.value)}
              >
                <span className="color-dot" style={getColorDotStyle(option.label)} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <span className="filter-label">季节</span>
          <div className="option-wrap">
            {seasonOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`tag-btn ${selectedSeasons.includes(option.value) ? 'active' : ''}`}
                onClick={() => onToggleSeason(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <span className="filter-label">场合</span>
          <div className="option-wrap">
            {occasionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`tag-btn ${selectedOccasions.includes(option.value) ? 'active' : ''}`}
                onClick={() => onToggleOccasion(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
