// ─── Hằng số ─────────────────────────────────────────────────────────────────
// Lương cơ sở từ 1/7/2024 (Nghị định 73/2024/NĐ-CP)
const BASE_SALARY = 2_340_000

// Mức đóng BHXH/BHYT tối đa = 20 × lương cơ sở
export const MAX_INS_BASE = 20 * BASE_SALARY // 46,800,000

// Lương tối thiểu vùng (2024, dùng cho trần BHTN)
const REGIONAL_MIN_WAGE = {
  1: 4_960_000, // Hà Nội, TP.HCM, Đồng Nai, Bình Dương...
  2: 4_410_000,
  3: 3_860_000,
  4: 3_450_000,
}

// Giảm trừ gia cảnh (từ 1/1/2026 — Luật thuế TNCN sửa đổi 2025)
export const PERSONAL_DED  = 15_500_000 // bản thân / tháng (tăng từ 11tr)
export const DEPENDENT_DED =  6_200_000 // mỗi người phụ thuộc / tháng (tăng từ 4,4tr)

// Tỷ lệ bảo hiểm (phía người lao động)
export const BHXH_RATE = 0.08  // 8%
export const BHYT_RATE = 0.015 // 1.5%
export const BHTN_RATE = 0.01  // 1%

// Biểu thuế TNCN lũy tiến 5 bậc (quy đổi tháng)
// Áp dụng từ 1/1/2026 — Luật thuế TNCN sửa đổi 2025
export const PIT_TIERS = [
  { max:  10_000_000, rate: 0.05, label: '≤ 10 tr'    },
  { max:  30_000_000, rate: 0.10, label: '10–30 tr'   },
  { max:  60_000_000, rate: 0.20, label: '30–60 tr'   },
  { max: 100_000_000, rate: 0.30, label: '60–100 tr'  },
  { max: Infinity,    rate: 0.35, label: '> 100 tr'   },
]

// ─── calcNet ──────────────────────────────────────────────────────────────────
// grossVND:      lương gross theo hợp đồng (đồng)
// allowancesVND: các khoản cộng thêm / phụ cấp (đồng, optional) — chịu thuế TNCN, không tính BHXH
// bonusVND:      thưởng tháng (đồng, optional) — chịu thuế TNCN, không tính BHXH
// dependents:    số người phụ thuộc đăng ký
// region:        vùng lương tối thiểu (1-4), ảnh hưởng trần BHTN
export function calcNet(grossVND, allowancesVND = 0, bonusVND = 0, dependents = 0, region = 1) {
  const gross      = Math.round(grossVND)
  const allowances = Math.round(allowancesVND) || 0
  const bonus      = Math.round(bonusVND) || 0
  if (!gross || gross <= 0) return null

  const totalAgreed = gross + allowances + bonus

  // ── Bảo hiểm — tính trên lương gross, không gồm phụ cấp / thưởng ──
  const bhxhBase = Math.min(gross, MAX_INS_BASE)
  const bhytBase = Math.min(gross, MAX_INS_BASE)
  const bhtnBase = Math.min(gross, 20 * (REGIONAL_MIN_WAGE[region] || REGIONAL_MIN_WAGE[1]))

  const bhxh = Math.round(bhxhBase * BHXH_RATE)
  const bhyt = Math.round(bhytBase * BHYT_RATE)
  const bhtn = Math.round(bhtnBase * BHTN_RATE)
  const totalIns = bhxh + bhyt + bhtn

  // ── Giảm trừ gia cảnh ──
  const personalDed  = PERSONAL_DED
  const dependentDed = dependents * DEPENDENT_DED
  // TNTT = (gross + trợ cấp + bonus) − BH − trợ cấp − giảm trừ
  //      = gross + bonus − BH − giảm trừ  (trợ cấp triệt tiêu nhau)
  const taxable = Math.max(0, gross + bonus - totalIns - personalDed - dependentDed)

  // ── Thuế TNCN lũy tiến ──
  // Populate tất cả tiers (không break sớm) để component dùng cho visualization
  let taxTotal = 0
  let remaining = taxable
  let prev = 0
  const pitRows = []

  for (const tier of PIT_TIERS) {
    const tierWidth    = tier.max === Infinity ? null : tier.max - prev  // null = vô hạn
    const maxSlice     = tierWidth === null ? remaining : Math.min(remaining, tierWidth)
    const taxableSlice = Math.max(0, maxSlice)
    const tax          = taxableSlice > 0 ? Math.round(taxableSlice * tier.rate) : 0

    pitRows.push({ ...tier, tierWidth, taxableSlice, tax })
    taxTotal  += tax
    remaining -= taxableSlice
    if (tier.max !== Infinity) prev = tier.max
  }

  const net = totalAgreed - totalIns - taxTotal

  return {
    gross, allowances, bonus, totalAgreed,
    bhxh, bhyt, bhtn, totalIns,
    personalDed, dependentDed, taxable,
    pitRows, taxTotal, net,
    isCapped: gross > MAX_INS_BASE,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatVND(n) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + 'đ'
}
