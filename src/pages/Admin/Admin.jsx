/**
 * /admin — Affiliate config editor.
 *
 * Flow:
 *   1. Mount → GET /api/admin/session. Nếu chưa auth → LoginView.
 *   2. Auth xong → GET /api/affiliates, show Editor.
 *   3. User edit local state → Save button enabled.
 *   4. Click Save → POST /api/affiliates với full config.
 *   5. Success → show toast "Đã lưu". Next page load của tool sẽ fetch mới.
 *
 * Không dùng form library — useState đủ cho form đơn giản này.
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  Tick01Icon,
  Cancel01Icon,
  Add01Icon,
  Delete01Icon,
  RefreshIcon,
  Logout01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  HelpCircleIcon,
} from '@hugeicons/core-free-icons'
import { getDefaultAffiliateConfig } from '../../data/affiliates.js'
import AdminHelp from './AdminHelp.jsx'
import './Admin.css'

// ─── API helpers ────────────────────────────────────────────────────────────

async function apiGet(path) {
  const res = await fetch(path, { credentials: 'include', cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

// ─── Empty brand template ───────────────────────────────────────────────────

function emptyBrand(slug = '') {
  return {
    slug,
    name: '',
    initial: '',
    color: '#48A887',
    logoSrc: '',
    tagline: '',
    metric: '',
    url: 'https://',
    approved: false,
    referralCode: '',
  }
}

// ─── Login view ─────────────────────────────────────────────────────────────

function LoginView({ onAuth }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { ok, data } = await apiPost('/api/admin/login', { password })
    setLoading(false)
    if (ok) {
      onAuth()
    } else {
      setError(data?.error || 'Đăng nhập thất bại')
      setPassword('')
    }
  }

  return (
    <div className="ad-login-wrap">
      <form className="ad-login-card" onSubmit={handleSubmit}>
        <h1 className="ad-login-title">Chilathu Admin</h1>
        <p className="ad-login-sub">Đăng nhập để chỉnh affiliate config</p>

        <input
          type="password"
          className="ad-login-input"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          disabled={loading}
        />

        {error && <div className="ad-login-error">{error}</div>}

        <button
          type="submit"
          className="ad-login-btn"
          disabled={loading || !password}
        >
          {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  )
}

// ─── Brand card — edit 1 brand inline ──────────────────────────────────────

// Live preview logo: img nếu logoSrc hợp lệ, fallback initial+color nếu ảnh fail.
// Re-mount khi logoSrc đổi (key=logoSrc) để retry sau khi user sửa URL.
// size='lg' cho editor (48x48), 'sm' cho sidebar row (32x32).
function BrandLogoPreview({ brand, size = 'lg' }) {
  const [failed, setFailed] = useState(false)
  const showImg = brand.logoSrc && !failed
  const sizeCls = size === 'sm' ? ' ad-brand-logo-sm' : ''
  if (showImg) {
    return (
      <div className={`ad-brand-logo ad-brand-logo-img${sizeCls}`}>
        <img
          src={brand.logoSrc}
          alt={brand.name || brand.slug}
          onError={() => setFailed(true)}
        />
      </div>
    )
  }
  return (
    <div
      className={`ad-brand-logo${sizeCls}`}
      style={{ background: brand.color || '#48A887' }}
    >
      {brand.initial || '?'}
    </div>
  )
}

// Compact sidebar row — shows logo + name + live/off pill.
function BrandSidebarRow({ brand, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`ad-brand-row${selected ? ' is-selected' : ''}`}
      onClick={onSelect}
    >
      <BrandLogoPreview key={brand.logoSrc || 'fallback'} brand={brand} size="sm" />
      <div className="ad-brand-row-body">
        <div className="ad-brand-row-name">{brand.name || `@${brand.slug}`}</div>
        <div className="ad-brand-row-meta">
          <span className={`ad-brand-row-status${brand.approved ? ' is-live' : ''}`}>
            {brand.approved ? 'Live' : 'Off'}
          </span>
          <span className="ad-brand-row-slug">@{brand.slug}</span>
        </div>
      </div>
    </button>
  )
}

function BrandCard({ brand, onChange, onDelete, canDelete }) {
  const update = (patch) => onChange({ ...brand, ...patch })

  return (
    <div className={`ad-brand-card${brand.approved ? ' is-approved' : ''}`}>
      <div className="ad-brand-head">
        <BrandLogoPreview key={brand.logoSrc || 'fallback'} brand={brand} />

        <div className="ad-brand-head-body">
          <div className="ad-brand-name">{brand.name || '(chưa có tên)'}</div>
          <div className="ad-brand-slug">@{brand.slug}</div>
        </div>

        <label className="ad-toggle" title="Approved = live, track được">
          <input
            type="checkbox"
            checked={!!brand.approved}
            onChange={(e) => update({ approved: e.target.checked })}
          />
          <span className="ad-toggle-track">
            <span className="ad-toggle-thumb" />
          </span>
          <span className="ad-toggle-label">
            {brand.approved ? 'Live' : 'Off'}
          </span>
        </label>
      </div>

      <div className="ad-field-grid">
        <label className="ad-field">
          <span className="ad-field-label">Name</span>
          <input
            type="text"
            value={brand.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </label>

        <label className="ad-field">
          <span className="ad-field-label">Initial (1-2 chars)</span>
          <input
            type="text"
            maxLength={2}
            value={brand.initial}
            onChange={(e) => update({ initial: e.target.value })}
          />
        </label>

        <label className="ad-field">
          <span className="ad-field-label">Color</span>
          <div className="ad-color-wrap">
            <input
              type="color"
              value={brand.color || '#48A887'}
              onChange={(e) => update({ color: e.target.value })}
            />
            <input
              type="text"
              className="ad-color-text"
              value={brand.color || ''}
              onChange={(e) => update({ color: e.target.value })}
            />
          </div>
        </label>

        <label className="ad-field ad-field-wide">
          <span className="ad-field-label">
            Logo URL (optional — để trống sẽ dùng Initial + Color)
          </span>
          <input
            type="text"
            value={brand.logoSrc || ''}
            onChange={(e) => update({ logoSrc: e.target.value })}
            placeholder="https://logo.clearbit.com/vib.com.vn"
          />
        </label>

        <label className="ad-field ad-field-wide">
          <span className="ad-field-label">Tagline</span>
          <input
            type="text"
            value={brand.tagline}
            onChange={(e) => update({ tagline: e.target.value })}
          />
        </label>

        <label className="ad-field ad-field-wide">
          <span className="ad-field-label">Metric (dòng số liệu kèm CTA)</span>
          <input
            type="text"
            value={brand.metric}
            onChange={(e) => update({ metric: e.target.value })}
            placeholder="VD: Lãi suất 5.6%/năm"
          />
        </label>

        <label className="ad-field ad-field-wide">
          <span className="ad-field-label">Affiliate URL</span>
          <input
            type="text"
            value={brand.url}
            onChange={(e) => update({ url: e.target.value })}
            placeholder="https://go.isclix.com/..."
          />
        </label>

        <label className="ad-field ad-field-wide">
          <span className="ad-field-label">
            Referral code (nếu app-based, để trống = không show modal)
          </span>
          <input
            type="text"
            value={brand.referralCode || ''}
            onChange={(e) => update({ referralCode: e.target.value })}
            placeholder="VD: PAAT_2200776"
          />
        </label>
      </div>

      <div className="ad-brand-foot">
        <button
          type="button"
          className="ad-btn-danger"
          onClick={onDelete}
          disabled={!canDelete}
          title={
            canDelete
              ? 'Xoá brand'
              : 'Brand đang dùng trong tool mapping — gỡ khỏi mapping trước'
          }
        >
          <HugeiconsIcon icon={Delete01Icon} size={14} strokeWidth={2} />
          Xoá brand
        </button>
      </div>
    </div>
  )
}

// ─── Tool mapping row ───────────────────────────────────────────────────────

function ToolMappingRow({ tool, mapping, brandOptions, onChange }) {
  const toggleComparison = (slug) => {
    const set = new Set(mapping.comparison)
    if (set.has(slug)) set.delete(slug)
    else set.add(slug)
    onChange({ ...mapping, comparison: Array.from(set) })
  }

  return (
    <div className="ad-tool-row">
      <div className="ad-tool-head">
        <span className="ad-tool-slug">/{tool}</span>
      </div>

      <label className="ad-field">
        <span className="ad-field-label">Featured brand (single CTA)</span>
        <select
          value={mapping.featured || ''}
          onChange={(e) => onChange({ ...mapping, featured: e.target.value })}
        >
          <option value="">— Không featured —</option>
          {brandOptions.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.name} {b.approved ? '✓' : '(pending)'}
            </option>
          ))}
        </select>
      </label>

      <div className="ad-field">
        <span className="ad-field-label">Comparison brands (bảng so sánh)</span>
        <div className="ad-chip-group">
          {brandOptions.map((b) => {
            const active = mapping.comparison.includes(b.slug)
            return (
              <button
                key={b.slug}
                type="button"
                className={`ad-chip${active ? ' is-active' : ''}${
                  !b.approved ? ' is-pending' : ''
                }`}
                onClick={() => toggleComparison(b.slug)}
              >
                {active && <HugeiconsIcon icon={Tick01Icon} size={12} strokeWidth={2.5} />}
                {b.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Editor ─────────────────────────────────────────────────────────────────

function Editor({ onLogout }) {
  const [config, setConfig] = useState(null)
  const [initial, setInitial] = useState(null)
  const [activeTab, setActiveTab] = useState('brands') // 'brands' | 'tools'
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null) // {type: 'ok'|'err', text}
  const [newBrandSlug, setNewBrandSlug] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const [selectedBrandSlug, setSelectedBrandSlug] = useState(null)

  // Load config
  useEffect(() => {
    (async () => {
      const { ok, data } = await apiGet('/api/affiliates')
      if (ok && data.brands && data.toolAffiliates) {
        setConfig(data)
        setInitial(JSON.parse(JSON.stringify(data)))
      } else {
        // KV chưa có entry → seed từ defaults
        const def = getDefaultAffiliateConfig()
        setConfig(def)
        setInitial(JSON.parse(JSON.stringify(def)))
      }
    })()
  }, [])

  const dirty = useMemo(
    () => config && initial && JSON.stringify(config) !== JSON.stringify(initial),
    [config, initial]
  )

  const brandsList = useMemo(
    () => (config ? Object.values(config.brands) : []),
    [config]
  )

  // Auto-select sensible brand khi list đổi (initial load, add, delete).
  // Tránh selected slug trỏ vào brand đã xoá hoặc null khi mới load.
  useEffect(() => {
    if (!config) return
    const slugs = Object.keys(config.brands)
    if (slugs.length === 0) {
      if (selectedBrandSlug !== null) setSelectedBrandSlug(null)
    } else if (!selectedBrandSlug || !config.brands[selectedBrandSlug]) {
      setSelectedBrandSlug(slugs[0])
    }
  }, [config, selectedBrandSlug])

  // Check if a brand is referenced by any tool mapping — prevent delete.
  const brandInUse = useCallback(
    (slug) => {
      if (!config) return false
      return Object.values(config.toolAffiliates).some(
        (m) => m.featured === slug || m.comparison.includes(slug)
      )
    },
    [config]
  )

  const showToast = (type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 2800)
  }

  // ─── Brand actions ──
  const updateBrand = (slug, next) => {
    setConfig((c) => ({ ...c, brands: { ...c.brands, [slug]: next } }))
  }
  const deleteBrand = (slug) => {
    if (!confirm(`Xoá brand "${slug}"?`)) return
    setConfig((c) => {
      const { [slug]: _, ...rest } = c.brands
      return { ...c, brands: rest }
    })
  }
  const addBrand = () => {
    const slug = newBrandSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (!slug) return showToast('err', 'Slug không hợp lệ')
    if (config.brands[slug]) return showToast('err', 'Slug đã tồn tại')
    setConfig((c) => ({
      ...c,
      brands: { ...c.brands, [slug]: emptyBrand(slug) },
    }))
    setSelectedBrandSlug(slug) // jump editor straight to new brand
    setNewBrandSlug('')
    showToast('ok', `Đã thêm brand "${slug}"`)
  }

  // ─── Tool mapping actions ──
  const updateToolMapping = (tool, mapping) => {
    setConfig((c) => ({
      ...c,
      toolAffiliates: { ...c.toolAffiliates, [tool]: mapping },
    }))
  }

  // ─── Save / reset ──
  const handleSave = async () => {
    setSaving(true)
    const { ok, data } = await apiPost('/api/affiliates', config)
    setSaving(false)
    if (ok) {
      setInitial(JSON.parse(JSON.stringify(config)))
      showToast('ok', 'Đã lưu — mới chỉ cache edge, cần chờ tới 60s')
    } else {
      showToast('err', data?.error || 'Lưu thất bại')
    }
  }

  const handleResetDefaults = () => {
    if (!confirm('Reset config về defaults bundled trong code? Thay đổi chưa lưu sẽ mất.')) return
    const def = getDefaultAffiliateConfig()
    setConfig(def)
    showToast('ok', 'Đã reset về defaults (chưa save)')
  }

  const handleDiscard = () => {
    if (!dirty) return
    if (!confirm('Huỷ thay đổi chưa lưu?')) return
    setConfig(JSON.parse(JSON.stringify(initial)))
  }

  const handleLogout = async () => {
    await apiPost('/api/admin/logout', {})
    onLogout()
  }

  if (!config) {
    return (
      <div className="ad-loading">
        <div className="ad-spinner" />
        <div>Đang tải config…</div>
      </div>
    )
  }

  return (
    <div className="ad-page">
      <header className="ad-header">
        <div className="ad-header-title">Affiliate Admin</div>
        <div className="ad-header-actions">
          <button
            className="ad-btn-ghost"
            onClick={() => setHelpOpen(true)}
            title="Xem hướng dẫn sử dụng"
          >
            <HugeiconsIcon icon={HelpCircleIcon} size={14} strokeWidth={2} />
            Hướng dẫn
          </button>
          <button
            className="ad-btn-ghost"
            onClick={handleResetDefaults}
            title="Reset config về mặc định"
          >
            <HugeiconsIcon icon={RefreshIcon} size={14} strokeWidth={2} />
            Reset defaults
          </button>
          <button className="ad-btn-ghost" onClick={handleLogout}>
            <HugeiconsIcon icon={Logout01Icon} size={14} strokeWidth={2} />
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="ad-tabs">
        <button
          className={`ad-tab${activeTab === 'brands' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('brands')}
        >
          Brands <span className="ad-tab-count">{brandsList.length}</span>
        </button>
        <button
          className={`ad-tab${activeTab === 'tools' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          Tool mappings{' '}
          <span className="ad-tab-count">
            {Object.keys(config.toolAffiliates).length}
          </span>
        </button>
      </div>

      <main className="ad-main">
        {activeTab === 'brands' && (
          <div className="ad-brands-split">
            <aside className="ad-brands-sidebar">
              <div className="ad-add-brand">
                <input
                  type="text"
                  placeholder="Brand slug mới (vd: mbbank)"
                  value={newBrandSlug}
                  onChange={(e) => setNewBrandSlug(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addBrand()}
                />
                <button className="ad-btn-primary ad-btn-compact" onClick={addBrand}>
                  <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
                  Thêm
                </button>
              </div>

              {brandsList.length === 0 ? (
                <div className="ad-brands-empty">
                  Chưa có brand nào — gõ slug bên trên rồi bấm <strong>Thêm</strong> để bắt đầu.
                </div>
              ) : (
                <div className="ad-brands-list">
                  {brandsList.map((b) => (
                    <BrandSidebarRow
                      key={b.slug}
                      brand={b}
                      selected={b.slug === selectedBrandSlug}
                      onSelect={() => setSelectedBrandSlug(b.slug)}
                    />
                  ))}
                </div>
              )}
            </aside>

            <section className="ad-brands-editor">
              {selectedBrandSlug && config.brands[selectedBrandSlug] ? (
                <BrandCard
                  key={selectedBrandSlug}
                  brand={config.brands[selectedBrandSlug]}
                  onChange={(next) => updateBrand(selectedBrandSlug, next)}
                  onDelete={() => deleteBrand(selectedBrandSlug)}
                  canDelete={!brandInUse(selectedBrandSlug)}
                />
              ) : (
                <div className="ad-brands-empty-editor">
                  Chọn brand bên trái để chỉnh, hoặc thêm brand mới.
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="ad-tools">
            {Object.entries(config.toolAffiliates).map(([tool, mapping]) => (
              <ToolMappingRow
                key={tool}
                tool={tool}
                mapping={mapping}
                brandOptions={brandsList}
                onChange={(next) => updateToolMapping(tool, next)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className={`ad-footer${dirty ? ' is-dirty' : ''}`}>
        <div className="ad-footer-status">
          {dirty ? (
            <>
              <span className="ad-dot-dirty" />
              Có thay đổi chưa lưu
            </>
          ) : (
            <>
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={14}
                strokeWidth={2}
              />
              Đã đồng bộ
            </>
          )}
        </div>
        <div className="ad-footer-actions">
          {dirty && (
            <button className="ad-btn-ghost" onClick={handleDiscard}>
              Huỷ
            </button>
          )}
          <button
            className="ad-btn-primary"
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            {saving ? 'Đang lưu…' : 'Lưu config'}
          </button>
        </div>
      </footer>

      {toast && (
        <div className={`ad-toast ad-toast-${toast.type}`}>
          <HugeiconsIcon
            icon={toast.type === 'ok' ? CheckmarkCircle01Icon : AlertCircleIcon}
            size={16}
            strokeWidth={2}
          />
          {toast.text}
        </div>
      )}

      <AdminHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function Admin() {
  const navigate = useNavigate()
  const [authState, setAuthState] = useState('loading') // loading | authed | unauthed

  const checkSession = useCallback(async () => {
    const { ok } = await apiGet('/api/admin/session')
    setAuthState(ok ? 'authed' : 'unauthed')
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  if (authState === 'loading') {
    return (
      <div className="ad-loading">
        <div className="ad-spinner" />
      </div>
    )
  }

  if (authState === 'unauthed') {
    return <LoginView onAuth={() => setAuthState('authed')} />
  }

  return <Editor onLogout={() => setAuthState('unauthed')} />
}
