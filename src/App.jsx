import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home/Home.jsx'
import TinhTienDien from './pages/TinhTienDien/TinhTienDien.jsx'
import TinhTienNuoc from './pages/TinhTienNuoc/TinhTienNuoc.jsx'
import TinhLuong from './pages/TinhLuong/TinhLuong.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tinh-tien-dien" element={<TinhTienDien />} />
        <Route path="/tinh-tien-nuoc" element={<TinhTienNuoc />} />
        <Route path="/tinh-luong" element={<TinhLuong />} />
        {/* thêm tools mới ở đây */}
      </Routes>
    </BrowserRouter>
  )
}
