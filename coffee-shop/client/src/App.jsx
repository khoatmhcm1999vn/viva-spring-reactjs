import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import MenuPage from "./pages/MenuPage.jsx";

/*
 * react-router-dom 7: dung Routes/Route va element={...}.
 *
 * Khong phai API v5 (Switch, component={...}) ma Vivacon dang dung - hai du an
 * o hai major version khac nhau, dung copy pattern qua lai.
 */
function App() {
    return (
        <BrowserRouter>
            <header className="topbar">
                <Link to="/menu" className="topbar__brand">
                    Coffee Shop
                </Link>
            </header>

            <Routes>
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/" element={<Navigate to="/menu" replace />} />
                <Route path="*" element={<p className="notfound">Khong tim thay trang.</p>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
