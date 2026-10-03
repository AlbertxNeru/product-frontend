import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/api'

const emptyForm = {
  product_name: '',
  description: '',
  price: '',
  quantity: '',
}

function Products() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  })()

  const loadProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/api/products')
      setProducts(response.data?.products || [])
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products

    return products.filter((product) =>
      [product.product_name, product.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    )
  }, [products, search])

  const inventoryValue = useMemo(
    () =>
      products.reduce(
        (total, product) => total + Number(product.price || 0) * Number(product.quantity || 0),
        0,
      ),
    [products],
  )

  const totalUnits = useMemo(
    () => products.reduce((total, product) => total + Number(product.quantity || 0), 0),
    [products],
  )

  const openAddModal = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setForm({
      product_name: product.product_name || '',
      description: product.description || '',
      price: product.price ?? '',
      quantity: product.quantity ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  const handleFormChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const saveProduct = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    const payload = {
      ...form,
      price: Number(form.price),
      quantity: Number(form.quantity),
    }

    try {
      if (editingProduct) {
        await api.put(`/api/products/${editingProduct.id}`, payload)
        setNotice('Product updated successfully.')
      } else {
        await api.post('/api/products', payload)
        setNotice('Product added successfully.')
      }

      setModalOpen(false)
      setForm(emptyForm)
      setEditingProduct(null)
      await loadProducts()
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to save the product.')
    } finally {
      setSaving(false)
    }
  }

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(`Delete “${product.product_name}”?`)
    if (!confirmed) return

    setError('')
    setNotice('')
    try {
      await api.delete(`/api/products/${product.id}`)
      setProducts((current) => current.filter((item) => item.id !== product.id))
      setNotice('Product deleted successfully.')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to delete the product.')
    }
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    try {
      if (refreshToken) {
        await api.post('/api/logout', { refresh_token: refreshToken })
      }
    } catch {
      // Local sign-out should still continue even if the API is unavailable.
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      navigate('/login', { replace: true })
    }
  }

  const currency = (value) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(Number(value || 0))

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">PM</div>
          <div>
            <strong>Product Manager</strong>
            <span>LavaLust + React</span>
          </div>
        </div>

        <nav>
          <a className="nav-item active" href="#products">
            <span className="nav-icon">▦</span>
            Products
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{(user.username || user.email || 'U').charAt(0).toUpperCase()}</div>
            <div>
              <strong>{user.username || 'User'}</strong>
              <span>{user.email || 'Authenticated user'}</span>
            </div>
          </div>
          <button className="secondary-button full-button" onClick={logout} type="button">
            Log out
          </button>
        </div>
      </aside>

      <main className="dashboard-main" id="products">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">INVENTORY</span>
            <h1>Products</h1>
            <p>Manage your product records through the LavaLust API.</p>
          </div>
          <button className="primary-button" onClick={openAddModal} type="button">
            + Add product
          </button>
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <span>Total products</span>
            <strong>{products.length}</strong>
            <small>Records in the database</small>
          </article>
          <article className="stat-card">
            <span>Total units</span>
            <strong>{totalUnits}</strong>
            <small>Current stock quantity</small>
          </article>
          <article className="stat-card">
            <span>Inventory value</span>
            <strong>{currency(inventoryValue)}</strong>
            <small>Price × quantity</small>
          </article>
        </section>

        {notice && <div className="alert success-alert">{notice}</div>}
        {error && !modalOpen && <div className="alert error-alert">{error}</div>}

        <section className="table-card">
          <div className="table-toolbar">
            <div>
              <h2>Product list</h2>
              <p>{filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'} shown</p>
            </div>
            <label className="search-box">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
              />
            </label>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Created</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="empty-state">Loading products…</td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      <strong>No products found.</strong>
                      <span>Add your first product to get started.</span>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-cell">
                          <div className="product-icon">{product.product_name?.charAt(0)?.toUpperCase()}</div>
                          <div>
                            <strong>{product.product_name}</strong>
                            <span>{product.description || 'No description'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="price-cell">{currency(product.price)}</td>
                      <td>
                        <span className={`stock-badge ${Number(product.quantity) === 0 ? 'out' : ''}`}>
                          {product.quantity}
                        </span>
                      </td>
                      <td>{product.created_at ? new Date(product.created_at).toLocaleDateString() : '—'}</td>
                      <td>
                        <div className="row-actions">
                          <button className="table-button" onClick={() => openEditModal(product)} type="button">
                            Edit
                          </button>
                          <button className="table-button danger" onClick={() => deleteProduct(product)} type="button">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={() => setModalOpen(false)}>
          <section className="modal-card" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">{editingProduct ? 'UPDATE RECORD' : 'NEW RECORD'}</span>
                <h2>{editingProduct ? 'Edit product' : 'Add product'}</h2>
              </div>
              <button className="icon-button" onClick={() => setModalOpen(false)} type="button" aria-label="Close">
                ×
              </button>
            </div>

            <form onSubmit={saveProduct} className="product-form">
              <label>
                Product name
                <input
                  name="product_name"
                  value={form.product_name}
                  onChange={handleFormChange}
                  maxLength="100"
                  placeholder="e.g. Wireless Mouse"
                  required
                  autoFocus
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows="4"
                  placeholder="Short product description"
                />
              </label>

              <div className="form-grid">
                <label>
                  Price (PHP)
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </label>

                <label>
                  Quantity
                  <input
                    type="number"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleFormChange}
                    min="0"
                    step="1"
                    placeholder="0"
                    required
                  />
                </label>
              </div>

              {error && <div className="alert error-alert">{error}</div>}

              <div className="modal-actions">
                <button className="secondary-button" onClick={() => setModalOpen(false)} type="button">
                  Cancel
                </button>
                <button className="primary-button" disabled={saving} type="submit">
                  {saving ? 'Saving…' : editingProduct ? 'Save changes' : 'Add product'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default Products
