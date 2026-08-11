import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { Product } from "../types";
import ProductForm from "./ProductForm";
import "./Products.css";

export default function Products() {
  const { tenant } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const load = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/products/by-tenant", { tenantId: tenant.tenantId });
      setProducts(data.products || []);
    } catch {
      setError("Couldn't load products.");
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    try {
      await api.delete(`/products/${product._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
    } catch {
      alert("Failed to delete product.");
    }
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setFormOpen(true);
  }

  function handleSaved(saved: Product) {
    setFormOpen(false);
    setProducts((prev) => {
      const exists = prev.some((p) => p._id === saved._id);
      return exists ? prev.map((p) => (p._id === saved._id ? saved : p)) : [saved, ...prev];
    });
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p className="page-sub">{products.length} product{products.length === 1 ? "" : "s"} in your catalog</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add product
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : error ? (
          <div className="empty-state empty-state-error">{error}</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No products yet.</p>
            <button className="btn btn-primary" onClick={openCreate}>
              Add your first product
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="thumb">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} />
                      ) : (
                        <span className="thumb-placeholder">📦</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="product-name">{p.name}</div>
                    <div className="product-desc">{p.description}</div>
                  </td>
                  <td>{p.category}</td>
                  <td>₦{Number(p.price).toLocaleString()}</td>
                  <td className="row-actions">
                    <button className="btn btn-secondary" onClick={() => openEdit(p)}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(p)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <ProductForm
          product={editing}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
