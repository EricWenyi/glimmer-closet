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
  onCategoryChange: (value?: ClothCategory) => void;
  onToggleColor: (value: ClothColor) => void;
  onToggleSeason: (value: ClothSeason) => void;
  onToggleOccasion: (value: ClothOccasion) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
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
    onCategoryChange,
    onToggleColor,
    onToggleSeason,
    onToggleOccasion,
    onSearchChange,
    onReset,
  } = props;

  return (
    <section className="filter-bar">
      <div className="filter-top-row">
        <input
          type="text"
          value={searchText}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="搜索衣服名称或备注"
          className="search-input"
        />
        <button type="button" className="reset-btn" onClick={onReset}>清空筛选</button>
      </div>

      <div className="filter-section">
        <p>分类</p>
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
        <p>颜色</p>
        <div className="option-wrap">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`tag-btn ${selectedColors.includes(option.value) ? 'active' : ''}`}
              onClick={() => onToggleColor(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <p>季节</p>
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
        <p>场合</p>
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
    </section>
  );
}
