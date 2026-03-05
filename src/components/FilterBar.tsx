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

// 颜色映射表 - 使用莫兰迪色系
const colorDotMap: Record<string, string> = {
  'black': '#2d2d2d',
  'white': '#f8f8f8',
  'gray': '#9a9a9a',
  'red': '#c97b7b',
  'blue': '#7b9ac9',
  'green': '#8fb89a',
  'yellow': '#e6d29a',
  'pink': '#e6b8c7',
  'purple': '#b8a8c9',
  'brown': '#a89080',
  'beige': '#e8dcc8',
  'multicolor': 'linear-gradient(45deg, #e6b8c7, #b8a8c9, #e6d29a)',
};

// 颜色代码映射
const colorCodeMap: Record<string, string> = {
  '黑': 'black',
  '白': 'white',
  '灰': 'gray',
  '红': 'red',
  '蓝': 'blue',
  '绿': 'green',
  '黄': 'yellow',
  '粉': 'pink',
  '紫': 'purple',
  '棕': 'brown',
  '米色': 'beige',
  '花色': 'multicolor',
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

  const getColorDotStyle = (label: string) => {
    const colorKey = colorCodeMap[label];
    const color = colorDotMap[colorKey] || '#ccc';
    return {
      background: color,
      border: ['白', '米色'].includes(label) ? '1.5px solid #ddd' : '1.5px solid rgba(0,0,0,0.1)',
    };
  };

  return (
    <section className="filter-bar">
      <div className="filter-top-row">
        <input
          type="text"
          value={searchText}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="搜索衣服名称或备注..."
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
              <span 
                className="color-dot" 
                style={getColorDotStyle(option.label)}
              />
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
