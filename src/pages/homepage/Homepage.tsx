import { useEffect, useState, useCallback } from "react";
import { Row, Col, Card, Button, Pagination, Checkbox, Radio, Spin } from "antd";
import { getFormattedPrice } from "../../utils/formatPrice";
import api from "../../config/axios";
import Banner from "../../components/banner/Banner";
import "./Homepage.scss";
import AOS from "aos";
import "aos/dist/aos.css";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../redux/features/cartSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  weight: number;
}

interface PaginatedResponse {
  content: Product[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface RootState {
  user: { fullName: string; role: string } | null;
  cart: {
    items: {
      id: string;
      name: string;
      price: number;
      quantity: number;
      stockQuantity: number;
      imageUrl: string;
      weight: number;
    }[];
  };
}

function Homepage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "">("");
  const [pagination, setPagination] = useState({
    page: 0,
    size: 12,
    total: 0,
  });
  const [showPopup, setShowPopup] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/products/paginated?page=${pagination.page}&size=${pagination.size}`);
      const paginatedData = response.data.data as PaginatedResponse;
      setProducts(paginatedData.content);
      setPagination((prev) => ({
        ...prev,
        total: paginatedData.totalElements,
      }));

      const unique = [...new Set(paginatedData.content.map((p) => p.categoryName))];
      setCategories(unique);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.size]);

  useEffect(() => {
    document.title = "The Hamster";
    AOS.init({ duration: 800, once: true, offset: 80 });
    fetchProducts();
  }, [fetchProducts]);

  const handlePageChange = (page: number, pageSize?: number) => {
    setPagination((prev) => ({
      ...prev,
      page: page - 1,
      size: pageSize || prev.size,
    }));
  };

  const filteredProducts = (): Product[] => {
    let filtered = [...products];
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => selectedCategories.includes(p.categoryName));
    }
    if (sortOrder === "asc") filtered.sort((a, b) => a.price - b.price);
    else if (sortOrder === "desc") filtered.sort((a, b) => b.price - a.price);
    return filtered;
  };

  const getProductsByCategory = (category: string): Product[] => {
    return filteredProducts().filter((p) => p.categoryName === category);
  };

  const handleCategoryChange = (checkedValues: (string | number)[]) => {
    setSelectedCategories(checkedValues as string[]);
  };

  const handleAddToCart = (product: Product) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    if (product.stockQuantity === 0) {
      toast.error("Sản phẩm đã hết hàng, không thể mua!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        stockQuantity: product.stockQuantity,
        imageUrl: product.imageUrl,
        quantity: 1,
        weight: product.weight,
      })
    );

    // Hiển thị popup “Thêm vào giỏ hàng”
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  return (
    <div className="Homepage">
      <Banner />
      <div className="content">
        <h1 className="title" data-aos="fade-up">
          Sản phẩm của chúng tôi
        </h1>

        <Row gutter={[24, 24]}>
          {/* Sidebar Filter */}
          <Col xs={24} md={6} lg={5}>
            <div className="filter-box" data-aos="fade-right">
              <h3 className="filter-title">Bộ lọc</h3>
              <div className="filter-section">
                <h4 className="filter-subtitle">Danh mục</h4>
                <Checkbox.Group
                  options={categories.map((c) => ({ label: c, value: c }))}
                  value={selectedCategories}
                  onChange={handleCategoryChange}
                  className="filter-checkbox"
                />
              </div>
              <div className="filter-section">
                <h4 className="filter-subtitle">Giá</h4>
                <Radio.Group onChange={(e) => setSortOrder(e.target.value)} value={sortOrder} className="filter-radio">
                  <Radio value="">Tất cả</Radio>
                  <Radio value="asc">Tăng dần</Radio>
                  <Radio value="desc">Giảm dần</Radio>
                </Radio.Group>
              </div>
            </div>
          </Col>

          {/* Main Content */}
          <Col xs={24} md={18} lg={19}>
            {loading ? (
              <div className="loading">
                <Spin size="large" /> <p>Đang tải...</p>
              </div>
            ) : (
              <>
                {categories.map((categoryName) => {
                  const categoryProducts = getProductsByCategory(categoryName);
                  if (categoryProducts.length === 0) return null;
                  return (
                    <div key={categoryName} className="category-section" data-aos="fade-up" data-aos-offset="100">
                      <h2 className="category-title" data-aos="fade-right">
                        {categoryName}
                      </h2>
                      <Row gutter={[16, 16]} justify="center">
                        {categoryProducts.map((product) => (
                          <Col xs={24} sm={12} md={8} lg={6} key={product.id} data-aos="zoom-in">
                            <Card hoverable className="product-card">
                              <Link to={`/product/${product.id}`}>
                                <img alt={product.name} src={product.imageUrl} className="product-image" />
                              </Link>
                              <div className="product-info">
                                <Link to={`/product/${product.id}`}>
                                  <h3 className="product-name">{product.name}</h3>
                                </Link>
                                <p className="product-price">{getFormattedPrice(product.price)}</p>
                                <p className="product-stock">Số lượng: {product.stockQuantity}</p>
                                <Button type="primary" className="buy-button" onClick={() => handleAddToCart(product)}>
                                  Mua hàng
                                </Button>
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  );
                })}
                <Pagination
                  current={pagination.page + 1}
                  pageSize={pagination.size}
                  total={pagination.total}
                  onChange={handlePageChange}
                  style={{ marginTop: 20, textAlign: "center" }}
                />
              </>
            )}
          </Col>
        </Row>

        {/* Popup thông báo thêm sản phẩm */}
        {showPopup && (
          <div className="added-popup">
            <div className="popup-content">✅ Sản phẩm đã được thêm vào giỏ hàng!</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Homepage;
