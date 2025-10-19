import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useCart } from '../contexts/CartContext';
import { useSwipe } from '../hooks/useSwipe';
import { useTelegramBackButton, useTelegramMainButton, useTelegramSettingsButton } from '../hooks/useTelegramUI';
import Header from '../components/Header';
import { Product } from '../types/api';
import { formatCurrency } from '../utils/format';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showQuantityControls, setShowQuantityControls] = useState(false);
  const [showDescriptionPopup, setShowDescriptionPopup] = useState(false);

  const handleAddToCart = async () => {
    if (!product) return;

    // If quantity controls not shown, show them first
    if (!showQuantityControls) {
      setShowQuantityControls(true);
      return;
    }

    // Otherwise, add to cart
    try {
      console.log('🔵 Кнопка добавления в корзину нажата, товар:', product.id, 'количество:', quantity);
      setIsAddingToCart(true);
      await addItem(product.id, quantity);
      console.log('✅ Товар добавлен, переходим в корзину через 500мс');
      // Show success feedback
      setTimeout(() => {
        navigate('/cart');
      }, 500);
    } catch (err) {
      console.error('❌ Ошибка при добавлении в корзину:', err);
      setIsAddingToCart(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);
        const response = await apiFetch(`/api/products/${id}`);
        if (response.success) {
          setProduct(response.data);
        } else {
          setError('Товар не найден');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Ошибка загрузки товара');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Telegram UI кнопки
  useTelegramBackButton(() => navigate(-1));
  useTelegramSettingsButton(() => console.log('Settings clicked'));

  // Telegram Main Button для добавления в корзину
  useTelegramMainButton(
    !showQuantityControls
      ? 'Добавить в корзину'
      : `Перейти в корзину · ${formatCurrency((product?.price || 0) * quantity)}`,
    handleAddToCart,
    {
      color: '#3b82f6',
      textColor: '#ffffff',
      isActive: !isAddingToCart,
      isProgressVisible: isAddingToCart
    }
  );

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (!product?.images) return;

    const totalImages = product.images.length;
    if (direction === 'prev') {
      setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
    } else {
      setCurrentImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
    }
  };

  const getConditionText = (condition: number) => {
    if (condition >= 9) return 'Отлично';
    if (condition >= 7) return 'Хорошо';
    if (condition >= 5) return 'Средне';
    return 'Требует внимания';
  };

  const getConditionColor = (condition: number) => {
    if (condition >= 9) return { bg: 'var(--color-success-bg)', text: 'var(--color-success-text)' };
    if (condition >= 7) return { bg: 'var(--color-info-bg)', text: 'var(--color-info-text)' };
    if (condition >= 5) return { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-text)' };
    return { bg: 'var(--color-error-bg)', text: 'var(--color-error-text)' };
  };

  // Swipe handlers for image navigation
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => handleImageNavigation('next'),
    onSwipeRight: () => handleImageNavigation('prev'),
  }, {
    threshold: 50,
    preventDefaultTouchmoveEvent: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Header hideSearch />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-accent)' }}></div>
            <p style={{ color: 'var(--color-text)' }}>Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-bg">
        <Header hideSearch />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-lg mb-4" style={{ color: 'var(--color-error)' }}>
              {error || 'Товар не найден'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 rounded-lg font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: 'var(--color-accent)', color: '#ffffff' }}
            >
              Вернуться к каталогу
            </button>
          </div>
        </div>
      </div>
    );
  }

  const conditionColors = getConditionColor(product.condition);

  return (
    <div className="min-h-screen bg-bg" style={{ paddingBottom: '80px' }}>
      <Header hideSearch />

      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Gallery */}
          <div>
            {/* Main Image */}
            <div
              className="relative rounded-xl overflow-hidden mb-3"
              style={{ backgroundColor: 'var(--color-surface)', aspectRatio: '3/4' }}
              {...swipeHandlers}
            >
              {/* Progress bars at top (like pablomsk) */}
              {product.images.length > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    right: '8px',
                    display: 'flex',
                    gap: '4px',
                    zIndex: 10
                  }}
                >
                  {product.images.map((_, index) => (
                    <div
                      key={index}
                      style={{
                        flex: 1,
                        height: '2px',
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: index === currentImageIndex ? '100%' : '0%',
                          height: '100%',
                          backgroundColor: '#ffffff',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <img
                src={product.images[currentImageIndex]}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=1000&fit=crop&auto=format';
                }}
              />

              {/* Condition Badge */}
              <div
                className="absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-medium shadow-lg"
                style={{ backgroundColor: conditionColors.bg, color: conditionColors.text }}
              >
                {getConditionText(product.condition)}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Brand */}
            <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-accent)' }}>
              {product.brand}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>
              {product.title}
            </h1>

            {/* Price */}
            <div className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              {formatCurrency(product.price)}
            </div>

            {/* Details Grid */}
            <div
              className="rounded-lg p-4 mb-4"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Размер
                  </div>
                  <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {product.size}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Цвет
                  </div>
                  <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {product.color}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Категория
                  </div>
                  <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {product.category}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Состояние
                  </div>
                  <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {product.condition}/10
                  </div>
                </div>
              </div>
            </div>

            {/* Description - pablomsk style */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                Описание товара
              </h2>
              <div
                style={{
                  color: 'var(--color-text)',
                  lineHeight: '1.6',
                  fontSize: '15px',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {product.description.length > 150 ? (
                  <>
                    {product.description.substring(0, 150)}...
                    <div style={{ marginTop: '12px' }}>
                      <button
                        onClick={() => setShowDescriptionPopup(true)}
                        style={{
                          color: 'var(--tg-theme-link-color, #2481cc)',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '15px',
                          cursor: 'pointer',
                          textDecoration: 'none'
                        }}
                      >
                        Читать дальше ▼
                      </button>
                    </div>
                  </>
                ) : (
                  product.description
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quantity Controls - показываем только когда нужно */}
      {showQuantityControls && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: '80px',
            padding: '12px 16px',
            backgroundColor: 'var(--color-bg)',
            borderTop: '1px solid var(--color-border)',
            zIndex: 40
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              maxWidth: '200px',
              margin: '0 auto'
            }}
          >
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              style={{
                padding: '0 20px',
                height: '50px',
                fontSize: '24px',
                fontWeight: 'bold',
                color: quantity <= 1 ? '#d1d5db' : '#111827',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: quantity <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              −
            </button>
            <div
              style={{
                padding: '0 20px',
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                minWidth: '60px',
                textAlign: 'center'
              }}
            >
              {quantity}
            </div>
            <button
              onClick={() => setQuantity(quantity + 1)}
              style={{
                padding: '0 20px',
                height: '50px',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#111827',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Description Popup (like pablomsk) */}
      {showDescriptionPopup && (
        <div
          onClick={() => setShowDescriptionPopup(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-bg)',
              borderRadius: '16px 16px 0 0',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              animation: 'slideUp 0.3s ease-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-text)', margin: 0 }}>
                {product.title}
              </h2>
              <button
                onClick={() => setShowDescriptionPopup(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--color-text)',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                color: 'var(--color-text)',
                lineHeight: '1.6',
                fontSize: '15px',
                whiteSpace: 'pre-wrap'
              }}
            >
              {product.description}
            </div>
            <div style={{ marginTop: '24px' }}>
              <button
                onClick={() => setShowDescriptionPopup(false)}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--tg-theme-button-color, #3b82f6)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
