import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'ChilàThu Tools'
const BASE_URL  = 'https://tools.chilathu.com'
const OG_IMAGE  = `${BASE_URL}/og-image.png`

/**
 * SEO component — dùng cho mọi page.
 *
 * Props:
 *   title        string  — tiêu đề trang (không cần kèm tên site, component tự append)
 *   description  string  — mô tả hiển thị trên Google / social
 *   path         string  — đường dẫn, VD '/tinh-tien-dien'
 *   keywords     string  — từ khóa phân cách bởi dấu phẩy (optional)
 *   ogImage      string  — URL ảnh OG tuỳ chỉnh (optional, dùng ảnh mặc định nếu bỏ qua)
 */
export default function SEO({ title, description, path = '/', keywords, ogImage }) {
  const fullTitle    = `${title} | ${SITE_NAME}`
  const canonicalUrl = `${BASE_URL}${path}`
  const image        = ogImage || OG_IMAGE

  return (
    <Helmet>
      {/* ── Primary ── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* ── Open Graph ── */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url"         content={canonicalUrl} />
      <meta property="og:type"        content="website" />
      <meta property="og:image"       content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height"content="630" />
      <meta property="og:locale"      content="vi_VN" />
      <meta property="og:site_name"   content={SITE_NAME} />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={image} />
    </Helmet>
  )
}
