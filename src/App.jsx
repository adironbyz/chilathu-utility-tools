import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home/Home.jsx'
import TinhTienDien from './pages/TinhTienDien/TinhTienDien.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tinh-tien-dien" element={<TinhTienDien />} />
        {/* thêm tools mới ở đây */}
      </Routes>
    </BrowserRouter>
  )
}
