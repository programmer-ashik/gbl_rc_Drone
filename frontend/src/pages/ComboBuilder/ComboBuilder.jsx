import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ROUTES } from "../../constants";
import Icon from "../../components/common/Icon/Icon";
import Button from "../../components/common/Button/Button";
import { productService } from "../../services/productService";
import { addToCart } from "../../store/slices/cartSlice";
import {
  estimateFlightMinutes,
  productImages,
  productPath,
  productPrice,
  productTitle,
  resolveAssetUrl,
} from "../../utils/products";

const STEPS = [
  { key: "frame", label: "Frame", categoryHints: ["fpv-racing", "accessories"], attr: { use: "fpv" }, typeHint: "frame" },
  { key: "motor", label: "Motors", categoryHints: ["motors", "fpv-racing"], attr: { type: "brushless" }, typeHint: "motor", qty: 4 },
  { key: "esc", label: "ESC", categoryHints: ["motors", "fpv-racing", "accessories"], attr: {}, typeHint: "esc" },
  { key: "propeller", label: "Propellers", categoryHints: ["accessories", "fpv-racing"], attr: {}, typeHint: "propeller", qty: 4 },
  { key: "battery", label: "Battery", categoryHints: ["batteries"], attr: { chemistry: "lipo" }, typeHint: "battery" },
];

const pickCompatible = (frame, type, catalog) => {
  const fromFrame = (frame?.compatibleWith || [])
    .filter((entry) => entry.productType === type)
    .flatMap((entry) => (entry.productIds || []).map((item) => (typeof item === "object" ? item : null)))
    .filter(Boolean);
  if (fromFrame.length) return fromFrame;
  return catalog.filter((item) => {
    const text = `${item.category || ""} ${item.subcategory || ""} ${item.name || item.title || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
    return text.includes(type) || (item.attributes?.use === "fpv" && type !== "battery");
  });
};

export const ComboBuilder = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState("frame");
  const [selection, setSelection] = useState({});
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      productService.filter({ category: "fpv-racing", limit: 50, inStock: "true" }),
      productService.filter({ category: "motors", limit: 50, inStock: "true" }),
      productService.filter({ category: "batteries", limit: 50, inStock: "true" }),
      productService.filter({ category: "accessories", limit: 50, inStock: "true" }),
    ])
      .then((responses) => {
        if (!active) return;
        const map = new Map();
        responses.forEach((response) => {
          (response.items || []).forEach((item) => map.set(item._id, item));
        });
        setCatalog([...map.values()]);
      })
      .catch(() => active && setCatalog([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const frame = selection.frame;
  const options = useMemo(() => {
    if (activeStep === "frame") {
      return catalog.filter((item) => {
        const text = `${item.category || ""} ${item.subcategory || ""} ${item.name || ""}`.toLowerCase();
        return text.includes("frame") || item.attributes?.platform === "racing" || item.subcategory?.includes("frame");
      });
    }
    return pickCompatible(frame, activeStep, catalog);
  }, [activeStep, catalog, frame]);

  const totals = useMemo(() => {
    let price = 0;
    let motors = 0;
    let batteryMah = 0;
    let propellerInch = 0;
    STEPS.forEach((step) => {
      const product = selection[step.key];
      if (!product) return;
      const qty = step.qty || 1;
      price += productPrice(product) * qty;
      if (step.key === "motor") motors = qty;
      if (step.key === "battery") {
        const match = `${product.name || ""} ${(product.specifications || []).join(" ")}`.match(/(\d{3,5})\s*mah/i);
        batteryMah = match ? Number(match[1]) : Number(product.attributes?.capacity || 0);
      }
      if (step.key === "propeller") {
        const match = `${product.name || ""} ${(product.specifications || []).join(" ")}`.match(/(\d+(?:\.\d+)?)\s*(?:inch|")/i);
        propellerInch = match ? Number(match[1]) : 5;
      }
    });
    return {
      price,
      flightMinutes: estimateFlightMinutes({ motors, batteryMah, propellerInch }),
      parts: STEPS.filter((step) => selection[step.key]).length,
    };
  }, [selection]);

  const choose = (product) => {
    setSelection((current) => ({ ...current, [activeStep]: product }));
    const index = STEPS.findIndex((step) => step.key === activeStep);
    if (index < STEPS.length - 1) setActiveStep(STEPS[index + 1].key);
  };

  const addComboToCart = async () => {
    const items = STEPS.map((step) => selection[step.key]).filter(Boolean);
    if (!items.length) return;
    setAdding(true);
    try {
      for (const step of STEPS) {
        const product = selection[step.key];
        if (!product) continue;
        await dispatch(addToCart({ productId: product._id, quantity: step.qty || 1 }));
      }
      navigate(ROUTES.CART);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="site-container py-5 text-text md:py-8">
      <nav className="page-breadcrumb" aria-label="Breadcrumb">
        <Link to={ROUTES.HOME} className="hover:text-warning">Home</Link>
        <Icon name="chevron-right" size={3} className="cursor-default" />
        <Link to={ROUTES.COMBO_PACKAGES} className="hover:text-warning">Combos</Link>
        <Icon name="chevron-right" size={3} className="cursor-default" />
        <span className="font-medium text-text">Combo builder</span>
      </nav>

      <div className="mb-4 border-b border-border pb-4">
        <h1 className="page-title">FPV Combo Builder</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-text-muted">
          Start with a frame, then pick compatible motors, ESCs, propellers, and a battery. Price and estimated flight time update as you build.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        <aside className="space-y-2">
          {STEPS.map((step, index) => {
            const selected = selection[step.key];
            const locked = step.key !== "frame" && !selection.frame;
            return (
              <button
                key={step.key}
                type="button"
                disabled={locked}
                onClick={() => setActiveStep(step.key)}
                className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left ${activeStep === step.key ? "border-warning bg-warning/10" : "border-border bg-background-secondary"} ${locked ? "opacity-40" : ""}`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-xs font-bold">{index + 1}</span>
                <span>
                  <span className="block text-sm font-semibold">{step.label}</span>
                  <span className="block text-xs text-text-muted">{selected ? productTitle(selected) : locked ? "Select a frame first" : "Choose a part"}</span>
                </span>
              </button>
            );
          })}
        </aside>

        <section className="rounded-2xl border border-border bg-background-secondary p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-text-primary">Select {STEPS.find((step) => step.key === activeStep)?.label}</h2>
            <span className="text-xs text-text-muted">{options.length} options</span>
          </div>
          {loading ? (
            <div className="py-16 text-center text-text-muted">Loading compatible parts...</div>
          ) : options.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {options.map((product) => {
                const active = selection[activeStep]?._id === product._id;
                const image = productImages(product)[0];
                return (
                  <button
                    key={product._id}
                    type="button"
                    onClick={() => choose(product)}
                    className={`flex gap-3 rounded-xl border p-3 text-left transition-colors ${active ? "border-warning bg-warning/5" : "border-border bg-background hover:border-warning/60"}`}
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-background-secondary">
                      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-semibold text-text">{productTitle(product)}</p>
                      <p className="mt-1 text-sm font-bold text-warning">৳{productPrice(product).toLocaleString()}</p>
                      <p className="mt-1 text-xs capitalize text-text-muted">{product.category?.replace(/-/g, " ")}</p>
                      <Link to={productPath(product)} onClick={(event) => event.stopPropagation()} className="mt-2 inline-block text-xs font-semibold text-warning">
                        Details
                      </Link>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-background py-12 text-center text-sm text-text-muted">
              No compatible parts found for this step. Try another frame or browse the catalog.
            </div>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-border bg-background-secondary p-4 lg:sticky lg:top-24">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-text-muted">Your combo</h2>
          <ul className="mt-4 space-y-3">
            {STEPS.map((step) => {
              const product = selection[step.key];
              return (
                <li key={step.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-text-muted">{step.label}{step.qty ? ` ×${step.qty}` : ""}</span>
                  <span className="text-right font-semibold text-text">
                    {product ? `৳${(productPrice(product) * (step.qty || 1)).toLocaleString()}` : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Estimated total</span>
              <strong className="text-xl text-warning">৳{totals.price.toLocaleString()}</strong>
            </div>
            <p className="mt-2 text-xs text-text-muted">
              Est. flight time:{" "}
              <strong className="text-text">{totals.flightMinutes ? `${totals.flightMinutes} min` : "Add motors + battery"}</strong>
            </p>
          </div>
          <Button
            variant="solid"
            disabled={totals.parts < 2 || adding}
            onClick={addComboToCart}
            className="mt-4 w-full rounded-xl bg-warning text-white disabled:opacity-40"
          >
            {adding ? "Adding..." : "Add combo to cart"}
          </Button>
          <button
            type="button"
            className="mt-2 w-full text-xs font-semibold text-text-muted"
            onClick={() => {
              setSelection({});
              setActiveStep("frame");
            }}
          >
            Clear build
          </button>
          {!frame && (
            <p className="mt-3 text-xs text-text-muted">Tip: pick a carbon frame first to unlock compatible motors and ESCs.</p>
          )}
          {frame?.image && <img src={resolveAssetUrl(frame.image)} alt="" className="mt-4 hidden" />}
        </aside>
      </div>
    </div>
  );
};

export default ComboBuilder;
