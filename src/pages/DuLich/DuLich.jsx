import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo.jsx'
import SEO from '../../components/SEO.jsx'
import { HugeiconsIcon } from '@hugeicons/react'
import { DashboardSquare01Icon, Copy01Icon, LinkSquare01Icon } from '@hugeicons/core-free-icons'
import './DuLich.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _id = 1
function genId() { return String(_id++) }

// ─── LocalStorage persistence ─────────────────────────────────────────────────

const STORAGE_KEY = 'dl_session_v1'

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    const ids = (data.expenses || []).map(e => parseInt(e.id) || 0)
    if (ids.length > 0) _id = Math.max(...ids) + 1
    return data
  } catch {
    return null
  }
}

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

function fmtFull(n) {
  return Math.round(n).toLocaleString('vi-VN') + 'đ'
}

function fmtCompact(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' tỷ'
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'tr'
  if (n >= 1_000)         return Math.round(n / 1_000) + 'k'
  return n.toLocaleString('vi-VN') + 'đ'
}

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'flight',    emoji: '✈️', label: 'Vé' },
  { id: 'hotel',     emoji: '🏨', label: 'Lưu trú' },
  { id: 'food',      emoji: '🍜', label: 'Ăn uống' },
  { id: 'transport', emoji: '🚌', label: 'Đi lại' },
  { id: 'activity',  emoji: '🎡', label: 'Vui chơi' },
  { id: 'shopping',  emoji: '🛍️', label: 'Mua sắm' },
  { id: 'other',     emoji: '📦', label: 'Khác' },
]

const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸', name: 'USD', defaultRate: '25000' },
  { code: 'THB', flag: '🇹🇭', name: 'THB', defaultRate: '710'   },
  { code: 'JPY', flag: '🇯🇵', name: 'JPY', defaultRate: '167'   },
  { code: 'KRW', flag: '🇰🇷', name: 'KRW', defaultRate: '18'    },
  { code: 'EUR', flag: '🇪🇺', name: 'EUR', defaultRate: '27000' },
  { code: 'SGD', flag: '🇸🇬', name: 'SGD', defaultRate: '18800' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DuLich() {
  const navigate = useNavigate()

  const [destInput,    setDestInput]    = useState(() => loadSession()?.destInput    ?? '')
  const [peopleStr,    setPeopleStr]    = useState(() => loadSession()?.peopleStr   ?? '2')
  const [expenses,     setExpenses]     = useState(() => loadSession()?.expenses    ?? [])

  // Add expense form
  const [showForm,     setShowForm]     = useState(false)
  const [draftCat,     setDraftCat]     = useState('food')
  const [draftDesc,    setDraftDesc]    = useState('')
  const [draftAmtInput, setDraftAmtInput] = useState('')
  const [draftForeign, setDraftForeign] = useState(false)

  // Currency
  const [showCurrency,  setShowCurrency]  = useState(false)
  const [currency,      setCurrency]      = useState(() => loadSession()?.currency  ?? 'USD')
  const [rateInput,     setRateInput]     = useState(() => loadSession()?.rateInput ?? '25000')

  const [toastMsg,     setToastMsg]     = useState('')
  const [toastVis,     setToastVis]     = useState(false)
  const [toastUndo,    setToastUndo]    = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const toastTimer   = useRef(null)
  const confirmTimer = useRef(null)

  // ── Persist session ─────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      destInput, peopleStr, expenses, currency, rateInput,
    }))
  }, [destInput, peopleStr, expenses, currency, rateInput])

  function showToast(msg, undoFn = null, duration = 2200) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToastMsg(msg)
    setToastUndo(undoFn ? () => undoFn : null)
    setToastVis(true)
    toastTimer.current = setTimeout(() => {
      setToastVis(false)
      setToastUndo(null)
    }, duration)
  }

  function requestClear() {
    if (confirmClear) {
      clearTimeout(confirmTimer.current)
      setConfirmClear(false)
      clearSession()
    } else {
      setConfirmClear(true)
      confirmTimer.current = setTimeout(() => setConfirmClear(false), 3000)
    }
  }

  function clearSession() {
    const backup = { destInput, peopleStr, expenses, currency, rateInput }
    setDestInput('')
    setPeopleStr('2')
    setExpenses([])
    setCurrency('USD')
    setRateInput('25000')
    setShowForm(false)
    setDraftDesc('')
    setDraftAmtInput('')
    setDraftForeign(false)
    showToast('Đã xoá phiên', () => {
      setDestInput(backup.destInput)
      setPeopleStr(backup.peopleStr)
      setExpenses(backup.expenses)
      setCurrency(backup.currency)
      setRateInput(backup.rateInput)
      showToast('Đã hoàn tác')
    }, 4000)
  }

  const people  = Math.max(1, parseInt(peopleStr) || 1)
  const rate    = parseRate(rateInput.replace(/\./g, ''))

  const currentCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0]

  function toVND(amount, isForeign) {
    if (!isForeign) return amount
    return Math.round(amount * rate)
  }

  function addExpense() {
    const rawAmount = parseVND(draftAmtInput)
    if (!rawAmount) return
    setExpenses(prev => [...prev, {
      id:        genId(),
      category:  draftCat,
      desc:      draftDesc.trim(),
      rawAmount,
      isForeign: draftForeign,
      vndAmount: toVND(rawAmount, draftForeign),
    }])
    setDraftDesc('')
    setDraftAmtInput('')
    setShowForm(false)
  }

  // Recompute vndAmount for all foreign expenses when rate changes
  const expensesWithVND = useMemo(() =>
    expenses.map(e => ({
      ...e,
      vndAmount: e.isForeign ? Math.round(e.rawAmount * rate) : e.rawAmount,
    })),
    [expenses, rate]
  )

  const totalVND      = expensesWithVND.reduce((s, e) => s + e.vndAmount, 0)
  const perPersonVND  = people > 0 ? totalVND / people : 0

  // By category
  const byCategory = useMemo(() => {
    const map = {}
    CATEGORIES.forEach(c => { map[c.id] = 0 })
    expensesWithVND.forEach(e => { map[e.category] = (map[e.category] || 0) + e.vndAmount })
    return CATEGORIES.filter(c => map[c.id] > 0).map(c => ({ ...c, total: map[c.id] }))
  }, [expensesWithVND])

  function handleCopy() {
    const dest = destInput.trim() || 'chuyến đi'
    const lines = [
      `Chi phí ${dest} — ${people} người`,
      `Tổng: ${fmtFull(totalVND)} · Mỗi người: ${fmtFull(perPersonVND)}`,
      '',
      ...byCategory.map(c => `${c.emoji} ${c.label}: ${fmtFull(c.total)}`),
    ]
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Đã copy tổng kết'))
  }

  const catEmoji = id => CATEGORIES.find(c => c.id === id)?.emoji || '📦'
  const catLabel = id => CATEGORIES.find(c => c.id === id)?.label || 'Khác'

  return (
    <div className="dl-page notebook-bg">
      <SEO
        title="Chi Phí Du Lịch — Lên ngân sách chuyến đi, đổi ngoại tệ"
        description="Tính chi phí du lịch, lên ngân sách theo hạng mục (vé, lưu trú, ăn uống...), đổi ngoại tệ, chia tiền theo đầu người."
        path="/chi-phi-du-lich"
        keywords="chi phí du lịch, ngân sách du lịch, đổi ngoại tệ, tính tiền du lịch, chia tiền du lịch"
      />

      <header className="dl-header">
        <Logo />
        <button className="dl-menu-btn" onClick={() => navigate('/')} aria-label="Tất cả công cụ">
          <HugeiconsIcon icon={DashboardSquare01Icon} size={22} color="currentColor" strokeWidth={1.5} />
        </button>
      </header>

      <div className="dl-content">
        <h1 className="dl-page-title">Chi phí du lịch</h1>

        {/* ── Trip info ── */}
        <div className="dl-card">
          <div className="dl-card-title">Thông tin chuyến đi</div>
          <div className="dl-inputs">

            <div className="dl-input-row">
              <label className="dl-input-label">Điểm đến (tuỳ chọn)</label>
              <div className="dl-input-field">
                <input
                  type="text"
                  placeholder="VD: Đà Nẵng, Thái Lan, Nhật..."
                  value={destInput}
                  onChange={e => setDestInput(e.target.value)}
                  maxLength={40}
                />
              </div>
            </div>

            <div className="dl-input-row">
              <label className="dl-input-label">Số người đi</label>
              <div className="dl-stepper-row">
                <button
                  className="dl-stepper-btn"
                  onClick={() => setPeopleStr(String(Math.max(1, people - 1)))}
                  disabled={people <= 1}
                >−</button>
                <span className="dl-stepper-val">{people}</span>
                <button
                  className="dl-stepper-btn"
                  onClick={() => setPeopleStr(String(people + 1))}
                >+</button>
              </div>
              <div className="dl-chips">
                {[1, 2, 3, 4, 5, 6].map(v => (
                  <button
                    key={v}
                    className={`dl-chip${people === v ? ' active' : ''}`}
                    onClick={() => setPeopleStr(String(v))}
                  >{v} người</button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── Currency card ── */}
        <div className="dl-card">
          <button
            className={`dl-currency-toggle${showCurrency ? ' active' : ''}`}
            onClick={() => setShowCurrency(v => !v)}
          >
            <span className="dl-currency-check">{showCurrency ? '✓' : '+'}</span>
            Đổi ngoại tệ — nhập chi phí bằng ngoại tệ
          </button>

          {showCurrency && (
            <div className="dl-currency-box">
              <div className="dl-input-row">
                <label className="dl-input-label">Đồng tiền</label>
                <div className="dl-currency-grid">
                  {CURRENCIES.map(c => (
                    <button
                      key={c.code}
                      className={`dl-currency-btn${currency === c.code ? ' active' : ''}`}
                      onClick={() => { setCurrency(c.code); setRateInput(c.defaultRate) }}
                    >{c.flag} {c.code}</button>
                  ))}
                </div>
              </div>
              <div className="dl-input-row">
                <label className="dl-input-label">1 {currentCurrency.code} = ? VND</label>
                <div className="dl-input-field">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={currentCurrency.defaultRate}
                    value={rateInput}
                    onChange={e => setRateInput(formatInput(e.target.value))}
                  />
                  <span className="dl-input-unit">đ</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Expenses card ── */}
        <div className="dl-card">
          <div className="dl-card-title-row">
            <span className="dl-card-title">
              Chi phí {expensesWithVND.length > 0 && `· ${fmtCompact(totalVND)}`}
            </span>
            {expenses.length > 0 && (
              <button
                className={`dl-clear-btn${confirmClear ? ' confirm' : ''}`}
                onClick={requestClear}
              >{confirmClear ? 'Xác nhận?' : 'Xoá phiên'}</button>
            )}
          </div>

          {expensesWithVND.length > 0 && (
            <div className="dl-expense-list">
              {expensesWithVND.map(e => (
                <div key={e.id} className="dl-expense-item">
                  <span className="dl-expense-emoji">{catEmoji(e.category)}</span>
                  <div className="dl-expense-middle">
                    <span className="dl-expense-desc">{e.desc || catLabel(e.category)}</span>
                    {e.isForeign && (
                      <span className="dl-expense-foreign">
                        {e.rawAmount.toLocaleString('vi-VN')} {currency} × {fmtCompact(rate)}
                      </span>
                    )}
                  </div>
                  <span className="dl-expense-amount">{fmtCompact(e.vndAmount)}</span>
                  <button
                    className="dl-expense-remove"
                    onClick={() => setExpenses(prev => prev.filter(x => x.id !== e.id))}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          {showForm ? (
            <div className="dl-add-form">
              <div className="dl-input-row">
                <label className="dl-input-label">Hạng mục</label>
                <div className="dl-cat-chips">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      className={`dl-cat-chip${draftCat === c.id ? ' active' : ''}`}
                      onClick={() => setDraftCat(c.id)}
                    >{c.emoji} {c.label}</button>
                  ))}
                </div>
              </div>

              <div className="dl-input-row">
                <label className="dl-input-label">Mô tả (tuỳ chọn)</label>
                <div className="dl-input-field">
                  <input
                    type="text"
                    placeholder="VD: Vé máy bay VN Airlines..."
                    value={draftDesc}
                    onChange={e => setDraftDesc(e.target.value)}
                    maxLength={40}
                    autoFocus
                  />
                </div>
              </div>

              <div className="dl-input-row">
                <div className="dl-amt-label-row">
                  <label className="dl-input-label">Số tiền</label>
                  {showCurrency && (
                    <button
                      className={`dl-foreign-toggle${draftForeign ? ' active' : ''}`}
                      onClick={() => setDraftForeign(v => !v)}
                    >
                      {draftForeign ? `${currency} ✓` : `Nhập bằng ${currency}`}
                    </button>
                  )}
                </div>
                <div className="dl-input-field">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Nhập số tiền"
                    value={draftAmtInput}
                    onChange={e => setDraftAmtInput(formatInput(e.target.value))}
                  />
                  <span className="dl-input-unit">{draftForeign ? currency : 'đ'}</span>
                </div>
                {draftForeign && parseVND(draftAmtInput) > 0 && rate > 0 && (
                  <span className="dl-convert-hint">
                    ≈ {fmtFull(toVND(parseVND(draftAmtInput), true))}
                  </span>
                )}
              </div>

              <div className="dl-form-actions">
                <button className="dl-btn-cancel" onClick={() => { setShowForm(false); setDraftDesc(''); setDraftAmtInput(''); setDraftForeign(false) }}>
                  Huỷ
                </button>
                <button
                  className="dl-btn-add"
                  onClick={addExpense}
                  disabled={!parseVND(draftAmtInput)}
                >Thêm</button>
              </div>
            </div>
          ) : (
            <button className="dl-add-btn" onClick={() => setShowForm(true)}>
              + Thêm chi phí
            </button>
          )}
        </div>

        {/* ── Summary card ── */}
        {totalVND > 0 && (
          <div className="dl-card dl-result">
            <div className="dl-sum-hero">
              <span className="dl-sum-hero-label">Mỗi người</span>
              <span className="dl-sum-hero-val">{fmtFull(perPersonVND)}</span>
              {people > 1 && (
                <span className="dl-sum-hero-sub">Tổng {people} người: {fmtFull(totalVND)}</span>
              )}
            </div>

            {byCategory.length > 1 && (
              <>
                <div className="dl-sec-label">Theo hạng mục</div>
                <div className="dl-cat-breakdown">
                  {byCategory.map(c => (
                    <div key={c.id} className="dl-cat-row">
                      <span className="dl-cat-emoji">{c.emoji}</span>
                      <span className="dl-cat-name">{c.label}</span>
                      <div className="dl-cat-bar-wrap">
                        <div
                          className="dl-cat-bar"
                          style={{ width: `${(c.total / totalVND * 100).toFixed(0)}%` }}
                        />
                      </div>
                      <span className="dl-cat-pct">{(c.total / totalVND * 100).toFixed(0)}%</span>
                      <span className="dl-cat-amount">{fmtCompact(c.total)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="dl-actions">
              <button className="dl-btn-share" onClick={handleCopy}>
                <HugeiconsIcon icon={Copy01Icon} size={16} color="currentColor" strokeWidth={2} />
                Copy tổng kết
              </button>
            </div>
          </div>
        )}

        <a
          className="dl-cta"
          href="https://app.chilathu.com?utm_source=tools.chilathu.com&utm_medium=tool&utm_campaign=dulich_footer"
          target="_blank"
          rel="noopener noreferrer"
        >
          Theo dõi thu chi với Chilathu.com
          <HugeiconsIcon icon={LinkSquare01Icon} size={14} color="currentColor" strokeWidth={1.5} />
        </a>

        <div className="dl-footer">© ChilàThu</div>
      </div>

      <div className={`dl-toast${toastVis ? ' show' : ''}${toastUndo ? ' dl-toast--action' : ''}`}>
        <span>{toastMsg}</span>
        {toastUndo && (
          <button
            className="dl-toast-undo"
            onClick={() => { toastUndo(); setToastVis(false); setToastUndo(null) }}
          >Hoàn tác</button>
        )}
      </div>
    </div>
  )
}
