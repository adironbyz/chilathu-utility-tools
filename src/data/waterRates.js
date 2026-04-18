/**
 * ChilàThu Tools — Bảng giá nước sạch sinh hoạt & kinh doanh
 * Cập nhật: 2026-04-18
 *
 * Cấu trúc tỉnh/thành:
 *   residential.mode     — 'tiered_household' | 'tiered_person' | 'flat'
 *   residential.tiers    — bậc lũy tiến (nếu mode là tiered_*)
 *   residential.price    — đơn giá phẳng (nếu mode là flat)
 *   residential.vatIncluded — true nếu giá đã gồm VAT
 *   residential.vat      — tỉ lệ VAT (0.05, 0.10) nếu !vatIncluded
 *   residential.wasteWaterFeeRate — phí thoát nước (tỉ lệ % trên tiền nước)
 *   business             — tương tự, luôn là flat
 *
 * Để thêm tỉnh mới: copy template ở cuối, điền data, xóa pending: true
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatVND(n) {
  return Math.round(n).toLocaleString('vi-VN') + 'đ'
}

/**
 * Tính tiền nước
 * @param {number} m3          — số khối tiêu thụ
 * @param {object} province    — object tỉnh/thành từ provinces[]
 * @param {string} type        — 'residential' | 'business'
 * @param {number} numPersons  — số nhân khẩu (chỉ dùng nếu mode === 'tiered_person')
 */
export function calcWater(m3, province, type = 'residential', numPersons = 4) {
  if (!m3 || m3 <= 0 || !province || province.pending) return null

  const info = province[type]
  if (!info) return null

  const vatRate = info.vatIncluded ? 0 : (info.vat ?? 0)
  const wasteRate = info.wasteWaterFeeRate ?? 0

  // ── Flat rate ──
  if (info.mode === 'flat') {
    const subtotal = m3 * info.price
    const vatAmount = Math.round(subtotal * vatRate)
    const wasteWaterFee = Math.round(subtotal * wasteRate)
    return {
      type, m3, flat: true,
      pricePerM3: info.price,
      vatIncluded: !!info.vatIncluded,
      subtotal, vatAmount, wasteWaterFee, vatRate, wasteRate,
      total: subtotal + vatAmount + wasteWaterFee,
    }
  }

  // ── Tiered ──
  // For 'tiered_person': scale tier thresholds by numPersons
  const scale = info.mode === 'tiered_person' ? numPersons : 1

  const breakdown = []
  let remaining = m3
  let subtotal = 0
  let tierStart = 1

  for (const tier of info.tiers) {
    if (remaining <= 0) break
    const tierMin = tierStart
    const tierMax = tier.max === Infinity ? Infinity : tier.max * scale
    const capacity = tierMax === Infinity ? remaining : (tierMax - tierMin + 1)
    const qty = Math.min(remaining, capacity)
    const amount = qty * tier.price

    breakdown.push({
      tier: tier.tier,
      label: tierMax === Infinity
        ? `Trên ${tierMin - 1} m³`
        : `${tierMin}–${tierMax} m³`,
      qty,
      price: tier.price,
      amount,
    })

    subtotal += amount
    remaining -= qty
    tierStart = tierMax + 1
  }

  const vatAmount = Math.round(subtotal * vatRate)
  const wasteWaterFee = Math.round(subtotal * wasteRate)

  return {
    type, m3,
    mode: info.mode,
    numPersons: info.mode === 'tiered_person' ? numPersons : null,
    breakdown, subtotal,
    vatIncluded: !!info.vatIncluded,
    vatAmount, vatRate,
    wasteWaterFee, wasteRate,
    total: subtotal + vatAmount + wasteWaterFee,
  }
}

// ─── Province data ───────────────────────────────────────────────────────────
//
// Nguồn tham khảo chính:
//   Hà Nội  — QĐ 3541/QĐ-UBND ngày 7/7/2023, hiệu lực từ 1/1/2024
//   TP.HCM  — SAWACO, hiệu lực từ 2024 (phí thoát nước 30% từ 1/1/2025)
//   Đà Nẵng — QĐ UBND TP Đà Nẵng, hiệu lực từ 1/1/2025
//   Cần Thơ — UBND TP Cần Thơ, giá đã bao gồm VAT, hiệu lực từ 1/2/2024
//   Hải Phòng — QĐ 05/2024/QĐ-UBND, hiệu lực từ 1/3/2024 (đang cập nhật đủ bậc)

export const provinces = [

  // ══════════════════════════════════════════════
  //  5 THÀNH PHỐ TRỰC THUỘC TRUNG ƯƠNG
  // ══════════════════════════════════════════════

  {
    id: 'ha-noi',
    name: 'Hà Nội',
    provider: 'HAWACO & các đơn vị cấp nước HN',
    sourceLabel: 'QĐ 3541/QĐ-UBND (7/7/2023)',
    sourceUrl: 'https://xaydungchinhsach.chinhphu.vn/ha-noi-chinh-thuc-tang-gia-nuoc-sach-119230710150335997.htm',
    effectiveFrom: '01/01/2024',
    residential: {
      mode: 'tiered_household',
      // Bậc tính theo hộ/tháng (không theo người)
      tiers: [
        { tier: 1, max: 10,       price: 8500  },
        { tier: 2, max: 20,       price: 9900  },
        { tier: 3, max: 30,       price: 16000 },
        { tier: 4, max: Infinity, price: 27000 },
      ],
      vatIncluded: false,
      vat: 0.05,
    },
    business: {
      mode: 'flat',
      price: 29000,
      vatIncluded: false,
      vat: 0.10,
      note: 'Kinh doanh dịch vụ. Sản xuất vật chất: 16.000đ/m³ chưa VAT',
    },
  },

  {
    id: 'ho-chi-minh',
    name: 'TP. Hồ Chí Minh',
    provider: 'SAWACO (Bến Thành, Thủ Đức, Tân Hòa...)',
    sourceLabel: 'SAWACO 2024–2025',
    sourceUrl: 'https://www.sawaco.com.vn/',
    effectiveFrom: '01/01/2024',
    residential: {
      // Bậc tính theo m³/người/tháng — thresholds nhân với số nhân khẩu
      mode: 'tiered_person',
      tiers: [
        { tier: 1, max: 4,        price: 6700  },
        { tier: 2, max: 6,        price: 12900 },
        { tier: 3, max: Infinity, price: 14900 },
      ],
      vatIncluded: false,
      vat: 0.05,
      // Phí thoát nước & xử lý nước thải = 30% tiền nước (từ 1/1/2025)
      wasteWaterFeeRate: 0.30,
      wasteWaterFeeLabel: 'Phí thoát nước (30%)',
    },
    business: {
      mode: 'flat',
      price: 21300,
      vatIncluded: false,
      vat: 0.10,
      note: 'Kinh doanh dịch vụ. Sản xuất: 12.100đ/m³. HC SN: 13.000đ/m³',
    },
  },

  {
    id: 'da-nang',
    name: 'Đà Nẵng',
    provider: 'DAWACO',
    sourceLabel: 'QĐ UBND TP Đà Nẵng 2025',
    sourceUrl: 'https://dawaco.com.vn/',
    effectiveFrom: '01/01/2025',
    residential: {
      mode: 'tiered_household',
      // Khu vực đô thị. Nông thôn: 3000 / 3600 / 4500
      tiers: [
        { tier: 1, max: 10,       price: 4580 },
        { tier: 2, max: 30,       price: 5488 },
        { tier: 3, max: Infinity, price: 6849 },
      ],
      vatIncluded: false,
      vat: 0.05,
    },
    business: {
      mode: 'flat',
      price: 14000,
      vatIncluded: false,
      vat: 0.10,
      note: 'Ước tính — cần xác minh từ DAWACO',
      approximate: true,
    },
  },

  {
    id: 'hai-phong',
    name: 'Hải Phòng',
    provider: 'Cấp nước Hải Phòng',
    sourceLabel: 'QĐ 05/2024/QĐ-UBND (01/03/2024)',
    sourceUrl: 'https://capnuochaiphong.com.vn/',
    effectiveFrom: '01/03/2024',
    residential: {
      mode: 'tiered_household',
      // Khu vực đô thị. Bậc 1 đã xác nhận; bậc 2+ đang cập nhật
      tiers: [
        { tier: 1, max: 10,       price: 10900 },
        { tier: 2, max: 20,       price: 13000, approximate: true },
        { tier: 3, max: Infinity, price: 17000, approximate: true },
      ],
      vatIncluded: false,
      vat: 0.05,
      note: 'Bậc 2+ là ước tính — đang cập nhật dữ liệu chính thức',
      partialData: true,
    },
    business: {
      mode: 'flat',
      price: 20000,
      vatIncluded: false,
      vat: 0.10,
      approximate: true,
    },
  },

  {
    id: 'can-tho',
    name: 'Cần Thơ',
    provider: 'Cấp nước Cần Thơ',
    sourceLabel: 'UBND TP Cần Thơ (01/02/2024)',
    sourceUrl: 'https://tapchinuoc.vn/thanh-pho-can-tho-tang-gia-nuoc-sach-175240204102959461.htm',
    effectiveFrom: '01/02/2024',
    residential: {
      // Giá phẳng, đã bao gồm VAT
      mode: 'flat',
      price: 9020,
      vatIncluded: true,
      note: 'Giá đã bao gồm VAT. Khu vực đô thị',
    },
    business: {
      mode: 'flat',
      price: 11520,
      vatIncluded: true,
      note: 'Kinh doanh dịch vụ. Sản xuất: 9.930đ/m³. HC SN: 9.310đ/m³',
    },
  },

  // ══════════════════════════════════════════════
  //  TỈNH THÀNH — đang cập nhật dữ liệu
  // ══════════════════════════════════════════════

  { id: 'an-giang',         name: 'An Giang',            pending: true },
  { id: 'ba-ria-vung-tau',  name: 'Bà Rịa - Vũng Tàu',  pending: true },
  { id: 'bac-giang',        name: 'Bắc Giang',           pending: true },
  { id: 'bac-kan',          name: 'Bắc Kạn',             pending: true },
  { id: 'bac-lieu',         name: 'Bạc Liêu',            pending: true },
  { id: 'bac-ninh',         name: 'Bắc Ninh',            pending: true },
  { id: 'ben-tre',          name: 'Bến Tre',             pending: true },
  { id: 'binh-dinh',        name: 'Bình Định',           pending: true },
  { id: 'binh-duong',       name: 'Bình Dương',          pending: true },
  { id: 'binh-phuoc',       name: 'Bình Phước',          pending: true },
  { id: 'binh-thuan',       name: 'Bình Thuận',          pending: true },
  { id: 'ca-mau',           name: 'Cà Mau',              pending: true },
  { id: 'cao-bang',         name: 'Cao Bằng',            pending: true },
  { id: 'dak-lak',          name: 'Đắk Lắk',             pending: true },
  { id: 'dak-nong',         name: 'Đắk Nông',            pending: true },
  { id: 'dien-bien',        name: 'Điện Biên',           pending: true },
  { id: 'dong-nai',         name: 'Đồng Nai',            pending: true },
  { id: 'dong-thap',        name: 'Đồng Tháp',           pending: true },
  { id: 'gia-lai',          name: 'Gia Lai',             pending: true },
  { id: 'ha-giang',         name: 'Hà Giang',            pending: true },
  { id: 'ha-nam',           name: 'Hà Nam',              pending: true },
  { id: 'ha-tinh',          name: 'Hà Tĩnh',             pending: true },
  { id: 'hai-duong',        name: 'Hải Dương',           pending: true },
  { id: 'hau-giang',        name: 'Hậu Giang',           pending: true },
  { id: 'hoa-binh',         name: 'Hòa Bình',            pending: true },
  { id: 'hung-yen',         name: 'Hưng Yên',            pending: true },
  { id: 'khanh-hoa',        name: 'Khánh Hòa',           pending: true },
  { id: 'kien-giang',       name: 'Kiên Giang',          pending: true },
  { id: 'kon-tum',          name: 'Kon Tum',             pending: true },
  { id: 'lai-chau',         name: 'Lai Châu',            pending: true },
  { id: 'lam-dong',         name: 'Lâm Đồng',            pending: true },
  { id: 'lang-son',         name: 'Lạng Sơn',            pending: true },
  { id: 'lao-cai',          name: 'Lào Cai',             pending: true },
  { id: 'long-an',          name: 'Long An',             pending: true },
  { id: 'nam-dinh',         name: 'Nam Định',            pending: true },
  { id: 'nghe-an',          name: 'Nghệ An',             pending: true },
  { id: 'ninh-binh',        name: 'Ninh Bình',           pending: true },
  { id: 'ninh-thuan',       name: 'Ninh Thuận',          pending: true },
  { id: 'phu-tho',          name: 'Phú Thọ',             pending: true },
  { id: 'phu-yen',          name: 'Phú Yên',             pending: true },
  { id: 'quang-binh',       name: 'Quảng Bình',          pending: true },
  { id: 'quang-nam',        name: 'Quảng Nam',           pending: true },
  { id: 'quang-ngai',       name: 'Quảng Ngãi',          pending: true },
  { id: 'quang-ninh',       name: 'Quảng Ninh',          pending: true },
  { id: 'quang-tri',        name: 'Quảng Trị',           pending: true },
  { id: 'soc-trang',        name: 'Sóc Trăng',           pending: true },
  { id: 'son-la',           name: 'Sơn La',              pending: true },
  { id: 'tay-ninh',         name: 'Tây Ninh',            pending: true },
  { id: 'thai-binh',        name: 'Thái Bình',           pending: true },
  { id: 'thai-nguyen',      name: 'Thái Nguyên',         pending: true },
  { id: 'thanh-hoa',        name: 'Thanh Hóa',           pending: true },
  { id: 'thua-thien-hue',   name: 'Thừa Thiên Huế',      pending: true },
  { id: 'tien-giang',       name: 'Tiền Giang',          pending: true },
  { id: 'tra-vinh',         name: 'Trà Vinh',            pending: true },
  { id: 'tuyen-quang',      name: 'Tuyên Quang',         pending: true },
  { id: 'vinh-long',        name: 'Vĩnh Long',           pending: true },
  { id: 'vinh-phuc',        name: 'Vĩnh Phúc',           pending: true },
  { id: 'yen-bai',          name: 'Yên Bái',             pending: true },
]
