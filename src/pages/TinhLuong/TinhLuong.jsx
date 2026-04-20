import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { calcNet, formatVND } from '../../data/salaryRates.js'
import { Logo } from '../../components/Logo.jsx'
import SEO from '../../components/SEO.jsx'
import { HugeiconsIcon } from '@hugeicons/react'
import { DashboardSquare01Icon, Link01Icon, LinkSquare01Icon, UserIcon } from '@hugeicons/core-free-icons'
import './TinhLuong.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Fill bar colors — 5 bậc (biểu thuế 2026)
const PIT_FILL_COLORS  = ['#86efac', '#fbbf24', '#f97316', '#ef4444', '#991b1b']
// Badge bg colors — darker so white text passes contrast
const PIT_BADGE_COLORS = ['#16a34a', '#d97706', '#ea580c', '#dc2626', '#7f1d1d']

function parseVND(v) {
  const n = parseInt((v || '').replace(/\./g, '').replace(/\D/g, ''), 10)
  return isNaN(n) || n <= 0 ? 0 : n
}

function formatInput(raw) {
  const digits = (raw || '').replace(/\D/g, '')
  if (!digits) return ''
  return parseInt(digits, 10).toLocaleString('vi-VN')
}

function handleAmountChange(setter) {
  return (e) => setter(formatInput(e.target.value))
}

function encodeShareUrl(gross, allowances, bonus, dependents) {
  const params = new URLSearchParams({ g: parseVND(gross) })
  if (parseVND(allowances) > 0) params.set('a', parseVND(allowances))
  if (parseVND(bonus) > 0)      params.set('b', parseVND(bonus))
  if (dependents > 0)           params.set('d', dependents)
  return `${window.location.origin}/tinh-luong?${params.toString()}`
}

function readShareParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    gross:      p.get('g') ? formatInput(p.get('g')) : '',
    allowances: p.get('a') ? formatInput(p.get('a')) : '',
    bonus:      p.get('b') ? formatInput(p.get('b')) : '',
    dependents: parseInt(p.get('d') || '0') || 0,
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InsuranceSection({ result }) {
  return (
    <div className="tln-section">
      <div className="tln-section-label">Bảo hiểm (NLĐ đóng)</div>
      <div className="tln-rows">
        <div className="tln-row">
          <span className="tln-row-label">BHXH 8%</span>
          <span className="tln-row-val">−{formatVND(result.bhxh)}</span>
        </div>
        <div className="tln-row">
          <span className="tln-row-label">BHYT 1,5%</span>
          <span className="tln-row-val">−{formatVND(result.bhyt)}</span>
        </div>
        <div className="tln-row">
          <span className="tln-row-label">BHTN 1%</span>
          <span className="tln-row-val">−{formatVND(result.bhtn)}</span>
        </div>
      </div>
      <div className="tln-row tln-row-sub">
        <span className="tln-row-label tln-row-label-bold">Tổng bảo hiểm</span>
        <span className="tln-row-val tln-row-val-bold">−{formatVND(result.totalIns)}</span>
      </div>
      {result.isCapped && (
        <div className="tln-capped-note">
          ⚡ Lương vượt trần — BH tính tối đa trên 46,8 triệu
        </div>
      )}
    </div>
  )
}

function DeductionSection({ result }) {
  return (
    <div className="tln-section">
      <div className="tln-section-label">Giảm trừ gia cảnh</div>
      <div className="tln-rows">
        <div className="tln-row">
          <span className="tln-row-label">Bản thân</span>
          <span className="tln-row-val">−{formatVND(result.personalDed)}</span>
        </div>
        {result.dependentDed > 0 && (
          <div className="tln-row">
            <span className="tln-row-label">Người phụ thuộc</span>
            <span className="tln-row-val">−{formatVND(result.dependentDed)}</span>
          </div>
        )}
      </div>
      <div className="tln-row tln-row-sub">
        <span className="tln-row-label tln-row-label-bold">Thu nhập tính thuế</span>
        <span className={`tln-row-val tln-row-val-bold${result.taxable <= 0 ? ' tln-zero' : ''}`}>
          {result.taxable <= 0 ? 'Không chịu thuế' : formatVND(result.taxable)}
        </span>
      </div>
    </div>
  )
}

function TaxSection({ result }) {
  if (result.taxable <= 0) {
    return (
      <div className="tln-section">
        <div className="tln-section-label">Thuế TNCN</div>
        <div className="tln-tax-zero">✓ Không phát sinh thuế TNCN</div>
      </div>
    )
  }

  // Hiện tất cả 7 bậc
  const displayTiers = result.pitRows.map((row, i) => ({
    ...row,
    colorIdx: i,
    isEmpty: row.taxableSlice === 0,
  }))

  return (
    <div className="tln-section">
      <div className="tln-section-label">Thuế TNCN (lũy tiến)</div>
      <div className="tln-pit-buckets">
        {displayTiers.map((row, i) => {
          const fillPct = row.isEmpty
            ? 0
            : row.tierWidth
              ? Math.min(100, (row.taxableSlice / row.tierWidth) * 100)
              : 100
          const isFull    = !row.isEmpty && fillPct >= 99.9
          const isPartial = !row.isEmpty && !isFull
          const fillColor  = PIT_FILL_COLORS[row.colorIdx]  || PIT_FILL_COLORS[6]
          const badgeColor = PIT_BADGE_COLORS[row.colorIdx] || PIT_BADGE_COLORS[6]

          return (
            <div key={i} className={`tln-bucket${row.isEmpty ? ' tln-bucket--next' : ''}`}>
              {/* Rate badge + range label + tax amount */}
              <div className="tln-bucket-header">
                <div className="tln-bucket-left">
                  <span
                    className="tln-pit-badge"
                    style={{ background: row.isEmpty ? 'var(--m-muted)' : badgeColor }}
                  >
                    {Math.round(row.rate * 100)}%
                  </span>
                  <span className="tln-bucket-range">{row.label}</span>
                </div>
                <span className="tln-bucket-meta">
                  {row.isEmpty
                    ? <span className="tln-bucket-next-label">chưa chạm</span>
                    : formatVND(row.tax)
                  }
                </span>
              </div>

              {/* Fill bar */}
              <div className="tln-bucket-track">
                {fillPct > 0 && (
                  <div
                    className="tln-bucket-fill"
                    style={{ width: `${fillPct}%`, background: fillColor }}
                  />
                )}
                {/* Marker "đang ở đây" cho bậc partial */}
                {isPartial && (
                  <div className="tln-bucket-cursor" style={{ left: `${fillPct}%` }} />
                )}
              </div>

              {/* Capacity hint cho bậc partial */}
              {isPartial && row.tierWidth && (
                <div className="tln-bucket-hint">
                  {formatVND(row.taxableSlice)} / {formatVND(row.tierWidth)}
                  {' '}· còn {formatVND(row.tierWidth - row.taxableSlice)} nữa đầy bậc
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="tln-row tln-row-sub">
        <span className="tln-row-label tln-row-label-bold">Tổng thuế TNCN</span>
        <span className="tln-row-val tln-row-val-bold">−{formatVND(result.taxTotal)}</span>
      </div>
    </div>
  )
}

function NetSummary({ result }) {
  const deductRate = ((result.totalIns + result.taxTotal) / result.totalAgreed * 100).toFixed(1)
  return (
    <div className="tln-net-block">
      <span className="tln-net-label">Lương thực nhận</span>
      <span className="tln-net-amount">{formatVND(result.net)}</span>
      <span className="tln-net-meta">Khấu trừ {deductRate}% so với tổng lương thỏa thuận</span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TinhLuong() {
  const init = readShareParams()
  const navigate = useNavigate()

  const [grossInput,      setGrossInput]      = useState(init.gross)
  const [allowancesInput, setAllowancesInput] = useState(init.allowances)
  const [bonusInput,      setBonusInput]      = useState(init.bonus)
  const [dependents,      setDependents]      = useState(init.dependents)
  const [showOptional,    setShowOptional]    = useState(
    !!(init.allowances || init.bonus) // tự mở nếu có giá trị từ share URL
  )
  const [toastMsg,        setToastMsg]        = useState('')
  const [toastVis,        setToastVis]        = useState(false)

  const gross      = parseVND(grossInput)
  const allowances = parseVND(allowancesInput)
  const bonus      = parseVND(bonusInput)
  const hasInput   = gross > 0
  const result     = hasInput ? calcNet(gross, allowances, bonus, dependents) : null

  // Tổng lương thỏa thuận (hiển thị ngay trong input card)
  const totalAgreedPreview = gross + allowances + bonus

  const handleShare = useCallback(() => {
    const url = encodeShareUrl(grossInput, allowancesInput, bonusInput, dependents)
    navigator.clipboard.writeText(url).then(() => {
      setToastMsg('Đã copy link — paste để chia sẻ')
      setToastVis(true)
      setTimeout(() => setToastVis(false), 2200)
    })
  }, [grossInput, allowancesInput, bonusInput, dependents])

  return (
    <div className="tln-page notebook-bg">
      <SEO
        title="Tính Lương Net (Thực Nhận) 2026 — Gross → Net"
        description="Tính lương thực nhận từ lương gross. Khấu trừ BHXH 8%, BHYT 1,5%, BHTN 1%, thuế TNCN lũy tiến 5 bậc 2026. Giảm trừ bản thân 15,5 triệu/tháng."
        path="/tinh-luong"
        keywords="tính lương net, lương gross net, tính lương thực nhận, tính thuế TNCN, BHXH người lao động, lương net là gì"
      />

      {/* ── Header ── */}
      <header className="tln-header">
        <Logo />
        <button className="tln-menu-btn" onClick={() => navigate('/')} aria-label="Tất cả công cụ">
          <HugeiconsIcon icon={DashboardSquare01Icon} size={22} color="currentColor" strokeWidth={1.5} />
        </button>
      </header>

      <div className="tln-content">

        <h1 className="tln-page-title">Tính lương Net</h1>

        {/* ── Input card ── */}
        <div className="tln-card">
          <div className="tln-card-title">Thông tin lương</div>

          <div className="tln-inputs">
            {/* Lương cơ bản */}
            <div className="tln-input-row">
              <label className="tln-input-label">Lương cơ bản (Gross)</label>
              <div className="tln-input-field">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ví dụ: 10.000.000"
                  value={grossInput}
                  onChange={handleAmountChange(setGrossInput)}
                  autoFocus
                />
                <span className="tln-input-unit">đ</span>
              </div>
            </div>

            {/* Các khoản optional — ẩn mặc định */}
            {!showOptional ? (
              <button className="tln-add-btn" onClick={() => setShowOptional(true)}>
                + Thêm phụ cấp / thưởng
              </button>
            ) : (
              <>
                <div className="tln-input-row">
                  <label className="tln-input-label">Phụ cấp / trợ cấp</label>
                  <div className="tln-input-field">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Ví dụ: 1.500.000"
                      value={allowancesInput}
                      onChange={handleAmountChange(setAllowancesInput)}
                      autoFocus
                    />
                    <span className="tln-input-unit">đ</span>
                  </div>
                </div>
                <div className="tln-input-row">
                  <label className="tln-input-label">Thưởng tháng này</label>
                  <div className="tln-input-field">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Ví dụ: 2.000.000"
                      value={bonusInput}
                      onChange={handleAmountChange(setBonusInput)}
                    />
                    <span className="tln-input-unit">đ</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tổng lương thỏa thuận */}
          {hasInput && (
            <div className="tln-agreed-row">
              <span className="tln-agreed-label">Tổng lương thỏa thuận</span>
              <span className="tln-agreed-val">{formatVND(totalAgreedPreview)}</span>
            </div>
          )}

          {/* Dependents stepper */}
          <div className="tln-persons-wrap">
            <div className="tln-persons-label">
              <HugeiconsIcon icon={UserIcon} size={14} color="currentColor" strokeWidth={1.5} />
              <span>Người phụ thuộc</span>
            </div>
            <div className="tln-persons-stepper">
              <button
                className="tln-stepper-btn"
                onClick={() => setDependents(p => Math.max(0, p - 1))}
                disabled={dependents <= 0}
              >−</button>
              <span className="tln-stepper-val">{dependents}</span>
              <button
                className="tln-stepper-btn"
                onClick={() => setDependents(p => Math.min(10, p + 1))}
                disabled={dependents >= 10}
              >+</button>
            </div>
          </div>
        </div>

        {/* ── Result card ── */}
        <div className="tln-card tln-result">

          {!hasInput && (
            <div className="tln-empty-result">
              <span className="tln-empty-arrow">↑</span>
              <span>Nhập lương cơ bản ở trên để tính</span>
            </div>
          )}

          {result && (
            <>
              <InsuranceSection result={result} />
              <div className="tln-divider" />
              <DeductionSection result={result} />
              <div className="tln-divider" />
              <TaxSection result={result} />
              <div className="tln-divider" />
              <NetSummary result={result} />

              <div className="tln-actions">
                <button className="tln-btn-share" onClick={handleShare}>
                  <HugeiconsIcon icon={Link01Icon} size={16} color="currentColor" strokeWidth={2} />
                  Copy link kết quả
                </button>
              </div>
            </>
          )}
        </div>

        {/* Disclaimer */}
        {result && (
          <div className="tln-disclaimer">
            📌 Giảm trừ bản thân 15,5 triệu/tháng, người phụ thuộc 6,2 triệu/tháng (từ 1/1/2026).
            📌 Biểu thuế TNCN 5 bậc (từ 1/1/2026). TNTT = (gross + bonus) − BH − trợ cấp − giảm trừ bản thân − người phụ thuộc. Trợ cấp và bonus không tính cơ sở BHXH.
          </div>
        )}

        {/* Soft CTA */}
        <a
          className="tln-cta"
          href="https://app.chilathu.com?utm_source=tienich.chilathu.com&utm_medium=tool&utm_campaign=tln_footer"
          target="_blank"
          rel="noopener noreferrer"
        >
          Theo dõi thu chi với Chilathu.com
          <HugeiconsIcon icon={LinkSquare01Icon} size={14} color="currentColor" strokeWidth={1.5} />
        </a>

        <div className="tln-footer">
          © ChilàThu · Luật BHXH, Luật thuế TNCN hiện hành
        </div>
      </div>

      {/* Toast */}
      <div className={`tln-toast${toastVis ? ' show' : ''}`}>{toastMsg}</div>
    </div>
  )
}
