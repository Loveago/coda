'use client';

import { useMemo, useState } from 'react';
import {
  Boxes, FolderTree, Loader2, Minus, Package, Pencil, Plus, Search, Tag, Trash2
} from 'lucide-react';
import ImageUploadField from '@/components/ImageUploadField';

type Category = { id: string; name: string; slug: string; _count?: { products: number } };
type Product = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  stock: number;
  brand: string | null;
  available: boolean;
  categoryId: string | null;
  createdAt: string;
};

const field = { padding: '11px 13px', border: '1px solid var(--line)', borderRadius: 9, background: '#fff', fontSize: 12.5, width: '100%' };
const label = { fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5, letterSpacing: '.4px' };

const suggestedCategories = [
  'Spare Parts', 'Tyres & Wheels', 'Oils & Fluids', 'Batteries', 'Braking System',
  'Engine Parts', 'Body Parts', 'Electrical & Lighting', 'Interior & Comfort',
  'Exterior & Accessories', 'Car Care & Cleaning', 'Tools & Equipment', 'Lubricants', 'Filters'
];

function ghs(pesewas: number | null) {
  return pesewas === null ? 'PRICE ON REQUEST' : `GHS ${(pesewas / 100).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function nextSku(existing: string[], name: string) {
  const prefix = (slugify(name).split('-')[0] || 'part').slice(0, 5).toUpperCase();
  let n = existing.length + 1;
  let sku = `${prefix}-${String(n).padStart(4, '0')}`;
  while (existing.includes(sku)) {
    n += 1;
    sku = `${prefix}-${String(n).padStart(4, '0')}`;
  }
  return sku;
}

export default function ProductManager({
  initialProducts,
  initialCategories
}: {
  initialProducts: Product[];
  initialCategories: Category[];
}) {
  const [tab, setTab] = useState<'products' | 'categories'>('products');
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // ===== Add-product form state =====
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // ===== Edit modal state =====
  const [editing, setEditing] = useState<Product | null>(null);
  // price is held as a GHS decimal string while editing, converted to pesewas on save.
  const [editDraft, setEditDraft] = useState<Record<string, unknown>>({});
  const [editImages, setEditImages] = useState<string[]>([]);

  // ===== Category form state =====
  const [catName, setCatName] = useState('');
  const [catBusy, setCatBusy] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryFilter && product.categoryId !== categoryFilter) return false;
      if (!needle) return true;
      return [product.name, product.sku, product.brand || '', product.description || ''].join(' ').toLowerCase().includes(needle);
    });
  }, [products, query, categoryFilter]);

  const lowStock = products.filter((product) => product.stock <= 5);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/management/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          sku: sku || nextSku(products.map((product) => product.sku), name),
          description: description || undefined,
          imageUrl: images[0] || undefined,
          price: price ? Math.round(Number(price) * 100) : undefined,
          stock: Number(stock || 0),
          brand: brand || undefined,
          categoryId: categorySlug || undefined,
          available: true
        })
      });
      const created = await response.json();
      if (!response.ok) throw new Error(created.error || 'Could not save the product.');
      setProducts((current) => [created, ...current]);
      if (created.category) {
        setCategories((current) => (current.some((category) => category.id === created.category.id)
          ? current.map((category) => (category.id === created.category.id ? { ...category, _count: { products: (category._count?.products ?? 0) + 1 } } : category))
          : [...current, { ...created.category, _count: { products: 1 } }]));
      }
      setName(''); setSku(''); setBrand(''); setPrice(''); setStock('1'); setDescription(''); setImages([]); setCategorySlug('');
      setMessage({ ok: true, text: `"${created.name}" added to the catalogue.` });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Could not save the product.' });
    } finally {
      setSaving(false);
    }
  }

  async function patch(id: string, data: Record<string, unknown>) {
    setBusy(id);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/management/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Update failed.');
      setProducts((current) => current.map((product) => (product.id === id ? { ...product, ...result } : product)));
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Update failed.' });
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this product permanently?')) return;
    setBusy(id);
    try {
      const response = await fetch('/api/admin/management/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!response.ok) throw new Error('Delete failed.');
      setProducts((current) => current.filter((product) => product.id !== id));
      setMessage({ ok: true, text: 'Product deleted.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Delete failed.' });
    } finally {
      setBusy(null);
    }
  }

  function openEdit(product: Product) {
    setEditing(product);
    // Store price as a GHS string in the draft — saveEdit converts back to pesewas.
    setEditDraft({ name: product.name, sku: product.sku, brand: product.brand ?? '', price: product.price === null ? '' : (product.price / 100).toFixed(2), stock: product.stock, description: product.description ?? '', categoryId: product.categoryId });
    setEditImages(product.imageUrl ? [product.imageUrl] : []);
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(editing.id);
    try {
      const payload = {
        ...editDraft,
        imageUrl: editImages[0] || null,
        price: editDraft.price === undefined || editDraft.price === null || editDraft.price === '' || Number.isNaN(Number(editDraft.price)) ? null : Math.round(Number(editDraft.price) * 100)
      };
      const response = await fetch('/api/admin/management/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...payload })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Update failed.');
      setProducts((current) => current.map((product) => (product.id === editing.id ? { ...product, ...result } : product)));
      setEditing(null);
      setMessage({ ok: true, text: 'Product updated.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Update failed.' });
    } finally {
      setBusy(null);
    }
  }

  async function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!catName.trim()) return;
    setCatBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/management/product-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName.trim(), slug: slugify(catName) })
      });
      const created = await response.json();
      if (!response.ok) throw new Error(created.error || 'Could not add the category.');
      setCategories((current) => [...current, { ...created, _count: { products: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
      setCatName('');
      setMessage({ ok: true, text: `Category "${created.name}" created.` });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Could not add the category.' });
    } finally {
      setCatBusy(false);
    }
  }

  async function removeCategory(id: string) {
    if (!window.confirm('Delete this category? Products must be moved first.')) return;
    setBusy(id);
    try {
      const response = await fetch('/api/admin/management/product-categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Delete failed.');
      setCategories((current) => current.filter((category) => category.id !== id));
      setMessage({ ok: true, text: 'Category deleted.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Delete failed.' });
    } finally {
      setBusy(null);
    }
  }

  const categoryName = (id: string | null) => categories.find((category) => category.id === id)?.name || 'Uncategorised';

  return (
    <section style={{ display: 'grid', gap: 22 }}>
      <div className="payfilters" role="tablist" aria-label="Catalogue sections">
        <button type="button" role="tab" aria-selected={tab === 'products'} className={`payfilter${tab === 'products' ? ' on' : ''}`} onClick={() => setTab('products')}>
          <Package size={12} style={{ verticalAlign: -2 }} /> PRODUCTS ({products.length})
        </button>
        <button type="button" role="tab" aria-selected={tab === 'categories'} className={`payfilter${tab === 'categories' ? ' on' : ''}`} onClick={() => setTab('categories')}>
          <FolderTree size={12} style={{ verticalAlign: -2 }} /> CATEGORIES ({categories.length})
        </button>
      </div>

      {message && <p role="status" className={message.ok ? 'status-ok' : 'status-err'} style={{ margin: 0 }}>{message.text}</p>}

      {tab === 'products' && (
        <>
          {lowStock.length > 0 && (
            <div className="renew-banner" style={{ padding: '14px 18px' }}>
              <div style={{ position: 'relative', zIndex: 1, fontSize: 12.5 }}>
                <strong><Boxes size={14} style={{ verticalAlign: -2 }} /> Low stock alert:</strong>{' '}
                {lowStock.slice(0, 4).map((product) => `${product.name} (${product.stock})`).join(', ')}
                {lowStock.length > 4 ? ` +${lowStock.length - 4} more` : ''}
              </div>
            </div>
          )}

          <div className="admin-panel">
            <h2>Add a product</h2>
            <form onSubmit={create} style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div>
                  <label style={label}>PRODUCT NAME *</label>
                  <input value={name} onChange={(event) => { setName(event.target.value); if (!sku) setSku(nextSku(products.map((p) => p.sku), event.target.value || 'part')); }} required minLength={2} placeholder="e.g. Brake Pads — Toyota Corolla" style={field} />
                </div>
                <div>
                  <label style={label}>SKU *</label>
                  <input value={sku} onChange={(event) => setSku(event.target.value.toUpperCase())} required placeholder="Auto-generated" style={field} />
                </div>
                <div>
                  <label style={label}>CATEGORY</label>
                  <select value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)} style={field}>
                    <option value="">— Uncategorised —</option>
                    {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={label}>BRAND</label>
                  <input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="e.g. Bosch, Toyota" style={field} />
                </div>
                <div>
                  <label style={label}>PRICE (GHS)</label>
                  <input value={price} onChange={(event) => setPrice(event.target.value)} type="number" step="0.01" min={0} placeholder="Leave empty = on request" style={field} />
                </div>
                <div>
                  <label style={label}>STOCK QTY *</label>
                  <input value={stock} onChange={(event) => setStock(event.target.value)} type="number" min={0} required style={field} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Missing a category? Create one:</span>
                {suggestedCategories.filter((suggestion) => !categories.some((category) => category.name === suggestion)).slice(0, 8).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="admin-action"
                    style={{ fontSize: 10.5 }}
                    onClick={() => {
                      setCatName(suggestion);
                      setTab('categories');
                      setMessage({ ok: true, text: `Press "Add category" to create "${suggestion}", then return to products.` });
                    }}
                  >
                    <Tag size={10} /> {suggestion}
                  </button>
                ))}
              </div>

              <ImageUploadField urls={images} onChange={setImages} max={1} label="Product photo" />

              <div>
                <label style={label}>DESCRIPTION</label>
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} placeholder="Fitment details, condition, warranty…" style={{ ...field, resize: 'vertical' }} />
              </div>

              <button className="btn btn-primary" disabled={saving} style={{ justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {saving ? <Loader2 size={15} className="spin" /> : <Plus size={15} />} {saving ? 'SAVING...' : 'ADD PRODUCT'}
              </button>
            </form>
          </div>

          <div className="admin-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>Catalogue ({filtered.length})</h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--muted)' }} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products…" style={{ ...field, width: 210, paddingLeft: 30 }} aria-label="Search products" />
                </span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} style={{ ...field, width: 180 }} aria-label="Filter by category">
                  <option value="">All categories</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>
            </div>
            {filtered.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>{products.length === 0 ? 'No products yet — add your first spare part or accessory above.' : 'No products match your filters.'}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table card-table">
                  <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>State</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filtered.map((product) => (
                      <tr key={product.id}>
                        <td data-label="Product">
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            {product.imageUrl
                              ? <img src={product.imageUrl} alt="" style={{ width: 52, height: 40, objectFit: 'cover', borderRadius: 7, border: '1px solid var(--line)' }} />
                              : <span style={{ width: 52, height: 40, borderRadius: 7, background: '#F1F1F1', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}><Package size={16} /></span>}
                            <span><strong>{product.name}</strong><br /><small style={{ color: 'var(--muted)' }}>{product.sku}{product.brand ? ` · ${product.brand}` : ''}</small></span>
                          </div>
                        </td>
                        <td data-label="Category">{categoryName(product.categoryId)}</td>
                        <td data-label="Price"><strong>{ghs(product.price)}</strong></td>
                        <td data-label="Stock">
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button type="button" className="admin-action" style={{ padding: '3px 8px' }} disabled={busy === product.id || product.stock <= 0} onClick={() => patch(product.id, { stock: Math.max(0, product.stock - 1) })} aria-label="Decrease stock"><Minus size={11} /></button>
                            <strong style={{ color: product.stock <= 5 ? '#C0392B' : undefined, minWidth: 26, textAlign: 'center', display: 'inline-block' }}>{product.stock}</strong>
                            <button type="button" className="admin-action" style={{ padding: '3px 8px' }} disabled={busy === product.id} onClick={() => patch(product.id, { stock: product.stock + 1 })} aria-label="Increase stock"><Plus size={11} /></button>
                          </div>
                        </td>
                        <td data-label="State"><span className={`badge ${product.available ? 'badge-active' : 'badge-INACTIVE'}`}>{product.available ? 'LISTED' : 'HIDDEN'}</span></td>
                        <td data-label="Actions">
                          <button type="button" className="admin-action" disabled={busy === product.id} onClick={() => openEdit(product)}><Pencil size={11} /> EDIT</button>
                          <button type="button" className="admin-action" disabled={busy === product.id} onClick={() => patch(product.id, { available: !product.available })}>{product.available ? 'DELIST' : 'LIST'}</button>
                          <button type="button" className="admin-action danger" disabled={busy === product.id} onClick={() => remove(product.id)}><Trash2 size={11} /> DELETE</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'categories' && (
        <>
          <div className="admin-panel">
            <h2>Add a category</h2>
            <form onSubmit={addCategory} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <label style={label}>CATEGORY NAME *</label>
                <input value={catName} onChange={(event) => setCatName(event.target.value)} required minLength={2} placeholder="e.g. Suspension Parts" style={field} />
              </div>
              <button className="btn btn-primary" disabled={catBusy} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {catBusy ? <Loader2 size={15} className="spin" /> : <Plus size={15} />} ADD CATEGORY
              </button>
            </form>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {suggestedCategories.map((suggestion) => (
                <button key={suggestion} type="button" className="admin-action" style={{ fontSize: 10.5 }} onClick={() => setCatName(suggestion)}>
                  <Tag size={10} /> {suggestion}
                </button>
              ))}
            </div>
          </div>
          <div className="admin-panel">
            <h2>Categories ({categories.length})</h2>
            {categories.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>No categories yet.</p>
            ) : (
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Slug</th><th>Products</th><th>Actions</th></tr></thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td><strong>{category.name}</strong></td>
                      <td><small>{category.slug}</small></td>
                      <td>{category._count?.products ?? products.filter((product) => product.categoryId === category.id).length}</td>
                      <td>
                        <button type="button" className="admin-action danger" disabled={busy === category.id} onClick={() => removeCategory(category.id)}><Trash2 size={11} /> DELETE</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ===== Edit modal ===== */}
      {editing && (
        <div role="dialog" aria-modal="true" aria-label={`Edit ${editing.name}`} onClick={(event) => { if (event.target === event.currentTarget) setEditing(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,.55)', zIndex: 120, display: 'grid', placeItems: 'center', padding: 16 }}>
          <div className="admin-panel" style={{ width: 'min(620px, 100%)', maxHeight: '88vh', overflowY: 'auto' }}>
            <h2>Edit product</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={label}>NAME</label>
                <input value={String(editDraft.name ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, name: event.target.value }))} style={field} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={label}>SKU</label>
                  <input value={String(editDraft.sku ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, sku: event.target.value.toUpperCase() }))} style={field} />
                </div>
                <div>
                  <label style={label}>BRAND</label>
                  <input value={String(editDraft.brand ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, brand: event.target.value }))} style={field} />
                </div>
                <div>
                  <label style={label}>PRICE (GHS)</label>
                  <input type="number" step="0.01" min={0} value={String(editDraft.price ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, price: event.target.value }))} style={field} />
                </div>
                <div>
                  <label style={label}>STOCK</label>
                  <input type="number" min={0} value={String(editDraft.stock ?? 0)} onChange={(event) => setEditDraft((d) => ({ ...d, stock: Number(event.target.value) }))} style={field} />
                </div>
              </div>
              <div>
                <label style={label}>CATEGORY</label>
                <select value={String(editDraft.categoryId ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, categoryId: event.target.value || null }))} style={field}>
                  <option value="">— Uncategorised —</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>DESCRIPTION</label>
                <textarea rows={2} value={String(editDraft.description ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, description: event.target.value }))} style={{ ...field, resize: 'vertical' }} />
              </div>
              <ImageUploadField urls={editImages} onChange={setEditImages} max={1} label="Product photo" />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>CANCEL</button>
                <button type="button" className="btn btn-primary" disabled={busy === editing.id} onClick={saveEdit}>{busy === editing.id ? 'SAVING...' : 'SAVE CHANGES'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
