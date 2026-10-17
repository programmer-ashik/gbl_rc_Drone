import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { categoryService } from "../../services/categoryService";
import { useCatalog } from "../../contexts/CatalogContext";

const EMPTY_FORM = {
  name: "",
  parentId: "",
  icon: "",
  image: "",
  metaTitle: "",
  metaDescription: "",
  isActive: true,
  isNavVisible: true,
  isFooterVisible: false,
  displayOrder: 0,
};

const visibilityClass = (on) =>
  on ? "bg-success-bg text-success" : "bg-background text-text-muted";

export const AdminCategories = () => {
  const { refreshCategories } = useCatalog();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const load = async () => {
    setLoading(true);
    try {
      const items = await categoryService.manage();
      setCategories(items || []);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const parents = useMemo(
    () => categories.filter((item) => item.level < 3 && item._id !== editingId),
    [categories, editingId],
  );

  const grouped = useMemo(() => {
    const byParent = new Map();
    categories.forEach((item) => {
      const key = item.parentId || "root";
      const current = byParent.get(key) || [];
      current.push(item);
      byParent.set(key, current);
    });
    const walk = (parentId, depth) => {
      const rows = (byParent.get(parentId) || []).sort(
        (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
      );
      return rows.flatMap((item) => [{ ...item, depth }, ...walk(item._id, depth + 1)]);
    };
    return walk("root", 0);
  }, [categories]);

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name || item.label || "",
      parentId: item.parentId || "",
      icon: item.icon || "",
      image: item.image || "",
      metaTitle: item.metaTitle || "",
      metaDescription: item.metaDescription || "",
      isActive: item.isActive ?? true,
      isNavVisible: item.isNavVisible ?? true,
      isFooterVisible: item.isFooterVisible ?? false,
      displayOrder: item.displayOrder ?? 0,
    });
  };

  const resetForm = () => {
    setEditingId("");
    setForm(EMPTY_FORM);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      parentId: form.parentId || null,
      displayOrder: Number(form.displayOrder) || 0,
    };
    try {
      if (editingId) {
        await categoryService.update(editingId, payload);
      } else {
        await categoryService.create(payload);
      }
      resetForm();
      await load();
      await refreshCategories();
    } catch (requestError) {
      setError(requestError.message || "Could not save category");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item, field) => {
    try {
      await categoryService.toggleVisibility(item._id, { [field]: !item[field] });
      await load();
      await refreshCategories();
    } catch (requestError) {
      setError(requestError.message || "Could not update visibility");
    }
  };

  const move = async (item, direction) => {
    const siblings = categories
      .filter((candidate) => (candidate.parentId || "") === (item.parentId || ""))
      .sort((a, b) => a.displayOrder - b.displayOrder);
    const index = siblings.findIndex((candidate) => candidate._id === item._id);
    const swapWith = siblings[index + direction];
    if (!swapWith) return;
    try {
      await categoryService.reorder([
        { id: item._id, displayOrder: swapWith.displayOrder, parentId: item.parentId || null },
        { id: swapWith._id, displayOrder: item.displayOrder, parentId: swapWith.parentId || null },
      ]);
      await load();
      await refreshCategories();
    } catch (requestError) {
      setError(requestError.message || "Could not reorder categories");
    }
  };

  const disable = async (item) => {
    if (!window.confirm(`Disable ${item.name}?`)) return;
    try {
      await categoryService.remove(item._id);
      await load();
      await refreshCategories();
    } catch (requestError) {
      setError(requestError.message || "Could not disable category");
    }
  };

  return (
    <AdminLayout title="Category Navigation">
      {error && (
        <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 text-red-400 text-sm p-3">
          {error}
        </div>
      )}

      <form
        onSubmit={submit}
        className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3 bg-background-secondary border border-border rounded-2xl p-4"
      >
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          required
          placeholder="Category name"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          name="parentId"
          value={form.parentId}
          onChange={onChange}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Top level</option>
          {parents.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name} (L{item.level})
            </option>
          ))}
        </select>
        <input
          name="icon"
          value={form.icon}
          onChange={onChange}
          placeholder="Icon key"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="image"
          value={form.image}
          onChange={onChange}
          placeholder="Banner image URL"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="metaTitle"
          value={form.metaTitle}
          onChange={onChange}
          placeholder="SEO title"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="displayOrder"
          type="number"
          min="0"
          value={form.displayOrder}
          onChange={onChange}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <textarea
          name="metaDescription"
          value={form.metaDescription}
          onChange={onChange}
          placeholder="SEO description"
          className="md:col-span-2 rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-20"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" checked={form.isActive} onChange={onChange} />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isNavVisible" checked={form.isNavVisible} onChange={onChange} />
          Show in nav
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isFooterVisible" checked={form.isFooterVisible} onChange={onChange} />
          Show in footer
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-warning text-white px-4 py-2 text-sm font-semibold"
          >
            {editingId ? "Update" : "Add"} category
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-xl border border-border px-4 py-2 text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="bg-background-secondary border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-sm font-bold">Navigation tree</div>
        {loading ? (
          <div className="p-6 text-sm text-text-muted">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Flags</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((item) => (
                  <tr key={item._id} className="border-t border-border">
                    <td className="px-4 py-3" style={{ paddingLeft: `${16 + item.depth * 18}px` }}>
                      <div className="font-semibold text-text">{item.name}</div>
                      <div className="text-xs text-text-muted">{item.slug}</div>
                    </td>
                    <td className="px-4 py-3">L{item.level}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button type="button" className={`rounded-full px-2 py-0.5 text-[11px] ${visibilityClass(item.isActive)}`} onClick={() => toggle(item, "isActive")}>
                          {item.isActive ? "Active" : "Hidden"}
                        </button>
                        <button type="button" className={`rounded-full px-2 py-0.5 text-[11px] ${visibilityClass(item.isNavVisible)}`} onClick={() => toggle(item, "isNavVisible")}>
                          Nav
                        </button>
                        <button type="button" className={`rounded-full px-2 py-0.5 text-[11px] ${visibilityClass(item.isFooterVisible)}`} onClick={() => toggle(item, "isFooterVisible")}>
                          Footer
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">{item.displayOrder}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => move(item, -1)} className="text-xs font-semibold">
                          Up
                        </button>
                        <button type="button" onClick={() => move(item, 1)} className="text-xs font-semibold">
                          Down
                        </button>
                        <button type="button" onClick={() => startEdit(item)} className="text-xs font-semibold text-warning">
                          Edit
                        </button>
                        <button type="button" onClick={() => disable(item)} className="text-xs font-semibold text-danger">
                          Disable
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  );
};

export default AdminCategories;
