import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  rates,
  calcResidential,
  calcTOU,
  calcAdministrative,
  formatVND,
} from '../../data/electricityRates.js'
import { Logo } from '../../components/Logo.jsx'
import SEO from '../../components/SEO.jsx'
import { HugeiconsIcon } from '@hugeicons/react'
import { DashboardSquare01Icon, Link01Icon, LinkSquare01Icon } from '@hugeicons/core-free-icons'
import { trackAppCrosslink, trackToolCalculateDone } from '../../lib/analytics.js'
import './TinhTienDien.css'

// ─── Constants ───────────────────────────────────────────────
const GROUPS = [
  { id: 'residential',    label: 'Sinh hoạt',   tou: false },
  { id: 'business',       label: 'Kinh doanh',  tou: true  },
  { id: 'industrial',     label: 'Sản xuất',    tou: true  },
  { id: 'agricultural',   label: 'Nông nghiệp', tou: true  },
  { id: 'administrative', label: 'Hành chính SN', tou: false },
]

const TIER_BG        = ['#86efac','#4ade80','#fbbf24','#f97316','#ef4444','#dc2626']
const TIER_BADGE_BG  = ['#16a34a','#15803d','#d97706','#ea580c','#dc2626','#b91c1c']

// ─── Helpers ─────────────────────────────────────────────────
function getVoltageOptions(groupId) {
  const table = rates.current[groupId]
  if (!table || Array.isArray(table)) return []
  return Object.entries(table).map(([key, val]) => ({ key, label: val.label }))
}

function parseKwh(v) {
  const n = parseInt(v, 10)
  return isNaN(n) || n < 0 ? 0 : n
}

function encodeShareUrl(group, voltage, kwh, offK, normalK, peakK) {
  const params = new URLSearchParams({ group, voltage, kwh, off: offK, normal: normalK, peak: peakK })
  return `${window.location.origin}/tinh-tien-dien?${params.toString()}`
}

function readShareParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    group:   p.get('group')   || 'residential',
    voltage: p.get('voltage') || '',
    kwh:     p.get('kwh')     || '',
    off:     p.get('off')     || '',
    normal:  p.get('normal')  || '',
    peak:    p.get('peak')    || '',
  }
}

// ─── Sub-components ──────────────────────────────────────────

// Bucket chart — chỉ dùng cho sinh hoạt (tiered)
function BucketChart({ tiers }) {
  if (!tiers) return null
  return (
    <div className="ttd-buckets-wrap">
      <span className="ttd-buckets-title">Chi phí theo bậc thang</span>
      <div className="ttd-pit-buckets">
        {tiers.map((row, i) => {
          const isEmpty   = row.kwh === 0
          const fillPct   = isEmpty ? 0 : row.capacity ? Math.min(100, (row.kwh / row.capacity) * 100) : 100
          const isFull    = !isEmpty && fillPct >= 99.9
          const isPartial = !isEmpty && !isFull
          const fillColor  = TIER_BG[i]       || TIER_BG[5]
          const badgeColor = isEmpty ? 'var(--m-muted)' : (TIER_BADGE_BG[i] || TIER_BADGE_BG[5])
          const rangeLabel = row.max === Infinity
            ? `> ${row.min - 1} kWh`
            : `${row.min}–${row.max} kWh`

          return (
            <div key={i} className={`ttd-bucket${isEmpty ? ' ttd-bucket--next' : ''}`}>
              <div className="ttd-bucket-header">
                <div className="ttd-bucket-left">
                  <span className="ttd-bucket-badge" style={{ background: badgeColor }}>
                    Bậc {row.tier}
                  </span>
                  <span className="ttd-bucket-range">{rangeLabel}</span>
                </div>
                <span className="ttd-bucket-meta">
                  {isEmpty
                    ? <span className="ttd-bucket-next-label">chưa chạm</span>
                    : formatVND(row.amount)
                  }
                </span>
              </div>
              <div className="ttd-bucket-track">
                {fillPct > 0 && (
                  <div className="ttd-bucket-fill" style={{ width: `${fillPct}%`, background: fillColor }} />
                )}
                {isPartial && <div className="ttd-bucket-cursor" style={{ left: `${fillPct}%` }} />}
              </div>
              {isPartial && row.capacity && (
                <div className="ttd-bucket-hint">
                  {row.kwh} / {row.capacity} kWh · còn {row.capacity - row.kwh} kWh nữa đầy bậc
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// TOU chart — dùng bucket fill style (giống BucketChart sinh hoạt)
function TouChart({ rows }) {
  if (!rows) return null
  const TOU_FILL  = ['#86efac', '#4ade80', '#ef4444']
  const TOU_BADGE = ['#16a34a', '#15803d', '#b91c1c']
  const maxAmount = Math.max(...rows.map(r => r.amount), 1)

  return (
    <div className="ttd-buckets-wrap">
      <span className="ttd-buckets-title">Chi phí theo khung giờ</span>
      <div className="ttd-pit-buckets">
        {rows.map((row, i) => {
          const isEmpty = row.kwh === 0
          const fillPct = isEmpty ? 0 : (row.amount / maxAmount) * 100
          const name    = row.label.replace('Giờ ', '')

          return (
            <div key={i} className={`ttd-bucket${isEmpty ? ' ttd-bucket--next' : ''}`}>
              <div className="ttd-bucket-header">
                <div className="ttd-bucket-left">
                  <span
                    className="ttd-bucket-badge"
                    style={{ background: isEmpty ? 'var(--m-muted)' : TOU_BADGE[i] }}
                  >{name}</span>
                </div>
                <span className="ttd-bucket-meta">
                  {isEmpty
                    ? <span className="ttd-bucket-next-label">0 kWh</span>
                    : formatVND(row.amount)
                  }
                </span>
              </div>
              <div className="ttd-bucket-track">
                {fillPct > 0 && (
                  <div
                    className="ttd-bucket-fill"
                    style={{ width: `${fillPct}%`, background: TOU_FILL[i] }}
                  />
                )}
              </div>
              {!isEmpty && row.kwh > 0 && row.price > 0 && (
                <div className="ttd-bucket-hint">
                  {row.kwh.toLocaleString('vi-VN')} kWh × {row.price.toLocaleString('vi-VN')}đ/kWh
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BreakdownTable({ result, compareResult, showCompare }) {
  if (!result) return null
  const isTOU = !!result.rows
  const rows = isTOU ? result.rows : result.tiers

  return (
    <div className="ttd-table-wrap">
      <table className="ttd-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>{isTOU ? 'Khung giờ' : 'Bậc'}</th>
            <th>kWh</th>
            <th>Đơn giá</th>
            {showCompare && compareResult && <th>Giá cũ</th>}
            <th>Thành tiền</th>
            {showCompare && compareResult && <th>Chênh lệch</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const kwh     = isTOU ? row.kwh : row.kwh
            const price   = isTOU ? row.price : row.price
            const amount  = row.amount
            const isEmpty = kwh === 0

            const oldRow = showCompare && compareResult
              ? (isTOU ? compareResult.rows?.[i] : compareResult.tiers?.[i])
              : null
            const diff = oldRow ? amount - oldRow.amount : null

            return (
              <tr key={i} className={isEmpty ? 'zero-row' : ''}>
                <td>
                  {!isTOU && typeof row.tier === 'number' && (
                    <span
                      className="tier-badge"
                      style={{ background: TIER_BG[i] }}
                    >
                      {row.tier}
                    </span>
                  )}
                  {isTOU ? row.label : typeof row.tier === 'number' ? `${row.min}–${row.max === Infinity ? '...' : row.max} kWh` : 'Giá phẳng'}
                </td>
                <td>{kwh > 0 ? kwh.toLocaleString('vi-VN') : '—'}</td>
                <td>{price ? price.toLocaleString('vi-VN') + 'đ' : '⚠️'}</td>
                {showCompare && compareResult && (
                  <td className="old-price">
                    {oldRow?.amount ? formatVND(oldRow.amount) : '—'}
                  </td>
                )}
                <td style={{ fontWeight: isEmpty ? 400 : 700 }}>
                  {amount > 0 ? formatVND(amount) : '—'}
                </td>
                {showCompare && compareResult && (
                  <td className={diff > 0 ? 'diff-pos' : diff < 0 ? 'diff-neg' : ''}>
                    {diff !== null && diff !== 0
                      ? `${diff > 0 ? '+' : ''}${formatVND(diff)}`
                      : '—'}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Summary({ result, compareResult, showCompare }) {
  if (!result) return null
  const oldTotal = compareResult?.total
  return (
    <div className="ttd-summary">
      <div className="ttd-summary-row">
        <span className="ttd-summary-label">Tạm tính (chưa VAT)</span>
        <span className="ttd-summary-value">{formatVND(result.subtotal)}</span>
      </div>
      <div className="ttd-summary-row">
        <span className="ttd-summary-label">VAT 8%</span>
        <span className="ttd-summary-value">{formatVND(result.vatAmount)}</span>
      </div>
      <div className="ttd-summary-row total">
        <span className="ttd-summary-label">Tổng thanh toán</span>
        <div style={{ textAlign: 'right' }}>
          {showCompare && oldTotal && (
            <div style={{ fontSize: 12, color: 'var(--m-muted)', textDecoration: 'line-through', marginBottom: 2 }}>
              {formatVND(oldTotal)}
            </div>
          )}
          <span className="ttd-summary-value">{formatVND(result.total)}</span>
          {showCompare && oldTotal && result.total !== oldTotal && (
            <div style={{ fontSize: 12, color: result.total > oldTotal ? 'var(--m-red)' : 'var(--m-green)', marginTop: 2 }}>
              {result.total > oldTotal ? '+' : ''}{formatVND(result.total - oldTotal)} so với kỳ trước
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SourceCitation({ rateData }) {
  return (
    <div className="ttd-citation">
      <span className="ttd-citation-icon">📌</span>
      <p className="ttd-citation-text">
        Nguồn:{' '}
        <a href={rateData.sourceUrl} target="_blank" rel="noopener noreferrer">
          {rateData.label} ngày {rateData.date} — Bộ Công Thương
        </a>
        {' '}(áp dụng từ {rateData.effectiveFrom})
      </p>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────
export default function TinhTienDien() {
  const init = readShareParams()

  const [group,     setGroup]     = useState(init.group || 'residential')
  const [voltage,   setVoltage]   = useState(init.voltage || '')
  const [kwh,       setKwh]       = useState(init.kwh || '')
  const [offKwh,    setOffKwh]    = useState(init.off || '')
  const [normalKwh, setNormalKwh] = useState(init.normal || '')
  const [peakKwh,   setPeakKwh]   = useState(init.peak || '')

  const navigate = useNavigate()

  const [showCompare,  setShowCompare]  = useState(false)
  const [showBanner,   setShowBanner]   = useState(true)
  const [toastMsg,     setToastMsg]     = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const groupMeta     = GROUPS.find(g => g.id === group)
  const isTOU         = groupMeta?.tou && group !== 'administrative'
  const isAdmin       = group === 'administrative'
  const voltageOpts   = getVoltageOptions(group)

  // auto-set default voltage when group changes
  useEffect(() => {
    if (voltageOpts.length > 0 && !voltageOpts.find(v => v.key === voltage)) {
      setVoltage(voltageOpts[0].key)
    }
    if (voltageOpts.length === 0) setVoltage('')
  }, [group])

  // ── Compute result ──
  const totalKwh = parseKwh(kwh)
  const off  = parseKwh(offKwh)
  const norm = parseKwh(normalKwh)
  const peak = parseKwh(peakKwh)
  const hasInput = group === 'residential' || isAdmin
    ? totalKwh > 0
    : (off + norm + peak) > 0

  const result = (() => {
    if (!hasInput) return null
    if (group === 'residential') return calcResidential(totalKwh)
    if (isAdmin) return calcAdministrative(totalKwh, voltage)
    return calcTOU(off, norm, peak, voltage, group)
  })()

  const compareResult = (() => {
    if (!showCompare || !rates.previous || !hasInput) return null
    if (group === 'residential') return calcResidential(totalKwh, rates.previous)
    if (isAdmin) return calcAdministrative(totalKwh, voltage, rates.previous)
    return calcTOU(off, norm, peak, voltage, group, rates.previous)
  })()

  const isUnavailable = hasInput && result === null

  // ── Fire calculate_done event once per session ──
  const calcFiredRef = useRef(false)
  useEffect(() => {
    if (result && !calcFiredRef.current) {
      trackToolCalculateDone('tinh-tien-dien')
      calcFiredRef.current = true
    }
  }, [result])

  // ── Warning ──
  const showWarning = !isTOU && totalKwh > 9999

  // ── Share ──
  const handleShare = useCallback(() => {
    const url = encodeShareUrl(group, voltage, kwh, offKwh, normalKwh, peakKwh)
    navigator.clipboard.writeText(url).then(() => {
      setToastMsg('Đã copy link — paste để chia sẻ')
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 2200)
    })
  }, [group, voltage, kwh, offKwh, normalKwh, peakKwh])

  const hasPrevious = !!rates.previous

  return (
    <div className="ttd-page notebook-bg">
      <SEO
        title="Tính Tiền Điện EVN 2025 — Sinh hoạt, Kinh doanh, Sản xuất"
        description="Tính tiền điện theo bậc thang EVN mới nhất 2025 (QĐ 1279). Hỗ trợ 5 nhóm: sinh hoạt, kinh doanh, sản xuất, nông nghiệp, hành chính sự nghiệp. Nhanh, chính xác, miễn phí."
        path="/tinh-tien-dien"
        keywords="tính tiền điện, tiền điện EVN, bậc thang tiền điện, công thức tính tiền điện, tiền điện sinh hoạt, tiền điện tháng"
      />
      {/* Header */}
      <header className="ttd-header">
        <Logo />
        <button className="ttd-menu-btn" onClick={() => navigate('/')} aria-label="Tất cả công cụ">
          <HugeiconsIcon icon={DashboardSquare01Icon} size={22} color="currentColor" strokeWidth={1.5} />
        </button>
      </header>

      <div className="ttd-content">

        <h1 className="ttd-page-title">Tính tiền điện</h1>

        {/* Price change banner */}
        {hasPrevious && showBanner && (
          <div className="ttd-price-banner">
            <span className="ttd-price-banner-icon">🔔</span>
            <div className="ttd-price-banner-body">
              <div className="ttd-price-banner-title">Giá điện vừa được điều chỉnh</div>
              <div className="ttd-price-banner-sub">{rates.current.label} — áp dụng từ {rates.current.effectiveFrom}</div>
            </div>
            {result && (
              <button className="ttd-price-banner-btn" onClick={() => setShowCompare(v => !v)}>
                {showCompare ? 'Ẩn so sánh' : 'So sánh ↕'}
              </button>
            )}
            <button className="ttd-price-banner-close" onClick={() => setShowBanner(false)}>✕</button>
          </div>
        )}

        {/* Input card */}
        <div className="ttd-card">
          <div className="ttd-card-title">Loại hộ dùng điện</div>

          {/* Group tabs */}
          <div className="ttd-group-tabs">
            {GROUPS.map(g => (
              <button
                key={g.id}
                className={`ttd-group-tab${group === g.id ? ' active' : ''}`}
                onClick={() => { setGroup(g.id); setKwh(''); setOffKwh(''); setNormalKwh(''); setPeakKwh('') }}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Voltage selector */}
          {voltageOpts.length > 0 && (
            <div className="ttd-voltage-wrap">
              <label className="ttd-voltage-label" htmlFor="voltage-select">Cấp điện áp</label>
              <select
                id="voltage-select"
                className="ttd-voltage-select"
                value={voltage}
                onChange={e => setVoltage(e.target.value)}
              >
                {voltageOpts.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* kWh inputs */}
          <div className="ttd-inputs">
            {isTOU ? (
              <>
                <div className="ttd-tou-rows">
                  <div className="ttd-tou-row">
                    <div className="ttd-tou-label-wrap">
                      <span className="ttd-tou-name off">Thấp điểm</span>
                      <span className="ttd-tou-time">22h–4h</span>
                    </div>
                    <div className="ttd-input-field off">
                      <input type="number" inputMode="numeric" placeholder="0"
                        value={offKwh} onChange={e => setOffKwh(e.target.value)} min="0" />
                      <span className="ttd-input-unit">kWh</span>
                    </div>
                  </div>
                  <div className="ttd-tou-row">
                    <div className="ttd-tou-label-wrap">
                      <span className="ttd-tou-name">Bình thường</span>
                      <span className="ttd-tou-time">4h–9h30 | 11h30–17h | 20h–22h</span>
                    </div>
                    <div className="ttd-input-field">
                      <input type="number" inputMode="numeric" placeholder="0"
                        value={normalKwh} onChange={e => setNormalKwh(e.target.value)} min="0" />
                      <span className="ttd-input-unit">kWh</span>
                    </div>
                  </div>
                  <div className="ttd-tou-row">
                    <div className="ttd-tou-label-wrap">
                      <span className="ttd-tou-name peak">Cao điểm</span>
                      <span className="ttd-tou-time">9h30–11h30 | 17h–20h (T2–T7)</span>
                    </div>
                    <div className="ttd-input-field peak">
                      <input type="number" inputMode="numeric" placeholder="0"
                        value={peakKwh} onChange={e => setPeakKwh(e.target.value)} min="0" />
                      <span className="ttd-input-unit">kWh</span>
                    </div>
                  </div>
                </div>
                <div className="ttd-tou-hint">
                  <span className="ttd-tou-hint-icon">💡</span>
                  <span>3 con số này có trong <strong>hóa đơn tiền điện hàng tháng</strong> của bạn — EVN ghi rõ kWh theo từng khung giờ.</span>
                </div>
              </>
            ) : (
              <div className="ttd-input-row">
                <label className="ttd-input-label">Số kWh tiêu thụ trong tháng</label>
                <div className="ttd-input-field">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Ví dụ: 200"
                    value={kwh}
                    onChange={e => setKwh(e.target.value)}
                    min="0"
                    max="99999"
                    autoFocus
                  />
                  <span className="ttd-input-unit">kWh</span>
                </div>
              </div>
            )}
          </div>

          {/* Warning: high kWh */}
          {showWarning && (
            <div className="ttd-warning">
              ⚠️ Số kWh này có vẻ rất lớn — kiểm tra lại nhé
            </div>
          )}
        </div>

        {/* Result card */}
        <div className="ttd-card ttd-result">
          {!hasInput && (
            <div className="ttd-empty-result">
              <span className="ttd-empty-arrow">↑</span>
              <span>Nhập số kWh ở trên để tính tiền điện</span>
            </div>
          )}

          {isUnavailable && (
            <div className="ttd-unavailable">
              ⚠️ Bảng giá cho nhóm này chưa được cập nhật đầy đủ.
              Vui lòng kiểm tra lại sau hoặc tra cứu trực tiếp tại{' '}
              <a href={rates.current.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--m-warning)', textDecoration: 'underline' }}>
                EVN
              </a>.
            </div>
          )}

          {result && (
            <>
              {result.tiers && <BucketChart tiers={result.tiers} />}
              {result.rows  && <TouChart rows={result.rows} />}
              <Summary result={result} compareResult={compareResult} showCompare={showCompare} />
              <SourceCitation rateData={rates.current} />

              <div className="ttd-actions">
                <button className="ttd-btn-share" onClick={handleShare}>
                  <HugeiconsIcon icon={Link01Icon} size={16} color="currentColor" strokeWidth={2} />
                  Copy link kết quả
                </button>
                {hasPrevious && (
                  <button
                    className={`ttd-btn-compare${showCompare ? ' active' : ''}`}
                    onClick={() => setShowCompare(v => !v)}
                  >
                    {showCompare ? 'Ẩn so sánh' : 'So sánh giá cũ'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Soft CTA */}
        <a
          className="ttd-cta"
          href="https://app.chilathu.com?utm_source=tienich.chilathu.com&utm_medium=tool&utm_campaign=ttd_footer"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAppCrosslink('tinh-tien-dien', { campaign: 'ttd_footer' })}
        >
          Theo dõi thu chi với Chilathu.com
          <HugeiconsIcon icon={LinkSquare01Icon} size={14} color="currentColor" strokeWidth={1.5} />
        </a>

        {/* Footer */}
        <div className="ttd-footer">
          © ChilàThu · Dữ liệu giá điện theo {rates.current.label}
        </div>
      </div>

      {/* Toast */}
      <div className={`ttd-toast${toastVisible ? ' show' : ''}`}>
        {toastMsg}
      </div>
    </div>
  )
}
