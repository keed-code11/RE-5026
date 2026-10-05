import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  ShoppingBag,
  Search,
  Menu,
  X,
  Plus,
  Minus,
  Check,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Package,
  ShieldCheck,
  Truck,
  Trash2,
} from "lucide-react";
import { useCatalogue } from "../queries/catalogue";
import type { AppRouterClient } from "../../api";
type Product = Awaited<ReturnType<AppRouterClient["catalogue"]["list"]>>[number];
type CartItem = { id: number; size: string; quantity: number };
const money = (n: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(n);
const categories = ["All pieces", "Hoodies", "T-shirts", "Polos", "Bottoms", "Accessories"];
const colorHex: Record<string, string> = {
  Onyx: "#151515",
  Ivory: "#ded6be",
  Charcoal: "#595959",
  Midnight: "#18213c",
  White: "#f0f0e8",
};
function readSaved<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export default function Store() {
  const [path, navigate] = useLocation();
  const { data: products = [], isLoading, isError, refetch } = useCatalogue();
  const [cart, setCart] = useState<CartItem[]>(() => readSaved("re-cart", []));
  const [orders, setOrders] = useState<{ number: string; total: number }[]>(() =>
    readSaved("re-orders", []),
  );
  const [bag, setBag] = useState(false);
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [category, setCategory] = useState("All pieces");
  const [color, setColor] = useState("All colours");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sort, setSort] = useState("Featured");
  const [toast, setToast] = useState("");
  const [confirmation, setConfirmation] = useState<{ number: string; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const reduce = useReducedMotion();
  const count = cart.reduce((n, c) => n + c.quantity, 0);
  const total = cart.reduce(
    (n, c) => n + (products.find((p) => p.id === c.id)?.price || 0) * c.quantity,
    0,
  );
  useEffect(() => localStorage.setItem("re-cart", JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem("re-orders", JSON.stringify(orders)), [orders]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setMenu(false);
  }, [path]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelected(null);
        setBag(false);
        setMenu(false);
      }
    };
    window.addEventListener("keydown", listener);
    document.body.style.overflow = selected || bag || menu ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", listener);
      document.body.style.overflow = "";
    };
  }, [selected, bag, menu]);
  const available = (p: Product, size: string) =>
    Math.max(
      0,
      (p.sizeStock[size as keyof typeof p.sizeStock] || 0) -
        cart.filter((c) => c.id === p.id && c.size === size).reduce((n, c) => n + c.quantity, 0),
    );
  const add = (p: Product, size: string) => {
    if (!available(p, size)) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.id === p.id && c.size === size);
      return existing
        ? prev.map((c) => (c === existing ? { ...c, quantity: c.quantity + 1 } : c))
        : [...prev, { id: p.id, size, quantity: 1 }];
    });
    setToast(`${p.name} added to your bag`);
  };
  const update = (item: CartItem, delta: number) =>
    setCart((prev) =>
      prev.flatMap((c) =>
        c.id === item.id && c.size === item.size
          ? c.quantity + delta > 0
            ? [{ ...c, quantity: c.quantity + delta }]
            : []
          : [c],
      ),
    );
  const shop = (filter = "All pieces") => {
    setCategory(filter);
    navigate("/clothes");
  };
  let filtered = products.filter(
    (p) =>
      (category === "All pieces" || p.category === category) &&
      (color === "All colours" || p.color === color) &&
      `${p.name} ${p.color} ${p.category}`.toLowerCase().includes(search.toLowerCase()),
  );
  if (sort === "Price: low to high") filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === "Price: high to low") filtered = [...filtered].sort((a, b) => b.price - a.price);
  const featured = [3, 9, 6, 1]
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];
  const reveal = {
    initial: { opacity: 0, y: reduce ? 0 : 26 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.65 },
  };
  const nav = [
    ["Home", "/"],
    ["Clothes", "/clothes"],
    ["Collection", "/collection"],
    ["About", "/about"],
    ["Checkout", "/checkout"],
  ];
  return (
    <div className={reduce ? "store reduced-motion" : "store"}>
      <div className="announcement">
        <span>THE SIGNATURE COLLECTION</span>
        <span className="announce-center">Quiet luxury. Loud identity.</span>
        <span>
          24 DESIGNS · ONE VISION <ArrowUpRight size={12} />
        </span>
      </div>
      <header className="header">
        <Link href="/" className="brand">
          <span className="brand-monogram">
            RE<span>®</span>
          </span>
          <span>
            RE ENTERTAINMENT<small>CRAFTED FOR CULTURE</small>
          </span>
        </Link>
        <nav>
          {nav.map(([name, url]) => (
            <Link key={url} href={url} className={path === url ? "active" : ""}>
              {name}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <button
            aria-label="Search products"
            onClick={() => {
              setSearchOpen(!searchOpen);
              navigate("/clothes");
            }}
          >
            <Search size={19} />
          </button>
          <button
            className="bag-button"
            aria-label={`Open shopping bag, ${count} items`}
            onClick={() => setBag(true)}
          >
            <ShoppingBag size={19} />
            <span className="bag-label">Bag</span>
            <motion.span
              key={count}
              animate={reduce ? {} : { scale: [1, 1.35, 1] }}
              className="bag-count"
            >
              {count}
            </motion.span>
          </button>
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setMenu(true)}>
            <Menu size={22} />
          </button>
        </div>
      </header>
      <AnimatePresence mode="wait">
        <motion.main
          key={path}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.22 }}
        >
          {path === "/" ? (
            <>
              <section className="hero">
                <div className="hero-monogram" aria-hidden="true">
                  RE
                </div>
                <div className="hero-orbit orbit-one" />
                <div className="hero-orbit orbit-two" />
                <div className="hero-text">
                  <motion.div {...reveal} className="eyebrow">
                    <span /> THE SIGNATURE DROP / 01
                  </motion.div>
                  <motion.h1 {...reveal} transition={{ delay: 0.1, duration: 0.8 }}>
                    Quiet luxury.
                    <br />
                    <span>Loud identity.</span>
                  </motion.h1>
                  <motion.p {...reveal} transition={{ delay: 0.2, duration: 0.8 }}>
                    Not just what you wear. What you stand for.
                    <br />
                    Signature essentials. An unmistakable presence.
                  </motion.p>
                  <motion.div
                    {...reveal}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="hero-ctas"
                  >
                    <button className="button gold" onClick={() => shop()}>
                      SHOP THE DROP <ArrowUpRight size={19} />
                    </button>
                    <Link className="text-link" href="/collection">
                      Explore the collection <ArrowRight size={17} />
                    </Link>
                  </motion.div>
                  <div className="hero-caption">
                    <span className="line" /> MADE TO BE WORN. DESIGNED TO BE REMEMBERED.
                  </div>
                </div>
                <div className="hero-garments">
                  <span className="garment-label">THE SIGNATURE HOODIE</span>
                  <motion.img
                    className="hero-back"
                    src="/images/product-3-1.png"
                    alt="Black signature hoodie with gold RE graphic on the back"
                    initial={{ opacity: 0, y: 60, rotate: 8 }}
                    animate={{ opacity: 1, y: reduce ? 0 : [0, -12, 0], rotate: 8 }}
                    transition={{
                      opacity: { duration: 1 },
                      y: { duration: reduce ? 0 : 7, repeat: Infinity, ease: "easeInOut" },
                    }}
                  />
                  <motion.img
                    className="hero-front"
                    src="/images/product-3-0.png"
                    alt="Black RE signature hoodie front"
                    initial={{ opacity: 0, y: -60, rotate: -8 }}
                    animate={{ opacity: 1, y: reduce ? 0 : [0, 10, 0], rotate: -8 }}
                    transition={{
                      opacity: { duration: 1, delay: 0.3 },
                      y: { duration: reduce ? 0 : 6, repeat: Infinity, ease: "easeInOut" },
                    }}
                  />
                  <button
                    className="hero-product-link"
                    onClick={() => setSelected(products.find((p) => p.id === 3) || null)}
                  >
                    <span>ONYX / SIGNATURE SERIES</span>
                    <ArrowUpRight size={20} />
                  </button>
                </div>
                <div className="hero-bottom">
                  <span>01 — THE CULTURE COLLECTION</span>
                  <span>
                    SCROLL TO DISCOVER <span className="down-arrow">↓</span>
                  </span>
                </div>
              </section>
              <div className="values-strip">
                <span>
                  <span className="mini-star">✦</span> SIGNATURE DETAILS
                </span>
                <span>
                  <span className="mini-star">✦</span> CULTURE IN EVERY THREAD
                </span>
                <span>
                  <span className="mini-star">✦</span> AN IDENTITY. NOT A TREND.
                </span>
                <span>
                  <span className="mini-star">✦</span> THE RE STANDARD
                </span>
              </div>
              <section className="section featured">
                <motion.div {...reveal} className="section-heading">
                  <div>
                    <span className="eyebrow">THE PIECES THAT DEFINE US</span>
                    <h2>
                      The signature edit<span>.</span>
                    </h2>
                  </div>
                  <Link href="/clothes" className="text-link">
                    View all pieces <ArrowUpRight size={18} />
                  </Link>
                </motion.div>
                <div className="product-grid">
                  {featured.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      p={p}
                      index={i}
                      onOpen={setSelected}
                      reduce={!!reduce}
                    />
                  ))}
                </div>
              </section>
              <section className="editorial section">
                <motion.div {...reveal} className="editorial-image">
                  <span className="eyebrow">02 / THE IVORY EDIT</span>
                  <img
                    src="/images/product-9-1.png"
                    alt="Ivory signature hoodie gold back detail"
                  />
                  <span className="editorial-big">
                    A softer
                    <br />
                    statement.
                  </span>
                </motion.div>
                <motion.div {...reveal} className="editorial-copy">
                  <span className="eyebrow">BEYOND THE EVERYDAY</span>
                  <h2>
                    Presence is
                    <br />
                    in the details.
                  </h2>
                  <p>
                    From our signature monogram to a palette that speaks without shouting. Discover
                    pieces that bring your identity into focus.
                  </p>
                  <button
                    className="button outline"
                    onClick={() => {
                      setColor("Ivory");
                      shop();
                    }}
                  >
                    DISCOVER THE IVORY EDIT <ArrowUpRight size={18} />
                  </button>
                </motion.div>
              </section>
              <section className="brand-statement section">
                <span className="eyebrow">THIS IS RE ENTERTAINMENT</span>
                <h2>
                  For the ones who don’t
                  <br />
                  need to <em>say too much.</em>
                </h2>
                <Link href="/about" className="text-link">
                  The story behind the identity <ArrowUpRight size={18} />
                </Link>
              </section>
            </>
          ) : path === "/clothes" ? (
            <section className="section catalogue">
              <div className="page-heading">
                <span className="eyebrow">RE ENTERTAINMENT / THE WARDROBE</span>
                <h1>
                  Every piece. <span>A statement.</span>
                </h1>
                <p>Discover the full collection. Find your signature.</p>
              </div>
              <div className="filter-row">
                <div className="category-tabs">
                  {categories.map((c) => (
                    <button
                      className={category === c ? "chosen" : ""}
                      onClick={() => setCategory(c)}
                      key={c}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <button aria-label="Show product search" onClick={() => setSearchOpen(!searchOpen)}>
                  <Search size={19} />
                </button>
              </div>
              <div className="filter-tools">
                <span>
                  {filtered.length} pieces <span className="muted">/ sample prices in ZAR</span>
                </span>
                <div>
                  <SlidersHorizontal size={15} />
                  <select
                    aria-label="Filter by colour"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  >
                    {["All colours", ...Object.keys(colorHex)].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Sort products"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    {["Featured", "Price: low to high", "Price: high to low"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              {searchOpen && (
                <input
                  className="search-input"
                  placeholder="Search hoodies, colours, accessories…"
                  aria-label="Search collection"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              )}
              {isLoading ? (
                <div className="loading">Loading the collection…</div>
              ) : isError ? (
                <div className="empty">
                  <h2>Couldn’t load the collection.</h2>
                  <button className="button outline" onClick={() => refetch()}>
                    Try again
                  </button>
                </div>
              ) : filtered.length ? (
                <div className="product-grid">
                  {filtered.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      p={p}
                      index={i}
                      onOpen={setSelected}
                      reduce={!!reduce}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <h2>No pieces found.</h2>
                  <button
                    className="button outline"
                    onClick={() => {
                      setSearch("");
                      setColor("All colours");
                      setCategory("All pieces");
                    }}
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </section>
          ) : path === "/collection" ? (
            <section className="section collection">
              <div className="page-heading">
                <span className="eyebrow">THE CULTURE COLLECTION / 01</span>
                <h1>
                  One vision.
                  <br />
                  <span>Different expressions.</span>
                </h1>
                <p>Five colour stories. Twenty-four designs. Find the one that feels like you.</p>
              </div>
              <div className="collection-grid">
                {[
                  ["Onyx", 3, "The original statement."],
                  ["Ivory", 9, "Understated. Unforgettable."],
                  ["Charcoal", 14, "A different kind of depth."],
                  ["Midnight", 19, "Made for after hours."],
                ].map(([c, id, description], i) => (
                  <motion.button
                    {...reveal}
                    key={c}
                    className={`collection-panel collection-${c}`}
                    onClick={() => {
                      setColor(String(c));
                      shop();
                    }}
                  >
                    <span className="eyebrow">
                      0{i + 1} / THE {String(c).toUpperCase()} EDIT
                    </span>
                    <img src={`/images/product-${id}-1.png`} alt={`${c} hoodie`} />
                    <div>
                      <h2>
                        {c}
                        <ArrowUpRight size={28} />
                      </h2>
                      <p>{description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
              <div className="note">
                White graphic tees complete the collection.{" "}
                <button
                  className="text-link"
                  onClick={() => {
                    setColor("White");
                    shop();
                  }}
                >
                  Explore white <ArrowRight size={16} />
                </button>
              </div>
            </section>
          ) : path === "/about" ? (
            <section className="section about">
              <div className="page-heading">
                <span className="eyebrow">THE IDENTITY BEHIND THE NAME</span>
                <h1>
                  More than clothing.
                  <br />
                  <span>A way to show up.</span>
                </h1>
              </div>
              <div className="about-layout">
                <div className="about-art">
                  <span>RE</span>
                  <img
                    src="/images/product-3-1.png"
                    alt="RE Entertainment signature gold monogram hoodie"
                  />
                </div>
                <div className="about-copy">
                  <span className="eyebrow">RE ENTERTAINMENT</span>
                  <h2>
                    Quiet luxury.
                    <br />
                    Crafted for culture.
                  </h2>
                  <p>
                    RE Entertainment brings a distinct identity to everyday dressing. The collection
                    pairs clean silhouettes with signature RE details and a considered palette of
                    onyx, ivory, charcoal and midnight.
                  </p>
                  <p>
                    From hoodies and graphic tees to joggers, polos and headwear, every piece
                    belongs to one visual world. Wear a single statement. Or make the collection
                    your own.
                  </p>
                  <button className="button gold" onClick={() => shop()}>
                    FIND YOUR SIGNATURE <ArrowUpRight size={18} />
                  </button>
                </div>
              </div>
              <div className="about-values">
                {[
                  ["01", "Identity first", "An unmistakable monogram. A personal statement."],
                  [
                    "02",
                    "A considered palette",
                    "Colours that work together, season after season.",
                  ],
                  ["03", "Culture, worn", "Everyday essentials with a presence of their own."],
                ].map(([n, t, d]) => (
                  <div key={n}>
                    <span className="eyebrow">{n} / THE RE STANDARD</span>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : path === "/checkout" ? (
            <section className="section checkout">
              <div className="page-heading">
                <span className="eyebrow">THE FINAL DETAIL</span>
                <h1>
                  Your next <span>statement.</span>
                </h1>
                <p>Demo checkout — no payment is collected and no real order is placed.</p>
              </div>
              {confirmation ? (
                <div className="success">
                  <Check size={42} />
                  <span className="eyebrow">DEMO ORDER COMPLETE</span>
                  <h2>You’re part of the culture.</h2>
                  <p>
                    Order {confirmation.number} · {money(confirmation.total)}
                  </p>
                  <p>
                    This demo order is saved on this device only. Nothing will be charged or
                    shipped.
                  </p>
                  <button
                    className="button gold"
                    onClick={() => {
                      setConfirmation(null);
                      shop();
                    }}
                  >
                    CONTINUE EXPLORING <ArrowRight size={18} />
                  </button>
                </div>
              ) : !cart.length ? (
                <div className="empty">
                  <ShoppingBag size={38} />
                  <h2>Your bag is waiting.</h2>
                  <p>Find a piece that feels like you.</p>
                  <button className="button gold" onClick={() => shop()}>
                    EXPLORE THE COLLECTION <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                <div className="checkout-layout">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSubmitting(true);
                      const order = { number: `RE-${Date.now().toString().slice(-7)}`, total };
                      setOrders((prev) => [order, ...prev]);
                      setConfirmation(order);
                      setCart([]);
                      setSubmitting(false);
                    }}
                  >
                    <h2>01 / Your details</h2>
                    <div className="form-grid">
                      <label>
                        First name
                        <input
                          required
                          aria-label="First name"
                          autoComplete="on"
                        />
                      </label>
                      <label>
                        Last name
                        <input
                          required
                          aria-label="Last name"
                          autoComplete="on"
                        />
                      </label>
                    </div>
                    <label>
                      Email address
                      <input
                        type="email"
                        required
                        aria-label="Email address"
                        autoComplete="email"
                      />
                    </label>
                    <label>
                      Phone number
                      <input type="tel" required aria-label="Phone number" autoComplete="tel" />
                    </label>
                    <h2>02 / Delivery details</h2>
                    <label>
                      Street address
                      <input required aria-label="Street address" autoComplete="street-address" />
                    </label>
                    <div className="form-grid">
                      <label>
                        City
                        <input required aria-label="City" autoComplete="address-level2" />
                      </label>
                      <label>
                        Postal code
                        <input
                          required
                          pattern="[0-9]{4}"
                          title="Enter a four-digit South African postal code"
                          aria-label="Postal code"
                          autoComplete="postal-code"
                        />
                      </label>
                    </div>
                    <label>
                      Province
                      <select required aria-label="Province">
                        <option value="">Select your province</option>
                        {[
                          "Eastern Cape",
                          "Free State",
                          "Gauteng",
                          "KwaZulu-Natal",
                          "Limpopo",
                          "Mpumalanga",
                          "North West",
                          "Northern Cape",
                          "Western Cape",
                        ].map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </label>
                    <p className="note">
                      <ShieldCheck size={18} /> Demo only. No card details required. Delivery is not
                      arranged.
                    </p>
                    <button className="button gold" disabled={submitting} type="submit">
                      {submitting ? "SAVING…" : "PLACE DEMO ORDER"} <ArrowRight size={18} />
                    </button>
                  </form>
                  <aside className="order-summary">
                    <span className="eyebrow">
                      YOUR SELECTION / {count} {count === 1 ? "PIECE" : "PIECES"}
                    </span>
                    {cart.map((c) => {
                      const p = products.find((p) => p.id === c.id);
                      return p ? (
                        <CartLine
                          key={`${c.id}-${c.size}`}
                          p={p}
                          item={c}
                          update={update}
                          canAdd={available(p, c.size) > 0}
                        />
                      ) : null;
                    })}
                    <div className="totals">
                      <span>
                        Subtotal<b>{money(total)}</b>
                      </span>
                      <span>
                        Demo delivery<b>Complimentary</b>
                      </span>
                      <span className="grand-total">
                        Total<b>{money(total)}</b>
                      </span>
                    </div>
                    <p className="note">Sample prices · ZAR · Demo order only</p>
                  </aside>
                </div>
              )}
            </section>
          ) : (
            <section className="section empty">
              <h1>That page isn’t in this collection.</h1>
              <Link className="button gold" href="/">
                BACK TO HOME
              </Link>
            </section>
          )}
        </motion.main>
      </AnimatePresence>
      <div className="service-strip">
        <span>
          <Package size={20} /> 24 signature designs
        </span>
        <span>
          <Truck size={20} /> South African storefront
        </span>
        <span>
          <ShieldCheck size={20} /> No-charge demo checkout
        </span>
      </div>
      <footer>
        <div className="footer-top">
          <Link href="/" className="footer-logo">
            RE<span>ENTERTAINMENT</span>
          </Link>
          <div className="footer-tagline">
            Quiet luxury.
            <br />
            Crafted for culture.
          </div>
          <div>
            <span className="eyebrow">EXPLORE</span>
            <Link href="/clothes">All clothes</Link>
            <Link href="/collection">The collection</Link>
            <Link href="/about">Our story</Link>
          </div>
          <div>
            <span className="eyebrow">YOUR SELECTION</span>
            <button onClick={() => setBag(true)}>Shopping bag ({count})</button>
            <Link href="/checkout">Demo checkout</Link>
            <span className="footer-small">Sizes XS–XL / One size</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} RE ENTERTAINMENT</span>
          <span>Sample pricing · 5 items per design · Demo size allocation</span>
          <span>AN IDENTITY. NOT A TREND.</span>
        </div>
      </footer>
      <AnimatePresence>
        {toast && (
          <motion.div
            aria-live="polite"
            className="toast"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <Check size={18} />
            {toast}
            <button
              onClick={() => {
                setBag(true);
                setToast("");
              }}
            >
              View bag <ArrowRight size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selected && (
          <ProductModal
            p={selected}
            onClose={() => setSelected(null)}
            add={add}
            available={available}
            reduce={!!reduce}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {bag && (
          <>
            <motion.div
              className="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBag(false)}
            />
            <motion.dialog
              open
              aria-modal="true"
              aria-label="Shopping bag"
              className="bag-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
            >
              <div className="drawer-header">
                <h2>
                  Your bag <span>({count})</span>
                </h2>
                <button aria-label="Close shopping bag" onClick={() => setBag(false)}>
                  <X />
                </button>
              </div>
              <span className="eyebrow">GOOD TASTE. GREAT CHOICE.</span>
              <div className="bag-lines">
                {cart.length ? (
                  cart.map((c) => {
                    const p = products.find((p) => p.id === c.id);
                    return p ? (
                      <CartLine
                        key={`${c.id}-${c.size}`}
                        p={p}
                        item={c}
                        update={update}
                        canAdd={available(p, c.size) > 0}
                      />
                    ) : null;
                  })
                ) : (
                  <div className="empty">
                    <ShoppingBag size={38} />
                    <h2>A little quiet in here.</h2>
                    <p>Your next statement is waiting.</p>
                    <button
                      className="button gold"
                      onClick={() => {
                        setBag(false);
                        shop();
                      }}
                    >
                      SHOP THE DROP <ArrowRight size={17} />
                    </button>
                  </div>
                )}
              </div>
              {!!cart.length && (
                <div className="drawer-bottom">
                  <div className="grand-total">
                    <span>Subtotal</span>
                    <b>{money(total)}</b>
                  </div>
                  <p className="note">Sample prices in ZAR. No real charges.</p>
                  <button
                    className="button gold"
                    onClick={() => {
                      setBag(false);
                      setConfirmation(null);
                      navigate("/checkout");
                    }}
                  >
                    CONTINUE TO CHECKOUT <ArrowRight size={18} />
                  </button>
                  <button className="continue" onClick={() => setBag(false)}>
                    Continue exploring
                  </button>
                </div>
              )}
            </motion.dialog>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {menu && (
          <motion.dialog
            open
            aria-modal="true"
            aria-label="Navigation"
            className="mobile-navigation"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <button aria-label="Close menu" onClick={() => setMenu(false)}>
              <X />
            </button>
            <span className="eyebrow">RE ENTERTAINMENT</span>
            {nav.map(([name, url]) => (
              <Link href={url} key={url} onClick={() => setMenu(false)}>
                {name}
                <ArrowUpRight />
              </Link>
            ))}
          </motion.dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
function ProductCard({
  p,
  index,
  onOpen,
  reduce,
}: {
  p: Product;
  index: number;
  onOpen: (p: Product) => void;
  reduce: boolean;
}) {
  const [back, setBack] = useState(false);
  return (
    <motion.article
      className="product-card"
      initial={{ opacity: 0, y: reduce ? 0 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 4) * 0.08, duration: 0.6 }}
    >
      <button
        className="product-visual"
        onClick={() => onOpen(p)}
        onMouseEnter={() => setBack(true)}
        onMouseLeave={() => setBack(false)}
        aria-label={`View ${p.color} ${p.name}`}
      >
        <span className="product-badge">
          {[3, 9, 19].includes(p.id) ? "SIGNATURE" : "THE ESSENTIALS"}
        </span>
        <img
          className={back ? "hidden-view" : ""}
          src={p.images[0]}
          alt={`${p.color} ${p.name} front`}
          loading="lazy"
        />
        <img
          className={!back ? "hidden-view" : ""}
          src={p.images[1]}
          alt={`${p.color} ${p.name} alternate view`}
          loading="lazy"
        />
        <span className="quick-add">
          <Plus size={19} />
        </span>
        <span className="visual-colour">
          {p.color.toUpperCase()} / 0{p.id}
        </span>
      </button>
      <div className="product-info">
        <button onClick={() => onOpen(p)}>{p.name}</button>
        <span>{money(p.price)}</span>
      </div>
      <div className="product-meta">
        <span>
          <i style={{ background: colorHex[p.color] }} />
          {p.color} <span className="meta-divider">/</span> {p.category}
        </span>
        <span className="stock-dot">5 available</span>
      </div>
    </motion.article>
  );
}
function ProductModal({
  p,
  onClose,
  add,
  available,
  reduce,
}: {
  p: Product;
  onClose: () => void;
  add: (p: Product, size: string) => void;
  available: (p: Product, size: string) => number;
  reduce: boolean;
}) {
  const [view, setView] = useState(0);
  const [size, setSize] = useState(p.sizes.length === 1 ? "One size" : "");
  const [guide, setGuide] = useState(false);
  const start = useRef(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    buttonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>(".product-modal button, .product-modal a"),
      );
      const first = focusables[0],
        last = focusables.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const remaining = p.sizes.reduce((n, s) => n + available(p, s), 0);
  return (
    <>
      <motion.div
        className="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.dialog
        open
        aria-modal="true"
        aria-labelledby="product-title"
        className="product-modal"
        initial={{ opacity: 0, y: reduce ? 0 : 40, scale: reduce ? 1 : 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <button
          ref={buttonRef}
          className="modal-close"
          aria-label="Close product"
          onClick={onClose}
        >
          <X size={22} />
        </button>
        <div
          className="product-gallery"
          onTouchStart={(e) => {
            start.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (Math.abs(start.current - e.changedTouches[0].clientX) > 40) setView((v) => 1 - v);
          }}
        >
          <span className="eyebrow">THE SIGNATURE COLLECTION</span>
          <AnimatePresence mode="wait">
            <motion.img
              key={view}
              src={p.images[view]}
              alt={`${p.color} ${p.name}, ${view === 0 ? "front" : "alternate"} view`}
              initial={{ opacity: 0, x: reduce ? 0 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduce ? 0 : -20 }}
              transition={{ duration: 0.25 }}
            />
          </AnimatePresence>
          <div className="gallery-controls">
            <button aria-label="Previous product image" onClick={() => setView((v) => 1 - v)}>
              <ChevronLeft size={18} />
            </button>
            <span>
              {view === 0 ? "FRONT VIEW" : "ALTERNATE VIEW"}{" "}
              <span className="gallery-dots">
                {[0, 1].map((n) => (
                  <button
                    aria-label={`Show ${n === 0 ? "front" : "alternate"} view`}
                    className={n === view ? "current" : ""}
                    key={n}
                    onClick={() => setView(n)}
                  />
                ))}
              </span>
            </span>
            <button aria-label="Next product image" onClick={() => setView((v) => 1 - v)}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="product-details">
          <span className="eyebrow">
            {p.category.toUpperCase()} / {p.color.toUpperCase()}
          </span>
          <h2 id="product-title">{p.name}</h2>
          <div className="detail-price">
            {money(p.price)} <span>Sample price · ZAR</span>
          </div>
          <p>
            A signature RE piece in {p.color.toLowerCase()}. An everyday silhouette, finished with
            an identity that’s unmistakably yours.
          </p>
          <div className="colour-detail">
            <span className="eyebrow">COLOUR</span>
            <i style={{ background: colorHex[p.color] }} />
            {p.color}
          </div>
          <div className="size-heading">
            <span className="eyebrow">SELECT SIZE{size && ` / ${size}`}</span>
            <button onClick={() => setGuide(!guide)}>
              {guide ? "Hide size info" : "Size information"}
            </button>
          </div>
          <div className="size-options">
            {p.sizes.map((s) => (
              <button
                key={s}
                className={s === size ? "selected" : ""}
                disabled={!available(p, s)}
                onClick={() => {
                  setSize(s);
                  setAdded(false);
                }}
              >
                {s}
              </button>
            ))}
          </div>
          {guide && (
            <div className="size-guide">
              {p.sizes.length === 1
                ? "Accessories use one-size sizing."
                : "Demo size range: XS, S, M, L, XL. One unit per size. Actual garment measurements are not provided in the catalogue."}
            </div>
          )}
          <div className="stock-line">
            <i />
            {size
              ? `${available(p, size)} available in ${size}`
              : `${remaining} available across all sizes`}
            <span>Demo stock</span>
          </div>
          <motion.button
            whileTap={reduce ? {} : { scale: 0.97 }}
            disabled={!size || !available(p, size)}
            className="button gold add-button"
            onClick={() => {
              add(p, size);
              setAdded(true);
            }}
          >
            {added ? "ADDED TO YOUR BAG" : !size ? "SELECT YOUR SIZE" : "ADD TO BAG"}
            {added ? <Check size={19} /> : <ShoppingBag size={19} />}
          </motion.button>
          <div className="product-disclosure">
            <ShieldCheck size={16} />
            <span>
              Five units per design. Sample size allocation.
              <br />
              Demo checkout — no charges or shipments.
            </span>
          </div>
          <a
            href={p.catalogue}
            target="_blank"
            rel="noreferrer"
            className="text-link catalogue-link"
          >
            View original catalogue image <ArrowUpRight size={15} />
          </a>
        </div>
      </motion.dialog>
    </>
  );
}
function CartLine({
  p,
  item,
  update,
  canAdd,
}: {
  p: Product;
  item: CartItem;
  update: (c: CartItem, d: number) => void;
  canAdd: boolean;
}) {
  return (
    <div className="cart-line">
      <img src={p.images[0]} alt={`${p.color} ${p.name}`} />
      <div>
        <h3>{p.name}</h3>
        <p>
          {p.color} / {item.size}
        </p>
        <div className="quantity">
          <button aria-label={`Decrease ${p.name} quantity`} onClick={() => update(item, -1)}>
            <Minus size={12} />
          </button>
          <span>{item.quantity}</span>
          <button
            disabled={!canAdd}
            aria-label={`Increase ${p.name} quantity`}
            onClick={() => update(item, 1)}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
      <div className="cart-line-end">
        <b>{money(p.price * item.quantity)}</b>
        <button aria-label={`Remove ${p.name}`} onClick={() => update(item, -item.quantity)}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
