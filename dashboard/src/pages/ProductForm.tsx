import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { Product } from "../types";
import "./ProductForm.css";

interface Props {
  product: Product | null;
  onClose: () => void;
  onSaved: (product: Product) => void;
}

function toCsv(arr?: string[]) {
  return (arr || []).join(", ");
}

function fromCsv(value: string) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function ProductForm({ product, onClose, onSaved }: Props) {
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [category, setCategory] = useState(product?.category || "");
  const [subcategory, setSubcategory] = useState(product?.subcategory || "");
  const [images, setImages] = useState(toCsv(product?.images));
  const [colors, setColors] = useState(toCsv(product?.colors));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      name,
      description,
      price: Number(price),
      category,
      subcategory,
      images: fromCsv(images),
      colors: fromCsv(colors),
    };

    try {
      const { data } = product
        ? await api.put(`/products/${product._id}`, payload)
        : await api.post("/products", payload);
      onSaved(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-panel card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>{product ? "Edit product" : "Add product"}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Price (₦)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Category</span>
              <input value={category} onChange={(e) => setCategory(e.target.value)} required />
            </label>
          </div>

          <label className="field">
            <span>Subcategory (optional)</span>
            <input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} />
          </label>

          <label className="field">
            <span>Image URLs (comma-separated)</span>
            <input
              value={images}
              onChange={(e) => setImages(e.target.value)}
              placeholder="https://…, https://…"
              required
            />
          </label>

          <label className="field">
            <span>Colors (optional, comma-separated)</span>
            <input value={colors} onChange={(e) => setColors(e.target.value)} placeholder="Red, Blue" />
          </label>

          {error && <div className="login-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save product"}
          </button>
        </div>
      </form>
    </div>
  );
}
