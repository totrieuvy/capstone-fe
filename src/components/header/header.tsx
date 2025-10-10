import { Link } from "react-router-dom";
import { FaUserCircle, FaUser, FaSignOutAlt, FaShoppingCart, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import "./header.scss";
import logo from "../../assets/logo.png";
import Navigation from "../../constants/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "../../redux/features/userSlice";
import { updateQuantity, removeFromCart, clearCart } from "../../redux/features/cartSlice";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stockQuantity: number;
  imageUrl: string;
}

interface User {
  fullName: string;
  role: string;
}

interface RootState {
  user: User | null;
  cart: {
    items: CartItem[];
  };
}

function Header() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartItemCount = cartItems.reduce((total: number, item: CartItem) => total + item.quantity, 0);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector(".header");
      if (header) {
        if (window.scrollY > 50) header.classList.add("header--scrolled");
        else header.classList.remove("header--scrolled");
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsCartOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
  };

  const handleRemoveItem = (id: string) => {
    dispatch(removeFromCart(id));
  };

  return (
    <header className="header">
      <div className="header__left">
        <Link to="/">
          <img src={logo} alt="logo" className="header__left__logo" />
        </Link>
      </div>

      <div className="header__middle">
        {Navigation.map((item) => (
          <Link key={item.id} to={item.path} className="nav-link">
            {item.name}
          </Link>
        ))}
      </div>

      <div className="header__right">
        {user && user?.role === "CUSTOMER" ? (
          <>
            <div className="user-dropdown">
              <span className="dropdown-toggle">
                <FaUserCircle /> {user?.fullName}
              </span>
              <div className="dropdown-menu">
                <Link to="/profile/your-hamster" className="dropdown-item">
                  <FaUser /> Thông tin cá nhân
                </Link>
                <Link to="/" className="dropdown-item" onClick={handleLogout}>
                  <FaSignOutAlt /> Đăng xuất
                </Link>
              </div>
            </div>

            <div className="cart-container" ref={cartRef}>
              <span className="cart-toggle" onClick={() => setIsCartOpen(!isCartOpen)}>
                <FaShoppingCart />
                {cartItemCount > 0 && <span className="cart-count">{cartItemCount}</span>}
              </span>

              {isCartOpen && (
                <div className="cart-menu">
                  {cartItems.length === 0 ? (
                    <div className="cart-empty">Giỏ hàng trống</div>
                  ) : (
                    <>
                      {cartItems.map((item: CartItem) => (
                        <div key={item.id} className="cart-item">
                          <img src={item.imageUrl} alt={item.name} className="cart-item-image" />
                          <div className="cart-item-details">
                            <span className="cart-item-name">{item.name}</span>
                            <span className="cart-item-price">{item.price.toLocaleString()} VNĐ</span>
                            <div className="cart-item-quantity">
                              <button
                                onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                                disabled={item.quantity <= 1}
                              >
                                -
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                                disabled={item.quantity >= item.stockQuantity}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <FaTrash onClick={() => handleRemoveItem(item.id)} className="cart-item-remove" />
                        </div>
                      ))}

                      {/* 👇 Nút Checkout mới thêm */}
                      <div className="cart-checkout">
                        <Link to="/checkout" className="checkout-btn">
                          Thanh toán
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/login">
            <FaUserCircle style={{ fontSize: "35px", color: "#e0732f" }} />
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;
