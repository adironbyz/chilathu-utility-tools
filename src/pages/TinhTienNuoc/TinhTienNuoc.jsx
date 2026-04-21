import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { provinces, calcWater, formatVND } from '../../data/waterRates.js'
import { Logo } from '../../components/Logo.jsx'
import SEO from '../../components/SEO.jsx'
import { HugeiconsIcon } from '@hugeicons/react'
import { DashboardSquare01Icon, Link01Icon, LinkSquare01Icon, UserIcon } from '@hugeicons/core-free-icons'
import { trackAppCrosslink, trackToolCalculateDone } from '../../lib/analytics.js'
import './TinhTienNuoc.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIER_FILL_COLORS  = ['#86efac', '#4ade80', '#fbbf24', '#f97316']
const TIER_BADGE_COLORS = ['#16a34a', '#15803d', '#d97706', '#ea580c']

function parseM3(v) {
  const n = parseFloat(v)
  return isNaN(n) || n < 0 ? 0 : n
}

function encodeShareUrl(provinceId, type, m3, persons) {
  const params = new URLSearchParams({ p: provinceId, t: type, m: m3 })
  if (persons) params.set('n', persons)
  return `${window.location.origin}/tinh-tien-nuoc?${params.toString()}`
}

function readShareParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    provinceId: p.get('p') || 'ha-noi',
    type:       p.get('t') || 'residential',
    m3:         p.get('m') || '',
    persons:    p.get('n') || '4',
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function BucketChart({ result }) {
  if (!result || result.flat) return null
  const rows = result.breakdown
  return (
    <div className="ttn-buckets-wrap">
      <span className="ttn-buckets-title">Chi phí theo bậc thang</span>
      <div className="ttn-pit-buckets">
        {rows.map((row, i) => {
          const isEmpty   = row.qty === 0
          const fillPct   = isEmpty ? 0 : row.capacity ? Math.min(100, (row.qty / row.capacity) * 100) : 100
          const isFull    = !isEmpty && fillPct >= 99.9
          const isPartial = !isEmpty && !isFull
          const fillColor  = TIER_FILL_COLORS[i]  || TIER_FILL_COLORS[3]
          const badgeColor = isEmpty ? 'var(--m-muted)' : (TIER_BADGE_COLORS[i] || TIER_BADGE_COLORS[3])

          return (
            <div key={i} className={`ttn-bucket${isEmpty ? ' ttn-bucket--next' : ''}`}>
              <div className="ttn-bucket-header">
                <div className="ttn-bucket-left">
                  <span className="ttn-bucket-badge" style={{ background: badgeColor }}>
                    Bậc {row.tier}
                  </span>
                  <span className="ttn-bucket-range">{row.label}</span>
                </div>
                <span className="ttn-bucket-meta">
                  {isEmpty
                    ? <span className="ttn-bucket-next-label">chưa chạm</span>
                    : formatVND(row.amount)
                  }
                </span>
              </div>
              <div className="ttn-bucket-track">
                {fillPct > 0 && (
                  <div className="ttn-bucket-fill" style={{ width: `${fillPct}%`, background: fillColor }} />
                )}
                {isPartial && <div className="ttn-bucket-cursor" style={{ left: `${fillPct}%` }} />}
              </div>
              {isPartial && row.capacity && (
                <div className="ttn-bucket-hint">
                  {row.qty} / {row.capacity} m³ · còn {row.capacity - row.qty} m³ nữa đầy bậc
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BreakdownTable({ result }) {
  if (!result || result.flat) return null
  const rows = result.breakdown

  return (
    <div className="ttn-table-wrap">
      <table className="ttn-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Bậc</th>
            <th>m³</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={row.qty === 0 ? 'zero-row' : ''}>
              <td>
                <span className="ttn-tier-badge" style={{ background: TIER_COLORS[i] || TIER_COLORS[3] }}>
                  {row.tier}
                </span>
                {row.label}
              </td>
              <td>{row.qty > 0 ? row.qty.toLocaleString('vi-VN') : '—'}</td>
              <td>{row.price.toLocaleString('vi-VN')}đ</td>
              <td style={{ fontWeight: row.qty === 0 ? 400 : 700 }}>
                {row.qty > 0 ? formatVND(row.amount) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Summary({ result }) {
  if (!result) return null

  const showSubtotal = !result.vatIncluded && (result.vatAmount > 0 || result.wasteWaterFee > 0)

  return (
    <div className="ttn-summary">
      {result.flat && (
        <div className="ttn-summary-row">
          <span className="ttn-summary-label">{result.m3} m³ × {formatVND(result.pricePerM3)}</span>
          <span className="ttn-summary-value">{formatVND(result.subtotal)}</span>
        </div>
      )}

      {showSubtotal && !result.flat && (
        <div className="ttn-summary-row">
          <span className="ttn-summary-label">Tạm tính (chưa VAT)</span>
          <span className="ttn-summary-value">{formatVND(result.subtotal)}</span>
        </div>
      )}

      {result.vatAmount > 0 && (
        <div className="ttn-summary-row">
          <span className="ttn-summary-label">VAT {Math.round(result.vatRate * 100)}%</span>
          <span className="ttn-summary-value">{formatVND(result.vatAmount)}</span>
        </div>
      )}

      {result.wasteWaterFee > 0 && (
        <div className="ttn-summary-row">
          <span className="ttn-summary-label">{result.wasteLabel}</span>
          <span className="ttn-summary-value">{formatVND(result.wasteWaterFee)}</span>
        </div>
      )}

      {result.vatIncluded && (
        <div className="ttn-vat-note">✓ Giá đã bao gồm VAT</div>
      )}

      <div className="ttn-summary-row total">
        <span className="ttn-summary-label">Tổng thanh toán</span>
        <span className="ttn-summary-value">{formatVND(result.total)}</span>
      </div>
    </div>
  )
}

function SourceCitation({ province }) {
  if (!province || province.pending) return null
  return (
    <div className="ttn-citation">
      <span className="ttn-citation-icon">📌</span>
      <p className="ttn-citation-text">
        Nguồn: <a href={province.sourceUrl} target="_blank" rel="noopener noreferrer">
          {province.sourceLabel}
        </a>
        {province.effectiveFrom && ` — áp dụng từ ${province.effectiveFrom}`}
      </p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TinhTienNuoc() {
  const init = readShareParams()
  const navigate = useNavigate()

  const [provinceId, setProvinceId] = useState(init.provinceId)
  const [type,       setType]       = useState(init.type)       // 'residential' | 'business'
  const [m3Input,    setM3Input]    = useState(init.m3)
  const [persons,    setPersons]    = useState(parseInt(init.persons) || 4)
  const [toastMsg,   setToastMsg]   = useState('')
  const [toastVis,   setToastVis]   = useState(false)

  const province = provinces.find(p => p.id === provinceId) || provinces[0]
  const m3 = parseM3(m3Input)
  const hasInput = m3 > 0

  const isPerPerson = !province.pending
    && type === 'residential'
    && province.residential?.mode === 'tiered_person'

  const result = hasInput && !province.pending
    ? calcWater(m3, province, type, persons)
    : null

  const hasPartialData = !province.pending && province[type]?.partialData

  // ── Fire calculate_done event once per session ──
  const calcFiredRef = useRef(false)
  useEffect(() => {
    if (result && !calcFiredRef.current) {
      trackToolCalculateDone('tinh-tien-nuoc')
      calcFiredRef.current = true
    }
  }, [result])

  // ── Share ──
  const handleShare = useCallback(() => {
    const url = encodeShareUrl(provinceId, type, m3Input, isPerPerson ? persons : null)
    navigator.clipboard.writeText(url).then(() => {
      setToastMsg('Đã copy link — paste để chia sẻ')
      setToastVis(true)
      setTimeout(() => setToastVis(false), 2200)
    })
  }, [provinceId, type, m3Input, isPerPerson, persons])

  // ── Province change ──
  const handleProvinceChange = (id) => {
    setProvinceId(id)
    setM3Input('')
    // Reset type if new province doesn't support current type
    const newProv = provinces.find(p => p.id === id)
    if (newProv && !newProv.pending && !newProv[type]) {
      setType('residential')
    }
  }

  return (
    <div className="ttn-page notebook-bg">
      <SEO
        title="Tính Tiền Nước 2026 — 63 Tỉnh Thành Việt Nam"
        description="Tính tiền nước sinh hoạt và kinh doanh theo giá nước mới nhất 2026 của 63 tỉnh thành. Đã tính phí BVMT nước theo NĐ 346/2025. Hà Nội, TP.HCM, Đà Nẵng, Hải Phòng, Cần Thơ..."
        path="/tinh-tien-nuoc"
        keywords="tính tiền nước, giá nước sinh hoạt, tiền nước Hà Nội, tiền nước HCM, tiền nước 63 tỉnh thành, bậc thang nước"
      />

      {/* ── Header ── */}
      <header className="ttn-header">
        <Logo />
        <button className="ttn-menu-btn" onClick={() => navigate('/')} aria-label="Tất cả công cụ">
          <HugeiconsIcon icon={DashboardSquare01Icon} size={22} color="currentColor" strokeWidth={1.5} />
        </button>
      </header>

      <div className="ttn-content">

        <h1 className="ttn-page-title">Tính tiền nước</h1>

        {/* ── Input card ── */}
        <div className="ttn-card">
          <div className="ttn-card-title">Tỉnh / Thành phố</div>

          {/* Province selector */}
          <div className="ttn-province-wrap">
            <select
              className="ttn-province-select"
              value={provinceId}
              onChange={e => handleProvinceChange(e.target.value)}
            >
              <optgroup label="Thành phố lớn">
                {provinces.filter(p => ['ha-noi','ho-chi-minh','da-nang','hai-phong','can-tho'].includes(p.id)).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.pending ? ' (đang cập nhật)' : ''}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Tỉnh thành">
                {provinces.filter(p => !['ha-noi','ho-chi-minh','da-nang','hai-phong','can-tho'].includes(p.id)).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.pending ? ' (đang cập nhật)' : ''}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Type tabs */}
          {!province.pending && (
            <div className="ttn-type-tabs">
              <button
                className={`ttn-type-tab${type === 'residential' ? ' active' : ''}`}
                onClick={() => setType('residential')}
              >
                Sinh hoạt
              </button>
              {province.business && (
                <button
                  className={`ttn-type-tab${type === 'business' ? ' active' : ''}`}
                  onClick={() => setType('business')}
                >
                  Kinh doanh
                </button>
              )}
            </div>
          )}

          {/* Per-person field — chỉ hiển thị cho HCM */}
          {isPerPerson && (
            <div className="ttn-persons-wrap">
              <div className="ttn-persons-label">
                <HugeiconsIcon icon={UserIcon} size={14} color="currentColor" strokeWidth={1.5} />
                <span>Số nhân khẩu đăng ký</span>
              </div>
              <div className="ttn-persons-stepper">
                <button
                  className="ttn-stepper-btn"
                  onClick={() => setPersons(p => Math.max(1, p - 1))}
                  disabled={persons <= 1}
                >−</button>
                <span className="ttn-stepper-val">{persons}</span>
                <button
                  className="ttn-stepper-btn"
                  onClick={() => setPersons(p => Math.min(20, p + 1))}
                  disabled={persons >= 20}
                >+</button>
              </div>
            </div>
          )}

          {/* m³ input */}
          {!province.pending && (
            <div className="ttn-inputs">
              <div className="ttn-input-row">
                <label className="ttn-input-label">Số m³ tiêu thụ trong tháng</label>
                <div className="ttn-input-field">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Ví dụ: 15"
                    value={m3Input}
                    onChange={e => setM3Input(e.target.value)}
                    min="0"
                    autoFocus
                  />
                  <span className="ttn-input-unit">m³</span>
                </div>
              </div>
              {isPerPerson && (
                <div className="ttn-person-hint">
                  <span>💡</span>
                  <span>Ngưỡng bậc tính theo <strong>{persons} nhân khẩu</strong> — thay đổi nếu hộ bạn khác</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Result card ── */}
        <div className="ttn-card ttn-result">

          {/* Pending province */}
          {province.pending && (
            <div className="ttn-pending">
              <span className="ttn-pending-icon">🗺️</span>
              <div className="ttn-pending-body">
                <div className="ttn-pending-title">Chưa có dữ liệu cho {province.name}</div>
                <div className="ttn-pending-sub">
                  Vui lòng tra cứu trực tiếp từ công ty cấp nước địa phương hoặc website UBND tỉnh.
                </div>
              </div>
            </div>
          )}

          {/* No input yet */}
          {!province.pending && !hasInput && (
            <div className="ttn-empty-result">
              <span className="ttn-empty-arrow">↑</span>
              <span>Nhập số m³ ở trên để tính tiền nước</span>
            </div>
          )}

          {/* Partial data warning */}
          {hasPartialData && hasInput && (
            <div className="ttn-partial-warning">
              ⚠️ Một số bậc giá là ước tính — kết quả có thể chênh lệch. Kiểm tra lại với{' '}
              <a href={province.sourceUrl} target="_blank" rel="noopener noreferrer">
                đơn vị cấp nước
              </a>.
            </div>
          )}

          {/* Result */}
          {result && (
            <>
              <BucketChart result={result} />
              <Summary result={result} />
              <SourceCitation province={province} />

              <div className="ttn-actions">
                <button className="ttn-btn-share" onClick={handleShare}>
                  <HugeiconsIcon icon={Link01Icon} size={16} color="currentColor" strokeWidth={2} />
                  Copy link kết quả
                </button>
              </div>
            </>
          )}
        </div>

        {/* Soft CTA */}
        <a
          className="ttn-cta"
          href="https://app.chilathu.com?utm_source=tienich.chilathu.com&utm_medium=tool&utm_campaign=ttn_footer"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAppCrosslink('tinh-tien-nuoc', { campaign: 'ttn_footer' })}
        >
          Theo dõi thu chi với Chilathu.com
          <HugeiconsIcon icon={LinkSquare01Icon} size={14} color="currentColor" strokeWidth={1.5} />
        </a>

        <div className="ttn-footer">
          © ChilàThu · Giá nước + phí BVMT 10% theo NĐ 346/2025/NĐ-CP (từ 1/1/2026)
        </div>
      </div>

      {/* Toast */}
      <div className={`ttn-toast${toastVis ? ' show' : ''}`}>{toastMsg}</div>
    </div>
  )
}
