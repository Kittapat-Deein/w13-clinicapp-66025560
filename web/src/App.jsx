import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const COLOR_PALETTES = [
  { from: '#b45309', to: '#92400e', tag: '#fef3c7', tagText: '#78350f' },  // amber
  { from: '#dc2626', to: '#991b1b', tag: '#fee2e2', tagText: '#7f1d1d' },  // red
  { from: '#047857', to: '#065f46', tag: '#d1fae5', tagText: '#064e3b' },  // green
  { from: '#1d4ed8', to: '#1e3a8a', tag: '#dbeafe', tagText: '#1e3a8a' },  // blue
  { from: '#7c3aed', to: '#4c1d95', tag: '#ede9fe', tagText: '#4c1d95' },  // purple
  { from: '#0e7490', to: '#164e63', tag: '#cffafe', tagText: '#164e63' },  // cyan
  { from: '#b91c1c', to: '#7f1d1d', tag: '#ffe4e6', tagText: '#881337' },  // rose
  { from: '#0f766e', to: '#134e4a', tag: '#ccfbf1', tagText: '#134e4a' },  // teal
];
function getColor(id) { return COLOR_PALETTES[(id - 1) % COLOR_PALETTES.length]; }

function Badge({ children, style }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '999px',
      fontSize: '0.7rem',
      fontWeight: '600',
      letterSpacing: '0.03em',
      ...style
    }}>
      {children}
    </span>
  );
}

function WhiskeyCard({ whiskey, isSelected, onClick }) {
  const c = getColor(whiskey.id);
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      style={{
        position: 'relative',
        borderRadius: '14px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: isSelected ? '2.5px solid #f59e0b' : '2px solid transparent',
        outline: 'none',
        background: '#1a1c25',
        transition: 'transform 0.18s, box-shadow 0.18s',
        boxShadow: isSelected
          ? '0 0 0 3px rgba(245,158,11,0.25), 0 8px 30px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(0,0,0,0.3)',
      }}
    >
      {/* Color bar top */}
      <div style={{
        height: '6px',
        background: `linear-gradient(90deg, ${c.from}, ${c.to})`
      }} />

      <div style={{ padding: '1.25rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '2.25rem', lineHeight: 1 }}>{whiskey.icon}</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fcd34d' }}>
              {whiskey.price}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.1rem' }}>ต่อขวด</div>
          </div>
        </div>

        {/* Name */}
        <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: '700', color: '#f9fafb', lineHeight: 1.2 }}>
          {whiskey.name}
        </h3>

        {/* Tags */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <Badge style={{ background: c.tag, color: c.tagText }}>
            📍 {whiskey.origin}
          </Badge>
          <Badge style={{ background: '#27293a', color: '#9ca3af' }}>
            {whiskey.category}
          </Badge>
        </div>

        {/* Description */}
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', lineHeight: '1.5', minHeight: '3rem' }}>
          {whiskey.description}
        </p>

        {/* Select state */}
        <div style={{
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid #27293a',
          textAlign: 'center',
          fontSize: '0.8rem',
          fontWeight: '600',
          color: isSelected ? '#f59e0b' : '#6b7280',
          transition: 'color 0.2s'
        }}>
          {isSelected ? '✓ เลือกอยู่' : 'คลิกเพื่อเลือก'}
        </div>
      </div>
    </div>
  );
}

function InputField({ label, required, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.4rem', color: '#d1d5db' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  backgroundColor: '#1c1e2c',
  border: '1.5px solid #323548',
  borderRadius: '8px',
  color: '#f3f4f6',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
};

export default function App() {
  const [whiskeys, setWhiskeys] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [selectedOrigin, setSelectedOrigin] = useState('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Filtered whiskeys based on search & category
  const filteredWhiskeys = whiskeys.filter(w => {
    const matchOrigin = selectedOrigin === 'ALL' || (w.origin && w.origin.toLowerCase() === selectedOrigin.toLowerCase());
    const query = search.toLowerCase().trim();
    const matchSearch = !query ||
      (w.name && w.name.toLowerCase().includes(query)) ||
      (w.origin && w.origin.toLowerCase().includes(query)) ||
      (w.category && w.category.toLowerCase().includes(query)) ||
      (w.description && w.description.toLowerCase().includes(query));
    return matchOrigin && matchSearch;
  });

  const [form, setForm] = useState({
    whiskey_id: '',
    customer_name: '',
    phone: '',
    reservation_time: '',
    quantity: 1,
  });

  function field(key) {
    return e => setForm(f => ({ ...f, [key]: e.target.value }));
  }

  async function loadData(silent = false) {
    try {
      if (!silent) setError(null);
      const [wRes, oRes] = await Promise.all([
        fetch(`${API_BASE}/whiskeys`).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e))),
        fetch(`${API_BASE}/orders`).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e))),
      ]);
      setWhiskeys(wRes);
      setOrders(oRes);
      if (wRes.length && !form.whiskey_id) {
        setForm(f => ({ ...f, whiskey_id: wRes[0].id }));
      }
    } catch (e) {
      setError(e.message || e.error || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function onSubmit(e) {
    e.preventDefault();
    // ── Phone validation: exactly 10 digits ──
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('⚠️ กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก (ตัวเลขเท่านั้น)');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, phone: digits }),
      });
      if (!res.ok) throw await res.json().catch(() => ({ error: 'server_error' }));
      const created = await res.json();
      setSuccessMsg(`🎉 จองสำเร็จ! คุณ ${created.customer_name} ได้ทำการจอง ${created.whiskey_name} เรียบร้อยแล้ว`);
      setForm(f => ({ ...f, customer_name: '', phone: '', reservation_time: '', quantity: 1 }));
      await loadData(true);
    } catch (err) {
      setError(err.message || err.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  }

  async function onCancel(id, customerName, whiskeyName) {
    if (!confirm(`ยืนยันยกเลิกการจอง "${whiskeyName}" ของคุณ ${customerName}?`)) return;
    setCancellingId(id);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw await res.json().catch(() => ({ error: 'delete_error' }));
      setSuccessMsg(`ยกเลิกรายการของคุณ ${customerName} เรียบร้อยแล้ว`);
      await loadData(true);
    } catch (err) {
      setError(err.message || 'ไม่สามารถยกเลิกได้');
    } finally {
      setCancellingId(null);
    }
  }

  const totalOrders = orders.length;
  const totalBottles = orders.reduce((sum, o) => sum + (o.quantity || 1), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0d0f18', color: '#e5e7eb', fontFamily: "'Prompt', system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{ background: '#12141f', borderBottom: '1px solid #1e2030', padding: '0 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>🥃</div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', fontFamily: "'Cinzel', serif", background: 'linear-gradient(90deg, #fcd34d, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.05em' }}>
                THE GRAND VAULT
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', letterSpacing: '0.04em' }}>
                WHISKEY RESERVATION · ระบบสั่งจองวิสกี้พรีเมียม
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#1a1c28', border: '1px solid #27293a', borderRadius: '999px', padding: '0.35rem 0.85rem', fontSize: '0.75rem', color: '#6b7280' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', flexShrink: 0, boxShadow: '0 0 6px #10b981' }} />
            Azure SQL Live
          </div>
        </div>
      </header>

      {/* ── STAT BANNER ── */}
      {!loading && (
        <div style={{ background: '#12141f', borderBottom: '1px solid #1e2030', padding: '0.65rem 1.5rem' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '2rem', fontSize: '0.8rem', color: '#9ca3af' }}>
            <span>📦 รายการจองทั้งหมด: <strong style={{ color: '#f3f4f6' }}>{totalOrders} ออเดอร์</strong></span>
            <span>🍾 จำนวนขวดรวม: <strong style={{ color: '#f3f4f6' }}>{totalBottles} ขวด</strong></span>
          </div>
        </div>
      )}

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>

        {/* ── ALERTS ── */}
        {error && (
          <div style={{ background: '#1e0f0f', border: '1.5px solid #7f1d1d', color: '#fca5a5', borderRadius: '10px', padding: '0.9rem 1.2rem', marginBottom: '1.5rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start', lineHeight: 1.4 }}>
            <span style={{ flexShrink: 0, marginTop: '1px' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ background: '#0d1f17', border: '1.5px solid #065f46', color: '#6ee7b7', borderRadius: '10px', padding: '0.9rem 1.2rem', marginBottom: '1.5rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start', lineHeight: 1.4 }}>
            <span style={{ flexShrink: 0, marginTop: '1px' }}>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── TOP GRID: MENU + FORM ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: '1.75rem', marginBottom: '2rem', alignItems: 'start' }}>

          {/* LEFT: Whiskey Menu — scrollable */}
          <section>
            {/* Header + Search */}
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem', fontWeight: '700', color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🍾 เลือกชนิดวิสกี้
              </h2>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#6b7280' }}>
                คลิกการ์ดเพื่อเลือก รายการที่เลือกจะใส่ลงฟอร์มอัตโนมัติ
              </p>

              {/* Search box with dedicated button */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  setSearch(searchInput);
                }}
                style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}
              >
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem', pointerEvents: 'none', color: '#6b7280' }}>🔍</span>
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อวิสกี้ เช่น Macallan, Japan, Bourbon..."
                    value={searchInput}
                    onChange={e => {
                      setSearchInput(e.target.value);
                      setSearch(e.target.value);
                    }}
                    style={{
                      ...inputStyle,
                      paddingLeft: '2.25rem',
                      paddingRight: searchInput ? '2.25rem' : '0.9rem',
                      fontSize: '0.88rem',
                    }}
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => { setSearchInput(''); setSearch(''); }}
                      style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', fontSize: '1rem', cursor: 'pointer', padding: '0.2rem', lineHeight: 1 }}
                    >✕</button>
                  )}
                </div>
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.1rem',
                    background: 'linear-gradient(135deg, #d97706, #b45309)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                    boxShadow: '0 2px 8px rgba(217,119,6,0.25)',
                  }}
                >
                  🔍 ค้นหาวิสกี้
                </button>
              </form>

              {/* Category Filter Chips */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
                {[
                  { id: 'ALL', label: 'ทั้งหมด' },
                  { id: 'Scotland', label: '🥃 Scotland' },
                  { id: 'USA', label: '🍸 USA' },
                  { id: 'Japan', label: '🍶 Japan' },
                  { id: 'Ireland', label: '🥂 Ireland' },
                ].map(chip => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setSelectedOrigin(chip.id)}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '999px',
                      border: selectedOrigin === chip.id ? '1.5px solid #f59e0b' : '1px solid #2d3146',
                      background: selectedOrigin === chip.id ? 'rgba(245, 158, 11, 0.18)' : '#14161f',
                      color: selectedOrigin === chip.id ? '#fcd34d' : '#9ca3af',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {(search || selectedOrigin !== 'ALL') && (
                <div style={{ marginBottom: '0.75rem', fontSize: '0.78rem', color: '#9ca3af', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>พบ <strong style={{ color: '#fcd34d' }}>{filteredWhiskeys.length}</strong> รายการ จาก {whiskeys.length} ทั้งหมด</span>
                  <button
                    onClick={() => { setSearchInput(''); setSearch(''); setSelectedOrigin('ALL'); }}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline', padding: 0, fontFamily: 'inherit' }}
                  >
                    ล้างตัวกรอง
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div style={{ background: '#14161f', borderRadius: '14px', padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                กำลังโหลดรายการ...
              </div>
            ) : filteredWhiskeys.length === 0 ? (
              <div style={{ background: '#14161f', borderRadius: '14px', padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                <p style={{ margin: 0, color: '#9ca3af' }}>ไม่พบวิสกี้ที่ค้นหา</p>
                <button
                  onClick={() => { setSearchInput(''); setSearch(''); setSelectedOrigin('ALL'); }}
                  style={{ marginTop: '0.75rem', background: 'none', border: '1px solid #374151', color: '#9ca3af', padding: '0.35rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}
                >
                  ล้างการค้นหาทั้งหมด
                </button>
              </div>
            ) : (
              /* ── Scrollable Left Card Container ── */
              <div style={{
                maxHeight: 'calc(100vh - 220px)',
                minHeight: '480px',
                overflowY: 'auto',
                paddingRight: '0.5rem',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem' }}>
                  {filteredWhiskeys.map(w => (
                    <WhiskeyCard
                      key={w.id}
                      whiskey={w}
                      isSelected={String(form.whiskey_id) === String(w.id)}
                      onClick={() => setForm(f => ({ ...f, whiskey_id: w.id }))}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* RIGHT: Order Form — sticky */}
          <section style={{ position: 'sticky', top: '1.25rem', alignSelf: 'start' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📝 ฟอร์มสั่งจอง
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                กรอกข้อมูลให้ครบถ้วนแล้วกดยืนยัน
              </p>
            </div>

            <div style={{ background: '#14161f', border: '1.5px solid #1e2030', borderRadius: '14px', padding: '1.5rem' }}>
              <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                {/* Whiskey dropdown */}
                <InputField label="ชนิดวิสกี้" required>
                  <select
                    value={form.whiskey_id}
                    onChange={field('whiskey_id')}
                    required
                    style={{ ...inputStyle }}
                  >
                    {whiskeys.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.icon} {w.name} — {w.price}
                      </option>
                    ))}
                  </select>
                </InputField>

                {/* Row: Name + Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <InputField label="ชื่อผู้สั่ง" required>
                    <input
                      type="text"
                      placeholder="ชื่อ-นามสกุล"
                      value={form.customer_name}
                      onChange={field('customer_name')}
                      required
                      style={inputStyle}
                    />
                  </InputField>
                  <InputField label="เบอร์ติดต่อ" required>
                    <div>
                      <input
                        type="tel"
                        placeholder="0812345678"
                        value={form.phone}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setForm(f => ({ ...f, phone: v }));
                        }}
                        required
                        maxLength={10}
                        style={{
                          ...inputStyle,
                          borderColor: form.phone.length > 0 && form.phone.length < 10 ? '#dc2626' : form.phone.length === 10 ? '#10b981' : '#323548',
                        }}
                      />
                      <div style={{ marginTop: '0.3rem', fontSize: '0.75rem', textAlign: 'right',
                        color: form.phone.length === 10 ? '#10b981' : form.phone.length > 0 ? '#f59e0b' : '#4b5563' }}>
                        {form.phone.length}/10 หลัก {form.phone.length === 10 ? '✓' : ''}
                      </div>
                    </div>
                  </InputField>
                </div>

                {/* Row: Date + Qty */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.85rem', alignItems: 'end' }}>
                  <InputField label="วัน-เวลา นัดรับ" required>
                    <input
                      type="datetime-local"
                      value={form.reservation_time}
                      onChange={field('reservation_time')}
                      required
                      style={{ ...inputStyle, colorScheme: 'dark' }}
                    />
                  </InputField>
                  <InputField label="จำนวน (ขวด)">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))}
                        style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1.5px solid #374151', background: '#1c1e2c', color: '#f3f4f6', fontSize: '1.1rem', cursor: 'pointer', flexShrink: 0 }}
                      >−</button>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={form.quantity}
                        onChange={e => setForm(f => ({ ...f, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                        style={{ ...inputStyle, width: '52px', textAlign: 'center', padding: '0.4rem', flexShrink: 0 }}
                      />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, quantity: Math.min(20, f.quantity + 1) }))}
                        style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1.5px solid #374151', background: '#1c1e2c', color: '#f3f4f6', fontSize: '1.1rem', cursor: 'pointer', flexShrink: 0 }}
                      >+</button>
                    </div>
                  </InputField>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || !whiskeys.length}
                  style={{
                    marginTop: '0.25rem',
                    padding: '0.85rem',
                    background: submitting ? '#374151' : 'linear-gradient(135deg, #d97706, #92400e)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: submitting ? 'none' : '0 4px 16px rgba(217,119,6,0.35)',
                    transition: 'background 0.2s, box-shadow 0.2s',
                    fontFamily: 'inherit',
                    letterSpacing: '0.02em',
                  }}
                >
                  {submitting ? '⏳ กำลังบันทึก...' : '✓ ยืนยันการสั่งจอง'}
                </button>

              </form>
            </div>
          </section>
        </div>

        {/* ── ORDER HISTORY ── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📜 ประวัติการสั่งจอง (Order History)
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                ข้อมูลทั้งหมดบันทึกใน Azure SQL Database แบบ Real-time
              </p>
            </div>
            <span style={{ background: '#1a1c28', border: '1px solid #27293a', color: '#fcd34d', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600' }}>
              {totalOrders} รายการ · {totalBottles} ขวด
            </span>
          </div>

          <div style={{ background: '#14161f', border: '1.5px solid #1e2030', borderRadius: '14px', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                ⏳ กำลังโหลด...
              </div>
            ) : orders.length === 0 ? (
              <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#4b5563' }}>ยังไม่มีรายการจอง</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>กรอกฟอร์มด้านบนเพื่อเพิ่มรายการแรก</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
                  <thead>
                    <tr style={{ background: '#0d0f18', borderBottom: '1px solid #1e2030' }}>
                      {['วัน-เวลานัดรับ', 'วิสกี้ที่จอง', 'จำนวน', 'ชื่อผู้สั่ง', 'เบอร์ติดต่อ', 'บันทึกเมื่อ', ''].map((h, i) => (
                        <th key={i} style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#6b7280', fontWeight: '600', textAlign: i === 6 ? 'center' : 'left', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o, idx) => {
                      const c = getColor(o.whiskey_id);
                      return (
                        <tr key={o.id} style={{ borderBottom: idx < orders.length - 1 ? '1px solid #1a1c26' : 'none', transition: 'background 0.15s' }}>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <div style={{ fontWeight: '600', color: '#f59e0b', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                              📅 {new Date(o.reservation_time).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <div style={{ color: '#9ca3af', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                              🕐 {new Date(o.reservation_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '4px', height: '36px', borderRadius: '3px', background: `linear-gradient(${c.from}, ${c.to})`, flexShrink: 0 }} />
                              <div>
                                <div style={{ fontWeight: '600', color: '#f3f4f6', fontSize: '0.9rem' }}>
                                  {o.icon || '🥃'} {o.whiskey_name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.1rem' }}>
                                  {o.origin} · {o.price}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <span style={{ background: '#1f2232', color: '#a78bfa', border: '1px solid #312e6e', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '600' }}>
                              {o.quantity || 1} ขวด
                            </span>
                          </td>
                          <td style={{ padding: '0.9rem 1rem', color: '#e5e7eb', fontWeight: '500', fontSize: '0.9rem' }}>
                            👤 {o.customer_name}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', color: '#9ca3af', fontSize: '0.87rem' }}>
                            📞 {o.phone}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', color: '#4b5563', fontSize: '0.77rem', whiteSpace: 'nowrap' }}>
                            {new Date(o.created).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}<br />
                            {new Date(o.created).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                            <button
                              onClick={() => onCancel(o.id, o.customer_name, o.whiskey_name)}
                              disabled={cancellingId === o.id}
                              style={{
                                background: 'transparent',
                                color: '#ef4444',
                                border: '1px solid #3f1212',
                                padding: '0.3rem 0.75rem',
                                borderRadius: '7px',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                cursor: cancellingId === o.id ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                whiteSpace: 'nowrap',
                                opacity: cancellingId === o.id ? 0.6 : 1,
                              }}
                            >
                              {cancellingId === o.id ? '⏳' : '✕ ยกเลิก'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #1e2030', padding: '1.25rem 1.5rem', textAlign: 'center', color: '#374151', fontSize: '0.78rem' }}>
        🥃 The Grand Vault Whiskey Reservation · Node.js + Azure SQL + Azure Cloud · Powered by CI/CD (GitHub Actions)
      </footer>
    </div>
  );
}