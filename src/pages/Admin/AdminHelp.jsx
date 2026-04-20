/**
 * AdminHelp — side drawer hiển thị workflow tutorials cho admin panel.
 *
 * Trigger: button "Hướng dẫn" ở header.
 * Content: 2 workflow chính (add brand, change featured/comparison)
 *          + glossary fields ngắn ở cuối.
 *
 * UX:
 *   - Slide từ phải, max 420px desktop, full-width mobile
 *   - Backdrop click = close
 *   - ESC = close
 *   - Accordion 2 sections, expanded by default (chỉ 2 sections nên không cần collapse)
 */

import { useEffect } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  Add01Icon,
  Tick01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'

export default function AdminHelp({ open, onClose }) {
  // ESC để close
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="ad-help-backdrop" onClick={onClose} />

      <aside className="ad-help-drawer" role="dialog" aria-label="Hướng dẫn">
        <header className="ad-help-header">
          <h2 className="ad-help-title">Hướng dẫn admin</h2>
          <button
            className="ad-help-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
          </button>
        </header>

        <div className="ad-help-body">
          {/* ─── Workflow 1: Add brand ───────────────────────────────────── */}
          <section className="ad-help-section">
            <div className="ad-help-section-head">
              <span className="ad-help-num">1</span>
              <div>
                <h3 className="ad-help-section-title">Thêm brand mới</h3>
                <p className="ad-help-section-when">
                  Khi Accesstrade duyệt campaign mới → có URL affiliate thật.
                </p>
              </div>
            </div>

            <ol className="ad-help-steps">
              <li>
                Tab <strong>Brands</strong> → kéo xuống cuối → field
                "Brand slug mới" → gõ tên không dấu (vd:{' '}
                <code>mbbank</code>, <code>vpbank</code>) → bấm{' '}
                <span className="ad-help-btn-mock">
                  <HugeiconsIcon icon={Add01Icon} size={11} strokeWidth={2} />
                  Thêm brand
                </span>
              </li>
              <li>
                Card brand mới xuất hiện → điền các fields (xem chi tiết bên
                dưới)
              </li>
              <li>
                Toggle góc phải card:{' '}
                <span className="ad-help-toggle-mock ad-off">Off</span> →{' '}
                <span className="ad-help-toggle-mock ad-live">Live</span>
              </li>
              <li>
                Qua tab <strong>Tool mappings</strong> → assign brand vào tool
                phù hợp (xem mục 2)
              </li>
              <li>
                Bấm <strong>Lưu config</strong> ở chân trang → chờ ~60s
                (edge cache) → check frontend
              </li>
            </ol>

            <div className="ad-help-fields">
              <div className="ad-help-fields-title">Field reference</div>
              <dl className="ad-help-dl">
                <dt>Name</dt>
                <dd>Tên hiển thị có dấu (vd: "MB Bank Loan")</dd>

                <dt>Initial</dt>
                <dd>
                  1–2 ký tự (vd: "MB") — fallback khi không có logo hoặc logo
                  load fail
                </dd>

                <dt>Color</dt>
                <dd>Brand color, làm nền cho Initial square</dd>

                <dt>Logo URL</dt>
                <dd>
                  Link ảnh PNG/SVG vuông. Để trống = dùng Initial + Color.
                  <br />
                  <span className="ad-help-tip">
                    💡 Free: <code>logo.clearbit.com/[domain]</code> — vd{' '}
                    <code>logo.clearbit.com/vib.com.vn</code>
                  </span>
                </dd>

                <dt>Tagline</dt>
                <dd>Mô tả 1 dòng, dưới 60 ký tự (hiện ở CTA card)</dd>

                <dt>Metric</dt>
                <dd>Dòng số liệu cụ thể (vd: "Lãi từ 5.6%/năm")</dd>

                <dt>Affiliate URL</dt>
                <dd>
                  Paste deeplink Accesstrade (dạng <code>go.isclix.com/...</code>)
                </dd>

                <dt>Referral code</dt>
                <dd>
                  Chỉ điền khi là app-based campaign (user phải nhập mã trong
                  app). Để trống = redirect thẳng.
                </dd>
              </dl>
            </div>
          </section>

          {/* ─── Workflow 2: Change featured / comparison ────────────────── */}
          <section className="ad-help-section">
            <div className="ad-help-section-head">
              <span className="ad-help-num">2</span>
              <div>
                <h3 className="ad-help-section-title">
                  Đổi featured / comparison cho tool
                </h3>
                <p className="ad-help-section-when">
                  Khi muốn show brand mới ở 1 tool, hoặc swap featured.
                </p>
              </div>
            </div>

            <div className="ad-help-concept">
              <div className="ad-help-concept-row">
                <span className="ad-help-concept-label">Featured</span>
                <span className="ad-help-concept-desc">
                  CTA to phía trên kết quả tool. Mỗi tool <strong>1 brand</strong>.
                </span>
              </div>
              <div className="ad-help-concept-row">
                <span className="ad-help-concept-label">Comparison</span>
                <span className="ad-help-concept-desc">
                  Bảng so sánh dưới featured. Cần{' '}
                  <strong>≥2 brand approved</strong> mới render.
                </span>
              </div>
            </div>

            <ol className="ad-help-steps">
              <li>
                Tab <strong>Tool mappings</strong> → tìm row tool (vd:{' '}
                <code>/tinh-lai-vay</code>)
              </li>
              <li>
                Dropdown <strong>Featured brand</strong> → chọn brand (phải đã
                Live)
              </li>
              <li>
                Chip row <strong>Comparison brands</strong> → click chip để
                toggle thêm/bớt:
                <div className="ad-help-chip-demo">
                  <span className="ad-help-chip-mock ad-active">
                    <HugeiconsIcon icon={Tick01Icon} size={10} strokeWidth={2.5} />
                    VIB App Max
                  </span>
                  <span className="ad-help-chip-mock">MB Bank</span>
                  <span className="ad-help-chip-mock">Cake</span>
                </div>
                <span className="ad-help-tip">
                  💡 Xanh = đang chọn. Cần ≥2 chip xanh thì bảng comparison mới
                  hiện ở frontend.
                </span>
              </li>
              <li>
                Bấm <strong>Lưu config</strong> → chờ 60s
              </li>
            </ol>
          </section>

          {/* ─── Footer tips ─────────────────────────────────────────────── */}
          <section className="ad-help-section ad-help-tips-section">
            <h3 className="ad-help-section-title">Tips chung</h3>
            <ul className="ad-help-tips-list">
              <li>
                <strong>Lưu config</strong> mỗi lần thay đổi — không có
                auto-save. Footer hiện{' '}
                <span className="ad-help-status-mock">⚠️ Có thay đổi chưa lưu</span>{' '}
                khi quên.
              </li>
              <li>
                Edge cache <strong>60 giây</strong>. Save xong vẫn phải đợi tới
                1 phút mới thấy ở frontend.
              </li>
              <li>
                <strong>Reset defaults</strong> = revert về config bundled trong
                code (chỉ trong UI, chưa save). Bấm Lưu config nếu muốn ghi đè.
              </li>
              <li>
                Brand không xoá được nếu đang được dùng trong tool mapping → gỡ
                khỏi mapping trước rồi mới xoá được.
              </li>
            </ul>
          </section>
        </div>
      </aside>
    </>
  )
}
