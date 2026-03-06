# Upload & Recommendation Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add AI-assisted clothing upload (image → Kimi 2.5 auto-fills category/colors) and weather-based outfit recommendations ("Today's Look" tab), frontend-first with mocked AI responses.

**Architecture:** Frontend-first approach — mock `analyzeCloth` and `recommendOutfits` functions return hardcoded data while the full UI is built. Real backend endpoints wired later. Weather data is real (Open-Meteo, free, no key). Upload proxied via a Next.js API route to keep the admin token server-side.

**Tech Stack:** Next.js 15 (App Router), TypeScript, CSS variables (globals.css — no Tailwind utilities in use), Open-Meteo REST API, existing Express backend at `NEXT_PUBLIC_CONTENT_API_BASE_URL`.

---

## Codebase Orientation

- `src/app/page.tsx` — main page, owns all state, renders FilterBar + closet grid
- `src/components/ClothCard.tsx` — displays one clothing item
- `src/components/FilterBar.tsx` — filter controls (category, color, season, occasion chips)
- `src/lib/api.ts` — all API functions + shared types (`Cloth`, `ClothCategory`, etc.)
- `src/app/globals.css` — all styles via CSS variables (Apple-style design system); add new styles here
- `backend/src/index.ts` — Express API (DO NOT modify in this plan — backend wiring is Phase 2)

CSS design system variables (already defined in globals.css):
```
--primary, --bg-primary/secondary/tertiary, --text-primary/secondary/tertiary
--border, --shadow-sm/md/lg, --radius-sm/md/lg/xl/full
--accent-blue/green/orange/pink, --success, --error
```

---

## Task 1: Add new types and mock/real API functions to `src/lib/api.ts`

**Files:**
- Modify: `src/lib/api.ts`

**Step 1: Add new types after existing type exports**

Add to `src/lib/api.ts` after line 26 (after the `ClothFilters` type):

```typescript
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
```

**Step 2: Add `fetchWeather` (real — calls Open-Meteo)**

Add after the new types:

```typescript
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
```

**Step 3: Add `analyzeCloth` (mock)**

```typescript
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
```

**Step 4: Add `recommendOutfits` (mock)**

```typescript
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
```

**Step 5: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add weather, analyze, recommend types and mock API functions"
```

---

## Task 2: Add Next.js API route for proxying clothing upload

The admin token must not be in browser JS. A Next.js route handler reads it from the server environment and forwards to the backend.

**Files:**
- Create: `src/app/api/upload/route.ts`

**Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from 'next/server';

const backendBase = (
  process.env.CONTENT_API_BASE_URL ||
  process.env.NEXT_PUBLIC_CONTENT_API_BASE_URL ||
  'http://localhost:4001'
).replace(/\/$/, '');

const adminToken = process.env.ADMIN_TOKEN;

export async function POST(req: NextRequest) {
  if (!adminToken) {
    return NextResponse.json({ error: 'ADMIN_TOKEN not configured' }, { status: 500 });
  }

  // Forward the multipart form data as-is to the backend
  const formData = await req.formData();
  const res = await fetch(`${backendBase}/v1/clothes/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });

  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}
```

**Step 2: Add `ADMIN_TOKEN` to your `.env.local`**

```
ADMIN_TOKEN=change_me
```

(Match the value in `backend/.env` or compose.yml.)

**Step 3: Commit**

```bash
git add src/app/api/upload/route.ts
git commit -m "feat: add server-side upload proxy route"
```

---

## Task 3: Add tab bar + FAB scaffold to `src/app/page.tsx`

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Add `activeTab` state at top of the `Home` component**

After line 71 (`const [occasions, setOccasions]...`), add:

```typescript
type Tab = 'closet' | 'today';
const [activeTab, setActiveTab] = useState<Tab>('closet');
const [uploadOpen, setUploadOpen] = useState(false);
```

**Step 2: Replace the `<main>` JSX**

Replace the entire `return (...)` block with:

```tsx
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

    {/* Today's Look tab — placeholder, wired in Task 7 */}
    {activeTab === 'today' && (
      <div className="state-text">今日穿搭功能加载中...</div>
    )}

    {/* Upload FAB */}
    <button
      type="button"
      className="upload-fab"
      onClick={() => setUploadOpen(true)}
      aria-label="上传新衣服"
    >
      +
    </button>

    {/* Upload Modal — wired in Task 5 */}
    {uploadOpen && (
      <div className="modal-backdrop" onClick={() => setUploadOpen(false)} />
    )}
  </main>
);
```

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add tab bar and upload FAB scaffold"
```

---

## Task 4: Add CSS for tab bar and FAB

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Append these styles to the end of globals.css**

```css
/* ── Tab Bar ─────────────────────────────────────────────────────────────── */

.tab-bar {
  display: flex;
  gap: 4px;
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: 6px;
  box-shadow: var(--shadow-md);
  margin-bottom: 28px;
  width: fit-content;
}

.tab-btn {
  height: 40px;
  padding: 0 24px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.tab-btn.active {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

/* ── Upload FAB ──────────────────────────────────────────────────────────── */

.upload-fab {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  font-size: 28px;
  font-weight: 300;
  color: #fff;
  background: var(--primary);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.4);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.upload-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(0, 122, 255, 0.5);
}

.upload-fab:active {
  transform: scale(0.96);
}

/* ── Modal Backdrop ──────────────────────────────────────────────────────── */

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  backdrop-filter: blur(4px);
}
```

**Step 2: Open browser at `http://localhost:3001` and verify:**
- Two tabs render correctly, switching between them works
- FAB button shows bottom-right
- Clicking FAB shows the backdrop

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add CSS for tab bar, FAB, and modal backdrop"
```

---

## Task 5: Build the UploadModal component

**Files:**
- Create: `src/components/UploadModal.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  type AnalyzeResult,
  type ClothCategory,
  type ClothColor,
  type ClothOccasion,
  type ClothSeason,
  analyzeCloth,
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

type Props = {
  onClose: () => void;
  onUploaded: () => void; // called after successful save, so parent can refresh
};

type Step = 'pick' | 'analyzing' | 'confirm' | 'saving' | 'done';

export default function UploadModal({ onClose, onUploaded }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('pick');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Step 2 form state — seeded from AI result
  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClothCategory>('top');
  const [selectedColors, setSelectedColors] = useState<ClothColor[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<ClothSeason[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<ClothOccasion[]>([]);

  function handleFileChange(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setAnalyzeError(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFileChange(file);
  }

  async function handleAnalyze() {
    if (!imageFile) return;
    setStep('analyzing');
    setAnalyzeError(null);
    try {
      const result: AnalyzeResult = await analyzeCloth(imageFile);
      setName(result.suggestedName);
      setSelectedCategory(result.category);
      setSelectedColors(result.colors);
      setSelectedSeasons([]);
      setSelectedOccasions([]);
      setStep('confirm');
    } catch {
      setAnalyzeError('分析失败，请重试');
      setStep('pick');
    }
  }

  function toggleColor(value: ClothColor) {
    setSelectedColors((prev) => (prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]));
  }

  function toggleSeason(value: ClothSeason) {
    setSelectedSeasons((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));
  }

  function toggleOccasion(value: ClothOccasion) {
    setSelectedOccasions((prev) => (prev.includes(value) ? prev.filter((o) => o !== value) : [...prev, value]));
  }

  async function handleSave() {
    if (!imageFile || !name.trim()) return;
    setStep('saving');
    setSaveError(null);

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('name', name.trim());
    formData.append('category', selectedCategory);
    formData.append('colors', selectedColors.join(','));
    formData.append('seasons', selectedSeasons.join(','));
    formData.append('occasions', selectedOccasions.join(','));
    formData.append('status', 'published');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error || '上传失败');
      }
      setStep('done');
      setTimeout(() => {
        onUploaded();
        onClose();
      }, 800);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '上传失败，请重试');
      setStep('confirm');
    }
  }

  return (
    <div className="modal-sheet" role="dialog" aria-modal="true">
      <div className="modal-header">
        <span className="modal-title">
          {step === 'confirm' || step === 'saving' || step === 'done' ? '确认衣物信息' : '上传新衣物'}
        </span>
        <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
          ✕
        </button>
      </div>

      {/* Step 1: Pick image */}
      {(step === 'pick' || step === 'analyzing') && (
        <div className="modal-body">
          <div
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <div className="drop-preview-wrap">
                <Image src={imagePreview} alt="preview" fill className="drop-preview-img" unoptimized />
              </div>
            ) : (
              <>
                <span className="drop-icon">📷</span>
                <p className="drop-hint">拖入图片或点击选择</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="visually-hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileChange(f);
            }}
          />
          {analyzeError && <p className="form-error">{analyzeError}</p>}
          <button
            type="button"
            className="primary-btn"
            disabled={!imageFile || step === 'analyzing'}
            onClick={handleAnalyze}
          >
            {step === 'analyzing' ? '分析中...' : 'AI 识别衣物 →'}
          </button>
        </div>
      )}

      {/* Step 2: Confirm form */}
      {(step === 'confirm' || step === 'saving' || step === 'done') && (
        <div className="modal-body">
          {imagePreview && (
            <div className="confirm-thumb-wrap">
              <Image src={imagePreview} alt="preview" fill className="confirm-thumb-img" unoptimized />
            </div>
          )}

          <div className="form-field">
            <label className="form-label">名称</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="衣物名称"
            />
          </div>

          <div className="form-field">
            <label className="form-label">分类</label>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ClothCategory)}
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">颜色</label>
            <div className="chip-picker">
              {COLOR_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`tag-btn ${selectedColors.includes(o.value) ? 'active' : ''}`}
                  onClick={() => toggleColor(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">季节</label>
            <div className="chip-picker">
              {SEASON_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`tag-btn ${selectedSeasons.includes(o.value) ? 'active' : ''}`}
                  onClick={() => toggleSeason(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">场合</label>
            <div className="chip-picker">
              {OCCASION_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`tag-btn ${selectedOccasions.includes(o.value) ? 'active' : ''}`}
                  onClick={() => toggleOccasion(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {saveError && <p className="form-error">{saveError}</p>}

          <div className="modal-footer-row">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setStep('pick')}
              disabled={step === 'saving'}
            >
              ← 重新选图
            </button>
            <button
              type="button"
              className="primary-btn"
              disabled={!name.trim() || step === 'saving' || step === 'done'}
              onClick={handleSave}
            >
              {step === 'saving' ? '保存中...' : step === 'done' ? '✓ 已保存' : '保存到衣橱'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/UploadModal.tsx
git commit -m "feat: add UploadModal component with AI analyze + confirm steps"
```

---

## Task 6: Wire UploadModal into `src/app/page.tsx`

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Add import at top of file**

```typescript
import UploadModal from '@/components/UploadModal';
```

**Step 2: Replace the placeholder modal section**

Find this block in the return JSX (added in Task 3):
```tsx
    {/* Upload Modal — wired in Task 5 */}
    {uploadOpen && (
      <div className="modal-backdrop" onClick={() => setUploadOpen(false)} />
    )}
```

Replace with:
```tsx
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
```

**Step 3: Add `refreshKey` state to force re-fetch after upload**

Add after the `uploadOpen` state:
```typescript
const [refreshKey, setRefreshKey] = useState(0);
```

**Step 4: Add `refreshKey` to the `useEffect` dependency array**

Find the existing `useEffect` that calls `fetchClothes`. Its dependency is `[filters]`. Change to:
```typescript
}, [filters, refreshKey]);
```

**Step 5: Verify in browser**
- Click FAB → modal opens with drop zone
- Drop an image → preview shows
- Click "AI 识别衣物 →" → spinner for ~1.2s → Step 2 form appears with pre-filled data
- Edit fields → click "保存到衣橱" → calls `/api/upload` → modal closes

**Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: wire UploadModal into main page with FAB trigger"
```

---

## Task 7: Add CSS for UploadModal

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Append to end of globals.css**

```css
/* ── Upload Modal Sheet ──────────────────────────────────────────────────── */

.modal-sheet {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--bg-primary);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: var(--shadow-xl);
  z-index: 300;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from { transform: translateX(-50%) translateY(100%); }
  to   { transform: translateX(-50%) translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  width: 32px;
  height: 32px;
  font-size: 16px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.modal-close:hover {
  background: var(--border);
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Drop zone */
.drop-zone {
  height: 200px;
  border: 2px dashed var(--border);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  position: relative;
  overflow: hidden;
}

.drop-zone:hover {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.drop-icon {
  font-size: 40px;
}

.drop-hint {
  font-size: 15px;
  color: var(--text-secondary);
}

.drop-preview-wrap {
  position: absolute;
  inset: 0;
}

.drop-preview-img {
  object-fit: cover;
}

/* Confirm thumbnail */
.confirm-thumb-wrap {
  position: relative;
  width: 100px;
  height: 125px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  flex-shrink: 0;
  align-self: center;
}

.confirm-thumb-img {
  object-fit: cover;
}

/* Form fields */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.form-input {
  height: 44px;
  padding: 0 16px;
  font-size: 15px;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  background: var(--bg-primary);
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-soft);
}

.form-select {
  height: 44px;
  padding: 0 16px;
  font-size: 15px;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  appearance: none;
  transition: all 0.2s ease;
}

.form-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-soft);
}

.chip-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.form-error {
  font-size: 13px;
  color: var(--error);
  padding: 8px 12px;
  background: rgba(255, 59, 48, 0.05);
  border-radius: var(--radius-md);
}

/* Buttons */
.primary-btn {
  height: 48px;
  padding: 0 24px;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  color: #fff;
  background: var(--primary);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
}

.primary-btn:hover:not(:disabled) {
  background: #0066d6;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ghost-btn {
  height: 48px;
  padding: 0 20px;
  font-size: 15px;
  font-weight: 500;
  font-family: inherit;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.ghost-btn:hover {
  background: var(--border);
  color: var(--text-primary);
}

.ghost-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-footer-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  clip: rect(0 0 0 0);
  overflow: hidden;
}
```

**Step 2: Verify in browser — the modal looks correct, slides up from bottom**

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add CSS for UploadModal sheet, form fields, and buttons"
```

---

## Task 8: Build WeatherBanner component

**Files:**
- Create: `src/components/WeatherBanner.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { type WeatherData, type WeatherCondition, fetchWeather } from '@/lib/api';

const conditionLabel: Record<WeatherCondition, string> = {
  sunny: '☀️ 晴天',
  cloudy: '⛅ 多云',
  rainy: '🌧 有雨',
  snowy: '❄️ 下雪',
  stormy: '⛈ 雷暴',
};

type Props = {
  onWeather: (w: WeatherData) => void;
  onGeoError: () => void;
};

type BannerState = 'loading' | 'denied' | 'ready' | 'error';

export default function WeatherBanner({ onWeather, onGeoError }: Props) {
  const [state, setState] = useState<BannerState>('loading');
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState('denied');
      onGeoError();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const w = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
          setWeather(w);
          setState('ready');
          onWeather(w);
        } catch {
          setState('error');
        }
      },
      () => {
        setState('denied');
        onGeoError();
      },
      { timeout: 8000 },
    );
  }, [onWeather, onGeoError]);

  if (state === 'loading') {
    return <div className="weather-banner weather-loading">获取天气中...</div>;
  }

  if (state === 'denied' || state === 'error') {
    return (
      <div className="weather-banner weather-denied">
        📍 无法获取位置，请允许位置权限后刷新页面
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="weather-banner weather-ready">
      <span className="weather-condition">{conditionLabel[weather.condition]}</span>
      <span className="weather-temp">{weather.temperature}°C</span>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/WeatherBanner.tsx
git commit -m "feat: add WeatherBanner with geolocation and Open-Meteo integration"
```

---

## Task 9: Build OutfitCard component

**Files:**
- Create: `src/components/OutfitCard.tsx`

**Step 1: Create the component**

```tsx
import Image from 'next/image';
import type { Cloth, OutfitRecommendation } from '@/lib/api';

type Props = {
  outfit: OutfitRecommendation;
  clothMap: Map<string, Cloth>; // shortCode → Cloth
  selected: boolean;
  onSelect: () => void;
};

export default function OutfitCard({ outfit, clothMap, selected, onSelect }: Props) {
  const resolvedItems = outfit.items
    .map((item) => ({ ...item, cloth: clothMap.get(item.shortCode) }))
    .filter((item): item is typeof item & { cloth: Cloth } => item.cloth !== undefined);

  return (
    <article
      className={`outfit-card ${selected ? 'outfit-card--selected' : ''}`}
      onClick={onSelect}
    >
      <div className="outfit-thumbs">
        {resolvedItems.slice(0, 3).map((item) => (
          <div key={item.shortCode} className="outfit-thumb-wrap">
            <Image
              src={item.cloth.imageUrl}
              alt={item.cloth.name}
              fill
              className="outfit-thumb-img"
              unoptimized
              sizes="80px"
            />
          </div>
        ))}
        {resolvedItems.length === 0 && (
          <div className="outfit-thumb-empty">👗</div>
        )}
      </div>
      <p className="outfit-label">{outfit.label}</p>
      {selected && <div className="outfit-selected-badge">✓ 今日穿搭</div>}
    </article>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/OutfitCard.tsx
git commit -m "feat: add OutfitCard component"
```

---

## Task 10: Build TodaysLookTab component

**Files:**
- Create: `src/components/TodaysLookTab.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  type Cloth,
  type OutfitRecommendation,
  type WeatherData,
  fetchClothes,
  recommendOutfits,
} from '@/lib/api';
import WeatherBanner from './WeatherBanner';
import OutfitCard from './OutfitCard';

export default function TodaysLookTab() {
  const [geoDenied, setGeoDenied] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [wardrobe, setWardrobe] = useState<Cloth[]>([]);
  const [outfits, setOutfits] = useState<OutfitRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleWeather = useCallback((w: WeatherData) => {
    setWeather(w);
  }, []);

  const handleGeoError = useCallback(() => {
    setGeoDenied(true);
    setLoading(false);
  }, []);

  // Fetch wardrobe once on mount
  useEffect(() => {
    fetchClothes({})
      .then(setWardrobe)
      .catch(() => setWardrobe([]));
  }, []);

  // Generate recommendations when both weather and wardrobe are ready
  useEffect(() => {
    if (!weather || wardrobe.length === 0) return;

    setLoading(true);
    recommendOutfits(weather, wardrobe)
      .then((results) => {
        setOutfits(results);
        setSelectedIndex(null);
      })
      .finally(() => setLoading(false));
  }, [weather, wardrobe]);

  // Build a map for quick cloth lookup in OutfitCard
  const clothMap = new Map(wardrobe.map((c) => [c.shortCode, c]));

  return (
    <div className="today-tab">
      <WeatherBanner onWeather={handleWeather} onGeoError={handleGeoError} />

      {geoDenied && (
        <p className="state-text">开启位置权限后，我们可以根据天气为你推荐今日穿搭。</p>
      )}

      {!geoDenied && wardrobe.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">👗</div>
          <h3>衣橱还是空的</h3>
          <p>先用右下角 + 按钮上传几件衣服，就能看到今日推荐啦</p>
        </div>
      )}

      {!geoDenied && loading && wardrobe.length > 0 && (
        <div className="outfit-row">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="outfit-card outfit-skeleton">
              <div className="outfit-thumbs">
                <div className="outfit-thumb-wrap skeleton-image" />
                <div className="outfit-thumb-wrap skeleton-image" />
              </div>
              <div className="skeleton-line short" style={{ marginTop: 12 }} />
            </div>
          ))}
        </div>
      )}

      {!loading && outfits.length > 0 && (
        <>
          <h2 className="section-heading">今日推荐穿搭</h2>
          <div className="outfit-row">
            {outfits.map((outfit, i) => (
              <OutfitCard
                key={i}
                outfit={outfit}
                clothMap={clothMap}
                selected={selectedIndex === i}
                onSelect={() => setSelectedIndex(i === selectedIndex ? null : i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/TodaysLookTab.tsx
git commit -m "feat: add TodaysLookTab with weather + outfit recommendations"
```

---

## Task 11: Wire TodaysLookTab into `src/app/page.tsx`

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Add import**

```typescript
import TodaysLookTab from '@/components/TodaysLookTab';
```

**Step 2: Replace the Today tab placeholder**

Find:
```tsx
    {/* Today's Look tab — placeholder, wired in Task 7 */}
    {activeTab === 'today' && (
      <div className="state-text">今日穿搭功能加载中...</div>
    )}
```

Replace with:
```tsx
    {activeTab === 'today' && <TodaysLookTab />}
```

**Step 3: Verify in browser**
- Switch to "今日穿搭" tab → weather banner loads (may require geo permission)
- After ~2s → 2 outfit cards appear
- Click an outfit card → shows "✓ 今日穿搭" badge

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: wire TodaysLookTab into main page"
```

---

## Task 12: Add CSS for TodaysLookTab, WeatherBanner, OutfitCard

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Append to end of globals.css**

```css
/* ── Today's Look Tab ────────────────────────────────────────────────────── */

.today-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-heading {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

/* Weather Banner */
.weather-banner {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: 20px 24px;
  box-shadow: var(--shadow-md);
}

.weather-loading {
  color: var(--text-secondary);
  font-size: 15px;
}

.weather-denied {
  color: var(--text-secondary);
  font-size: 15px;
}

.weather-ready {
  display: flex;
  align-items: center;
  gap: 16px;
}

.weather-condition {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.weather-temp {
  font-size: 32px;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: -0.02em;
}

/* Outfit Row */
.outfit-row {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
}

.outfit-row::-webkit-scrollbar {
  display: none;
}

/* Outfit Card */
.outfit-card {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.25s ease;
  flex-shrink: 0;
  width: 180px;
  border: 2px solid transparent;
}

.outfit-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.outfit-card--selected {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-soft);
}

.outfit-card.outfit-skeleton {
  cursor: default;
}

.outfit-thumbs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.outfit-thumb-wrap {
  position: relative;
  width: 72px;
  height: 90px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.outfit-thumb-img {
  object-fit: cover;
}

.outfit-thumb-empty {
  width: 72px;
  height: 90px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.outfit-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.outfit-selected-badge {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  background: var(--primary-soft);
  border-radius: var(--radius-full);
  padding: 3px 10px;
  display: inline-block;
}
```

**Step 2: Final end-to-end check in browser**
1. My Closet tab — existing grid + filters still work
2. FAB opens upload modal — drop image → AI fill → confirm form → save
3. Today's Look tab — weather loads → outfit cards appear → selecting highlights card

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add CSS for weather banner, outfit cards, and today tab"
```

---

## Done — Phase 1 Complete

All frontend UI is built with mocked AI responses. To wire in real backend (Phase 2):

1. Add `POST /v1/clothes/analyze` to Express backend (calls Kimi 2.5 vision)
2. Add `POST /v1/outfits/recommend` to Express backend (calls Kimi 2.5)
3. Replace `analyzeCloth` mock in `src/lib/api.ts` to call the real endpoint
4. Replace `recommendOutfits` mock to call the real endpoint
