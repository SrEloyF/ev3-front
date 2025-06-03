'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTokenFromCookie, decodePayload } from '@/app/lib/jwt';

type Product = {
  id: number;
  name: string;
  description: string;
  price: string;  // viene como string del backend
  stock: number;
  image_url: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<{ [key: number]: string }>({});

  // Al montarse, verificamos token y cargamos productos
  useEffect(() => {
    const token = getTokenFromCookie();
    if (!token) {
      router.push('/login');
      return;
    }
    const payload = decodePayload(token);
    if (!payload) {
      router.push('/login');
      return;
    }
    setUserId(payload.id);
    fetchProducts();
  }, [router]);

  // Filtrar productos cuando cambie searchTerm
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    setFiltered(
      term === ''
        ? products
        : products.filter((p) => p.name.toLowerCase().includes(term))
    );
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.data);
        setFiltered(data.data);
      }
    } catch {
      // Aquí podrías manejar errores
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleQuantityChange = (productId: number, value: string) => {
    if (/^\d*$/.test(value)) {
      setQuantities({ ...quantities, [productId]: value });
    }
  };

  // Cuando se añade al carrito, redirige a /cart
  const handleAddToCart = async (product: Product) => {
    if (!userId) {
      router.push('/login');
      return;
    }
    const qtyStr = quantities[product.id] || '1';
    const quantity = parseInt(qtyStr, 10);
    if (isNaN(quantity) || quantity < 1 || quantity > product.stock) {
      return; // opcionalmente muestra un error
    }
    try {
      const token = getTokenFromCookie();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          quantity
        })
      });
      if (res.ok) {
        router.push('/cart');
      } else {
        // opcional: manejar error de respuesta
      }
    } catch {
      // opcional: manejar error de conexión
    }
  };

  if (loading) {
    return (
      <div className="container-fluid vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <h5 className="text-muted">Cargando productos...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 py-4">
      <div className="container">
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="text-center">
              <h1 className="display-4 fw-bold text-primary mb-2">
                <i className="bi bi-shop me-2"></i>
                Catálogo de Productos
              </h1>
              <p className="lead text-muted">Descubre nuestra selección de productos</p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="row mb-4">
          <div className="col-12 col-md-8 col-lg-6 mx-auto">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="input-group">
                  <span className="input-group-text bg-primary text-white">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Buscar producto por nombre..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        {filtered.length === 0 ? (
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-body text-center py-5">
                  <i className="bi bi-search display-1 text-muted mb-3"></i>
                  <h4 className="text-muted">No se encontraron productos</h4>
                  <p className="text-muted">Intenta con otros términos de búsqueda</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="row mb-3">
              <div className="col-12">
                <h5 className="text-muted">
                  <i className="bi bi-grid-3x3-gap me-2"></i>
                  {filtered.length} producto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                </h5>
              </div>
            </div>
            
            <div className="row g-4">
              {filtered.map((prod) => (
                <div key={prod.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <div className="card h-100 shadow-sm hover-shadow transition-all">
                    {/* Product Image */}
                    <div className="position-relative overflow-hidden">
                      <img
                        src={prod.image_url}
                        alt={prod.name}
                        className="card-img-top object-fit-cover"
                        style={{ height: '200px' }}
                      />
                      {prod.stock === 0 && (
                        <div className="position-absolute top-0 end-0 m-2">
                          <span className="badge bg-danger">Agotado</span>
                        </div>
                      )}
                      {prod.stock < 5 && prod.stock > 0 && (
                        <div className="position-absolute top-0 end-0 m-2">
                          <span className="badge bg-warning text-dark">Últimas unidades</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title text-truncate" title={prod.name}>
                        {prod.name}
                      </h5>
                      <p className="card-text text-muted small mb-2" style={{ minHeight: '40px' }}>
                        {prod.description.length > 80 
                          ? `${prod.description.substring(0, 80)}...` 
                          : prod.description
                        }
                      </p>
                      
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="h5 text-primary fw-bold mb-0">
                            ${parseFloat(prod.price).toLocaleString()}
                          </span>
                          <small className="text-muted">
                            <i className="bi bi-box-seam me-1"></i>
                            Stock: {prod.stock}
                          </small>
                        </div>
                        
                        {/* Progress bar for stock */}
                        <div className="progress" style={{ height: '4px' }}>
                          <div 
                            className={`progress-bar ${
                              prod.stock > 10 ? 'bg-success' : 
                              prod.stock > 5 ? 'bg-warning' : 'bg-danger'
                            }`}
                            style={{ width: `${Math.min((prod.stock / 20) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Quantity and Add to Cart */}
                      <div className="mt-auto">
                        <div className="input-group mb-3">
                          <span className="input-group-text">
                            <i className="bi bi-123"></i>
                          </span>
                          <input
                            type="number"
                            className="form-control"
                            min="1"
                            max={prod.stock}
                            value={quantities[prod.id] || ''}
                            placeholder="1"
                            onChange={(e) => handleQuantityChange(prod.id, e.target.value)}
                            disabled={prod.stock === 0}
                          />
                        </div>
                        
                        <button
                          onClick={() => handleAddToCart(prod)}
                          disabled={prod.stock === 0}
                          className={`btn w-100 ${
                            prod.stock === 0 
                              ? 'btn-outline-secondary' 
                              : 'btn-primary'
                          } d-flex align-items-center justify-content-center`}
                        >
                          <i className={`bi ${
                            prod.stock === 0 ? 'bi-x-circle' : 'bi-cart-plus'
                          } me-2`}></i>
                          {prod.stock === 0 ? 'Agotado' : 'Añadir al carrito'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .hover-shadow {
          transition: all 0.3s ease;
        }
        .hover-shadow:hover {
          transform: translateY(-2px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
        .transition-all {
          transition: all 0.3s ease;
        }
        .object-fit-cover {
          object-fit: cover;
        }
      `}</style>
    </div>
  );
}