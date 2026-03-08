import { useState, useEffect, useMemo, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
// THEME — Prism Santé · Marine & Flamme
// accent orange #E8601C remplace le vert menthe
// ─────────────────────────────────────────────────────────────
const T = {
  bg:           "#F6F8FA",
  surface:      "#FFFFFF",
  header:       "#0A2342",
  primary:      "#0A2342",
  accent:       "#E8601C",
  accentDark:   "#CC5218",
  accentLight:  "#FEF0E8",
  income:       "#138A60",
  incomeLight:  "#E8F7EF",
  expense:      "#B83232",
  expenseLight: "#FDECEA",
  yellow:       "#F5C518",
  yellowLight:  "#FFFBEA",
  text:         "#0A1929",
  muted:        "#607080",
  border:       "#D8E4EC",
  overlay:      "rgba(10,35,66,0.82)",
  font:         "'Segoe UI','Helvetica Neue',Helvetica,sans-serif",
};

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const DEFAULT_GOALS = { calories:2000, protein:150, carbs:200, fat:65 };
const MEALS      = ["Petit-déjeuner","Déjeuner","Dîner","Collation"];
const MEAL_ICONS = { "Petit-déjeuner":"🌅","Déjeuner":"☀️","Dîner":"🌙","Collation":"🍎" };
const EXERCISE_TYPES = ["Force","Cardio","Souplesse","HIIT","Autre"];
const DAYS_FR   = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const today  = () => new Date().toISOString().split("T")[0];
const fmtD   = d  => { try { return new Date(d+"T00:00:00").toLocaleDateString("fr-FR"); } catch { return d; } };
const fmtN   = n  => Math.round(n||0).toLocaleString("fr-FR");
const uid    = () => Date.now() + Math.random();

// ─────────────────────────────────────────────────────────────
// OPEN FOOD FACTS
// ─────────────────────────────────────────────────────────────
async function fetchOFF(barcode) {
  const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
  const data = await res.json();
  if (data.status !== 1) throw new Error("Produit non trouvé dans Open Food Facts.");
  const p = data.product;
  const n = p.nutriments || {};
  return {
    barcode,
    name:      p.product_name || p.abbreviated_product_name || "Produit inconnu",
    brand:     p.brands || "",
    image:     p.image_thumb_url || p.image_small_url || null,
    calories:  Math.round(n["energy-kcal_100g"] || (n["energy_100g"]||0)/4.184 || 0),
    protein:   parseFloat((n.proteins_100g||0).toFixed(1)),
    carbs:     parseFloat((n.carbohydrates_100g||0).toFixed(1)),
    fat:       parseFloat((n.fat_100g||0).toFixed(1)),
    fiber:     parseFloat((n.fiber_100g||0).toFixed(1)),
    salt:      parseFloat((n.salt_100g||0).toFixed(2)),
    per100:    true,
    quantityG: 100,
    qty:       1,
    unit:      "g",
  };
}

// ─────────────────────────────────────────────────────────────
// LOGO PRISM SANTÉ — prisme orange + croix santé
// identique à l'icône de l'app
// ─────────────────────────────────────────────────────────────
function PrismLogo({ size = 32 }) {
  const r   = Math.round(size * 0.28), cx = size / 2;
  const top = size * 0.15, bot = size * 0.83, mid = size * 0.51;
  const lx  = size * 0.18, rx = size * 0.82;
  const cw  = size * 0.10, ch = size * 0.25;
  const cbx = cx - cw / 2, cby = mid - ch * 0.15;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" style={{ display:"block" }}>
      <rect width={size} height={size} rx={r} fill={T.header}/>
      <polygon points={`${cx},${top} ${rx},${bot} ${lx},${bot}`}
        fill={`${T.accent}18`} stroke={T.accent} strokeWidth={size*.065} strokeLinejoin="round"/>
      <line x1={cx} y1={top} x2={cx} y2={mid}
        stroke="#fff" strokeWidth={size*.04} strokeOpacity=".4"/>
      <circle cx={cx} cy={mid} r={size*.045} fill="#fff" opacity=".5"/>
      <line x1={cx} y1={mid} x2={lx+(cx-lx)*.52} y2={bot}
        stroke={T.accent} strokeWidth={size*.04} strokeOpacity=".9"/>
      {/* Croix santé */}
      <rect x={cbx} y={cby} width={cw} height={ch} rx={size*.025} fill={T.accent} opacity=".93"/>
      <rect x={cbx-(ch*.32)+cw*.5} y={cby+ch*.35} width={ch*.64+cw} height={cw} rx={size*.025} fill={T.accent} opacity=".93"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// RING — graphique circulaire
// ─────────────────────────────────────────────────────────────
function Ring({ val, max, color, size=56, label, sublabel }) {
  const r=20, circ=2*Math.PI*r;
  const pct = max>0 ? Math.min(val/max,1) : 0;
  const over = max>0 && val>max;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
      <svg width={size} height={size} viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke={T.border} strokeWidth="4"/>
        <circle cx="24" cy="24" r={r} fill="none" stroke={over?T.expense:color}
          strokeWidth="4" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
          strokeLinecap="round" transform="rotate(-90 24 24)" style={{ transition:"stroke-dashoffset .4s" }}/>
        <text x="24" y="26" textAnchor="middle" fontSize="9" fontWeight="800"
          fill={over?T.expense:color} fontFamily={T.font}>{Math.round(pct*100)}%</text>
      </svg>
      <div style={{ fontSize:10, fontWeight:700, color:T.text, textAlign:"center" }}>{label}</div>
      {sublabel && <div style={{ fontSize:9, color:T.muted, textAlign:"center" }}>{sublabel}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const S = {
  app:  { minHeight:"100vh", background:T.bg, color:T.text, fontFamily:T.font, maxWidth:480, margin:"0 auto", paddingBottom:72 },
  hdr:  { background:T.header, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:200 },
  card: { background:T.surface, borderRadius:14, padding:"13px 16px", margin:"10px 14px", border:`1px solid ${T.border}`, boxShadow:"0 1px 6px rgba(10,35,66,0.05)" },
  cf:   (m="10px 14px") => ({ background:T.surface, borderRadius:14, padding:"13px 16px", margin:m, border:`1px solid ${T.border}` }),
  row:  { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:`1px solid ${T.border}` },
  rowL: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0" },
  inp:  { width:"100%", background:T.bg, border:`1.5px solid ${T.border}`, borderRadius:9, padding:"9px 12px", color:T.text, fontSize:14, fontFamily:T.font, boxSizing:"border-box", marginBottom:9, outline:"none" },
  sel:  { width:"100%", background:T.bg, border:`1.5px solid ${T.border}`, borderRadius:9, padding:"9px 12px", color:T.text, fontSize:14, fontFamily:T.font, boxSizing:"border-box", marginBottom:9, outline:"none" },
  btn:  (bg, fg="#fff") => ({ width:"100%", padding:"11px", background:bg, border:"none", borderRadius:10, color:fg, fontSize:14, fontWeight:700, fontFamily:T.font, cursor:"pointer", marginBottom:7 }),
  smBtn:(bg, fg="#fff", o=false) => ({ padding:"5px 11px", background:o?"transparent":bg, border:o?`1.5px solid ${bg}`:"none", borderRadius:8, color:o?bg:fg, fontSize:12, fontWeight:600, fontFamily:T.font, cursor:"pointer", flexShrink:0 }),
  tog:  { display:"flex", background:T.bg, border:`1.5px solid ${T.border}`, borderRadius:10, padding:3, marginBottom:10 },
  tBtn: (a) => ({ flex:1, padding:"7px", border:"none", borderRadius:8, fontFamily:T.font, cursor:"pointer", fontWeight:a?700:400, fontSize:13, background:a?`${T.accent}22`:"transparent", color:a?T.accent:T.muted, transition:"all .15s" }),
  tab:  (a) => ({ flex:1, padding:"7px", border:"none", borderRadius:8, fontFamily:T.font, cursor:"pointer", fontWeight:a?700:400, fontSize:13, background:a?T.accent:"transparent", color:a?"#fff":T.muted }),
  nav:  { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:T.surface, display:"flex", borderTop:`1px solid ${T.border}`, zIndex:100, boxShadow:"0 -2px 12px rgba(10,35,66,0.08)" },
  navB: (a) => ({ flex:1, padding:"10px 2px 8px", background:"none", border:"none", fontFamily:T.font, color:a?T.accent:T.muted, cursor:"pointer", fontSize:9, display:"flex", flexDirection:"column", alignItems:"center", gap:2, fontWeight:a?700:500, borderTop:a?`2.5px solid ${T.accent}`:"2.5px solid transparent" }),
  lbl:  { fontSize:11, color:T.muted, fontWeight:600, display:"block", marginBottom:3, letterSpacing:.3 },
  sec:  { fontSize:10, color:T.muted, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase" },
  mSel: { display:"flex", gap:6, padding:"8px 14px", overflowX:"auto", scrollbarWidth:"none" },
  mChip:(a) => ({ padding:"5px 12px", borderRadius:20, border:`1px solid ${a?T.accent:T.border}`, background:a?T.accent:T.surface, color:a?"#fff":T.muted, cursor:"pointer", whiteSpace:"nowrap", fontSize:12, fontWeight:a?700:400 }),
  modal:{ position:"fixed", inset:0, background:T.overlay, zIndex:1000, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end" },
  mBox: { background:T.surface, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:480, maxHeight:"92vh", overflowY:"auto", padding:"20px 16px 32px" },
};

const Bar = ({ pct, color, h=5 }) => (
  <div style={{ height:h, borderRadius:3, background:T.border, overflow:"hidden", marginTop:3 }}>
    <div style={{ width:`${Math.min(pct||0,100)}%`, height:"100%", background:color, borderRadius:3, transition:"width .3s" }}/>
  </div>
);

// ─────────────────────────────────────────────────────────────
// SCANNER MODAL
// ─────────────────────────────────────────────────────────────
function ScannerModal({ onAdd, onClose }) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const detRef    = useRef(null);
  const rafRef    = useRef(null);
  const [phase,    setPhase]    = useState("scan");
  const [loading,  setLoading]  = useState(false);
  const [cameraOk, setCameraOk] = useState(false);
  const [noDet,    setNoDet]    = useState(false);
  const [error,    setError]    = useState("");
  const [product,  setProduct]  = useState(null);
  const [qty,      setQty]      = useState("100");
  const [manCode,  setManCode]  = useState("");

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const loop = async () => {
    if (!videoRef.current || !detRef.current) return;
    try {
      const codes = await detRef.current.detect(videoRef.current);
      if (codes.length > 0) { stopCamera(); await fetchProduct(codes[0].rawValue); return; }
    } catch {}
    rafRef.current = requestAnimationFrame(loop);
  };

  const startCamera = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment", width:{ideal:1280}, height:{ideal:720} } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraOk(true);
      if (!("BarcodeDetector" in window)) { setNoDet(true); return; }
      detRef.current = new window.BarcodeDetector({ formats:["ean_13","ean_8","upc_a","upc_e","code_128","code_39","itf","qr_code"] });
      loop();
    } catch {
      setError("Impossible d'accéder à la caméra. Saisissez le code manuellement.");
      setNoDet(true);
    }
  }, []);

  const fetchProduct = async (code) => {
    setLoading(true); setError("");
    try {
      const prod = await fetchOFF(code.trim());
      setProduct(prod); setQty("100"); setPhase("result");
    } catch(e) {
      setError(e.message || "Produit introuvable.");
      setPhase("scan");
      if (cameraOk && !noDet) startCamera();
    }
    setLoading(false);
  };

  useEffect(() => { startCamera(); return () => stopCamera(); }, []);

  const qtyN = parseFloat(qty)||100;
  const calc = (v) => product?.per100 ? +(v*qtyN/100).toFixed(1) : +(v*qtyN).toFixed(1);

  const confirm = () => {
    if (!product) return;
    onAdd({ ...product, quantityG:qtyN, calories:calc(product.calories), protein:calc(product.protein), carbs:calc(product.carbs), fat:calc(product.fat), per100:false });
    setProduct(null); setPhase("scan"); startCamera();
  };

  return (
    <div style={S.modal} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ ...S.mBox, padding:0, background:"#000", borderRadius:"20px 20px 0 0", overflow:"hidden", maxHeight:"95vh" }}>

        {/* Titre */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", background:T.header }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:20 }}>📷</span>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:"#fff" }}>Scanner un produit</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>Open Food Facts</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, color:"#fff", padding:"6px 12px", cursor:"pointer", fontSize:13, fontWeight:700 }}>✕ Fermer</button>
        </div>

        {/* Caméra */}
        <div style={{ position:"relative", width:"100%", background:"#000", aspectRatio:"4/3", maxHeight:300, overflow:"hidden" }}>
          <video ref={videoRef} muted playsInline autoPlay style={{ width:"100%", height:"100%", objectFit:"cover", display:phase==="scan"?"block":"none" }}/>

          {phase==="scan" && cameraOk && !noDet && (
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
              <div style={{ width:220, height:140, border:`2px solid ${T.accent}`, borderRadius:12, boxShadow:`0 0 0 2000px rgba(0,0,0,0.45)`, position:"relative" }}>
                {[{top:0,left:0},{top:0,right:0},{bottom:0,left:0},{bottom:0,right:0}].map((pos,i) => (
                  <div key={i} style={{ position:"absolute", width:18, height:18, ...pos,
                    borderTop:   pos.bottom!==undefined?"none":`3px solid ${T.accent}`,
                    borderLeft:  pos.right!==undefined?"none":`3px solid ${T.accent}`,
                    borderBottom:pos.top!==undefined?"none":`3px solid ${T.accent}`,
                    borderRight: pos.left!==undefined?"none":`3px solid ${T.accent}` }}/>
                ))}
                <div style={{ position:"absolute", left:4, right:4, height:2, background:T.accent, opacity:.8, top:"50%", animation:"scanline 2s ease-in-out infinite" }}/>
              </div>
              <div style={{ position:"absolute", bottom:12, left:0, right:0, textAlign:"center", color:"rgba(255,255,255,0.7)", fontSize:12 }}>
                Pointez vers le code-barres
              </div>
            </div>
          )}

          {loading && (
            <div style={{ position:"absolute", inset:0, background:"rgba(10,35,66,0.85)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
              <div style={{ width:40, height:40, border:`3px solid ${T.accent}33`, borderTop:`3px solid ${T.accent}`, borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
              <div style={{ color:"#fff", fontSize:13 }}>Recherche en cours…</div>
            </div>
          )}

          {phase==="result" && product?.image && <img src={product.image} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"contain", background:"#fff" }}/>}
          {phase==="result" && !product?.image && <div style={{ width:"100%", height:"100%", background:"#111", display:"flex", alignItems:"center", justifyContent:"center", fontSize:48 }}>🍱</div>}
        </div>

        <style>{`@keyframes scanline{0%,100%{top:15%}50%{top:80%}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

        <div style={{ background:T.surface, padding:"16px" }}>
          {error && <div style={{ background:T.expenseLight, border:`1px solid ${T.expense}44`, borderRadius:10, padding:"10px 12px", marginBottom:12, color:T.expense, fontSize:13 }}>❌ {error}</div>}

          {phase==="scan" && (
            <div>
              {noDet && !error && (
                <div style={{ background:T.yellowLight, border:`1px solid ${T.yellow}44`, borderRadius:10, padding:"10px 12px", marginBottom:12, fontSize:12, color:"#7A6010" }}>
                  ⚠️ Scanner auto non disponible sur ce navigateur.<br/>
                  <span style={{ fontWeight:600 }}>Saisissez le code-barres manuellement.</span>
                </div>
              )}
              <div style={{ fontSize:12, fontWeight:700, color:T.muted, marginBottom:6 }}>{noDet?"Saisir le code-barres":"Ou saisir manuellement"}</div>
              <div style={{ display:"flex", gap:8 }}>
                <input type="text" inputMode="numeric" placeholder="Ex : 3017620422003"
                  value={manCode} onChange={e => setManCode(e.target.value.replace(/\D/g,""))}
                  onKeyDown={e => e.key==="Enter" && manCode.length>=8 && fetchProduct(manCode)}
                  style={{ ...S.inp, marginBottom:0, flex:1 }}/>
                <button onClick={() => manCode.length>=8 && fetchProduct(manCode)}
                  disabled={manCode.length<8||loading}
                  style={{ ...S.smBtn(T.accent, "#fff"), padding:"9px 14px", fontSize:13, opacity:manCode.length<8?.5:1 }}>
                  Rechercher
                </button>
              </div>
            </div>
          )}

          {phase==="result" && product && (
            <div>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:16, fontWeight:800, lineHeight:1.3 }}>{product.name}</div>
                {product.brand && <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{product.brand}</div>}
                <div style={{ fontSize:10, color:T.accent, marginTop:3, fontWeight:600 }}>📊 Source : Open Food Facts</div>
              </div>

              {/* Quantité */}
              <div style={{ marginBottom:12 }}>
                <label style={S.lbl}>Quantité (g / ml)</label>
                <div style={{ display:"flex", gap:6 }}>
                  {["50","100","150","200","250"].map(v => (
                    <button key={v} onClick={() => setQty(v)}
                      style={{ flex:1, padding:"7px 4px", borderRadius:8, border:`1px solid ${qty===v?T.accent:T.border}`, background:qty===v?T.accentLight:T.bg, color:qty===v?T.accent:T.muted, fontSize:12, fontWeight:qty===v?700:400, cursor:"pointer" }}>
                      {v}g
                    </button>
                  ))}
                  <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)}
                    style={{ ...S.inp, marginBottom:0, width:60, flex:"0 0 60px", padding:"7px 8px", fontSize:12, textAlign:"center" }}/>
                </div>
              </div>

              {/* Macros */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, marginBottom:14 }}>
                {[{l:"Calories",v:calc(product.calories),u:"kcal",c:T.accent},{l:"Protéines",v:calc(product.protein),u:"g",c:T.accent},{l:"Glucides",v:calc(product.carbs),u:"g",c:T.yellow},{l:"Lipides",v:calc(product.fat),u:"g",c:T.expense}].map(({l,v,u,c}) => (
                  <div key={l} style={{ textAlign:"center", background:T.bg, borderRadius:9, padding:"8px 4px", border:`1px solid ${T.border}` }}>
                    <div style={{ fontSize:9, color:T.muted, marginBottom:2, fontWeight:600 }}>{l}</div>
                    <div style={{ fontSize:13, fontWeight:800, color:c }}>{fmtN(v)}</div>
                    <div style={{ fontSize:9, color:T.muted }}>{u}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", gap:8 }}>
                <button onClick={confirm} style={{ ...S.btn(T.accent), marginBottom:0, flex:2 }}>✅ Ajouter au panier</button>
                <button onClick={() => { setPhase("scan"); setProduct(null); startCamera(); }} style={{ ...S.btn(T.bg, T.muted), border:`1px solid ${T.border}`, marginBottom:0, flex:1 }}>🔄 Rescanner</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PANIER DE SCAN
// ─────────────────────────────────────────────────────────────
function ScanBasket({ basket, onUpdate, onRemove, onClear, onAddToJournal, onCreateRecipe }) {
  if (!basket.length) return null;
  const totalCal = basket.reduce((s,i) => s+(i.calories||0), 0);
  return (
    <div style={{ ...S.card, border:`2px solid ${T.accent}`, background:T.accentLight, margin:"10px 14px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:T.primary }}>🧺 Panier — {basket.length} produit(s)</div>
          <div style={{ fontSize:11, color:T.income, fontWeight:700, marginTop:1 }}>Total : {fmtN(totalCal)} kcal</div>
        </div>
        <button onClick={onClear} style={S.smBtn(T.muted, undefined, true)}>Vider</button>
      </div>
      {basket.map((item,i) => (
        <div key={item._bid} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderTop:`1px solid ${T.border}` }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{item.name}</div>
            <div style={{ fontSize:10, color:T.muted, display:"flex", alignItems:"center", gap:6 }}>
              <input type="number" min="1" value={item.quantityG||100}
                onChange={e => {
                  const g = parseFloat(e.target.value)||100;
                  const ratio = g/(item._origQty||100);
                  onUpdate(i, { ...item, quantityG:g,
                    calories:+((item._orig_cal||item.calories)*ratio).toFixed(0),
                    protein: +((item._orig_pro||item.protein)*ratio).toFixed(1),
                    carbs:   +((item._orig_car||item.carbs)*ratio).toFixed(1),
                    fat:     +((item._orig_fat||item.fat)*ratio).toFixed(1),
                  });
                }}
                style={{ width:56, background:"none", border:`1px solid ${T.border}`, borderRadius:6, padding:"2px 6px", fontSize:11, color:T.text, fontFamily:T.font }}/>
              <span>g · {fmtN(item.calories)} kcal · P:{fmtN(item.protein)}g</span>
            </div>
          </div>
          <button onClick={() => onRemove(i)} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:14, padding:"0 4px" }}>✕</button>
        </div>
      ))}
      <div style={{ display:"flex", gap:8, marginTop:12 }}>
        <button onClick={onAddToJournal} style={{ ...S.btn(T.accent), marginBottom:0, flex:1, fontSize:12 }}>🍽 Ajouter au journal</button>
        <button onClick={onCreateRecipe} style={{ ...S.btn(T.primary), marginBottom:0, flex:1, fontSize:12 }}>📖 Créer une recette</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────
export default function PrismSante() {
  // ── Données ───────────────────────────────────────────────
  const [foodEntries, setFoodEntries] = useState([]);
  const [recipes,     setRecipes]     = useState([]);
  const [goals,       setGoals]       = useState(DEFAULT_GOALS);
  const [workouts,    setWorkouts]    = useState([]);
  const [programs,    setPrograms]    = useState([]);
  const [perfGoals,   setPerfGoals]   = useState([]);
  const [loaded,      setLoaded]      = useState(false);

  // ── UI ────────────────────────────────────────────────────
  const [view,      setView]      = useState("dashboard");
  const [foodTab,   setFoodTab]   = useState("journal");
  const [sportTab,  setSportTab]  = useState("journal");
  const [manageTab, setManageTab] = useState("goals");
  const [addCtx,    setAddCtx]    = useState("food");
  const [selDate,   setSelDate]   = useState(today());
  const [selMonth,  setSelMonth]  = useState(new Date().getMonth());
  const [selYear,   setSelYear]   = useState(new Date().getFullYear());

  // ── Scanner & panier ──────────────────────────────────────
  const [showScanner, setShowScanner] = useState(false);
  const [scanBasket,  setScanBasket]  = useState([]);

  // ── Formulaire aliment ────────────────────────────────────
  const emptyFood = { name:"", meal:"Petit-déjeuner", calories:"", protein:"", carbs:"", fat:"", qty:"1", date:today() };
  const [fForm, setFForm] = useState(emptyFood);
  const [fErr,  setFErr]  = useState("");

  // ── Formulaire recette ────────────────────────────────────
  const emptyRec = { name:"", servings:"1", ingredients:[], steps:[], notes:"", calories:0, protein:0, carbs:0, fat:0 };
  const [rForm,       setRForm]       = useState(emptyRec);
  const [showRForm,   setShowRForm]   = useState(false);
  const [editRId,     setEditRId]     = useState(null);
  const [stepInput,   setStepInput]   = useState("");
  const [manIngInput, setManIngInput] = useState({ name:"", quantityG:"100", calories:"", protein:"", carbs:"", fat:"" });

  // ── Formulaire séance ─────────────────────────────────────
  const emptyWkt = { name:"", date:today(), notes:"", duration:"", exercises:[] };
  const emptyEx  = { name:"", type:"Force", sets:[{ reps:"", weight:"", duration:"", distance:"", unit:"kg" }] };
  const [wForm,   setWForm]   = useState(emptyWkt);
  const [editWId, setEditWId] = useState(null);
  const [curEx,   setCurEx]   = useState(emptyEx);
  const [showExF, setShowExF] = useState(false);

  // ── Formulaire programme ──────────────────────────────────
  const emptyProg = { name:"", days:DAYS_FR.map(d => ({ day:d, exercises:[] })) };
  const [pForm,       setPForm]       = useState(emptyProg);
  const [showPForm,   setShowPForm]   = useState(false);
  const [editPId,     setEditPId]     = useState(null);
  const [progExInput, setProgExInput] = useState({ dayIdx:0, name:"", sets:"3", reps:"10", weight:"" });

  // ── Objectifs ─────────────────────────────────────────────
  const [gForm,   setGForm]   = useState(DEFAULT_GOALS);
  const [pgForm,  setPgForm]  = useState({ name:"", target:"", current:"", unit:"kg" });
  const [showPgF, setShowPgF] = useState(false);

  // ── Flash ─────────────────────────────────────────────────
  const [flash, setFlash] = useState("");
  const showFlash = msg => { setFlash(msg); setTimeout(() => setFlash(""), 2500); };

  // ─────────────────────────────────────────────────────────
  // LOCALSTORAGE
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const g = k => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):null; } catch { return null; } };
    setFoodEntries(g("ph_food")     || []);
    setRecipes(    g("ph_recipes")  || []);
    setGoals(      g("ph_goals")    || DEFAULT_GOALS);
    setWorkouts(   g("ph_workouts") || []);
    setPrograms(   g("ph_programs") || []);
    setPerfGoals(  g("ph_perfgoals")|| []);
    setLoaded(true);
  }, []);
  useEffect(() => { if(loaded) localStorage.setItem("ph_food",      JSON.stringify(foodEntries)); }, [foodEntries, loaded]);
  useEffect(() => { if(loaded) localStorage.setItem("ph_recipes",   JSON.stringify(recipes));    }, [recipes,     loaded]);
  useEffect(() => { if(loaded) localStorage.setItem("ph_goals",     JSON.stringify(goals));      }, [goals,       loaded]);
  useEffect(() => { if(loaded) localStorage.setItem("ph_workouts",  JSON.stringify(workouts));   }, [workouts,    loaded]);
  useEffect(() => { if(loaded) localStorage.setItem("ph_programs",  JSON.stringify(programs));   }, [programs,    loaded]);
  useEffect(() => { if(loaded) localStorage.setItem("ph_perfgoals", JSON.stringify(perfGoals));  }, [perfGoals,   loaded]);

  // ─────────────────────────────────────────────────────────
  // DÉRIVÉ
  // ─────────────────────────────────────────────────────────
  const dayFood = useMemo(() => foodEntries.filter(e => e.date===selDate), [foodEntries, selDate]);
  const dayTotals = useMemo(() => ({
    calories: dayFood.reduce((s,e) => s+(e.calories||0)*(e.qty||1), 0),
    protein:  dayFood.reduce((s,e) => s+(e.protein||0)*(e.qty||1), 0),
    carbs:    dayFood.reduce((s,e) => s+(e.carbs||0)*(e.qty||1), 0),
    fat:      dayFood.reduce((s,e) => s+(e.fat||0)*(e.qty||1), 0),
  }), [dayFood]);
  const todayWorkouts = useMemo(() => workouts.filter(w => w.date===today()), [workouts]);
  const weekFood = useMemo(() => { const d=new Date(); d.setDate(d.getDate()-6); return foodEntries.filter(e => new Date(e.date)>=d); }, [foodEntries]);
  const weekCalAvg = useMemo(() => {
    if (!weekFood.length) return 0;
    const byDay = {};
    weekFood.forEach(e => { byDay[e.date]=(byDay[e.date]||0)+(e.calories||0)*(e.qty||1); });
    const vals = Object.values(byDay);
    return vals.reduce((s,v) => s+v, 0) / vals.length;
  }, [weekFood]);
  const monthWorkouts = useMemo(() => workouts.filter(w => {
    const d=new Date(w.date); return d.getMonth()===selMonth && d.getFullYear()===selYear;
  }), [workouts, selMonth, selYear]);

  const recipeCalc = ings => ({
    calories: +ings.reduce((s,i) => s+(parseFloat(i.calories)||0), 0).toFixed(0),
    protein:  +ings.reduce((s,i) => s+(parseFloat(i.protein)||0), 0).toFixed(1),
    carbs:    +ings.reduce((s,i) => s+(parseFloat(i.carbs)||0), 0).toFixed(1),
    fat:      +ings.reduce((s,i) => s+(parseFloat(i.fat)||0), 0).toFixed(1),
  });

  // ─────────────────────────────────────────────────────────
  // SCANNER & PANIER
  // ─────────────────────────────────────────────────────────
  const addToBasket = prod => {
    setScanBasket(prev => [...prev, { ...prod, _bid:uid(), _orig_cal:prod.calories, _orig_pro:prod.protein, _orig_car:prod.carbs, _orig_fat:prod.fat, _origQty:prod.quantityG||100 }]);
    showFlash(`✅ ${prod.name} ajouté au panier`);
  };
  const basketToJournal = () => {
    const meal = fForm.meal || "Déjeuner";
    setFoodEntries(prev => [...scanBasket.map(item => ({ id:uid(), name:item.name, meal, date:selDate, calories:item.calories, protein:item.protein, carbs:item.carbs, fat:item.fat, qty:1, barcode:item.barcode, brand:item.brand })), ...prev]);
    setScanBasket([]); showFlash(`✅ ${scanBasket.length} produit(s) ajouté(s) au journal`);
    setView("food"); setFoodTab("journal");
  };
  const basketToRecipe = () => {
    const macros = recipeCalc(scanBasket);
    setRForm({ ...emptyRec, ingredients:[...scanBasket.map(i => ({ ...i, id:uid() }))], ...macros });
    setScanBasket([]); setShowRForm(true); setFoodTab("recettes"); setView("food");
  };

  // ─────────────────────────────────────────────────────────
  // CRUD ALIMENTS
  // ─────────────────────────────────────────────────────────
  const submitFood = () => {
    if (!fForm.name.trim()) { setFErr("Nom requis."); return; }
    setFoodEntries(prev => [{ id:uid(), name:fForm.name.trim(), meal:fForm.meal, calories:parseFloat(fForm.calories)||0, protein:parseFloat(fForm.protein)||0, carbs:parseFloat(fForm.carbs)||0, fat:parseFloat(fForm.fat)||0, qty:parseFloat(fForm.qty)||1, date:fForm.date }, ...prev]);
    setFForm(emptyFood); setFErr(""); showFlash("✅ Enregistré !"); setView("food");
  };
  const deleteFood = id => window.confirm("Supprimer ?") && setFoodEntries(p => p.filter(e => e.id!==id));

  // ─────────────────────────────────────────────────────────
  // CRUD RECETTES
  // ─────────────────────────────────────────────────────────
  const addManualIngredient = () => {
    if (!manIngInput.name.trim()) return;
    const ing = { id:uid(), name:manIngInput.name.trim(), quantityG:parseFloat(manIngInput.quantityG)||100, calories:parseFloat(manIngInput.calories)||0, protein:parseFloat(manIngInput.protein)||0, carbs:parseFloat(manIngInput.carbs)||0, fat:parseFloat(manIngInput.fat)||0 };
    const newIngs = [...rForm.ingredients, ing];
    setRForm(f => ({ ...f, ingredients:newIngs, ...recipeCalc(newIngs) }));
    setManIngInput({ name:"", quantityG:"100", calories:"", protein:"", carbs:"", fat:"" });
  };
  const removeIngredient = id => { const ni=[...rForm.ingredients.filter(i=>i.id!==id)]; setRForm(f=>({...f,ingredients:ni,...recipeCalc(ni)})); };
  const addStep    = () => { if(!stepInput.trim())return; setRForm(f=>({...f,steps:[...f.steps,{id:uid(),text:stepInput.trim()}]})); setStepInput(""); };
  const removeStep = id => setRForm(f => ({ ...f, steps:f.steps.filter(s=>s.id!==id) }));
  const moveStep   = (id,dir) => { const st=[...rForm.steps]; const i=st.findIndex(s=>s.id===id); const j=i+dir; if(j<0||j>=st.length)return; [st[i],st[j]]=[st[j],st[i]]; setRForm(f=>({...f,steps:st})); };
  const submitRecipe = () => {
    if (!rForm.name.trim()) return;
    const macros = recipeCalc(rForm.ingredients);
    const item = { ...rForm, id:editRId||uid(), name:rForm.name.trim(), servings:parseFloat(rForm.servings)||1, ...macros };
    if (editRId) setRecipes(p => p.map(r => r.id===editRId?item:r));
    else setRecipes(p => [item,...p]);
    setRForm(emptyRec); setShowRForm(false); setEditRId(null); showFlash("✅ Recette enregistrée !");
  };
  const deleteRecipe    = id => window.confirm("Supprimer cette recette ?") && setRecipes(p=>p.filter(r=>r.id!==id));
  const startEditRec    = r  => { setRForm({...r,steps:r.steps||[],ingredients:r.ingredients||[]}); setEditRId(r.id); setShowRForm(true); };
  const addRecipeToJournal = (rec,meal) => { setFoodEntries(prev=>[{id:uid(),name:rec.name,meal,date:selDate,calories:rec.calories,protein:rec.protein,carbs:rec.carbs,fat:rec.fat,qty:1,fromRecipe:true},...prev]); showFlash(`✅ ${rec.name} ajouté au journal`); };

  // ─────────────────────────────────────────────────────────
  // CRUD WORKOUTS
  // ─────────────────────────────────────────────────────────
  const addSetToEx  = () => setCurEx(f => ({ ...f, sets:[...f.sets,{reps:"",weight:"",duration:"",distance:"",unit:"kg"}] }));
  const updateSet   = (idx,field,val) => setCurEx(f => ({ ...f, sets:f.sets.map((s,i)=>i===idx?{...s,[field]:val}:s) }));
  const removeSet   = idx => setCurEx(f => ({ ...f, sets:f.sets.filter((_,i)=>i!==idx) }));
  const removeEx    = idx => setWForm(f => ({ ...f, exercises:f.exercises.filter((_,i)=>i!==idx) }));
  const addExToWkt  = () => { if(!curEx.name.trim())return; setWForm(f=>({...f,exercises:[...f.exercises,{...curEx,id:uid()}]})); setCurEx(emptyEx); setShowExF(false); };
  const submitWorkout = () => {
    if (!wForm.name.trim()) return;
    const item = { ...wForm, id:editWId||uid(), duration:parseFloat(wForm.duration)||0 };
    if (editWId) setWorkouts(p=>p.map(w=>w.id===editWId?item:w));
    else setWorkouts(p=>[item,...p]);
    setWForm(emptyWkt); setEditWId(null); setView("sport"); showFlash("✅ Séance enregistrée !");
  };
  const deleteWorkout = id => window.confirm("Supprimer cette séance ?") && setWorkouts(p=>p.filter(w=>w.id!==id));
  const startEditWkt  = w  => { setWForm({...w}); setEditWId(w.id); setAddCtx("sport"); setView("add"); };

  // ─────────────────────────────────────────────────────────
  // CRUD PROGRAMMES
  // ─────────────────────────────────────────────────────────
  const addExToDay      = () => { if(!progExInput.name.trim())return; setPForm(f=>({...f,days:f.days.map((d,i)=>i===progExInput.dayIdx?{...d,exercises:[...d.exercises,{id:uid(),name:progExInput.name.trim(),type:"Force",sets:progExInput.sets,reps:progExInput.reps,weight:progExInput.weight}]}:d)})); setProgExInput(p=>({...p,name:"",weight:""})); };
  const removeExFromDay = (di,ei) => setPForm(f=>({...f,days:f.days.map((d,i)=>i===di?{...d,exercises:d.exercises.filter((_,j)=>j!==ei)}:d)}));
  const submitProgram   = () => { if(!pForm.name.trim())return; const item={...pForm,id:editPId||uid()}; if(editPId)setPrograms(p=>p.map(pr=>pr.id===editPId?item:pr));else setPrograms(p=>[item,...p]); setPForm(emptyProg); setShowPForm(false); setEditPId(null); };
  const deleteProgram   = id => window.confirm("Supprimer ce programme ?") && setPrograms(p=>p.filter(pr=>pr.id!==id));
  const applyProgram    = (prog,date) => { const d=new Date(date); const di=(d.getDay()+6)%7; const dp=prog.days[di]; if(!dp?.exercises.length){alert("Aucun exercice ce jour.");return;} setWForm({...emptyWkt,name:`${prog.name} — ${dp.day}`,date,exercises:dp.exercises.map(e=>({...e,id:uid(),sets:Array.from({length:parseInt(e.sets)||3},()=>({reps:e.reps||"",weight:e.weight||"",duration:"",distance:"",unit:"kg"}))}))}); setAddCtx("sport"); setView("add"); };

  // ─────────────────────────────────────────────────────────
  // CRUD OBJECTIFS
  // ─────────────────────────────────────────────────────────
  const submitPerfGoal = () => { if(!pgForm.name.trim()||!pgForm.target)return; setPerfGoals(p=>[{...pgForm,id:uid(),target:parseFloat(pgForm.target),current:parseFloat(pgForm.current)||0,createdAt:today()},...p]); setPgForm({name:"",target:"",current:"",unit:"kg"}); setShowPgF(false); };
  const updateGoalProg = (id,val) => setPerfGoals(p=>p.map(g=>g.id===id?{...g,current:parseFloat(val)||0}:g));

  const Nav = ({ icon, label, target }) => (
    <button style={S.navB(view===target)} onClick={() => setView(target)}>
      <span style={{ fontSize:17, lineHeight:1 }}>{icon}</span>{label}
    </button>
  );

  const DatePicker = () => (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 14px" }}>
      <button onClick={() => { const d=new Date(selDate); d.setDate(d.getDate()-1); setSelDate(d.toISOString().split("T")[0]); }}
        style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:14, color:T.muted }}>‹</button>
      <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)}
        style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:9, padding:"6px 10px", color:T.text, fontSize:13, fontFamily:T.font, textAlign:"center" }}/>
      <button onClick={() => { const d=new Date(selDate); d.setDate(d.getDate()+1); if(d<=new Date())setSelDate(d.toISOString().split("T")[0]); }}
        style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:14, color:T.muted }}>›</button>
    </div>
  );

  if (!loaded) return (
    <div style={{ ...S.app, display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>
      <div style={{ textAlign:"center" }}><PrismLogo size={52}/><div style={{ marginTop:12, color:T.muted, fontSize:13 }}>Chargement…</div></div>
    </div>
  );

  return (
    <div style={S.app}>

      {showScanner && <ScannerModal onAdd={addToBasket} onClose={() => setShowScanner(false)}/>}

      {flash && (
        <div style={{ position:"fixed", top:64, left:"50%", transform:"translateX(-50%)", zIndex:500, background:T.accentDark, color:"#fff", padding:"10px 20px", borderRadius:30, fontSize:13, fontWeight:700, pointerEvents:"none", boxShadow:"0 4px 20px rgba(0,0,0,0.2)" }}>
          {flash}
        </div>
      )}

      {/* ════ HEADER ════ */}
      <div style={S.hdr}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <PrismLogo size={30}/>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:"#fff", letterSpacing:.2, lineHeight:1.2 }}>Prism</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", letterSpacing:1.5, textTransform:"uppercase" }}>Santé</div>
          </div>
        </div>
        <button onClick={() => setShowScanner(true)}
          style={{ background:T.accent, border:"none", borderRadius:10, padding:"7px 14px", color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:16 }}>📷</span> Scanner
          {scanBasket.length > 0 && <span style={{ background:"#fff", color:T.accent, borderRadius:20, padding:"1px 7px", fontSize:11, fontWeight:800 }}>{scanBasket.length}</span>}
        </button>
      </div>

      {/* ════════════════════ DASHBOARD ════════════════════ */}
      {view==="dashboard" && (<>
        <DatePicker/>
        <ScanBasket basket={scanBasket}
          onUpdate={(i,item) => setScanBasket(prev => { const a=[...prev]; a[i]=item; return a; })}
          onRemove={i => setScanBasket(prev => prev.filter((_,idx) => idx!==i))}
          onClear={() => setScanBasket([])}
          onAddToJournal={basketToJournal}
          onCreateRecipe={basketToRecipe}/>

        {/* Balance calories */}
        <div style={{ background:`linear-gradient(135deg,${T.header},#1a4a7a)`, borderRadius:16, padding:"18px 16px 16px", margin:"10px 14px" }}>
          <div style={{ ...S.sec, color:"rgba(255,255,255,0.4)", marginBottom:10 }}>Objectif calorique — {fmtD(selDate)}</div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <Ring val={dayTotals.calories} max={goals.calories} color={T.accent} size={72}
              label={`${fmtN(dayTotals.calories)} kcal`} sublabel={`/ ${fmtN(goals.calories)}`}/>
            <div style={{ flex:1 }}>
              {[{l:"Protéines",v:dayTotals.protein,g:goals.protein,c:"#F09060"},{l:"Glucides",v:dayTotals.carbs,g:goals.carbs,c:T.yellow},{l:"Lipides",v:dayTotals.fat,g:goals.fat,c:"#F87C52"}].map(({l,v,g,c}) => (
                <div key={l} style={{ marginBottom:6 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(255,255,255,0.7)", marginBottom:2 }}>
                    <span>{l}</span><span style={{ fontWeight:700 }}>{fmtN(v)}g/{fmtN(g)}g</span>
                  </div>
                  <Bar pct={g>0?(v/g)*100:0} color={c}/>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:12, paddingTop:10, borderTop:"1px solid rgba(255,255,255,0.1)" }}>
            {[["CONSOMMÉ",dayTotals.calories,"#fff"],["RESTANT",Math.max(goals.calories-dayTotals.calories,0),dayTotals.calories>goals.calories?"#F87C52":T.accent],["MOY. 7J",weekCalAvg,"#fff"]].map(([l,v,c]) => (
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", marginBottom:2 }}>{l}</div>
                <div style={{ fontSize:14, fontWeight:800, color:c }}>{fmtN(v)}</div>
              </div>
            ))}
          </div>
        </div>

        {dayFood.length>0 && (
          <div style={S.card}>
            <div style={{ ...S.sec, marginBottom:10 }}>Repas — {fmtD(selDate)}</div>
            {MEALS.map(meal => {
              const items = dayFood.filter(e => e.meal===meal);
              if (!items.length) return null;
              return (
                <div key={meal} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.muted, marginBottom:4 }}>
                    {MEAL_ICONS[meal]} {meal} <span style={{ color:T.accent, fontWeight:800 }}>{fmtN(items.reduce((s,e)=>s+(e.calories||0)*(e.qty||1),0))} kcal</span>
                  </div>
                  {items.map(e => (
                    <div key={e.id} style={{ fontSize:12, padding:"2px 0 2px 14px", display:"flex", justifyContent:"space-between" }}>
                      <span>{e.qty>1?`${e.qty}× `:""}{e.name}</span>
                      <span style={{ color:T.muted }}>{fmtN((e.calories||0)*(e.qty||1))} kcal</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {todayWorkouts.length>0 && (
          <div style={S.card}>
            <div style={{ ...S.sec, color:T.accent, marginBottom:8 }}>🏋 Séance aujourd'hui</div>
            {todayWorkouts.map(w => (
              <div key={w.id} style={S.rowL}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{w.name}</div>
                  <div style={{ fontSize:11, color:T.muted }}>{w.exercises.length} exercice(s){w.duration?` · ${w.duration} min`:""}</div>
                </div>
                <span style={{ fontSize:11, fontWeight:600, color:T.accent, background:T.accentLight, padding:"3px 10px", borderRadius:20 }}>✓</span>
              </div>
            ))}
          </div>
        )}

        {perfGoals.length>0 && (
          <div style={S.card}>
            <div style={{ ...S.sec, marginBottom:10 }}>Objectifs</div>
            {perfGoals.slice(0,3).map(g => {
              const pct = g.target>0?(g.current/g.target)*100:0;
              return (
                <div key={g.id} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:2 }}>
                    <span style={{ fontWeight:600 }}>{g.name}</span>
                    <span style={{ color:pct>=100?T.income:T.accent, fontWeight:700 }}>{g.current}/{g.target} {g.unit}</span>
                  </div>
                  <Bar pct={pct} color={pct>=100?T.income:T.accent}/>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display:"flex", gap:10, padding:"0 14px 10px" }}>
          <button onClick={() => { setAddCtx("food"); setView("add"); }} style={{ flex:1, ...S.btn(T.accent), marginBottom:0 }}>🍽 Ajouter repas</button>
          <button onClick={() => { setAddCtx("sport"); setView("add"); }} style={{ flex:1, ...S.btn(T.primary), marginBottom:0 }}>🏋 Nouvelle séance</button>
        </div>
      </>)}

      {/* ════════════════════ ALIMENTATION ════════════════════ */}
      {view==="food" && (<>
        <div style={{ ...S.tog, margin:"10px 14px 0", marginBottom:0 }}>
          <button style={S.tab(foodTab==="journal")}  onClick={() => setFoodTab("journal")}>📋 Journal</button>
          <button style={S.tab(foodTab==="recettes")} onClick={() => setFoodTab("recettes")}>📖 Recettes</button>
        </div>

        {foodTab==="journal" && (<>
          <DatePicker/>
          <ScanBasket basket={scanBasket}
            onUpdate={(i,item) => setScanBasket(prev => { const a=[...prev]; a[i]=item; return a; })}
            onRemove={i => setScanBasket(prev => prev.filter((_,idx) => idx!==i))}
            onClear={() => setScanBasket([])}
            onAddToJournal={basketToJournal}
            onCreateRecipe={basketToRecipe}/>

          <div style={{ ...S.card, padding:"10px 14px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:800 }}>{fmtN(dayTotals.calories)} kcal</span>
              <span style={{ fontSize:11, color:T.muted }}>/ {fmtN(goals.calories)} kcal</span>
            </div>
            <Bar pct={goals.calories>0?(dayTotals.calories/goals.calories)*100:0} color={T.accent} h={7}/>
            <div style={{ display:"flex", gap:6, marginTop:10 }}>
              {[{l:"Prot.",c:T.accent,v:dayTotals.protein,g:goals.protein},{l:"Gluc.",c:T.yellow,v:dayTotals.carbs,g:goals.carbs},{l:"Lip.",c:T.expense,v:dayTotals.fat,g:goals.fat}].map(({l,v,g,c}) => (
                <div key={l} style={{ flex:1, textAlign:"center", background:T.bg, borderRadius:9, padding:"7px 4px" }}>
                  <div style={{ fontSize:9, color:T.muted, fontWeight:700, marginBottom:2 }}>{l}</div>
                  <div style={{ fontSize:12, fontWeight:800, color:c }}>{fmtN(v)}g</div>
                  <div style={{ fontSize:9, color:T.muted }}>/{fmtN(g)}g</div>
                </div>
              ))}
            </div>
          </div>

          {MEALS.map(meal => {
            const items = dayFood.filter(e => e.meal===meal);
            const mCal  = items.reduce((s,e) => s+(e.calories||0)*(e.qty||1), 0);
            return (
              <div key={meal} style={S.card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:items.length?8:0 }}>
                  <span style={{ fontSize:13, fontWeight:700 }}>{MEAL_ICONS[meal]} {meal}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {items.length>0 && <span style={{ fontSize:12, color:T.accent, fontWeight:700 }}>{fmtN(mCal)} kcal</span>}
                    <button onClick={() => { setFForm({...emptyFood,meal,date:selDate}); setAddCtx("food"); setView("add"); }} style={{ ...S.smBtn(T.accent), padding:"3px 10px", fontSize:11 }}>+ Ajouter</button>
                  </div>
                </div>
                {items.map((e,i,arr) => (
                  <div key={e.id} style={i===arr.length-1?S.rowL:S.row}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{e.qty>1?`${e.qty}× `:""}{e.name}{e.brand?<span style={{ color:T.muted, fontWeight:400, fontSize:11 }}> · {e.brand}</span>:null}</div>
                      <div style={{ fontSize:10, color:T.muted }}>
                        {fmtN((e.calories||0)*(e.qty||1))} kcal{e.protein>0?` · P:${fmtN((e.protein||0)*(e.qty||1))}g`:""}{e.carbs>0?` · G:${fmtN((e.carbs||0)*(e.qty||1))}g`:""}{e.fat>0?` · L:${fmtN((e.fat||0)*(e.qty||1))}g`:""}
                      </div>
                    </div>
                    <button onClick={() => deleteFood(e.id)} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:13, padding:"0 4px" }}>🗑</button>
                  </div>
                ))}
                {!items.length && <div style={{ fontSize:12, color:T.muted, padding:"4px 0" }}>Aucun aliment</div>}
              </div>
            );
          })}
        </>)}

        {foodTab==="recettes" && (<>
          <div style={{ padding:"8px 14px 0" }}>
            <button onClick={() => { if(!showRForm){setRForm(emptyRec);setEditRId(null);} setShowRForm(!showRForm); }} style={S.btn(showRForm?T.muted:T.primary)}>
              {showRForm?"✕ Annuler":"＋ Nouvelle recette"}
            </button>
          </div>

          {showRForm && (
            <div style={{ ...S.cf("0 14px 10px"), border:`1.5px solid ${T.accent}`, boxShadow:`0 0 0 3px ${T.accentLight}` }}>
              <div style={{ fontSize:14, fontWeight:800, marginBottom:12 }}>{editRId?"Modifier la recette":"Nouvelle recette"}</div>

              <label style={S.lbl}>Nom de la recette</label>
              <input placeholder="Ex : Omelette fromage-jambon" value={rForm.name} onChange={e => setRForm(f=>({...f,name:e.target.value}))} style={S.inp}/>
              <label style={S.lbl}>Nombre de portions</label>
              <input type="number" min="1" value={rForm.servings} onChange={e => setRForm(f=>({...f,servings:e.target.value}))} style={S.inp}/>

              <div style={{ ...S.sec, marginBottom:8, marginTop:4 }}>Ingrédients ({rForm.ingredients.length})</div>
              {rForm.ingredients.map(ing => (
                <div key={ing.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                  <div><span style={{ fontWeight:600 }}>{ing.name}</span><span style={{ color:T.muted, marginLeft:6 }}>{ing.quantityG}g · {fmtN(ing.calories)} kcal</span></div>
                  <button onClick={() => removeIngredient(ing.id)} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:13 }}>✕</button>
                </div>
              ))}

              <button onClick={() => setShowScanner(true)} style={{ ...S.btn(T.accentLight, T.accent), border:`1.5px dashed ${T.accent}`, marginBottom:8, fontSize:13 }}>
                📷 Scanner un ingrédient
              </button>
              {scanBasket.length>0 && (
                <button onClick={() => { const ni=[...rForm.ingredients,...scanBasket.map(i=>({...i,id:uid()}))]; setRForm(f=>({...f,ingredients:ni,...recipeCalc(ni)})); setScanBasket([]); }} style={{ ...S.btn(T.accent), marginBottom:8, fontSize:13 }}>
                  ✅ Ajouter le panier ({scanBasket.length} produit(s)) à la recette
                </button>
              )}

              <div style={{ background:T.bg, borderRadius:10, padding:"10px", marginBottom:10 }}>
                <div style={{ fontSize:11, color:T.muted, fontWeight:700, marginBottom:6 }}>Ajouter manuellement</div>
                <input placeholder="Nom de l'ingrédient" value={manIngInput.name} onChange={e => setManIngInput(f=>({...f,name:e.target.value}))} style={S.inp}/>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", gap:5 }}>
                  {[["g","quantityG"],["kcal","calories"],["P(g)","protein"],["G(g)","carbs"],["L(g)","fat"]].map(([l,k]) => (
                    <div key={k}>
                      <div style={{ fontSize:9, color:T.muted, textAlign:"center", marginBottom:2 }}>{l}</div>
                      <input type="number" min="0" step="0.1" value={manIngInput[k]} onChange={e => setManIngInput(f=>({...f,[k]:e.target.value}))} style={{ ...S.inp, marginBottom:0, padding:"6px 6px", fontSize:12, textAlign:"center" }}/>
                    </div>
                  ))}
                </div>
                <button onClick={addManualIngredient} style={{ ...S.btn(T.bg, T.accent), border:`1px solid ${T.accent}`, marginTop:6, marginBottom:0, fontSize:12 }}>+ Ajouter l'ingrédient</button>
              </div>

              {rForm.ingredients.length>0 && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, marginBottom:12, background:T.accentLight, padding:"10px", borderRadius:10 }}>
                  {[{l:"Calories",v:rForm.calories,c:T.accent},{l:"Protéines",v:rForm.protein,c:T.accent},{l:"Glucides",v:rForm.carbs,c:T.yellow},{l:"Lipides",v:rForm.fat,c:T.expense}].map(({l,v,c}) => (
                    <div key={l} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:9, color:T.muted, marginBottom:2 }}>{l}</div>
                      <div style={{ fontSize:13, fontWeight:800, color:c }}>{fmtN(v)}{l==="Calories"?" kcal":"g"}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ ...S.sec, marginBottom:8 }}>Étapes de préparation</div>
              {rForm.steps.map((step,i) => (
                <div key={step.id} style={{ display:"flex", alignItems:"flex-start", gap:6, marginBottom:7 }}>
                  <div style={{ width:22, height:22, borderRadius:20, background:T.accent, color:"#fff", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>{i+1}</div>
                  <div style={{ flex:1, fontSize:13, lineHeight:1.5, paddingTop:2 }}>{step.text}</div>
                  <div style={{ display:"flex", gap:3, flexShrink:0 }}>
                    <button onClick={() => moveStep(step.id,-1)} disabled={i===0} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:12, padding:"2px", opacity:i===0?.3:1 }}>▲</button>
                    <button onClick={() => moveStep(step.id,1)} disabled={i===rForm.steps.length-1} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:12, padding:"2px", opacity:i===rForm.steps.length-1?.3:1 }}>▼</button>
                    <button onClick={() => removeStep(step.id)} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:13, padding:"2px" }}>✕</button>
                  </div>
                </div>
              ))}
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <textarea placeholder="Décrivez l'étape…" value={stepInput} onChange={e => setStepInput(e.target.value)}
                  onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addStep();} }}
                  style={{ ...S.inp, marginBottom:0, flex:1, height:52, resize:"vertical", fontFamily:T.font, fontSize:13 }}/>
                <button onClick={addStep} style={{ ...S.smBtn(T.accent), alignSelf:"flex-start", padding:"9px 12px" }}>＋</button>
              </div>

              <label style={S.lbl}>Notes (astuces, variantes…)</label>
              <textarea value={rForm.notes} onChange={e => setRForm(f=>({...f,notes:e.target.value}))} placeholder="Ex : Peut se préparer la veille…" style={{ ...S.inp, height:56, resize:"vertical", fontFamily:T.font }}/>
              <button style={S.btn(T.accent)} onClick={submitRecipe} disabled={!rForm.name.trim()}>
                ✅ {editRId?"Mettre à jour la recette":"Enregistrer la recette"}
              </button>
            </div>
          )}

          {recipes.length===0
            ? <div style={{ ...S.card, textAlign:"center", color:T.muted, padding:"28px 16px", fontSize:13 }}>Aucune recette.<br/>Créez votre bibliothèque ou scannez des produits.</div>
            : recipes.map(r => (
              <div key={r.id} style={S.card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>{r.name}</div>
                    <div style={{ fontSize:11, color:T.muted, marginTop:1 }}>
                      {r.servings>1?`${r.servings} portions · `:""}{fmtN(r.calories)} kcal{r.protein>0?` · P:${fmtN(r.protein)}g`:""}{r.carbs>0?` · G:${fmtN(r.carbs)}g`:""}{r.fat>0?` · L:${fmtN(r.fat)}g`:""}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                    <button onClick={() => startEditRec(r)} style={S.smBtn(T.primary)}>✏️</button>
                    <button onClick={() => deleteRecipe(r.id)} style={S.smBtn(T.expense)}>🗑</button>
                  </div>
                </div>
                {r.ingredients?.length>0 && <div style={{ fontSize:11, color:T.muted, marginBottom:6 }}>{r.ingredients.map(i=>i.name).join(", ")}</div>}
                {r.steps?.length>0 && <div style={{ fontSize:11, color:T.muted, marginBottom:8 }}>📋 {r.steps.length} étape(s)</div>}
                {r.notes && <div style={{ fontSize:11, color:T.muted, fontStyle:"italic", marginBottom:8 }}>💬 {r.notes}</div>}
                <div style={{ display:"flex", gap:6 }}>
                  {MEALS.map(m => (
                    <button key={m} onClick={() => addRecipeToJournal(r,m)} style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, padding:"5px 4px", fontSize:10, fontWeight:600, color:T.muted, cursor:"pointer" }}>
                      {MEAL_ICONS[m]}
                    </button>
                  ))}
                </div>
              </div>
            ))
          }
        </>)}
      </>)}

      {/* ════════════════════ AJOUTER ════════════════════ */}
      {view==="add" && (<>
        <div style={{ ...S.tog, margin:"10px 14px 0" }}>
          <button style={S.tBtn(addCtx==="food")}  onClick={() => setAddCtx("food")}>🍽 Alimentation</button>
          <button style={S.tBtn(addCtx==="sport")} onClick={() => setAddCtx("sport")}>🏋 Sport</button>
        </div>

        {addCtx==="food" && (
          <div style={{ padding:"0 14px 14px" }}>
            <div style={{ fontSize:16, fontWeight:800, marginBottom:12, marginTop:8 }}>Ajouter un aliment</div>
            <label style={S.lbl}>Repas</label>
            <select value={fForm.meal} onChange={e => setFForm(f=>({...f,meal:e.target.value}))} style={S.sel}>{MEALS.map(m => <option key={m}>{m}</option>)}</select>
            <label style={S.lbl}>Date</label>
            <input type="date" value={fForm.date} onChange={e => setFForm(f=>({...f,date:e.target.value}))} style={S.inp}/>
            <label style={S.lbl}>Nom</label>
            <input placeholder="Ex : Yaourt nature 0%" value={fForm.name} onChange={e => setFForm(f=>({...f,name:e.target.value}))} style={S.inp}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div><label style={S.lbl}>Calories (kcal)</label><input type="number" min="0" value={fForm.calories} onChange={e => setFForm(f=>({...f,calories:e.target.value}))} style={{ ...S.inp, marginBottom:0 }}/></div>
              <div><label style={S.lbl}>Quantité</label><input type="number" min="0.1" step="0.1" value={fForm.qty} onChange={e => setFForm(f=>({...f,qty:e.target.value}))} style={{ ...S.inp, marginBottom:0 }}/></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:9 }}>
              {[["Prot. (g)","protein"],["Gluc. (g)","carbs"],["Lip. (g)","fat"]].map(([l,k]) => (
                <div key={k}><label style={S.lbl}>{l}</label><input type="number" min="0" step="0.1" value={fForm[k]} onChange={e => setFForm(f=>({...f,[k]:e.target.value}))} style={{ ...S.inp, marginBottom:0 }}/></div>
              ))}
            </div>
            {fErr && <div style={{ color:T.expense, fontSize:12, padding:"6px 10px", background:T.expenseLight, borderRadius:8, marginTop:8 }}>{fErr}</div>}
            <div style={{ marginTop:12 }}>
              <button style={S.btn(T.accent)} onClick={submitFood}>✅ Enregistrer</button>
            </div>
          </div>
        )}

        {addCtx==="sport" && (
          <div style={{ padding:"0 14px 14px" }}>
            <div style={{ fontSize:16, fontWeight:800, marginBottom:12, marginTop:8 }}>{editWId?"Modifier":"Nouvelle séance"}</div>
            <label style={S.lbl}>Nom de la séance</label>
            <input placeholder="Ex : Push Day A" value={wForm.name} onChange={e => setWForm(f=>({...f,name:e.target.value}))} style={S.inp}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div><label style={S.lbl}>Date</label><input type="date" value={wForm.date} onChange={e => setWForm(f=>({...f,date:e.target.value}))} style={{ ...S.inp, marginBottom:0 }}/></div>
              <div><label style={S.lbl}>Durée (min)</label><input type="number" min="0" value={wForm.duration} onChange={e => setWForm(f=>({...f,duration:e.target.value}))} style={{ ...S.inp, marginBottom:0 }}/></div>
            </div>
            <label style={{ ...S.lbl, marginTop:9 }}>Notes</label>
            <input value={wForm.notes} onChange={e => setWForm(f=>({...f,notes:e.target.value}))} style={S.inp}/>
            {wForm.exercises.length>0 && (
              <div style={{ marginBottom:10 }}>
                <div style={{ ...S.sec, marginBottom:6 }}>Exercices ({wForm.exercises.length})</div>
                {wForm.exercises.map((ex,i) => (
                  <div key={ex.id||i} style={{ background:T.bg, borderRadius:9, padding:"8px 10px", marginBottom:6, display:"flex", justifyContent:"space-between" }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700 }}>{ex.name} <span style={{ color:T.muted, fontWeight:400, fontSize:11 }}>{ex.type}</span></div>
                      <div style={{ fontSize:10, color:T.muted }}>{ex.sets.map((s,si)=>ex.type==="Cardio"?`${si+1}:${s.duration||"—"}min`:`${si+1}:${s.reps||"—"}×${s.weight||"—"}${s.unit||"kg"}`).join(" · ")}</div>
                    </div>
                    <button onClick={() => removeEx(i)} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            {!showExF
              ? <button onClick={() => setShowExF(true)} style={{ ...S.btn(T.bg, T.accent), border:`1.5px dashed ${T.accent}`, marginBottom:10 }}>＋ Ajouter un exercice</button>
              : (
                <div style={{ ...S.cf("0 0 10px"), border:`1.5px solid ${T.accent}` }}>
                  <div style={{ fontSize:12, fontWeight:700, marginBottom:8, color:T.accent }}>Nouvel exercice</div>
                  <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:8 }}>
                    <div><label style={S.lbl}>Nom</label><input value={curEx.name} onChange={e => setCurEx(f=>({...f,name:e.target.value}))} style={{ ...S.inp, marginBottom:0 }}/></div>
                    <div><label style={S.lbl}>Type</label><select value={curEx.type} onChange={e => setCurEx(f=>({...f,type:e.target.value}))} style={{ ...S.sel, marginBottom:0 }}>{EXERCISE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                  </div>
                  {curEx.sets.map((s,i) => (
                    <div key={i} style={{ display:"flex", gap:5, alignItems:"center", marginBottom:4, marginTop:6 }}>
                      <span style={{ fontSize:10, color:T.muted, width:18 }}>S{i+1}</span>
                      {curEx.type==="Cardio"
                        ? <><input placeholder="min" type="number" value={s.duration} onChange={e => updateSet(i,"duration",e.target.value)} style={{ ...S.inp, marginBottom:0, flex:1, padding:"6px 8px", fontSize:12 }}/><input placeholder="km" type="number" step="0.1" value={s.distance} onChange={e => updateSet(i,"distance",e.target.value)} style={{ ...S.inp, marginBottom:0, flex:1, padding:"6px 8px", fontSize:12 }}/></>
                        : <><input placeholder="Rép." type="number" value={s.reps} onChange={e => updateSet(i,"reps",e.target.value)} style={{ ...S.inp, marginBottom:0, flex:1, padding:"6px 8px", fontSize:12 }}/><input placeholder="Poids" type="number" step="0.5" value={s.weight} onChange={e => updateSet(i,"weight",e.target.value)} style={{ ...S.inp, marginBottom:0, flex:1, padding:"6px 8px", fontSize:12 }}/><select value={s.unit} onChange={e => updateSet(i,"unit",e.target.value)} style={{ ...S.sel, marginBottom:0, width:52, padding:"6px 4px", fontSize:11 }}>{["kg","lbs","bw"].map(u => <option key={u}>{u}</option>)}</select></>
                      }
                      {curEx.sets.length>1 && <button onClick={() => removeSet(i)} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer" }}>✕</button>}
                    </div>
                  ))}
                  <div style={{ display:"flex", gap:6, marginTop:6 }}>
                    <button onClick={addSetToEx} style={{ ...S.smBtn(T.bg, T.accent, true), flex:1 }}>＋ Série</button>
                    <button onClick={addExToWkt} style={{ ...S.smBtn(T.accent), flex:2 }}>✅ Ajouter</button>
                    <button onClick={() => { setShowExF(false); setCurEx(emptyEx); }} style={S.smBtn(T.muted)}>✕</button>
                  </div>
                </div>
              )
            }
            <button style={S.btn(T.accent)} onClick={submitWorkout} disabled={!wForm.name.trim()}>✅ {editWId?"Mettre à jour":"Enregistrer la séance"}</button>
          </div>
        )}
      </>)}

      {/* ════════════════════ SPORT ════════════════════ */}
      {view==="sport" && (<>
        <div style={{ ...S.tog, margin:"10px 14px 0", marginBottom:0 }}>
          <button style={S.tab(sportTab==="journal")}     onClick={() => setSportTab("journal")}>📋 Journal</button>
          <button style={S.tab(sportTab==="programmes")} onClick={() => setSportTab("programmes")}>📅 Programmes</button>
        </div>

        {sportTab==="journal" && (<>
          <div style={S.mSel}>
            {MONTHS_FR.map((m,i) => <button key={i} style={S.mChip(selMonth===i)} onClick={() => setSelMonth(i)}>{m.slice(0,3)}</button>)}
          </div>
          <div style={{ padding:"0 14px 6px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={S.sec}>{monthWorkouts.length} séance(s) — {MONTHS_FR[selMonth]}</span>
            <button onClick={() => { setWForm(emptyWkt); setEditWId(null); setAddCtx("sport"); setView("add"); }} style={S.smBtn(T.accent)}>＋ Séance</button>
          </div>
          {monthWorkouts.length===0
            ? <div style={{ ...S.card, textAlign:"center", color:T.muted, padding:"28px 16px", fontSize:13 }}>Aucune séance ce mois.</div>
            : [...monthWorkouts].sort((a,b) => new Date(b.date)-new Date(a.date)).map(w => (
              <div key={w.id} style={S.card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>{w.name}</div>
                    <div style={{ fontSize:11, color:T.muted, marginBottom:6 }}>{fmtD(w.date)}{w.duration?` · ${w.duration} min`:""}</div>
                    {w.exercises.map((ex,i) => (
                      <div key={i} style={{ fontSize:11, color:T.text, padding:"3px 0", borderTop:`1px solid ${T.border}` }}>
                        <span style={{ fontWeight:600 }}>{ex.name}</span>
                        <span style={{ color:T.muted, marginLeft:6 }}>{ex.type==="Cardio"?ex.sets.map(s=>`${s.duration||"—"}min`).join(", "):`${ex.sets.length} série(s)`}</span>
                      </div>
                    ))}
                    {w.notes && <div style={{ fontSize:11, color:T.muted, marginTop:4, fontStyle:"italic" }}>💬 {w.notes}</div>}
                  </div>
                  <div style={{ display:"flex", gap:5, marginLeft:8 }}>
                    <button onClick={() => startEditWkt(w)} style={S.smBtn(T.primary)}>✏️</button>
                    <button onClick={() => deleteWorkout(w.id)} style={S.smBtn(T.expense)}>🗑</button>
                  </div>
                </div>
              </div>
            ))
          }
        </>)}

        {sportTab==="programmes" && (<>
          <div style={{ padding:"8px 14px 0" }}>
            <button onClick={() => { setPForm(emptyProg); setEditPId(null); setShowPForm(!showPForm); }} style={S.btn(showPForm?T.muted:T.primary)}>
              {showPForm?"✕ Annuler":"＋ Nouveau programme"}
            </button>
          </div>
          {showPForm && (
            <div style={{ ...S.cf("0 14px 10px"), border:`1.5px solid ${T.accent}` }}>
              <div style={{ fontSize:13, fontWeight:800, marginBottom:10 }}>{editPId?"Modifier":"Nouveau programme"}</div>
              <label style={S.lbl}>Nom</label>
              <input value={pForm.name} onChange={e => setPForm(f=>({...f,name:e.target.value}))} style={S.inp}/>
              <div style={{ display:"flex", gap:4, overflowX:"auto", marginBottom:10 }}>
                {pForm.days.map((d,i) => (
                  <button key={i} onClick={() => setProgExInput(p=>({...p,dayIdx:i}))}
                    style={{ padding:"4px 10px", borderRadius:8, border:`1px solid ${progExInput.dayIdx===i?T.accent:T.border}`, background:progExInput.dayIdx===i?T.accentLight:T.bg, color:progExInput.dayIdx===i?T.accent:T.muted, fontSize:11, fontWeight:progExInput.dayIdx===i?700:400, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
                    {d.day.slice(0,3)}{d.exercises.length>0?` (${d.exercises.length})`:""}
                  </button>
                ))}
              </div>
              {pForm.days[progExInput.dayIdx].exercises.map((ex,ei) => (
                <div key={ei} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"5px 0", borderBottom:`1px solid ${T.border}` }}>
                  <span>{ex.name} — {ex.sets}×{ex.reps}{ex.weight?` @${ex.weight}kg`:""}</span>
                  <button onClick={() => removeExFromDay(progExInput.dayIdx,ei)} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer" }}>✕</button>
                </div>
              ))}
              <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                <input placeholder="Exercice" value={progExInput.name} onChange={e => setProgExInput(p=>({...p,name:e.target.value}))} style={{ ...S.inp, marginBottom:0, flex:"1 1 100px" }}/>
                <input placeholder="Séries" type="number" min="1" value={progExInput.sets} onChange={e => setProgExInput(p=>({...p,sets:e.target.value}))} style={{ ...S.inp, marginBottom:0, width:55, flex:"0 0 55px" }}/>
                <input placeholder="Rép." type="number" min="1" value={progExInput.reps} onChange={e => setProgExInput(p=>({...p,reps:e.target.value}))} style={{ ...S.inp, marginBottom:0, width:55, flex:"0 0 55px" }}/>
                <input placeholder="kg" type="number" step="0.5" value={progExInput.weight} onChange={e => setProgExInput(p=>({...p,weight:e.target.value}))} style={{ ...S.inp, marginBottom:0, width:55, flex:"0 0 55px" }}/>
                <button onClick={addExToDay} style={{ ...S.smBtn(T.accent), flexShrink:0 }}>＋</button>
              </div>
              <button style={{ ...S.btn(T.accent), marginTop:12 }} onClick={submitProgram}>✅ {editPId?"Mettre à jour":"Créer le programme"}</button>
            </div>
          )}
          {programs.map(prog => (
            <div key={prog.id} style={S.card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div style={{ fontSize:14, fontWeight:700 }}>{prog.name}</div>
                <div style={{ display:"flex", gap:5 }}>
                  <button onClick={() => { setPForm({...prog}); setEditPId(prog.id); setShowPForm(true); }} style={S.smBtn(T.primary)}>✏️</button>
                  <button onClick={() => deleteProgram(prog.id)} style={S.smBtn(T.expense)}>🗑</button>
                </div>
              </div>
              <div style={{ display:"flex", gap:4, marginBottom:10 }}>
                {prog.days.map((d,i) => (
                  <div key={i} style={{ textAlign:"center", flexShrink:0 }}>
                    <div style={{ fontSize:9, color:T.muted, marginBottom:3 }}>{d.day.slice(0,3).toUpperCase()}</div>
                    <div style={{ width:26, height:26, borderRadius:7, background:d.exercises.length?T.accentLight:T.bg, border:`1px solid ${d.exercises.length?T.accent:T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:d.exercises.length?T.accent:T.muted }}>
                      {d.exercises.length||"—"}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => applyProgram(prog,today())} style={{ ...S.btn(T.accentLight, T.accent), border:`1px solid ${T.accent}`, marginBottom:0, fontSize:13 }}>▶ Appliquer aujourd'hui</button>
            </div>
          ))}
        </>)}
      </>)}

      {/* ════════════════════ GÉRER ════════════════════ */}
      {view==="manage" && (
        <div style={{ padding:"16px 14px" }}>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:14, marginTop:4 }}>Paramètres & Objectifs</div>
          <div style={{ ...S.tog, marginBottom:14 }}>
            <button style={S.tab(manageTab==="goals")}      onClick={() => setManageTab("goals")}>🎯 Nutrition</button>
            <button style={S.tab(manageTab==="objectives")} onClick={() => setManageTab("objectives")}>🏆 Objectifs</button>
          </div>

          {manageTab==="goals" && (<>
            <div style={S.cf("0 0 12px")}>
              <div style={{ fontSize:13, fontWeight:800, marginBottom:12 }}>Objectifs journaliers</div>
              {[["Calories (kcal)","calories"],["Protéines (g)","protein"],["Glucides (g)","carbs"],["Lipides (g)","fat"]].map(([l,k]) => (
                <div key={k}><label style={S.lbl}>{l}</label>
                  <input type="number" min="0" value={gForm[k]??goals[k]}
                    onChange={e => setGForm(f=>({...f,[k]:parseFloat(e.target.value)||0}))}
                    onBlur={e => setGoals(g=>({...g,[k]:parseFloat(e.target.value)||0}))} style={S.inp}/>
                </div>
              ))}
              <button onClick={() => setGoals(gForm)} style={S.btn(T.accent)}>✅ Enregistrer</button>
            </div>
            <div style={S.cf("0 0 12px")}>
              <div style={{ fontSize:13, fontWeight:800, marginBottom:10 }}>Résumé 7 jours</div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                {[["MOY. CAL.",fmtN(weekCalAvg),T.accent],["OBJECTIF",fmtN(goals.calories),T.primary],["SÉANCES",workouts.filter(w=>(new Date()-new Date(w.date))<7*86400000).length,T.accent]].map(([l,v,c]) => (
                  <div key={l} style={{ textAlign:"center" }}>
                    <div style={{ ...S.sec, marginBottom:3 }}>{l}</div>
                    <div style={{ fontSize:16, fontWeight:800, color:c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </>)}

          {manageTab==="objectives" && (<>
            <button onClick={() => setShowPgF(!showPgF)} style={S.btn(showPgF?T.muted:T.accent)}>
              {showPgF?"✕ Annuler":"＋ Nouvel objectif"}
            </button>
            {showPgF && (
              <div style={{ ...S.cf("0 0 12px"), border:`1.5px solid ${T.accent}` }}>
                <label style={S.lbl}>Nom de l'objectif</label>
                <input placeholder="Ex : Développé couché 100kg" value={pgForm.name} onChange={e => setPgForm(f=>({...f,name:e.target.value}))} style={S.inp}/>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  <div><label style={S.lbl}>Actuel</label><input type="number" step="0.1" value={pgForm.current} onChange={e => setPgForm(f=>({...f,current:e.target.value}))} style={{ ...S.inp, marginBottom:0 }}/></div>
                  <div><label style={S.lbl}>Objectif</label><input type="number" step="0.1" value={pgForm.target} onChange={e => setPgForm(f=>({...f,target:e.target.value}))} style={{ ...S.inp, marginBottom:0 }}/></div>
                  <div><label style={S.lbl}>Unité</label><select value={pgForm.unit} onChange={e => setPgForm(f=>({...f,unit:e.target.value}))} style={{ ...S.sel, marginBottom:0 }}>{["kg","lbs","km","min","rép.","%"].map(u => <option key={u}>{u}</option>)}</select></div>
                </div>
                <button style={{ ...S.btn(T.accent), marginTop:10 }} onClick={submitPerfGoal}>✅ Ajouter</button>
              </div>
            )}
            {perfGoals.map(g => {
              const pct = g.target>0?(g.current/g.target)*100:0;
              return (
                <div key={g.id} style={S.cf("0 0 8px")}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <div><div style={{ fontSize:13, fontWeight:700 }}>{g.name}</div><div style={{ fontSize:10, color:T.muted }}>Depuis {fmtD(g.createdAt)}</div></div>
                    <button onClick={() => setPerfGoals(p=>p.filter(x=>x.id!==g.id))} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer" }}>🗑</button>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <input type="number" step="0.1" value={g.current} onChange={e => updateGoalProg(g.id,e.target.value)}
                      style={{ ...S.inp, marginBottom:0, width:80, flex:"0 0 80px", padding:"6px 10px", fontSize:13 }}/>
                    <span style={{ color:T.muted, fontSize:12 }}>/ {g.target} {g.unit}</span>
                    {pct>=100 && <span style={{ fontSize:11, background:T.incomeLight, color:T.income, padding:"2px 8px", borderRadius:20, fontWeight:700 }}>🎉 Atteint !</span>}
                  </div>
                  <Bar pct={pct} color={pct>=100?T.income:T.accent} h={7}/>
                  <div style={{ fontSize:10, color:T.muted, marginTop:3, textAlign:"right" }}>{pct.toFixed(1)} %</div>
                </div>
              );
            })}
          </>)}
        </div>
      )}

      {/* ════ BOTTOM NAV ════ */}
      <div style={S.nav}>
        <Nav icon="🏠" label="Accueil"  target="dashboard"/>
        <Nav icon="🍽" label="Aliments" target="food"/>
        <Nav icon="＋" label="Ajouter"  target="add"/>
        <Nav icon="🏋" label="Sport"    target="sport"/>
        <Nav icon="⚙️" label="Gérer"    target="manage"/>
      </div>
    </div>
  );
}
