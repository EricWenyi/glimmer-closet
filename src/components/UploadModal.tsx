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
