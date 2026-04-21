import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo.jsx'
import SEO from '../../components/SEO.jsx'
import { HugeiconsIcon } from '@hugeicons/react'
import { DashboardSquare01Icon, Link01Icon, LinkSquare01Icon } from '@hugeicons/core-free-icons'
import { AffiliateBlock } from '../../components/affiliate/index.js'
import '../../components/affiliate/Affiliate.css'
import { trackAppCrosslink, trackToolCalculateDone } from '../../lib/analytics.js'
import './TraGop.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseVND(v) {
  const n = parseInt((v || '').replace(/\./g, '').replace(/\D/g, ''), 10)
  return isNaN(n) || n <= 0 ? 0 : n
}

function formatInput(raw) {
  const digits = (raw || '').replace(/\D/g, '')
  if (!digits) return ''
  return parseInt(digits, 10).toLocaleString('vi-VN')
}

function parseRate(s) {
  return parseFloat((s || '').replace(',', '.')) || 0
}

function fmtCompact(n) {
  return Math.round(n).toLocaleString('vi-VN') + 'đ'
}

function fmtFull(n) {
  return Math.round(n).toLocaleString('vi-VN') + 'đ'
}

// ─── IRR bisection — lãi suất thực tế từ flat-fee installment ────────────────

function calcEffectiveAPR(price, monthlyPayment, months) {
  if (monthlyPayment * months <= price + 1) return 0
  let lo = 0.00001, hi = 3
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2
    const pv = monthlyPayment * (1 - Math.pow(1 + mid, -months)) / mid
    if (pv > price) hi = mid
    else lo = mid
  }
  return (Math.pow(1 + (lo + hi) / 2, 12) - 1) * 100
}

// ─── Calculations ─────────────────────────────────────────────────────────────

// 0% không phí — phân kỳ đều, không tính lãi
function calcFree(price, months) {
  const monthly = price / months
  return Array.from({ length: months }, (_, i) => ({
    month: i + 1,
    payment: monthly,
    principalPart: monthly,
    fee: 0,
    balance: Math.max(0, price - monthly * (i + 1)),
  }))
}

// 0% có phí chuyển đổi — phí phẳng trên số tiền gốc mỗi tháng
function calcFlatFee(price, feeRateMonth, months) {
  const monthlyFee       = price * feeRateMonth / 100
  const monthlyPrincipal = price / months
  const payment          = monthlyPrincipal + monthlyFee
  return Array.from({ length: months }, (_, i) => ({
    month: i + 1,
    payment,
    principalPart: monthlyPrincipal,
    fee: monthlyFee,
    balance: Math.max(0, price - monthlyPrincipal * (i + 1)),
  }))
}

// Có lãi suất — dư nợ giảm dần (FE Credit, Home Credit, ngân hàng)
function calcReducing(price, annualRate, months) {
  const r   = annualRate / 100 / 12
  const pmt = r === 0
    ? price / months
    : price * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1)
  let bal = price
  return Array.from({ length: months }, () => {
    const interest      = bal * r
    const principalPart = Math.min(pmt - interest, bal)
    bal = Math.max(0, bal - principalPart)
    return { month: bal < price ? (price - bal) / principalPart : 1, principalPart, fee: interest, payment: pmt, balance: bal }
  }).map((r, i) => ({ ...r, month: i + 1 }))
}

// ─── Share URL ────────────────────────────────────────────────────────────────

function encodeShareUrl(params) {
  return `${window.location.origin}/tra-gop?${new URLSearchParams(params)}`
}

function readShareParams() {
  const p = new URLSearchParams(window.location.search)
  const mode = ['free', 'fee', 'interest'].includes(p.get('m')) ? p.get('m') : 'free'
  return {
    mode,
    priceInput:  p.get('p') ? formatInput(p.get('p')) : '',
    feeStr:      p.get('f') || '1',
    rateStr:     p.get('r') || '20',
    termStr:     p.get('t') || '12',
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRICE_PRESETS = [
  { label: '3tr',  val: 3_000_000  },
  { label: '5tr',  val: 5_000_000  },
  { label: '10tr', val: 10_000_000 },
  { label: '15tr', val: 15_000_000 },
  { label: '20tr', val: 20_000_000 },
  { label: '30tr', val: 30_000_000 },
  { label: '50tr', val: 50_000_000 },
]

const TERM_PRESETS = [3, 6, 9, 12, 18, 24]

const MODES = [
  { id: 'free',     label: '0% không phí',  hint: 'Trả góp miễn phí — không thêm chi phí' },
  { id: 'fee',      label: '0% có phí',     hint: 'Ngân hàng tính phí chuyển đổi mỗi tháng trên số tiền mua' },
  { id: 'interest', label: 'Có lãi suất',   hint: 'FE Credit, Home Credit, vay ngân hàng — dư nợ giảm dần' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TraGop() {
  const navigate = useNavigate()
  const init = readShareParams()

  const [priceInput, setPriceInput] = useState(init.priceInput)
  const [mode,       setMode]       = useState(init.mode)
  const [feeStr,     setFeeStr]     = useState(init.feeStr)
  const [rateStr,    setRateStr]    = useState(init.rateStr)
  const [termStr,    setTermStr]    = useState(init.termStr)
  const [toastVis,   setToastVis]   = useState(false)

  const price     = parseVND(priceInput)
  const feeRate   = parseRate(feeStr)
  const annualRate = parseRate(rateStr)
  const months    = parseInt(termStr) || 0

  const valid = price > 0 && months > 0
    && (mode === 'free' || (mode === 'fee' && feeRate > 0) || (mode === 'interest' && annualRate > 0))

  const rows = useMemo(() => {
    if (!valid) return []
    if (mode === 'free')     return calcFree(price, months)
    if (mode === 'fee')      return calcFlatFee(price, feeRate, months)
    return calcReducing(price, annualRate, months)
  }, [valid, price, mode, feeRate, annualRate, months])

  const totalFees      = rows.reduce((s, r) => s + r.fee, 0)
  const totalPaid      = rows.reduce((s, r) => s + r.payment, 0)
  const monthlyPayment = rows[0]?.payment || 0
  const effectiveAPR   = mode === 'fee' && rows.length > 0
    ? calcEffectiveAPR(price, monthlyPayment, months) : 0

  const modeHint = MODES.find(m => m.id === mode)?.hint

  // ── Fire calculate_done event once per session ──
  const calcFiredRef = useRef(false)
  useEffect(() => {
    if (valid && rows.length > 0 && !calcFiredRef.current) {
      trackToolCalculateDone('tra-gop')
      calcFiredRef.current = true
    }
  }, [valid, rows.length])

  const handleShare = useCallback(() => {
    const params = { m: mode, p: price, t: termStr }
    if (mode === 'fee')      params.f = feeStr
    if (mode === 'interest') params.r = rateStr
    navigator.clipboard.writeText(encodeShareUrl(params)).then(() => {
      setToastVis(true)
      setTimeout(() => setToastVis(false), 2200)
    })
  }, [mode, price, termStr, feeStr, rateStr])

  return (
    <div className="tg-page notebook-bg">
      <SEO
        title="Tính Trả Góp — 0% không phí, có phí, có lãi suất"
        description="Tính trả góp 0% qua thẻ tín dụng, trả góp có phí chuyển đổi, hoặc có lãi suất (FE Credit, Home Credit). Xem lãi suất thực tế của khoản trả góp 0%."
        path="/tra-gop"
        keywords="tính trả góp, trả góp 0%, phí chuyển đổi, lãi suất thực, FE Credit, Home Credit"
      />

      <header className="tg-header">
        <Logo />
        <button className="tg-menu-btn" onClick={() => navigate('/')} aria-label="Tất cả công cụ">
          <HugeiconsIcon icon={DashboardSquare01Icon} size={22} color="currentColor" strokeWidth={1.5} />
        </button>
      </header>

      <div className="tg-content">
        <h1 className="tg-page-title">Tính trả góp</h1>

        {/* ── Input card ── */}
        <div className="tg-card">
          <div className="tg-card-title">Thông tin mua hàng</div>
          <div className="tg-inputs">

            {/* Giá sản phẩm */}
            <div className="tg-input-row">
              <label className="tg-input-label">Giá sản phẩm</label>
              <div className="tg-input-field">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Nhập giá tiền"
                  value={priceInput}
                  onChange={e => setPriceInput(formatInput(e.target.value))}
                  autoFocus
                />
                <span className="tg-input-unit">đ</span>
              </div>
              <div className="tg-chips">
                {PRICE_PRESETS.map(p => (
                  <button
                    key={p.val}
                    className={`tg-chip${parseVND(priceInput) === p.val ? ' active' : ''}`}
                    onClick={() => setPriceInput(formatInput(String(p.val)))}
                  >{p.label}</button>
                ))}
              </div>
            </div>

            {/* Loại trả góp */}
            <div className="tg-input-row">
              <label className="tg-input-label">Loại trả góp</label>
              <div className="tg-mode-grid">
                {MODES.map(m => (
                  <button
                    key={m.id}
                    className={`tg-mode-btn${mode === m.id ? ' active' : ''}`}
                    onClick={() => setMode(m.id)}
                  >{m.label}</button>
                ))}
              </div>
              <p className="tg-mode-hint">{modeHint}</p>
            </div>

            {/* Phí chuyển đổi (fee mode) */}
            {mode === 'fee' && (
              <div className="tg-input-row">
                <label className="tg-input-label">Phí chuyển đổi (%/tháng)</label>
                <div className="tg-input-field">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="1"
                    value={feeStr}
                    onChange={e => setFeeStr(e.target.value.replace(/[^0-9,.]/g, ''))}
                  />
                  <span className="tg-input-unit">%/tháng</span>
                </div>
                <div className="tg-chips">
                  {[0.5, 1, 1.5, 2].map(v => (
                    <button
                      key={v}
                      className={`tg-chip${parseRate(feeStr) === v ? ' active' : ''}`}
                      onClick={() => setFeeStr(String(v).replace('.', ','))}
                    >{String(v).replace('.', ',')}%</button>
                  ))}
                </div>
              </div>
            )}

            {/* Lãi suất (interest mode) */}
            {mode === 'interest' && (
              <div className="tg-input-row">
                <label className="tg-input-label">Lãi suất (%/năm)</label>
                <div className="tg-input-field">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="20"
                    value={rateStr}
                    onChange={e => setRateStr(e.target.value.replace(/[^0-9,.]/g, ''))}
                  />
                  <span className="tg-input-unit">%/năm</span>
                </div>
                <div className="tg-chips">
                  {[15, 20, 25, 30].map(v => (
                    <button
                      key={v}
                      className={`tg-chip${parseRate(rateStr) === v ? ' active' : ''}`}
                      onClick={() => setRateStr(String(v))}
                    >{v}%</button>
                  ))}
                </div>
              </div>
            )}

            {/* Số tháng */}
            <div className="tg-input-row">
              <label className="tg-input-label">Số tháng trả góp</label>
              <div className="tg-input-field">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="12"
                  value={termStr}
                  onChange={e => setTermStr(e.target.value.replace(/\D/g, ''))}
                />
                <span className="tg-input-unit">tháng</span>
              </div>
              <div className="tg-chips">
                {TERM_PRESETS.map(v => (
                  <button
                    key={v}
                    className={`tg-chip${parseInt(termStr) === v ? ' active' : ''}`}
                    onClick={() => setTermStr(String(v))}
                  >{v}T</button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── Result card ── */}
        <div className="tg-card tg-result">

          {!valid && (
            <div className="tg-empty">
              <span className="tg-empty-arrow">↑</span>
              <span>Nhập giá sản phẩm để tính</span>
            </div>
          )}

          {valid && rows.length > 0 && (
            <>
              {/* Summary */}
              <div className="tg-summary">
                <div className="tg-sum-hero">
                  <span className="tg-sum-hero-label">Trả mỗi tháng</span>
                  <span className="tg-sum-hero-val">{fmtFull(monthlyPayment)}</span>
                  {mode === 'free' && (
                    <span className="tg-free-badge">Không phí — không lãi</span>
                  )}
                </div>

                <div className="tg-sum-rows">
                  <div className="tg-sum-row">
                    <span className="tg-sum-label">Giá sản phẩm</span>
                    <span className="tg-sum-val">{fmtFull(price)}</span>
                  </div>

                  {totalFees > 0 && (
                    <>
                      <div className="tg-sum-row">
                        <span className="tg-sum-label">
                          {mode === 'fee' ? 'Tổng phí chuyển đổi' : 'Tổng lãi phải trả'}
                        </span>
                        <span className="tg-sum-val tg-red">{fmtFull(totalFees)}</span>
                      </div>
                      <div className="tg-sum-row">
                        <span className="tg-sum-label">Tổng phải trả</span>
                        <span className="tg-sum-val">{fmtFull(totalPaid)}</span>
                      </div>
                    </>
                  )}

                  {/* Effective rate insight — chỉ hiện cho fee mode */}
                  {mode === 'fee' && effectiveAPR > 0 && (
                    <div className="tg-sum-row tg-sum-row--highlight">
                      <span className="tg-sum-label">Lãi suất thực tế</span>
                      <span className="tg-sum-val tg-red">{effectiveAPR.toFixed(1)}%/năm</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Table — chỉ fee & interest */}
              {mode !== 'free' && (
                <>
                  <div className="tg-sec-label">Lịch thanh toán</div>
                  <div className="tg-table">
                    <div className="tg-thead">
                      <span>Tháng</span>
                      <span>Gốc</span>
                      <span>{mode === 'fee' ? 'Phí' : 'Lãi'}</span>
                      <span>Dư nợ</span>
                    </div>
                    {rows.map(r => (
                      <div key={r.month} className="tg-trow">
                        <span className="tg-tm">T{r.month}</span>
                        <span className="tg-tp">{fmtCompact(r.principalPart)}</span>
                        <span className="tg-ti">{fmtCompact(r.fee)}</span>
                        <span className={`tg-tb${r.balance <= 0 ? ' zero' : ''}`}>
                          {r.balance <= 0 ? 'Hết nợ' : fmtCompact(r.balance)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="tg-actions">
                <button className="tg-btn-share" onClick={handleShare}>
                  <HugeiconsIcon icon={Link01Icon} size={16} color="currentColor" strokeWidth={2} />
                  Copy link kết quả
                </button>
              </div>
            </>
          )}
        </div>

        {valid && monthlyPayment > 0 && (
          <AffiliateBlock
            tool="tra-gop"
            cta={{
              benefit:
                mode === 'interest'
                  ? 'Vay tín chấp thay vì trả góp — lãi có thể rẻ hơn'
                  : 'Cần tiền mặt cho khoản mua này? Duyệt trong 5 phút',
              contextLine: `Hàng ${fmtFull(price)}, trả góp ~${fmtFull(monthlyPayment)}/tháng.`,
            }}
          />
        )}

        {valid && mode === 'fee' && effectiveAPR > 0 && (
          <div className="tg-disclaimer">
            📌 "0% lãi suất" nhưng phí chuyển đổi {feeStr}%/tháng tương đương lãi suất thực <strong>{effectiveAPR.toFixed(1)}%/năm</strong>. Hãy so sánh trước khi quyết định.
          </div>
        )}

        {valid && mode === 'interest' && (
          <div className="tg-disclaimer">
            📌 Kết quả tham khảo. Lãi suất và phí thực tế phụ thuộc hợp đồng với đơn vị tài chính.
          </div>
        )}

        <a
          className="tg-cta"
          href="https://app.chilathu.com?utm_source=tienich.chilathu.com&utm_medium=tool&utm_campaign=tragop_footer"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAppCrosslink('tra-gop', { campaign: 'tragop_footer' })}
        >
          Theo dõi thu chi với Chilathu.com
          <HugeiconsIcon icon={LinkSquare01Icon} size={14} color="currentColor" strokeWidth={1.5} />
        </a>

        <div className="tg-footer">© ChilàThu · Kết quả mang tính tham khảo</div>
      </div>

      <div className={`tg-toast${toastVis ? ' show' : ''}`}>Đã copy link — paste để chia sẻ</div>
    </div>
  )
}
