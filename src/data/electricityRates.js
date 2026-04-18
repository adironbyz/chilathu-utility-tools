/**
 * Biểu giá bán lẻ điện — ChilàThu Tools
 * Cập nhật: khi có QĐ mới, đẩy `current` → `previous`, thêm `current` mới.
 * Nguồn: EVN + Bộ Công Thương
 */

export const rates = {
  current: {
    label: 'QĐ 1279/QĐ-BCT',
    date: '09/5/2025',
    effectiveFrom: '10/5/2025',
    sourceUrl: 'https://www.evn.com.vn/d/vi-VN/news/Bieu-gia-ban-le-dien-theo-Quyet-dinh-so-1279QD-BCT-ngay-0952025-cua-Bo-Cong-Thuong-60-28-502668',
    vat: 0.08,

    // ─── Sinh hoạt: 6 bậc thang, thống nhất toàn quốc ───
    residential: [
      { tier: 1, min: 0,   max: 50,       price: 1984 },
      { tier: 2, min: 51,  max: 100,      price: 2050 },
      { tier: 3, min: 101, max: 200,      price: 2380 },
      { tier: 4, min: 201, max: 300,      price: 2998 },
      { tier: 5, min: 301, max: 400,      price: 3350 },
      { tier: 6, min: 401, max: Infinity, price: 3460 },
    ],

    // ─── Kinh doanh: TOU theo cấp điện áp — QĐ 1279 có 3 tier ───
    // Đơn vị: đồng/kWh, chưa VAT
    business: {
      'tu-22kv':  { label: 'Từ 22kV trở lên',   off: 1609, normal: 2887, peak: 5025 },
      '6kv-22kv': { label: '6kV – dưới 22kV',   off: 1829, normal: 3108, peak: 5202 },
      'duoi-6kv': { label: 'Dưới 6kV',          off: 1918, normal: 3152, peak: 5422 },
    },

    // ─── Sản xuất công nghiệp: TOU theo cấp điện áp ───
    // Đơn vị: đồng/kWh, chưa VAT
    industrial: {
      '110kv':      { label: 'Từ 110kV trở lên',  off: 1146, normal: 1811, peak: 3266 },
      '22kv-110kv': { label: '22kV – dưới 110kV', off: 1190, normal: 1833, peak: 3398 },
      '6kv-22kv':   { label: '6kV – dưới 22kV',  off: 1234, normal: 1899, peak: 3508 },
      'duoi-6kv':   { label: 'Dưới 6kV',          off: 1300, normal: 1987, peak: 3640 },
    },

    // ─── Nông nghiệp ───
    // ⚠️ Chưa có data từ QĐ 1279 — cần bổ sung
    agricultural: {
      'duoi-6kv':   { label: 'Dưới 6kV',          off: null, normal: null, peak: null },
      '6kv-22kv':   { label: '6kV – dưới 22kV',  off: null, normal: null, peak: null },
      '22kv-110kv': { label: '22kV – dưới 110kV', off: null, normal: null, peak: null },
      '110kv':      { label: 'Từ 110kV trở lên',  off: null, normal: null, peak: null },
    },

    // ─── Hành chính sự nghiệp: flat rate, 4 loại × 2 cấp điện áp ───
    // Đơn vị: đồng/kWh, chưa VAT
    administrative: {
      'bv-tu-6kv':   { label: 'BV/Trường – từ 6kV',   price: 1940 },
      'bv-duoi-6kv': { label: 'BV/Trường – dưới 6kV', price: 2072 },
      'hcsn-tu-6kv': { label: 'HCSN – từ 6kV',        price: 2138 },
      'duoi-6kv':    { label: 'HCSN – dưới 6kV',      price: 2226 },
    },
  },

  // ─── Kỳ trước: điền vào khi có QĐ mới ───
  // Để null nếu chưa có kỳ trước
  previous: null,
  // Ví dụ khi cập nhật:
  // previous: {
  //   label: 'QĐ 2699/QĐ-BCT',
  //   date: '11/10/2024',
  //   effectiveFrom: '11/10/2024',
  //   residential: [...],
  //   ...
  // }
}

// ─── Helpers ───

/** Tính tiền điện sinh hoạt từ tổng kWh */
export function calcResidential(kwh, rateSet = rates.current) {
  const { residential, vat } = rateSet
  let remaining = kwh
  const tiers = residential.map(tier => {
    const range = tier.max === Infinity
      ? Math.max(0, remaining)
      : Math.min(remaining, tier.max - tier.min + 1)
    remaining = Math.max(0, remaining - range)
    const amount = range * tier.price
    return { ...tier, kwh: range, amount }
  })
  const subtotal = tiers.reduce((s, t) => s + t.amount, 0)
  const vatAmount = Math.round(subtotal * vat)
  const total = subtotal + vatAmount
  return { tiers, subtotal, vatAmount, total }
}

/** Tính tiền điện TOU (kinh doanh / sản xuất / nông nghiệp) */
export function calcTOU(offKwh, normalKwh, peakKwh, voltageKey, group, rateSet = rates.current) {
  const { vat } = rateSet
  const priceTable = rateSet[group]?.[voltageKey]
  if (!priceTable) return null

  // null price → return null so UI can show "dữ liệu chưa có"
  if (priceTable.off === null || priceTable.normal === null || priceTable.peak === null) return null

  const offAmount    = offKwh    * priceTable.off
  const normalAmount = normalKwh * priceTable.normal
  const peakAmount   = peakKwh   * priceTable.peak
  const subtotal     = offAmount + normalAmount + peakAmount
  const vatAmount    = Math.round(subtotal * vat)
  const total        = subtotal + vatAmount

  return {
    rows: [
      { label: 'Giờ thấp điểm', kwh: offKwh,    price: priceTable.off,    amount: offAmount },
      { label: 'Giờ bình thường', kwh: normalKwh, price: priceTable.normal, amount: normalAmount },
      { label: 'Giờ cao điểm',  kwh: peakKwh,   price: priceTable.peak,   amount: peakAmount },
    ],
    subtotal,
    vatAmount,
    total,
  }
}

/** Tính tiền điện hành chính SN (flat rate) — trả về cấu trúc tiers như sinh hoạt */
export function calcAdministrative(kwh, voltageKey, rateSet = rates.current) {
  const { vat } = rateSet
  const priceTable = rateSet.administrative?.[voltageKey]
  if (!priceTable) return null

  const subtotal  = kwh * (priceTable.price ?? 0)
  const vatAmount = Math.round(subtotal * vat)
  const total     = subtotal + vatAmount
  return {
    tiers: [{ tier: '—', min: 0, max: Infinity, price: priceTable.price, kwh, amount: subtotal }],
    subtotal,
    vatAmount,
    total,
  }
}

/** Format số tiền theo kiểu Việt Nam */
export function formatVND(amount) {
  return Math.round(amount).toLocaleString('vi-VN') + 'đ'
}
