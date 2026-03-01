import { useState, useEffect, useMemo } from "react";

const CATEGORIES_INCOME = ["Salaire", "Freelance", "Investissement", "Cadeau", "Remboursement", "Autre"];
const CATEGORIES_EXPENSE = ["Logement", "Alimentation", "Transport", "Santé", "Loisirs", "Vêtements", "Abonnements", "Épargne", "Autre"];

const formatCurrency = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const formatDate = (d) => new Date(d).toLocaleDateString("fr-FR");
const todayStr = () => new Date().toISOString().split("T")[0];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

export default function BudgetApp() {
  const [transactions, setTransactions] = useState([]);
  const [view, setView] = useState("dashboard");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const [form, setForm] = useState({ type: "expense", amount: "", description: "", category: "Alimentation", date: todayStr() });
  const [formError, setFormError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ✅ localStorage (fonctionne hors ligne et persiste entre sessions)
  useEffect(() => {
    const saved = localStorage.getItem("budget_transactions");
    if (saved) setTransactions(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("budget_transactions", JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = () => {
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
      setFormError("Veuillez entrer un montant valide."); return;
    }
    if (!form.description.trim()) {
      setFormError("Veuillez ajouter une description."); return;
    }
    const t = { id: Date.now(), type: form.type, amount: parseFloat(form.amount), description: form.description.trim(), category: form.category, date: form.date };
    setTransactions(prev => [t, ...prev]);
    setForm({ type: "expense", amount: "", description: "", category: "Alimentation", date: todayStr() });
    setFormError("");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    setView("dashboard");
  };

  const deleteTransaction = (id) => {
    if (window.confirm("Supprimer ce mouvement ?")) setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const filtered = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
  }), [transactions, filterMonth, filterYear]);

  const yearFiltered = useMemo(() => transactions.filter(t => new Date(t.date).getFullYear() === filterYear), [transactions, filterYear]);

  const totalIncome  = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const yearIncome  = yearFiltered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const yearExpense = yearFiltered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const monthlyData = useMemo(() => Array.from({ length: 12 }, (_, m) => {
    const mTx = transactions.filter(t => new Date(t.date).getFullYear() === filterYear && new Date(t.date).getMonth() === m);
    const inc = mTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = mTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { month: MONTHS_FR[m], inc, exp, bal: inc - exp };
  }), [transactions, filterYear]);

  const catData = useMemo(() => {
    const map = {};
    filtered.filter(t => t.type === "expense").forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const exportCSV = () => {
    const headers = ["Date","Type","Catégorie","Description","Montant"];
    const rows = transactions.map(t => [t.date, t.type === "income" ? "Entrée" : "Sortie", t.category, `"${t.description}"`, t.amount.toFixed(2)]);
    const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `budget_${filterYear}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const years = [...new Set([filterYear, ...transactions.map(t => new Date(t.date).getFullYear())])].sort((a,b)=>b-a);

  // Styles
  const green="#22c55e", red="#ef4444", blue="#3b82f6";
  const bgCard="#1e293b", bgMain="#0f172a", textMain="#f1f5f9", textMuted="#94a3b8";

  const S = {
    app:     { minHeight:"100vh", background:bgMain, color:textMain, fontFamily:"'Segoe UI',sans-serif", maxWidth:480, margin:"0 auto", paddingBottom:80 },
    header:  { background:bgCard, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #334155" },
    nav:     { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:bgCard, display:"flex", borderTop:"1px solid #334155", zIndex:100 },
    navBtn:  (a) => ({ flex:1, padding:"12px 4px 8px", background:"none", border:"none", color:a?blue:textMuted, cursor:"pointer", fontSize:11, display:"flex", flexDirection:"column", alignItems:"center", gap:3, fontWeight:a?700:400 }),
    card:    { background:bgCard, borderRadius:12, padding:16, margin:"12px 16px" },
    balBox:  { background:"linear-gradient(135deg,#1d4ed8,#7c3aed)", borderRadius:16, padding:"20px 16px", margin:"12px 16px", textAlign:"center" },
    row:     { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #334155" },
    badge:   (t) => ({ fontSize:11, padding:"2px 8px", borderRadius:20, background:t==="income"?"#166534":"#7f1d1d", color:t==="income"?green:red, fontWeight:600 }),
    input:   { width:"100%", background:"#0f172a", border:"1px solid #334155", borderRadius:8, padding:"10px 12px", color:textMain, fontSize:15, boxSizing:"border-box", marginBottom:12 },
    select:  { width:"100%", background:"#0f172a", border:"1px solid #334155", borderRadius:8, padding:"10px 12px", color:textMain, fontSize:15, boxSizing:"border-box", marginBottom:12 },
    btn:     (c) => ({ width:"100%", padding:13, background:c, border:"none", borderRadius:10, color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", marginBottom:8 }),
    toggle:  { display:"flex", background:"#0f172a", borderRadius:10, padding:4, marginBottom:12 },
    tBtn:    (a,t) => ({ flex:1, padding:8, border:"none", borderRadius:8, background:a?(t==="income"?"#166534":"#7f1d1d"):"none", color:a?(t==="income"?green:red):textMuted, cursor:"pointer", fontWeight:a?700:400, fontSize:14 }),
    mSel:    { display:"flex", gap:8, padding:"8px 16px", overflowX:"auto" },
    mChip:   (a) => ({ padding:"6px 14px", borderRadius:20, border:"none", background:a?blue:bgCard, color:a?"#fff":textMuted, cursor:"pointer", whiteSpace:"nowrap", fontSize:13, fontWeight:a?700:400 }),
  };

  const Bar = ({ pct, color }) => (
    <div style={{ height:6, borderRadius:3, background:"#334155", overflow:"hidden", marginTop:4 }}>
      <div style={{ width:`${Math.min(pct,100)}%`, height:"100%", background:color, borderRadius:3, transition:"width 0.3s" }} />
    </div>
  );

  const Nav = ({ icon, label, target }) => (
    <button style={S.navBtn(view===target)} onClick={() => setView(target)}>
      <span style={{ fontSize:20 }}>{icon}</span>{label}
    </button>
  );

  const MonthSel = () => (
    <div style={S.mSel}>
      {MONTHS_FR.map((m,i) => <button key={i} style={S.mChip(filterMonth===i)} onClick={() => setFilterMonth(i)}>{m.slice(0,3)}</button>)}
    </div>
  );

  return (
    <div style={S.app}>
      {/* Header */}
      <div style={S.header}>
        <span style={{ fontSize:18, fontWeight:700 }}>💰 Mon Budget</span>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <select value={filterYear} onChange={e => setFilterYear(+e.target.value)}
            style={{ ...S.select, width:"auto", marginBottom:0, fontSize:13, padding:"4px 8px" }}>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
          <button onClick={exportCSV} style={{ background:"#334155", border:"none", borderRadius:8, padding:"5px 10px", color:textMain, cursor:"pointer", fontSize:12 }}>⬇ CSV</button>
        </div>
      </div>

      {/* DASHBOARD */}
      {view === "dashboard" && (<>
        <MonthSel />
        <div style={S.balBox}>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginBottom:4 }}>Solde — {MONTHS_FR[filterMonth]} {filterYear}</div>
          <div style={{ fontSize:36, fontWeight:800, color:"#fff" }}>{formatCurrency(balance)}</div>
          <div style={{ display:"flex", justifyContent:"center", gap:24, marginTop:12 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>Entrées</div>
              <div style={{ fontSize:18, color:"#86efac", fontWeight:700 }}>{formatCurrency(totalIncome)}</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>Sorties</div>
              <div style={{ fontSize:18, color:"#fca5a5", fontWeight:700 }}>{formatCurrency(totalExpense)}</div>
            </div>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontSize:13, color:textMuted, fontWeight:600, marginBottom:10 }}>📅 Résumé annuel {filterYear}</div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div><div style={{ fontSize:11, color:textMuted }}>Entrées</div><div style={{ fontSize:16, color:green, fontWeight:700 }}>{formatCurrency(yearIncome)}</div></div>
            <div><div style={{ fontSize:11, color:textMuted }}>Sorties</div><div style={{ fontSize:16, color:red, fontWeight:700 }}>{formatCurrency(yearExpense)}</div></div>
            <div><div style={{ fontSize:11, color:textMuted }}>Solde</div><div style={{ fontSize:16, color:yearIncome-yearExpense>=0?green:red, fontWeight:700 }}>{formatCurrency(yearIncome-yearExpense)}</div></div>
          </div>
        </div>

        {catData.length > 0 && (
          <div style={S.card}>
            <div style={{ fontSize:13, color:textMuted, fontWeight:600, marginBottom:10 }}>🏷 Top dépenses — {MONTHS_FR[filterMonth]}</div>
            {catData.slice(0,4).map(([cat,amt]) => (
              <div key={cat} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                  <span>{cat}</span><span style={{ color:red }}>{formatCurrency(amt)}</span>
                </div>
                <Bar pct={totalExpense>0?(amt/totalExpense)*100:0} color={red} />
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize:13, color:textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:1, margin:"16px 16px 4px" }}>Derniers mouvements</div>
        <div style={S.card}>
          {filtered.length === 0
            ? <div style={{ color:textMuted, textAlign:"center", padding:"20px 0" }}>Aucun mouvement ce mois-ci.<br/>Appuyez sur ➕ pour ajouter.</div>
            : filtered.slice(0,8).map(t => (
              <div key={t.id} style={S.row}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>{t.description}</div>
                  <div style={{ fontSize:12, color:textMuted }}>{formatDate(t.date)} · {t.category}</div>
                </div>
                <div style={{ textAlign:"right", marginLeft:12 }}>
                  <div style={{ fontWeight:700, color:t.type==="income"?green:red, fontSize:15 }}>
                    {t.type==="income"?"+":"−"}{formatCurrency(t.amount)}
                  </div>
                </div>
              </div>
            ))
          }
          {filtered.length > 8 && (
            <button onClick={() => setView("history")} style={{ width:"100%", background:"none", border:"none", color:blue, cursor:"pointer", padding:"8px 0", fontSize:13, marginTop:4 }}>
              Voir tous les {filtered.length} mouvements →
            </button>
          )}
        </div>
      </>)}

      {/* ADD */}
      {view === "add" && (
        <div style={{ padding:16 }}>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:20, marginTop:8 }}>➕ Nouveau mouvement</div>
          {saveSuccess && <div style={{ background:"#166534", borderRadius:10, padding:12, marginBottom:16, color:green, textAlign:"center", fontWeight:600 }}>✅ Mouvement enregistré !</div>}
          <div style={S.toggle}>
            <button style={S.tBtn(form.type==="expense","expense")} onClick={() => setForm(f=>({...f,type:"expense",category:"Alimentation"}))}>⬇ Sortie</button>
            <button style={S.tBtn(form.type==="income","income")} onClick={() => setForm(f=>({...f,type:"income",category:"Salaire"}))}>⬆ Entrée</button>
          </div>
          <label style={{ fontSize:13, color:textMuted }}>Date</label>
          <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={S.input} />
          <label style={{ fontSize:13, color:textMuted }}>Montant (€)</label>
          <input type="number" placeholder="0.00" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} style={S.input} min="0" step="0.01" />
          <label style={{ fontSize:13, color:textMuted }}>Description</label>
          <input type="text" placeholder="Ex: Courses Lidl" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={S.input} />
          <label style={{ fontSize:13, color:textMuted }}>Catégorie</label>
          <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={S.select}>
            {(form.type==="income"?CATEGORIES_INCOME:CATEGORIES_EXPENSE).map(c=><option key={c}>{c}</option>)}
          </select>
          {formError && <div style={{ color:red, fontSize:13, marginBottom:10 }}>{formError}</div>}
          <button style={S.btn(form.type==="income"?"#166534":"#7f1d1d")} onClick={addTransaction}>
            {form.type==="income"?"✅ Ajouter l'entrée":"✅ Ajouter la sortie"}
          </button>
        </div>
      )}

      {/* HISTORY */}
      {view === "history" && (<>
        <MonthSel />
        <div style={{ padding:"0 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"12px 0 4px" }}>
            <span style={{ fontSize:15, fontWeight:700 }}>{MONTHS_FR[filterMonth]} {filterYear}</span>
            <span style={{ fontSize:13, color:textMuted }}>{filtered.length} mouvement(s)</span>
          </div>
        </div>
        <div style={S.card}>
          {filtered.length === 0
            ? <div style={{ color:textMuted, textAlign:"center", padding:"20px 0" }}>Aucun mouvement ce mois.</div>
            : filtered.map(t => (
              <div key={t.id} style={{ ...S.row, gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>{t.description}</div>
                  <div style={{ fontSize:12, color:textMuted }}>{formatDate(t.date)} · <span style={S.badge(t.type)}>{t.category}</span></div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:700, color:t.type==="income"?green:red }}>
                    {t.type==="income"?"+":"−"}{formatCurrency(t.amount)}
                  </div>
                  <button onClick={() => deleteTransaction(t.id)} style={{ background:"none", border:"none", color:"#475569", cursor:"pointer", fontSize:12, marginTop:2 }}>🗑</button>
                </div>
              </div>
            ))
          }
        </div>
      </>)}

      {/* STATS */}
      {view === "stats" && (<>
        <div style={{ padding:"16px 16px 0", fontSize:18, fontWeight:700 }}>📊 Statistiques {filterYear}</div>
        <div style={S.card}>
          <div style={{ fontSize:13, color:textMuted, fontWeight:600, marginBottom:10 }}>Évolution mensuelle</div>
          {monthlyData.map((m,i) => (
            <div key={i} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:2 }}>
                <span style={{ color:textMuted, width:36 }}>{m.month.slice(0,3)}</span>
                <span style={{ color:green, flex:1, textAlign:"center" }}>{m.inc>0?formatCurrency(m.inc):"—"}</span>
                <span style={{ color:red, flex:1, textAlign:"center" }}>{m.exp>0?formatCurrency(m.exp):"—"}</span>
                <span style={{ color:m.bal>=0?green:red, flex:1, textAlign:"right" }}>{m.inc>0||m.exp>0?formatCurrency(m.bal):"—"}</span>
              </div>
              {m.exp>0 && <Bar pct={yearExpense>0?(m.exp/yearExpense)*100:0} color={red} />}
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:textMuted, marginTop:4 }}>
            <span style={{ width:36 }}></span>
            <span style={{ flex:1, textAlign:"center" }}>Entrées</span>
            <span style={{ flex:1, textAlign:"center" }}>Sorties</span>
            <span style={{ flex:1, textAlign:"right" }}>Solde</span>
          </div>
        </div>
        <div style={S.card}>
          <div style={{ fontSize:13, color:textMuted, fontWeight:600, marginBottom:10 }}>Dépenses par catégorie — {filterYear}</div>
          {(() => {
            const map = {};
            yearFiltered.filter(t=>t.type==="expense").forEach(t=>{map[t.category]=(map[t.category]||0)+t.amount;});
            const entries = Object.entries(map).sort((a,b)=>b[1]-a[1]);
            return entries.length===0
              ? <div style={{ color:textMuted }}>Aucune dépense.</div>
              : entries.map(([cat,amt]) => (
                <div key={cat} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                    <span>{cat}</span><span style={{ color:red }}>{formatCurrency(amt)}</span>
                  </div>
                  <Bar pct={yearExpense>0?(amt/yearExpense)*100:0} color={red} />
                </div>
              ));
          })()}
        </div>
      </>)}

      {/* Bottom Nav */}
      <div style={S.nav}>
        <Nav icon="🏠" label="Accueil" target="dashboard" />
        <Nav icon="➕" label="Ajouter" target="add" />
        <Nav icon="📋" label="Historique" target="history" />
        <Nav icon="📊" label="Stats" target="stats" />
      </div>
    </div>
  );
}
