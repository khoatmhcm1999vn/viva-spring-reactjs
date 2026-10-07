import { useEffect, useState } from "react";
import { fetchCategories, fetchProducts } from "../api/client.js";
import { formatMoney } from "../utils/money.js";

const MenuPage = () => {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Danh muc chi tai mot lan.
    useEffect(() => {
        fetchCategories()
            .then((data) => setCategories(data.items))
            .catch((err) => setError(err.message));
    }, []);

    // San pham tai lai moi khi doi danh muc.
    useEffect(() => {
        let isStale = false;

        setIsLoading(true);
        fetchProducts({ category: activeCategory ?? undefined })
            .then((data) => {
                // Bo qua ket qua cu: nguoi dung co the bam doi danh muc nhanh
                // hon toc do tra loi, va khong co co nay thi response ve sau
                // cua request cu se ghi de ket qua moi.
                if (!isStale) {
                    setProducts(data.items);
                    setError(null);
                }
            })
            .catch((err) => {
                if (!isStale) {
                    setError(err.message);
                }
            })
            .finally(() => {
                if (!isStale) {
                    setIsLoading(false);
                }
            });

        return () => {
            isStale = true;
        };
    }, [activeCategory]);

    return (
        <main className="menu">
            <h1>Menu</h1>

            <nav className="menu__filters">
                <button
                    type="button"
                    className={activeCategory === null ? "is-active" : ""}
                    onClick={() => setActiveCategory(null)}
                >
                    Tat ca
                </button>
                {categories.map((category) => (
                    <button
                        key={category.slug}
                        type="button"
                        className={activeCategory === category.slug ? "is-active" : ""}
                        onClick={() => setActiveCategory(category.slug)}
                    >
                        {category.name} ({category.product_count})
                    </button>
                ))}
            </nav>

            {error && <p className="menu__error">{error}</p>}
            {isLoading && <p>Dang tai...</p>}

            {!isLoading && products.length === 0 && !error && <p>Chua co san pham nao.</p>}

            <ul className="menu__list">
                {products.map((product) => (
                    <li key={product.id} className="card">
                        <div className="card__head">
                            <h2>{product.name}</h2>
                            <span className="card__sku">{product.sku}</span>
                        </div>
                        <p className="card__desc">{product.description}</p>
                        <div className="card__foot">
                            <span className="card__cat">{product.category_name}</span>
                            <strong>{formatMoney(product.price, product.currency_code)}</strong>
                        </div>
                    </li>
                ))}
            </ul>
        </main>
    );
};

export default MenuPage;
