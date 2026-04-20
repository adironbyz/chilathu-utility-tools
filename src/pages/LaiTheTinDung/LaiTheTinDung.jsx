import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo.jsx'
import SEO from '../../components/SEO.jsx'
import { HugeiconsIcon } from '@hugeicons/react'
import { DashboardSquare01Icon, Link01Icon, LinkSquare01Icon } from '@hugeicons/core-free-icons'
import { AffiliateBlock } from '../../components/affiliate/index.js'
import '../../components/affiliate/Affiliate.css'
import './LaiTheTinDung.css'

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

// Compact display for table cells
function fmtCompact(n) {
  if (n <= 0)           return 'Hết nợ'
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' tỷ'
  if (n >= 1_000_000)   return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'tr'
  if (n >= 1_000)       return Math.round(n / 1_000) + 'k'
  return n.toLocaleString('vi-VN') + 'đ'
}

// Full display for summary row
function fmtFull(n) {
  return n.toLocaleString('vi-VN') + 'đ'
}

const MIN_PCT    = 0.05
const MIN_FLOOR  = 200_000
const MAX_MONTHS = 60

// ─── Calculation ─────────────────────────────────────────────────────────────

function calcRows(balance, rate, mode, customPmt, viewMonths) {
  const r    = rate / 100
  let   bal  = balance
  const rows = []
  const maxM = mode === 'none' ? viewMonths : MAX_MONTHS

  for (let i = 1; i <= maxM; i++) {
    if (bal <= 0) break
    const interest = Math.round(bal * r)
    let   payment  = 0

    if (mode === 'min') {
      payment = Math.min(
        Math.max(Math.round(bal * MIN_PCT), MIN_FLOOR),
        bal + interest
      )
    } else if (mode === 'custom') {
      payment = Math.min(customPmt, bal + interest)
    }

    const closeBal = Math.max(0, bal + interest - payment)
    rows.push({ month: i, openBal: bal, interest, payment, closeBal })
    bal = closeBal
  }

  return rows
}

// ─── Share URL ───────────────────────────────────────────────────────────────

function encodeShareUrl(balance, rateStr, mode, custPmt, viewMonths) {
  const p = new URLSearchParams({ b: balance, r: rateStr, m: mode })
  if (mode === 'custom' && custPmt > 0) p.set('c', custPmt)
  if (mode === 'none') p.set('v', viewMonths)
  return `${window.location.origin}/lai-the-tin-dung?${p.toString()}`
}

function readShareParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    balInput:   p.get('b') ? formatInput(p.get('b')) : '',
    rateStr:    p.get('r') || '2,5',
    mode:       ['none','min','custom'].includes(p.get('m')) ? p.get('m') : 'none',
    custInput:  p.get('c') ? formatInput(p.get('c')) : '',
    viewMonths: parseInt(p.get('v') || '6') || 6,
  }
}

// ─── Rate presets ─────────────────────────────────────────────────────────────

const RATES = [
  { label: '2,35%', val: 2.35 },
  { label: '2,5%',  val: 2.5  },
  { label: '3%',    val: 3.0  },
  { label: '3,5%',  val: 3.5  },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LaiTheTinDung() {
  const navigate = useNavigate()
  const init     = readShareParams()

  const [balInput,    setBalInput]   = useState(init.balInput)
  const [rateStr,     setRateStr]    = useState(init.rateStr)
  const [mode,        setMode]       = useState(init.mode)
  const [custInput,   setCustInput]  = useState(init.custInput)
  const [viewMonths,  setViewMonths] = useState(init.viewMonths)
  const [toastMsg,    setToastMsg]   = useState('')
  const [toastVis,    setToastVis]   = useState(false)

  const balance = parseVND(balInput)
  const rate    = parseRate(rateStr)
  const custPmt = parseVND(custInput)
  const valid   = balance > 0 && rate > 0

  const monthlyInterest = valid ? Math.round(balance * rate / 100) : 0
  const paymentTooLow   = mode === 'custom' && custPmt > 0 && custPmt <= monthlyInterest
  const noCustomAmt     = mode === 'custom' && custPmt <= 0

  const rows = useMemo(() => {
    if (!valid || paymentTooLow || noCustomAmt) return []
    return calcRows(balance, rate, mode, custPmt, viewMonths)
  }, [valid, balance, rate, mode, custPmt, viewMonths, paymentTooLow, noCustomAmt])

  const totalInterest = rows.reduce((s, r) => s + r.interest, 0)
  const totalPayment  = rows.reduce((s, r) => s + r.payment,  0)
  const lastRow       = rows[rows.length - 1]
  const isPaidOff     = lastRow?.closeBal <= 0
  const finalBal      = lastRow ? lastRow.closeBal : balance
  const hitsCap       = mode !== 'none' && !isPaidOff && rows.length >= MAX_MONTHS
  const hasFourCols   = mode !== 'none'

  const showResult = valid && !paymentTooLow && !noCustomAmt && rows.length > 0

  const handleShare = useCallback(() => {
    const url = encodeShareUrl(balance, rateStr, mode, custPmt, viewMonths)
    navigator.clipboard.writeText(url).then(() => {
      setToastMsg('Đã copy link — paste để chia sẻ')
      setToastVis(true)
      setTimeout(() => setToastVis(false), 2200)
    })
  }, [balance, rateStr, mode, custPmt, viewMonths])

  return (
    <div className="ltc-page notebook-bg">
      <SEO
        title="Tính Lãi Thẻ Tín Dụng Quá Hạn — Tính nhanh lãi phát sinh"
        description="Tính lãi thẻ tín dụng khi không trả đủ hoặc quá hạn. Nhập dư nợ, lãi suất, số tiền trả mỗi tháng để biết tổng lãi phát sinh và bao lâu trả hết."
        path="/lai-the-tin-dung"
        keywords="lãi thẻ tín dụng, tính lãi thẻ, thẻ tín dụng quá hạn, lãi suất thẻ tín dụng, tính lãi suất thẻ"
      />

      {/* ── Header ── */}
      <header className="ltc-header">
        <Logo />
        <button className="ltc-menu-btn" onClick={() => navigate('/')} aria-label="Tất cả công cụ">
          <HugeiconsIcon icon={DashboardSquare01Icon} size={22} color="currentColor" strokeWidth={1.5} />
        </button>
      </header>

      <div className="ltc-content">
        <h1 className="ltc-page-title">Tính lãi thẻ tín dụng quá hạn</h1>

        {/* ── Input card ── */}
        <div className="ltc-card">
          <div className="ltc-card-title">Thông tin thẻ</div>
          <div className="ltc-inputs">

            {/* Dư nợ */}
            <div className="ltc-input-row">
              <label className="ltc-input-label">Dư nợ hiện tại</label>
              <div className="ltc-input-field">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ví dụ: 5.000.000"
                  value={balInput}
                  onChange={e => setBalInput(formatInput(e.target.value))}
                  autoFocus
                />
                <span className="ltc-input-unit">đ</span>
              </div>
            </div>

            {/* Lãi suất */}
            <div className="ltc-input-row">
              <label className="ltc-input-label">Lãi suất / tháng</label>
              <div className="ltc-rate-wrap">
                <div className="ltc-input-field ltc-rate-input">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="2,5"
                    value={rateStr}
                    onChange={e => setRateStr(e.target.value.replace(/[^0-9,\.]/g, ''))}
                  />
                  <span className="ltc-input-unit">%</span>
                </div>
                <div className="ltc-rate-chips">
                  {RATES.map(r => (
                    <button
                      key={r.val}
                      className={`ltc-rate-chip${parseRate(rateStr) === r.val ? ' active' : ''}`}
                      onClick={() => setRateStr(String(r.val).replace('.', ','))}
                    >{r.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment mode */}
            <div className="ltc-input-row">
              <label className="ltc-input-label">Trả mỗi tháng</label>
              <div className="ltc-mode-pills">
                {[
                  { id: 'none',   label: 'Không trả'    },
                  { id: 'min',    label: 'Tối thiểu 5%' },
                  { id: 'custom', label: 'Tự nhập'       },
                ].map(m => (
                  <button
                    key={m.id}
                    className={`ltc-mode-pill${mode === m.id ? ' active' : ''}`}
                    onClick={() => setMode(m.id)}
                  >{m.label}</button>
                ))}
              </div>

              {mode === 'custom' && (
                <div className="ltc-input-field ltc-custom-input">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Số tiền trả mỗi tháng"
                    value={custInput}
                    onChange={e => setCustInput(formatInput(e.target.value))}
                  />
                  <span className="ltc-input-unit">đ</span>
                </div>
              )}

              {paymentTooLow && (
                <div className="ltc-warn-inline">
                  ⚠️ Số tiền trả ({fmtFull(custPmt)}) thấp hơn lãi phát sinh tháng đầu ({fmtFull(monthlyInterest)}). Dư nợ sẽ tiếp tục tăng.
                </div>
              )}
            </div>

            {/* Xem N tháng — chỉ dùng cho mode "none" */}
            {mode === 'none' && (
              <div className="ltc-stepper-row">
                <span className="ltc-stepper-label">Xem trước</span>
                <div className="ltc-stepper">
                  <button
                    className="ltc-stepper-btn"
                    onClick={() => setViewMonths(v => Math.max(1, v - 1))}
                    disabled={viewMonths <= 1}
                  >−</button>
                  <span className="ltc-stepper-val">{viewMonths} tháng</span>
                  <button
                    className="ltc-stepper-btn"
                    onClick={() => setViewMonths(v => Math.min(24, v + 1))}
                    disabled={viewMonths >= 24}
                  >+</button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Result card ── */}
        <div className="ltc-card ltc-result">

          {!valid && (
            <div className="ltc-empty">
              <span className="ltc-empty-arrow">↑</span>
              <span>Nhập dư nợ ở trên để tính</span>
            </div>
          )}

          {showResult && (
            <>
              {/* Summary */}
              <div className="ltc-summary">
                <div className="ltc-sum-row">
                  <span className="ltc-sum-label">Tổng lãi phát sinh</span>
                  <span className="ltc-sum-val ltc-red">{fmtFull(totalInterest)}</span>
                </div>
                {mode !== 'none' && (
                  <div className="ltc-sum-row">
                    <span className="ltc-sum-label">Tổng tiền đã trả</span>
                    <span className="ltc-sum-val">{fmtFull(totalPayment)}</span>
                  </div>
                )}
                {mode === 'none' && (
                  <div className="ltc-sum-row">
                    <span className="ltc-sum-label">Dư nợ sau {viewMonths} tháng</span>
                    <span className="ltc-sum-val ltc-red">{fmtFull(finalBal)}</span>
                  </div>
                )}
                {isPaidOff && (
                  <div className="ltc-paid-note">✓ Trả hết trong {rows.length} tháng</div>
                )}
                {hitsCap && (
                  <div className="ltc-warn-note">⚠️ Chưa trả hết sau {MAX_MONTHS} tháng — cân nhắc tăng số tiền trả mỗi tháng</div>
                )}
              </div>

              {/* Chi tiết */}
              <div className="ltc-sec-label">Chi tiết từng tháng</div>
              <div className={`ltc-table${hasFourCols ? ' ltc-table--4' : ''}`}>
                <div className="ltc-thead">
                  <span>Tháng</span>
                  <span>Lãi</span>
                  {hasFourCols && <span>Đã trả</span>}
                  <span>Dư nợ</span>
                </div>
                {rows.map(r => (
                  <div key={r.month} className="ltc-trow">
                    <span className="ltc-tm">T{r.month}</span>
                    <span className="ltc-ti">{fmtCompact(r.interest)}</span>
                    {hasFourCols && <span className="ltc-tp">{fmtCompact(r.payment)}</span>}
                    <span className={`ltc-tb${r.closeBal <= 0 ? ' zero' : ''}`}>
                      {r.closeBal <= 0 ? 'Hết nợ' : fmtCompact(r.closeBal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Share CTA */}
              <div className="ltc-actions">
                <button className="ltc-btn-share" onClick={handleShare}>
                  <HugeiconsIcon icon={Link01Icon} size={16} color="currentColor" strokeWidth={2} />
                  Copy link kết quả
                </button>
              </div>
            </>
          )}
        </div>

        {/* Affiliate block — angle: "user đang đốt tiền lãi thẻ, cân nhắc vay tín chấp lãi thấp hơn" */}
        {valid && monthlyInterest > 0 && (
          <AffiliateBlock
            tool="lai-the-tin-dung"
            cta={{
              benefit: 'Vay trả nợ thẻ — lãi thường thấp hơn 2–3 lần',
              contextLine: `Mỗi tháng thẻ đang tính ~${fmtFull(monthlyInterest)} tiền lãi.`,
            }}
          />
        )}

        {/* Disclaimer */}
        {valid && (
          <div className="ltc-disclaimer">
            📌 Lãi tính trên dư nợ đầu kỳ. Tối thiểu 5% hoặc 200.000đ tùy điều khoản ngân hàng. Lãi suất thực tế phụ thuộc hợp đồng thẻ.
          </div>
        )}

        {/* Soft CTA */}
        <a
          className="ltc-cta"
          href="https://app.chilathu.com?utm_source=tienich.chilathu.com&utm_medium=tool&utm_campaign=ltc_footer"
          target="_blank"
          rel="noopener noreferrer"
        >
          Theo dõi thu chi với Chilathu.com
          <HugeiconsIcon icon={LinkSquare01Icon} size={14} color="currentColor" strokeWidth={1.5} />
        </a>

        <div className="ltc-footer">
          © ChilàThu · Lãi suất tham khảo thị trường
        </div>
      </div>

      {/* Toast */}
      <div className={`ltc-toast${toastVis ? ' show' : ''}`}>{toastMsg}</div>
    </div>
  )
}
