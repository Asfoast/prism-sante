import { useState, useEffect, useMemo, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// THEME — Prism · Marine & Menthe (écosystème partagé Finance)
// ─────────────────────────────────────────────────────────────
const T = {
  bg:"#F6F8FA", surface:"#FFFFFF", header:"#0A2342",
  primary:"#0A2342",
  mint:"#3ECFB2", mintLight:"#E6FAF6", mintDark:"#2EB89E",
  orange:"#E8601C", orangeLight:"#FEF0E8",
  income:"#138A60", incomeLight:"#E8F7EF",
  expense:"#B83232", expenseLight:"#FDECEA",
  text:"#0A1929", muted:"#607080", border:"#D8E4EC",
  font:"'Segoe UI','Helvetica Neue',Helvetica,sans-serif",
};

// ─────────────────────────────────────────────────────────────
// DEFAULTS & HELPERS
// ─────────────────────────────────────────────────────────────
const DEFAULT_GOALS = { calories:2000, protein:150, carbs:200, fat:65 };
const MEALS = ["Petit-déjeuner","Déjeuner","Dîner","Collation"];
const MEAL_ICONS = { "Petit-déjeuner":"🌅","Déjeuner":"☀️","Dîner":"🌙","Collation":"🍎" };
const EXERCISE_TYPES = ["Force","Cardio","Souplesse","HIIT","Autre"];
const DAYS_FR = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const today  = () => new Date().toISOString().split("T")[0];
const fmtD   = d  => { try { return new Date(d+"T00:00:00").toLocaleDateString("fr-FR"); } catch { return d; } };
const fmtN   = n  => Math.round(n||0).toLocaleString("fr-FR");
const uid    = () => Date.now() + Math.random();

// ─────────────────────────────────────────────────────────────
// LOGO PRISM (shared with Finance)
// ─────────────────────────────────────────────────────────────
function PrismLogo({ size=32, variant="health" }) {
  const r = Math.round(size*0.28), cx=size/2;
  const top=size*0.15, bot=size*0.82, mid=size*0.55;
  const lx=size*0.18, rx=size*0.82;
  const accent = variant==="sport" ? T.orange : T.mint;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" style={{display:"block"}}>
      <rect width={size} height={size} rx={r} fill={T.header}/>
      <polygon points={`${cx},${top} ${rx},${bot} ${lx},${bot}`}
        fill="none" stroke={accent} strokeWidth={size*0.065} strokeLinejoin="round"/>
      <line x1={cx} y1={top} x2={cx} y2={mid} stroke="#fff" strokeWidth={size*0.04} strokeOpacity=".45"/>
      <line x1={cx} y1={mid} x2={lx+(cx-lx)*0.55} y2={bot} stroke={accent} strokeWidth={size*0.04} strokeOpacity=".8"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// RING PROGRESS
// ─────────────────────────────────────────────────────────────
function Ring({ val, max, color, size=56, label, sublabel }) {
  const r=20, circ=2*Math.PI*r;
  const pct = max>0 ? Math.min(val/max,1) : 0;
  const over = val>max && max>0;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
      <svg width={size} height={size} viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke={T.border} strokeWidth="4"/>
        <circle cx="24" cy="24" r={r} fill="none" stroke={over?"#E8601C":color}
          strokeWidth="4" strokeDasharray={circ}
          strokeDashoffset={circ*(1-pct)} strokeLinecap="round"
          transform="rotate(-90 24 24)" style={{transition:"stroke-dashoffset .4s"}}/>
        <text x="24" y="26" textAnchor="middle" fontSize="9" fontWeight="800"
          fill={over?"#E8601C":color} fontFamily={T.font}>{Math.round(pct*100)}%</text>
      </svg>
      <div style={{fontSize:10,fontWeight:700,color:T.text,textAlign:"center"}}>{label}</div>
      {sublabel && <div style={{fontSize:9,color:T.muted,textAlign:"center"}}>{sublabel}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const S = {
  app:   {minHeight:"100vh",background:T.bg,color:T.text,fontFamily:T.font,maxWidth:480,margin:"0 auto",paddingBottom:72},
  hdr:   {background:T.header,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:200},
  card:  {background:T.surface,borderRadius:14,padding:"13px 16px",margin:"10px 14px",border:`1px solid ${T.border}`,boxShadow:"0 1px 6px rgba(10,35,66,0.05)"},
  cf:    (m="10px 14px")=>({background:T.surface,borderRadius:14,padding:"13px 16px",margin:m,border:`1px solid ${T.border}`}),
  row:   {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${T.border}`},
  rowL:  {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0"},
  inp:   {width:"100%",background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:9,padding:"9px 12px",color:T.text,fontSize:14,fontFamily:T.font,boxSizing:"border-box",marginBottom:9,outline:"none"},
  sel:   {width:"100%",background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:9,padding:"9px 12px",color:T.text,fontSize:14,fontFamily:T.font,boxSizing:"border-box",marginBottom:9,outline:"none"},
  btn:   (bg,fg="#fff")=>({width:"100%",padding:"11px",background:bg,border:"none",borderRadius:10,color:fg,fontSize:14,fontWeight:700,fontFamily:T.font,cursor:"pointer",marginBottom:7}),
  smBtn: (bg,fg="#fff",o=false)=>({padding:"5px 11px",background:o?"transparent":bg,border:o?`1.5px solid ${bg}`:"none",borderRadius:8,color:o?bg:fg,fontSize:12,fontWeight:600,fontFamily:T.font,cursor:"pointer",flexShrink:0}),
  tog:   {display:"flex",background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:10,padding:3,marginBottom:10},
  tBtn:  (a,c)=>({flex:1,padding:"7px",border:"none",borderRadius:8,fontFamily:T.font,cursor:"pointer",fontWeight:a?700:400,fontSize:13,background:a?c+"22":"transparent",color:a?c:T.muted,transition:"all .15s"}),
  tab:   (a,c=T.mint)=>({flex:1,padding:"7px",border:"none",borderRadius:8,fontFamily:T.font,cursor:"pointer",fontWeight:a?700:400,fontSize:13,background:a?c:"transparent",color:a?"#fff":T.muted}),
  nav:   {position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:T.surface,display:"flex",borderTop:`1px solid ${T.border}`,zIndex:100,boxShadow:"0 -2px 12px rgba(10,35,66,0.08)"},
  navB:  (a,c)=>({flex:1,padding:"10px 2px 8px",background:"none",border:"none",fontFamily:T.font,color:a?c:T.muted,cursor:"pointer",fontSize:9,display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontWeight:a?700:500,borderTop:a?`2.5px solid ${c}`:"2.5px solid transparent"}),
  lbl:   {fontSize:11,color:T.muted,fontWeight:600,display:"block",marginBottom:3,letterSpacing:.3},
  sec:   {fontSize:10,color:T.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"},
  mSel:  {display:"flex",gap:6,padding:"8px 14px",overflowX:"auto",scrollbarWidth:"none"},
  mChip: (a)=>({padding:"5px 12px",borderRadius:20,border:`1px solid ${a?T.mint:T.border}`,background:a?T.mint:T.surface,color:a?"#fff":T.muted,cursor:"pointer",whiteSpace:"nowrap",fontSize:12,fontWeight:a?700:400}),
};
const Bar=({pct,color,h=5})=>(
  <div style={{height:h,borderRadius:3,background:T.border,overflow:"hidden",marginTop:3}}>
    <div style={{width:`${Math.min(pct||0,100)}%`,height:"100%",background:color,borderRadius:3,transition:"width .3s"}}/>
  </div>
);

// ─────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────
export default function PrismHealth() {
  // ── Data state ────────────────────────────────────────────
  const [foodEntries,  setFoodEntries]  = useState([]); // daily food log
  const [recipes,      setRecipes]      = useState([]); // recipe library
  const [goals,        setGoals]        = useState(DEFAULT_GOALS); // daily nutrition goals
  const [workouts,     setWorkouts]     = useState([]); // workout sessions
  const [programs,     setPrograms]     = useState([]); // training programs
  const [perfGoals,    setPerfGoals]    = useState([]); // fitness goals
  const [loaded,       setLoaded]       = useState(false);

  // ── UI state ──────────────────────────────────────────────
  const [view,      setView]      = useState("dashboard");
  const [foodTab,   setFoodTab]   = useState("journal");   // journal | recettes
  const [sportTab,  setSportTab]  = useState("journal");   // journal | programmes
  const [manageTab, setManageTab] = useState("goals");     // goals | programs | objectives
  const [selDate,   setSelDate]   = useState(today());
  const [selMonth,  setSelMonth]  = useState(new Date().getMonth());
  const [selYear,   setSelYear]   = useState(new Date().getFullYear());

  // ── Food form ─────────────────────────────────────────────
  const emptyFood = {name:"",meal:"Petit-déjeuner",calories:"",protein:"",carbs:"",fat:"",qty:"1",date:today(),fromRecipe:false};
  const [fForm,  setFForm]  = useState(emptyFood);
  const [fErr,   setFErr]   = useState("");
  const [addCtx, setAddCtx] = useState("food"); // "food" | "sport"

  // ── Recipe form ───────────────────────────────────────────
  const emptyRec = {name:"",calories:"",protein:"",carbs:"",fat:"",servings:"1",ingredients:"",notes:""};
  const [rForm,    setRForm]    = useState(emptyRec);
  const [showRForm,setShowRForm]= useState(false);
  const [editRId,  setEditRId]  = useState(null);

  // ── Workout form ──────────────────────────────────────────
  const emptyWkt = {name:"",date:today(),notes:"",duration:"",exercises:[]};
  const emptyEx  = {name:"",type:"Force",sets:[{reps:"",weight:"",duration:"",distance:"",unit:"kg"}]};
  const [wForm,     setWForm]     = useState(emptyWkt);
  const [showWForm, setShowWForm] = useState(false);
  const [editWId,   setEditWId]   = useState(null);
  const [curEx,     setCurEx]     = useState(emptyEx);
  const [showExF,   setShowExF]   = useState(false);

  // ── Program form ──────────────────────────────────────────
  const emptyProg = {name:"",days:DAYS_FR.map(d=>({day:d,exercises:[]}))};
  const [pForm,     setPForm]     = useState(emptyProg);
  const [showPForm, setShowPForm] = useState(false);
  const [editPId,   setEditPId]   = useState(null);
  const [progExInput, setProgExInput] = useState({dayIdx:0,name:"",sets:"3",reps:"10",weight:""});

  // ── Goal form ─────────────────────────────────────────────
  const [gForm, setGForm] = useState(DEFAULT_GOALS);
  const [pgForm,setPgForm]= useState({name:"",target:"",current:"",unit:"kg",type:"Poids"});
  const [showPgF,setShowPgF]=useState(false);

  // ─────────────────────────────────────────────────────────
  // LOCALSTORAGE
  // ─────────────────────────────────────────────────────────
  useEffect(()=>{
    const g=k=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch{return null;}};
    setFoodEntries(g("ph_food")||[]);
    setRecipes(    g("ph_recipes")||[]);
    setGoals(      g("ph_goals")||DEFAULT_GOALS);
    setWorkouts(   g("ph_workouts")||[]);
    setPrograms(   g("ph_programs")||[]);
    setPerfGoals(  g("ph_perfgoals")||[]);
    setLoaded(true);
  },[]);
  useEffect(()=>{ if(loaded) localStorage.setItem("ph_food",      JSON.stringify(foodEntries)); },[foodEntries,loaded]);
  useEffect(()=>{ if(loaded) localStorage.setItem("ph_recipes",   JSON.stringify(recipes));    },[recipes,loaded]);
  useEffect(()=>{ if(loaded) localStorage.setItem("ph_goals",     JSON.stringify(goals));      },[goals,loaded]);
  useEffect(()=>{ if(loaded) localStorage.setItem("ph_workouts",  JSON.stringify(workouts));   },[workouts,loaded]);
  useEffect(()=>{ if(loaded) localStorage.setItem("ph_programs",  JSON.stringify(programs));   },[programs,loaded]);
  useEffect(()=>{ if(loaded) localStorage.setItem("ph_perfgoals", JSON.stringify(perfGoals));  },[perfGoals,loaded]);

  // ─────────────────────────────────────────────────────────
  // DERIVED DATA
  // ─────────────────────────────────────────────────────────
  const dayFood = useMemo(()=>foodEntries.filter(e=>e.date===selDate),[foodEntries,selDate]);

  const dayTotals = useMemo(()=>({
    calories: dayFood.reduce((s,e)=>s+(e.calories||0)*( e.qty||1),0),
    protein:  dayFood.reduce((s,e)=>s+(e.protein ||0)*(e.qty||1),0),
    carbs:    dayFood.reduce((s,e)=>s+(e.carbs   ||0)*(e.qty||1),0),
    fat:      dayFood.reduce((s,e)=>s+(e.fat     ||0)*(e.qty||1),0),
  }),[dayFood]);

  const todayWorkout = useMemo(()=>workouts.filter(w=>w.date===today()),[workouts]);

  const weekFood = useMemo(()=>{
    const d=new Date(); d.setDate(d.getDate()-6);
    return foodEntries.filter(e=>new Date(e.date)>=d);
  },[foodEntries]);

  const weekCalAvg = useMemo(()=>{
    if(!weekFood.length) return 0;
    const byDay={};
    weekFood.forEach(e=>{ byDay[e.date]=(byDay[e.date]||0)+(e.calories||0)*(e.qty||1); });
    const days=Object.values(byDay);
    return days.reduce((s,v)=>s+v,0)/days.length;
  },[weekFood]);

  const monthWorkouts = useMemo(()=>workouts.filter(w=>{
    const d=new Date(w.date); return d.getMonth()===selMonth&&d.getFullYear()===selYear;
  }),[workouts,selMonth,selYear]);

  // Performance history for an exercise name
  const perfHistory = exName => workouts
    .flatMap(w=>w.exercises.filter(e=>e.name.toLowerCase()===exName.toLowerCase()).map(e=>({date:w.date,sets:e.sets})))
    .sort((a,b)=>new Date(b.date)-new Date(a.date))
    .slice(0,10);

  // ─────────────────────────────────────────────────────────
  // CRUD — FOOD ENTRIES
  // ─────────────────────────────────────────────────────────
  const submitFood = () => {
    if (!fForm.name.trim()) { setFErr("Nom requis."); return; }
    const cal = parseFloat(fForm.calories)||0;
    if (cal<0) { setFErr("Calories invalides."); return; }
    setFoodEntries(prev=>[{
      id:uid(), name:fForm.name.trim(), meal:fForm.meal,
      calories:cal, protein:parseFloat(fForm.protein)||0,
      carbs:parseFloat(fForm.carbs)||0, fat:parseFloat(fForm.fat)||0,
      qty:parseFloat(fForm.qty)||1, date:fForm.date,
    },...prev]);
    setFForm(emptyFood); setFErr(""); setView("food");
  };

  const deleteFood = id => window.confirm("Supprimer ?")&&setFoodEntries(p=>p.filter(e=>e.id!==id));

  const addFromRecipe = rec => {
    setFForm({...emptyFood,name:rec.name,calories:rec.calories,protein:rec.protein,carbs:rec.carbs,fat:rec.fat,fromRecipe:true,date:selDate});
    setAddCtx("food"); setView("add");
  };

  // ─────────────────────────────────────────────────────────
  // CRUD — RECIPES
  // ─────────────────────────────────────────────────────────
  const submitRecipe = () => {
    if (!rForm.name.trim()) return;
    const item = {...rForm, id:editRId||uid(), name:rForm.name.trim(),
      calories:parseFloat(rForm.calories)||0, protein:parseFloat(rForm.protein)||0,
      carbs:parseFloat(rForm.carbs)||0, fat:parseFloat(rForm.fat)||0,
      servings:parseFloat(rForm.servings)||1};
    if (editRId) setRecipes(p=>p.map(r=>r.id===editRId?item:r));
    else setRecipes(p=>[item,...p]);
    setRForm(emptyRec); setShowRForm(false); setEditRId(null);
  };
  const deleteRecipe = id=>window.confirm("Supprimer cette recette ?")&&setRecipes(p=>p.filter(r=>r.id!==id));
  const startEditRec = r=>{ setRForm({...r}); setEditRId(r.id); setShowRForm(true); };

  // ─────────────────────────────────────────────────────────
  // CRUD — WORKOUTS
  // ─────────────────────────────────────────────────────────
  const addExToWorkout = () => {
    if (!curEx.name.trim()) return;
    setWForm(f=>({...f,exercises:[...f.exercises,{...curEx,id:uid()}]}));
    setCurEx(emptyEx); setShowExF(false);
  };

  const addSetToEx = () => setCurEx(f=>({...f,sets:[...f.sets,{reps:"",weight:"",duration:"",distance:"",unit:"kg"}]}));
  const updateSet = (idx,field,val) => setCurEx(f=>({...f,sets:f.sets.map((s,i)=>i===idx?{...s,[field]:val}:s)}));
  const removeSet = idx => setCurEx(f=>({...f,sets:f.sets.filter((_,i)=>i!==idx)}));
  const removeEx  = idx => setWForm(f=>({...f,exercises:f.exercises.filter((_,i)=>i!==idx)}));

  const submitWorkout = () => {
    if (!wForm.name.trim()) return;
    const item={...wForm,id:editWId||uid(),duration:parseFloat(wForm.duration)||0};
    if (editWId) setWorkouts(p=>p.map(w=>w.id===editWId?item:w));
    else setWorkouts(p=>[item,...p]);
    setWForm(emptyWkt); setShowWForm(false); setEditWId(null); setView("sport");
  };

  const deleteWorkout = id=>window.confirm("Supprimer cette séance ?")&&setWorkouts(p=>p.filter(w=>w.id!==id));
  const startEditWkt  = w=>{ setWForm({...w}); setEditWId(w.id); setShowWForm(true); setView("add"); setAddCtx("sport"); };

  const applyProgram = (prog,date) => {
    const d=new Date(date); const dayIdx=(d.getDay()+6)%7;
    const dayPlan=prog.days[dayIdx];
    if(!dayPlan||!dayPlan.exercises.length){alert("Aucun exercice prévu ce jour dans ce programme.");return;}
    setWForm({...emptyWkt,name:`${prog.name} — ${dayPlan.day}`,date,exercises:dayPlan.exercises.map(e=>({...e,id:uid(),sets:Array.from({length:parseInt(e.sets)||3},()=>({reps:e.reps||"",weight:e.weight||"",duration:"",distance:"",unit:"kg"}))}))});
    setShowWForm(true); setAddCtx("sport"); setView("add");
  };

  // ─────────────────────────────────────────────────────────
  // CRUD — PROGRAMS
  // ─────────────────────────────────────────────────────────
  const addExToDay = () => {
    if (!progExInput.name.trim()) return;
    setPForm(f=>({...f,days:f.days.map((d,i)=>i===progExInput.dayIdx?{...d,exercises:[...d.exercises,{id:uid(),name:progExInput.name.trim(),type:"Force",sets:progExInput.sets,reps:progExInput.reps,weight:progExInput.weight}]}:d)}));
    setProgExInput(p=>({...p,name:"",weight:""}));
  };
  const removeExFromDay=(dayIdx,exIdx)=>setPForm(f=>({...f,days:f.days.map((d,i)=>i===dayIdx?{...d,exercises:d.exercises.filter((_,j)=>j!==exIdx)}:d)}));

  const submitProgram = () => {
    if (!pForm.name.trim()) return;
    const item={...pForm,id:editPId||uid()};
    if (editPId) setPrograms(p=>p.map(pr=>pr.id===editPId?item:pr));
    else setPrograms(p=>[item,...p]);
    setPForm(emptyProg); setShowPForm(false); setEditPId(null);
  };
  const deleteProgram=id=>window.confirm("Supprimer ce programme ?")&&setPrograms(p=>p.filter(pr=>pr.id!==id));

  // ─────────────────────────────────────────────────────────
  // CRUD — PERF GOALS
  // ─────────────────────────────────────────────────────────
  const submitPerfGoal=()=>{
    if(!pgForm.name.trim()||!pgForm.target)return;
    const item={...pgForm,id:uid(),target:parseFloat(pgForm.target),current:parseFloat(pgForm.current)||0,createdAt:today()};
    setPerfGoals(p=>[item,...p]);
    setPgForm({name:"",target:"",current:"",unit:"kg",type:"Poids"}); setShowPgF(false);
  };
  const updateGoalProgress=(id,val)=>setPerfGoals(p=>p.map(g=>g.id===id?{...g,current:parseFloat(val)||0}:g));
  const deletePerfGoal=id=>setPerfGoals(p=>p.filter(g=>g.id!==id));

  // ─────────────────────────────────────────────────────────
  // COMMON COMPONENTS
  // ─────────────────────────────────────────────────────────
  const Nav=({icon,label,target,color})=>(
    <button style={S.navB(view===target,color||T.mint)} onClick={()=>setView(target)}>
      <span style={{fontSize:17,lineHeight:1}}>{icon}</span>{label}
    </button>
  );

  const DatePicker=()=>(
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 14px"}}>
      <button onClick={()=>{const d=new Date(selDate);d.setDate(d.getDate()-1);setSelDate(d.toISOString().split("T")[0]);}}
        style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:14,color:T.muted}}>‹</button>
      <input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)}
        style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:9,padding:"6px 10px",color:T.text,fontSize:13,fontFamily:T.font,textAlign:"center"}}/>
      <button onClick={()=>{const d=new Date(selDate);d.setDate(d.getDate()+1);if(d<=new Date())setSelDate(d.toISOString().split("T")[0]);}}
        style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:14,color:T.muted}}>›</button>
    </div>
  );

  const MacroRow=({label,val,goal,color})=>{
    const pct=goal>0?Math.min((val/goal)*100,100):0;
    return(
      <div style={{marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
          <span style={{color:T.muted,fontWeight:600}}>{label}</span>
          <span style={{fontWeight:700,color}}>{fmtN(val)}g <span style={{color:T.muted,fontWeight:400}}>/ {fmtN(goal)}g</span></span>
        </div>
        <Bar pct={pct} color={color} h={6}/>
      </div>
    );
  };

  if (!loaded) return (
    <div style={{...S.app,display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"}}>
      <div style={{textAlign:"center"}}><PrismLogo size={52}/><div style={{marginTop:12,color:T.muted,fontSize:13}}>Chargement…</div></div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // ════════════════════════ RENDER ════════════════════════
  // ─────────────────────────────────────────────────────────
  return (
    <div style={S.app}>

      {/* ════ HEADER ════ */}
      <div style={S.hdr}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <PrismLogo size={30} variant={view==="sport"?"sport":"health"}/>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:"#fff",letterSpacing:.2,lineHeight:1.2}}>Prism</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",letterSpacing:1.5,textTransform:"uppercase"}}>
              {view==="sport"||(view==="add"&&addCtx==="sport") ? "Sport" : "Santé"}
            </div>
          </div>
        </div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",fontWeight:500}}>
          {fmtD(selDate)}
        </div>
      </div>

      {/* ════════════════════════════════════════
          DASHBOARD
      ════════════════════════════════════════ */}
      {view==="dashboard" && (<>
        <DatePicker/>

        {/* Calories du jour */}
        <div style={{...S.card,background:`linear-gradient(135deg,${T.header},#1a4a7a)`}}>
          <div style={{...S.sec,color:"rgba(255,255,255,0.4)",marginBottom:10}}>Objectif calorique</div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <Ring val={dayTotals.calories} max={goals.calories} color={T.mint} size={72}
              label={`${fmtN(dayTotals.calories)} kcal`} sublabel={`/ ${fmtN(goals.calories)}`}/>
            <div style={{flex:1}}>
              {[
                {l:"Protéines", v:dayTotals.protein, g:goals.protein, c:"#60E8C8"},
                {l:"Glucides",  v:dayTotals.carbs,   g:goals.carbs,   c:"#F5C518"},
                {l:"Lipides",   v:dayTotals.fat,     g:goals.fat,     c:"#F87C52"},
              ].map(({l,v,g,c})=>(
                <div key={l} style={{marginBottom:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"rgba(255,255,255,0.7)",marginBottom:2}}>
                    <span>{l}</span><span style={{fontWeight:700}}>{fmtN(v)}g/{fmtN(g)}g</span>
                  </div>
                  <Bar pct={g>0?(v/g)*100:0} color={c}/>
                </div>
              ))}
            </div>
          </div>
          {/* Reste */}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:12,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.1)"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",marginBottom:2}}>CONSOMMÉ</div>
              <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>{fmtN(dayTotals.calories)}</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",marginBottom:2}}>RESTANT</div>
              <div style={{fontSize:14,fontWeight:800,color:dayTotals.calories>goals.calories?"#F87C52":"#60E8C8"}}>
                {fmtN(Math.max(goals.calories-dayTotals.calories,0))}
              </div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",marginBottom:2}}>MOY. 7J</div>
              <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>{fmtN(weekCalAvg)}</div>
            </div>
          </div>
        </div>

        {/* Repas du jour */}
        {dayFood.length>0 && (
          <div style={S.card}>
            <div style={{...S.sec,marginBottom:10}}>Repas — {fmtD(selDate)}</div>
            {MEALS.map(meal=>{
              const items=dayFood.filter(e=>e.meal===meal);
              if(!items.length)return null;
              const mCal=items.reduce((s,e)=>s+(e.calories||0)*(e.qty||1),0);
              return(
                <div key={meal} style={{marginBottom:8}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.muted,marginBottom:4}}>
                    {MEAL_ICONS[meal]} {meal} <span style={{color:T.mint,fontWeight:800}}>{fmtN(mCal)} kcal</span>
                  </div>
                  {items.map(e=>(
                    <div key={e.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0 3px 16px",color:T.text}}>
                      <span>{e.qty>1?`${e.qty}× `:""}{e.name}</span>
                      <span style={{color:T.muted}}>{fmtN((e.calories||0)*(e.qty||1))} kcal</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Séances du jour */}
        {todayWorkout.length>0 && (
          <div style={S.card}>
            <div style={{...S.sec,color:T.orange,marginBottom:10}}>🏋 Séance aujourd'hui</div>
            {todayWorkout.map(w=>(
              <div key={w.id} style={S.rowL}>
                <div>
                  <div style={{fontSize:14,fontWeight:700}}>{w.name}</div>
                  <div style={{fontSize:11,color:T.muted}}>{w.exercises.length} exercice(s){w.duration?` · ${w.duration} min`:""}</div>
                </div>
                <span style={{fontSize:11,fontWeight:600,color:T.orange,background:T.orangeLight,padding:"3px 10px",borderRadius:20}}>✓ Fait</span>
              </div>
            ))}
          </div>
        )}

        {/* Objectifs progression */}
        {perfGoals.length>0 && (
          <div style={S.card}>
            <div style={{...S.sec,marginBottom:10}}>Objectifs</div>
            {perfGoals.slice(0,3).map(g=>{
              const pct=g.target>0?(g.current/g.target)*100:0;
              return(
                <div key={g.id} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:2}}>
                    <span style={{fontWeight:600}}>{g.name}</span>
                    <span style={{color:pct>=100?T.income:T.orange,fontWeight:700}}>{g.current}/{g.target} {g.unit}</span>
                  </div>
                  <Bar pct={pct} color={pct>=100?T.income:T.orange}/>
                </div>
              );
            })}
          </div>
        )}

        {/* Shortcuts */}
        <div style={{display:"flex",gap:10,padding:"0 14px 10px"}}>
          <button onClick={()=>{setAddCtx("food");setView("add");}} style={{flex:1,...S.btn(T.mint,T.primary),marginBottom:0}}>🍽 Ajouter un repas</button>
          <button onClick={()=>{setAddCtx("sport");setView("add");}} style={{flex:1,...S.btn(T.orange),marginBottom:0}}>🏋 Nouvelle séance</button>
        </div>
      </>)}

      {/* ════════════════════════════════════════
          ALIMENTATION
      ════════════════════════════════════════ */}
      {view==="food" && (<>
        <div style={{...S.tog,margin:"10px 14px 0",marginBottom:0}}>
          <button style={S.tab(foodTab==="journal",T.mint)} onClick={()=>setFoodTab("journal")}>📋 Journal</button>
          <button style={S.tab(foodTab==="recettes",T.mint)} onClick={()=>setFoodTab("recettes")}>📖 Recettes</button>
        </div>

        {/* ── Journal alimentaire ── */}
        {foodTab==="journal" && (<>
          <DatePicker/>
          {/* Résumé macros */}
          <div style={{...S.card,padding:"10px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:13,fontWeight:800}}>{fmtN(dayTotals.calories)} kcal</span>
              <span style={{fontSize:11,color:T.muted}}>/ {fmtN(goals.calories)} kcal</span>
            </div>
            <Bar pct={goals.calories>0?(dayTotals.calories/goals.calories)*100:0} color={T.mint} h={7}/>
            <div style={{display:"flex",gap:6,marginTop:10}}>
              {[
                {l:"Prot.",c:"#3ECFB2",v:dayTotals.protein,g:goals.protein},
                {l:"Gluc.", c:"#F5C518",v:dayTotals.carbs,  g:goals.carbs},
                {l:"Lip.",  c:"#F87C52",v:dayTotals.fat,    g:goals.fat},
              ].map(({l,v,g,c})=>(
                <div key={l} style={{flex:1,textAlign:"center",background:T.bg,borderRadius:9,padding:"7px 4px"}}>
                  <div style={{fontSize:9,color:T.muted,fontWeight:700,marginBottom:2}}>{l}</div>
                  <div style={{fontSize:12,fontWeight:800,color:c}}>{fmtN(v)}g</div>
                  <div style={{fontSize:9,color:T.muted}}>/{fmtN(g)}g</div>
                </div>
              ))}
            </div>
          </div>

          {/* Entrées par repas */}
          {MEALS.map(meal=>{
            const items=dayFood.filter(e=>e.meal===meal);
            const mCal=items.reduce((s,e)=>s+(e.calories||0)*(e.qty||1),0);
            return(
              <div key={meal} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom: items.length?8:0}}>
                  <span style={{fontSize:13,fontWeight:700}}>{MEAL_ICONS[meal]} {meal}</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {items.length>0&&<span style={{fontSize:12,color:T.mint,fontWeight:700}}>{fmtN(mCal)} kcal</span>}
                    <button onClick={()=>{setFForm({...emptyFood,meal,date:selDate});setAddCtx("food");setView("add");}}
                      style={{...S.smBtn(T.mint,T.primary),padding:"3px 10px",fontSize:11}}>+ Ajouter</button>
                  </div>
                </div>
                {items.map((e,i,arr)=>(
                  <div key={e.id} style={i===arr.length-1?S.rowL:S.row}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600}}>{e.qty>1?`${e.qty}× `:""}{e.name}</div>
                      <div style={{fontSize:10,color:T.muted}}>
                        {fmtN((e.calories||0)*(e.qty||1))} kcal
                        {e.protein>0?` · P:${fmtN((e.protein||0)*(e.qty||1))}g`:""}
                        {e.carbs>0?` · G:${fmtN((e.carbs||0)*(e.qty||1))}g`:""}
                        {e.fat>0?` · L:${fmtN((e.fat||0)*(e.qty||1))}g`:""}
                      </div>
                    </div>
                    <button onClick={()=>deleteFood(e.id)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:13,padding:"0 4px"}}>🗑</button>
                  </div>
                ))}
                {!items.length&&<div style={{fontSize:12,color:T.muted,padding:"4px 0"}}>Aucun aliment</div>}
              </div>
            );
          })}
        </>)}

        {/* ── Bibliothèque de recettes ── */}
        {foodTab==="recettes" && (<>
          <div style={{padding:"8px 14px 0"}}>
            <button onClick={()=>{setRForm(emptyRec);setEditRId(null);setShowRForm(!showRForm);}}
              style={S.btn(showRForm?T.muted:T.primary)}>
              {showRForm?"✕ Annuler":"＋ Nouvelle recette"}
            </button>
          </div>

          {showRForm && (
            <div style={{...S.cf("0 14px 10px"),border:`1.5px solid ${T.mint}`,boxShadow:`0 0 0 3px ${T.mintLight}`}}>
              <div style={{fontSize:13,fontWeight:800,marginBottom:10}}>{editRId?"Modifier":"Nouvelle recette"}</div>
              <label style={S.lbl}>Nom de la recette</label>
              <input placeholder="Ex : Omelette fromage" value={rForm.name} onChange={e=>setRForm(f=>({...f,name:e.target.value}))} style={S.inp}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[["Calories (kcal)","calories"],["Protéines (g)","protein"],["Glucides (g)","carbs"],["Lipides (g)","fat"]].map(([l,k])=>(
                  <div key={k}><label style={S.lbl}>{l}</label>
                  <input type="number" min="0" value={rForm[k]} onChange={e=>setRForm(f=>({...f,[k]:e.target.value}))} style={{...S.inp,marginBottom:0}}/></div>
                ))}
              </div>
              <label style={{...S.lbl,marginTop:9}}>Portions</label>
              <input type="number" min="1" value={rForm.servings} onChange={e=>setRForm(f=>({...f,servings:e.target.value}))} style={S.inp}/>
              <label style={S.lbl}>Ingrédients (optionnel)</label>
              <textarea placeholder="1 œuf, 30g fromage…" value={rForm.ingredients}
                onChange={e=>setRForm(f=>({...f,ingredients:e.target.value}))}
                style={{...S.inp,height:64,resize:"vertical",fontFamily:T.font}}/>
              <button style={S.btn(T.mint,T.primary)} onClick={submitRecipe}>✅ {editRId?"Mettre à jour":"Ajouter la recette"}</button>
            </div>
          )}

          {recipes.length===0
            ? <div style={{...S.card,textAlign:"center",color:T.muted,padding:"28px 16px",fontSize:13}}>
                Aucune recette.<br/>Créez votre bibliothèque personnelle.
              </div>
            : recipes.map(r=>(
              <div key={r.id} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>{r.name}</div>
                    <div style={{fontSize:11,color:T.muted}}>
                      {fmtN(r.calories)} kcal · P:{fmtN(r.protein)}g · G:{fmtN(r.carbs)}g · L:{fmtN(r.fat)}g
                    </div>
                    {r.ingredients&&<div style={{fontSize:11,color:T.muted,marginTop:3}}>{r.ingredients}</div>}
                  </div>
                  <div style={{display:"flex",gap:5,flexShrink:0,marginLeft:8}}>
                    <button onClick={()=>addFromRecipe(r)} style={S.smBtn(T.mint,T.primary)}>+ Journal</button>
                    <button onClick={()=>startEditRec(r)} style={S.smBtn(T.primary)}>✏️</button>
                    <button onClick={()=>deleteRecipe(r.id)} style={S.smBtn(T.expense)}>🗑</button>
                  </div>
                </div>
              </div>
            ))
          }
        </>)}
      </>)}

      {/* ════════════════════════════════════════
          AJOUTER (food ou sport)
      ════════════════════════════════════════ */}
      {view==="add" && (<>
        {/* Toggle food / sport */}
        <div style={{...S.tog,margin:"10px 14px 0"}}>
          <button style={S.tBtn(addCtx==="food",T.mint)} onClick={()=>setAddCtx("food")}>🍽 Alimentation</button>
          <button style={S.tBtn(addCtx==="sport",T.orange)} onClick={()=>setAddCtx("sport")}>🏋 Sport</button>
        </div>

        {/* ── Formulaire aliment ── */}
        {addCtx==="food" && (
          <div style={{padding:"0 14px 14px"}}>
            <div style={{fontSize:16,fontWeight:800,marginBottom:12,marginTop:8}}>Ajouter un aliment</div>
            <label style={S.lbl}>Repas</label>
            <select value={fForm.meal} onChange={e=>setFForm(f=>({...f,meal:e.target.value}))} style={S.sel}>
              {MEALS.map(m=><option key={m}>{m}</option>)}
            </select>
            <label style={S.lbl}>Date</label>
            <input type="date" value={fForm.date} onChange={e=>setFForm(f=>({...f,date:e.target.value}))} style={S.inp}/>
            <label style={S.lbl}>Nom de l'aliment</label>
            <input placeholder="Ex : Yaourt nature 0%" value={fForm.name} onChange={e=>setFForm(f=>({...f,name:e.target.value}))} style={S.inp}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div><label style={S.lbl}>Calories (kcal)</label><input type="number" min="0" value={fForm.calories} onChange={e=>setFForm(f=>({...f,calories:e.target.value}))} style={{...S.inp,marginBottom:0}}/></div>
              <div><label style={S.lbl}>Quantité / portions</label><input type="number" min="0.1" step="0.1" value={fForm.qty} onChange={e=>setFForm(f=>({...f,qty:e.target.value}))} style={{...S.inp,marginBottom:0}}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:9}}>
              {[["Prot. (g)","protein"],["Gluc. (g)","carbs"],["Lip. (g)","fat"]].map(([l,k])=>(
                <div key={k}><label style={S.lbl}>{l}</label><input type="number" min="0" step="0.1" value={fForm[k]} onChange={e=>setFForm(f=>({...f,[k]:e.target.value}))} style={{...S.inp,marginBottom:0}}/></div>
              ))}
            </div>
            {fErr&&<div style={{color:T.expense,fontSize:12,padding:"6px 10px",background:T.expenseLight,borderRadius:8,marginTop:8,fontWeight:600}}>{fErr}</div>}
            <div style={{marginTop:12}}>
              <button style={S.btn(T.mint,T.primary)} onClick={submitFood}>✅ Enregistrer</button>
              <button style={{...S.btn(T.surface,T.muted),border:`1px solid ${T.border}`}} onClick={()=>{setFForm(emptyFood);setFErr("");}}>Effacer</button>
            </div>

            {/* Raccourcis recettes */}
            {recipes.length>0&&(<>
              <div style={{...S.sec,margin:"12px 0 8px"}}>Depuis les recettes</div>
              {recipes.slice(0,4).map(r=>(
                <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:T.bg,borderRadius:9,marginBottom:6}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:600}}>{r.name}</div>
                    <div style={{fontSize:10,color:T.muted}}>{fmtN(r.calories)} kcal</div>
                  </div>
                  <button onClick={()=>{ setFForm(f=>({...f,name:r.name,calories:r.calories,protein:r.protein,carbs:r.carbs,fat:r.fat,fromRecipe:true})); }}
                    style={S.smBtn(T.mint,T.primary)}>Utiliser</button>
                </div>
              ))}
            </>)}
          </div>
        )}

        {/* ── Formulaire séance ── */}
        {addCtx==="sport" && (
          <div style={{padding:"0 14px 14px"}}>
            <div style={{fontSize:16,fontWeight:800,marginBottom:12,marginTop:8}}>{editWId?"Modifier la séance":"Nouvelle séance"}</div>

            <label style={S.lbl}>Nom de la séance</label>
            <input placeholder="Ex : Push Day A" value={wForm.name} onChange={e=>setWForm(f=>({...f,name:e.target.value}))} style={S.inp}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div><label style={S.lbl}>Date</label><input type="date" value={wForm.date} onChange={e=>setWForm(f=>({...f,date:e.target.value}))} style={{...S.inp,marginBottom:0}}/></div>
              <div><label style={S.lbl}>Durée (min)</label><input type="number" min="0" value={wForm.duration} onChange={e=>setWForm(f=>({...f,duration:e.target.value}))} style={{...S.inp,marginBottom:0}}/></div>
            </div>
            <label style={{...S.lbl,marginTop:9}}>Notes (optionnel)</label>
            <input placeholder="RPE, ressenti, objectifs…" value={wForm.notes} onChange={e=>setWForm(f=>({...f,notes:e.target.value}))} style={S.inp}/>

            {/* Exercices ajoutés */}
            {wForm.exercises.length>0&&(
              <div style={{marginBottom:10}}>
                <div style={{...S.sec,marginBottom:6}}>Exercices ({wForm.exercises.length})</div>
                {wForm.exercises.map((ex,i)=>(
                  <div key={ex.id||i} style={{background:T.bg,borderRadius:9,padding:"8px 10px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:700}}>{ex.name} <span style={{color:T.muted,fontWeight:400,fontSize:11}}>{ex.type}</span></div>
                      <div style={{fontSize:10,color:T.muted,marginTop:2}}>
                        {ex.sets.map((s,si)=>{
                          if(ex.type==="Cardio") return `${si+1}: ${s.duration||"—"}min ${s.distance?s.distance+"km":""}`;
                          return `${si+1}: ${s.reps||"—"}×${s.weight||"—"}${s.unit||"kg"}`;
                        }).join("  ·  ")}
                      </div>
                    </div>
                    <button onClick={()=>removeEx(i)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:13,padding:"0 4px"}}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Ajouter un exercice */}
            {!showExF
              ? <button onClick={()=>setShowExF(true)} style={{...S.btn(T.bg,T.orange),border:`1.5px dashed ${T.orange}`,marginBottom:10}}>＋ Ajouter un exercice</button>
              : (
                <div style={{...S.cf("0 0 10px"),border:`1.5px solid ${T.orange}`,boxShadow:`0 0 0 3px ${T.orangeLight}`}}>
                  <div style={{fontSize:12,fontWeight:700,marginBottom:8,color:T.orange}}>Nouvel exercice</div>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:8}}>
                    <div><label style={S.lbl}>Nom</label><input placeholder="Développé couché" value={curEx.name} onChange={e=>setCurEx(f=>({...f,name:e.target.value}))} style={{...S.inp,marginBottom:0}}/></div>
                    <div><label style={S.lbl}>Type</label>
                      <select value={curEx.type} onChange={e=>setCurEx(f=>({...f,type:e.target.value}))} style={{...S.sel,marginBottom:0}}>
                        {EXERCISE_TYPES.map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{...S.sec,margin:"8px 0 6px"}}>Séries</div>
                  {curEx.sets.map((s,i)=>(
                    <div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:5}}>
                      <span style={{fontSize:11,color:T.muted,width:18,flexShrink:0}}>S{i+1}</span>
                      {curEx.type==="Cardio"
                        ? (<>
                          <input placeholder="min" type="number" min="0" value={s.duration} onChange={e=>updateSet(i,"duration",e.target.value)}
                            style={{...S.inp,marginBottom:0,flex:1,padding:"6px 8px",fontSize:12}}/>
                          <input placeholder="km" type="number" min="0" step="0.1" value={s.distance} onChange={e=>updateSet(i,"distance",e.target.value)}
                            style={{...S.inp,marginBottom:0,flex:1,padding:"6px 8px",fontSize:12}}/>
                        </>)
                        : (<>
                          <input placeholder="Rép." type="number" min="0" value={s.reps} onChange={e=>updateSet(i,"reps",e.target.value)}
                            style={{...S.inp,marginBottom:0,flex:1,padding:"6px 8px",fontSize:12}}/>
                          <input placeholder="Poids" type="number" min="0" step="0.5" value={s.weight} onChange={e=>updateSet(i,"weight",e.target.value)}
                            style={{...S.inp,marginBottom:0,flex:1,padding:"6px 8px",fontSize:12}}/>
                          <select value={s.unit} onChange={e=>updateSet(i,"unit",e.target.value)}
                            style={{...S.sel,marginBottom:0,width:52,padding:"6px 4px",fontSize:11}}>
                            {["kg","lbs","bw"].map(u=><option key={u}>{u}</option>)}
                          </select>
                        </>)
                      }
                      {curEx.sets.length>1&&<button onClick={()=>removeSet(i)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:13,padding:"0 2px",flexShrink:0}}>✕</button>}
                    </div>
                  ))}
                  <div style={{display:"flex",gap:6,marginTop:4}}>
                    <button onClick={addSetToEx} style={{...S.smBtn(T.bg,T.orange,true),flex:1}}>＋ Série</button>
                    <button onClick={addExToWorkout} style={{...S.smBtn(T.orange),flex:2}}>✅ Ajouter l'exercice</button>
                    <button onClick={()=>{setShowExF(false);setCurEx(emptyEx);}} style={S.smBtn(T.muted)}>✕</button>
                  </div>
                </div>
              )
            }

            <button style={S.btn(T.orange)} onClick={submitWorkout} disabled={!wForm.name.trim()}>
              ✅ {editWId?"Mettre à jour la séance":"Enregistrer la séance"}
            </button>
          </div>
        )}
      </>)}

      {/* ════════════════════════════════════════
          SPORT
      ════════════════════════════════════════ */}
      {view==="sport" && (<>
        <div style={{...S.tog,margin:"10px 14px 0",marginBottom:0}}>
          <button style={S.tab(sportTab==="journal",T.orange)} onClick={()=>setSportTab("journal")}>📋 Journal</button>
          <button style={S.tab(sportTab==="programmes",T.orange)} onClick={()=>setSportTab("programmes")}>📅 Programmes</button>
        </div>

        {/* ── Journal des séances ── */}
        {sportTab==="journal" && (<>
          {/* Sélecteur mois */}
          <div style={S.mSel}>
            {MONTHS_FR.map((m,i)=>(
              <button key={i} style={{...S.mChip(selMonth===i),border:`1px solid ${selMonth===i?T.orange:T.border}`,background:selMonth===i?T.orange:T.surface,color:selMonth===i?"#fff":T.muted}}
                onClick={()=>setSelMonth(i)}>{m.slice(0,3)}</button>
            ))}
          </div>

          <div style={{padding:"0 14px 6px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{...S.sec}}>{monthWorkouts.length} séance(s) — {MONTHS_FR[selMonth]}</span>
            <button onClick={()=>{setWForm(emptyWkt);setEditWId(null);setShowWForm(false);setAddCtx("sport");setView("add");}}
              style={S.smBtn(T.orange)}>＋ Séance</button>
          </div>

          {monthWorkouts.length===0
            ? <div style={{...S.card,textAlign:"center",color:T.muted,padding:"28px 16px",fontSize:13}}>
                Aucune séance ce mois.<br/>
                <span style={{color:T.orange,fontWeight:600,cursor:"pointer"}} onClick={()=>{setAddCtx("sport");setView("add");}}>Créer une séance →</span>
              </div>
            : [...monthWorkouts].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(w=>(
              <div key={w.id} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700}}>{w.name}</div>
                    <div style={{fontSize:11,color:T.muted,marginBottom:6}}>
                      {fmtD(w.date)}{w.duration?` · ${w.duration} min`:""}
                    </div>
                    {w.exercises.map((ex,i)=>(
                      <div key={i} style={{fontSize:11,color:T.text,padding:"4px 0",borderTop:`1px solid ${T.border}`}}>
                        <span style={{fontWeight:600}}>{ex.name}</span>
                        <span style={{color:T.muted,marginLeft:6}}>
                          {ex.type==="Cardio"
                            ? ex.sets.map(s=>`${s.duration||"—"}min${s.distance?` ${s.distance}km`:""}`).join(", ")
                            : `${ex.sets.length} série(s) · max ${Math.max(...ex.sets.map(s=>parseFloat(s.weight)||0))||"—"}${ex.sets[0]?.unit||"kg"}`
                          }
                        </span>
                      </div>
                    ))}
                    {w.notes&&<div style={{fontSize:11,color:T.muted,marginTop:4,fontStyle:"italic"}}>💬 {w.notes}</div>}
                  </div>
                  <div style={{display:"flex",gap:5,flexShrink:0,marginLeft:8}}>
                    <button onClick={()=>startEditWkt(w)} style={S.smBtn(T.primary)}>✏️</button>
                    <button onClick={()=>deleteWorkout(w.id)} style={S.smBtn(T.expense)}>🗑</button>
                  </div>
                </div>
              </div>
            ))
          }
        </>)}

        {/* ── Programmes ── */}
        {sportTab==="programmes" && (<>
          <div style={{padding:"8px 14px 0"}}>
            <button onClick={()=>{setPForm(emptyProg);setEditPId(null);setShowPForm(!showPForm);}}
              style={S.btn(showPForm?T.muted:T.primary)}>
              {showPForm?"✕ Annuler":"＋ Nouveau programme"}
            </button>
          </div>

          {showPForm && (
            <div style={{...S.cf("0 14px 10px"),border:`1.5px solid ${T.orange}`,boxShadow:`0 0 0 3px ${T.orangeLight}`}}>
              <div style={{fontSize:13,fontWeight:800,marginBottom:10}}>{editPId?"Modifier le programme":"Nouveau programme"}</div>
              <label style={S.lbl}>Nom du programme</label>
              <input placeholder="Ex : Full Body 3J" value={pForm.name} onChange={e=>setPForm(f=>({...f,name:e.target.value}))} style={S.inp}/>

              {/* Onglets jours */}
              <div style={{display:"flex",gap:4,overflowX:"auto",marginBottom:10,paddingBottom:2}}>
                {pForm.days.map((d,i)=>(
                  <button key={i} onClick={()=>setProgExInput(p=>({...p,dayIdx:i}))}
                    style={{padding:"4px 10px",borderRadius:8,border:`1px solid ${progExInput.dayIdx===i?T.orange:T.border}`,background:progExInput.dayIdx===i?T.orangeLight:T.bg,color:progExInput.dayIdx===i?T.orange:T.muted,fontSize:11,fontWeight:progExInput.dayIdx===i?700:400,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                    {d.day.slice(0,3)}{d.exercises.length>0?` (${d.exercises.length})`:""}
                  </button>
                ))}
              </div>

              {/* Exercices du jour sélectionné */}
              {pForm.days[progExInput.dayIdx].exercises.map((ex,ei)=>(
                <div key={ei} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${T.border}`,fontSize:12}}>
                  <span>{ex.name} — {ex.sets}×{ex.reps}{ex.weight?` @${ex.weight}kg`:""}</span>
                  <button onClick={()=>removeExFromDay(progExInput.dayIdx,ei)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:12}}>✕</button>
                </div>
              ))}

              {/* Ajout exercice au programme */}
              <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                <input placeholder="Exercice" value={progExInput.name} onChange={e=>setProgExInput(p=>({...p,name:e.target.value}))} style={{...S.inp,marginBottom:0,flex:"1 1 120px"}}/>
                <input placeholder="Séries" type="number" min="1" value={progExInput.sets} onChange={e=>setProgExInput(p=>({...p,sets:e.target.value}))} style={{...S.inp,marginBottom:0,width:60,flex:"0 0 60px"}}/>
                <input placeholder="Rép." type="number" min="1" value={progExInput.reps} onChange={e=>setProgExInput(p=>({...p,reps:e.target.value}))} style={{...S.inp,marginBottom:0,width:60,flex:"0 0 60px"}}/>
                <input placeholder="kg" type="number" min="0" step="0.5" value={progExInput.weight} onChange={e=>setProgExInput(p=>({...p,weight:e.target.value}))} style={{...S.inp,marginBottom:0,width:60,flex:"0 0 60px"}}/>
                <button onClick={addExToDay} style={{...S.smBtn(T.orange),flexShrink:0}}>＋</button>
              </div>

              <button style={{...S.btn(T.orange),marginTop:12}} onClick={submitProgram}>✅ {editPId?"Mettre à jour":"Créer le programme"}</button>
            </div>
          )}

          {programs.length===0
            ? <div style={{...S.card,textAlign:"center",color:T.muted,padding:"28px 16px",fontSize:13}}>
                Aucun programme.<br/>Créez votre plan d'entraînement hebdomadaire.
              </div>
            : programs.map(prog=>(
              <div key={prog.id} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{fontSize:14,fontWeight:700}}>{prog.name}</div>
                  <div style={{display:"flex",gap:5}}>
                    <button onClick={()=>{setPForm({...prog});setEditPId(prog.id);setShowPForm(true);}} style={S.smBtn(T.primary)}>✏️</button>
                    <button onClick={()=>deleteProgram(prog.id)} style={S.smBtn(T.expense)}>🗑</button>
                  </div>
                </div>
                {/* Planning hebdo */}
                <div style={{display:"flex",gap:4,marginBottom:10,overflowX:"auto"}}>
                  {prog.days.map((d,i)=>(
                    <div key={i} style={{textAlign:"center",flexShrink:0}}>
                      <div style={{fontSize:9,color:T.muted,marginBottom:3}}>{d.day.slice(0,3).toUpperCase()}</div>
                      <div style={{width:28,height:28,borderRadius:8,background:d.exercises.length?T.orangeLight:T.bg,border:`1px solid ${d.exercises.length?T.orange:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:d.exercises.length?T.orange:T.muted}}>
                        {d.exercises.length||"—"}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Appliquer aujourd'hui */}
                <button onClick={()=>applyProgram(prog,today())} style={{...S.btn(T.orangeLight,T.orange),border:`1px solid ${T.orange}`,marginBottom:0,fontWeight:700,fontSize:13}}>
                  ▶ Appliquer aujourd'hui
                </button>
              </div>
            ))
          }
        </>)}
      </>)}

      {/* ════════════════════════════════════════
          GÉRER
      ════════════════════════════════════════ */}
      {view==="manage" && (
        <div style={{padding:"16px 14px"}}>
          <div style={{fontSize:18,fontWeight:800,marginBottom:14,marginTop:4}}>Paramètres & Objectifs</div>

          <div style={{...S.tog,marginBottom:14}}>
            <button style={S.tab(manageTab==="goals",T.mint)}      onClick={()=>setManageTab("goals")}>🎯 Nutrition</button>
            <button style={S.tab(manageTab==="objectives",T.orange)} onClick={()=>setManageTab("objectives")}>🏆 Objectifs</button>
          </div>

          {/* ── Objectifs nutritionnels ── */}
          {manageTab==="goals" && (<>
            <div style={S.cf("0 0 12px")}>
              <div style={{fontSize:13,fontWeight:800,marginBottom:12}}>Objectifs journaliers</div>
              {[
                {l:"Calories (kcal)",k:"calories"},
                {l:"Protéines (g)",  k:"protein"},
                {l:"Glucides (g)",   k:"carbs"},
                {l:"Lipides (g)",    k:"fat"},
              ].map(({l,k})=>(
                <div key={k}>
                  <label style={S.lbl}>{l}</label>
                  <input type="number" min="0" value={gForm[k]||goals[k]}
                    onChange={e=>setGForm(f=>({...f,[k]:parseFloat(e.target.value)||0}))}
                    onBlur={e=>setGoals(g=>({...g,[k]:parseFloat(e.target.value)||0}))}
                    style={S.inp}/>
                </div>
              ))}
              <button onClick={()=>setGoals(gForm)} style={S.btn(T.mint,T.primary)}>✅ Enregistrer les objectifs</button>
            </div>

            {/* Résumé semaine */}
            <div style={S.cf("0 0 12px")}>
              <div style={{fontSize:13,fontWeight:800,marginBottom:10}}>Résumé des 7 derniers jours</div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <div style={{textAlign:"center"}}>
                  <div style={{...S.sec,marginBottom:3}}>MOY. CAL.</div>
                  <div style={{fontSize:16,fontWeight:800,color:T.mint}}>{fmtN(weekCalAvg)}</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{...S.sec,marginBottom:3}}>OBJECTIF</div>
                  <div style={{fontSize:16,fontWeight:800,color:T.primary}}>{fmtN(goals.calories)}</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{...S.sec,marginBottom:3}}>SÉANCES</div>
                  <div style={{fontSize:16,fontWeight:800,color:T.orange}}>{workouts.filter(w=>{const d=new Date(w.date);const n=new Date();return(n-d)<7*86400000;}).length}</div>
                </div>
              </div>
            </div>
          </>)}

          {/* ── Objectifs fitness ── */}
          {manageTab==="objectives" && (<>
            <button onClick={()=>setShowPgF(!showPgF)} style={S.btn(showPgF?T.muted:T.orange)}>
              {showPgF?"✕ Annuler":"＋ Nouvel objectif"}
            </button>

            {showPgF && (
              <div style={{...S.cf("0 0 12px"),border:`1.5px solid ${T.orange}`,boxShadow:`0 0 0 3px ${T.orangeLight}`}}>
                <div style={{fontSize:13,fontWeight:800,marginBottom:10}}>Nouvel objectif</div>
                <label style={S.lbl}>Nom de l'objectif</label>
                <input placeholder="Ex : Développé couché 100kg" value={pgForm.name} onChange={e=>setPgForm(f=>({...f,name:e.target.value}))} style={S.inp}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  <div><label style={S.lbl}>Valeur actuelle</label><input type="number" step="0.1" value={pgForm.current} onChange={e=>setPgForm(f=>({...f,current:e.target.value}))} style={{...S.inp,marginBottom:0}}/></div>
                  <div><label style={S.lbl}>Objectif</label><input type="number" step="0.1" value={pgForm.target} onChange={e=>setPgForm(f=>({...f,target:e.target.value}))} style={{...S.inp,marginBottom:0}}/></div>
                  <div><label style={S.lbl}>Unité</label>
                    <select value={pgForm.unit} onChange={e=>setPgForm(f=>({...f,unit:e.target.value}))} style={{...S.sel,marginBottom:0}}>
                      {["kg","lbs","km","min","rép.","séries","%"].map(u=><option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <button style={{...S.btn(T.orange),marginTop:10}} onClick={submitPerfGoal}>✅ Ajouter</button>
              </div>
            )}

            {perfGoals.length===0
              ? <div style={{...S.cf(),textAlign:"center",color:T.muted,padding:"28px 16px",fontSize:13}}>
                  Aucun objectif.<br/>Définissez vos cibles de performance.
                </div>
              : perfGoals.map(g=>{
                const pct=g.target>0?(g.current/g.target)*100:0;
                return(
                  <div key={g.id} style={S.cf("0 0 8px")}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700}}>{g.name}</div>
                        <div style={{fontSize:10,color:T.muted}}>Depuis le {fmtD(g.createdAt)}</div>
                      </div>
                      <button onClick={()=>deletePerfGoal(g.id)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:13}}>🗑</button>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                      <input type="number" step="0.1" value={g.current}
                        onChange={e=>updateGoalProgress(g.id,e.target.value)}
                        style={{...S.inp,marginBottom:0,width:80,flex:"0 0 80px",padding:"6px 10px",fontSize:13}}/>
                      <span style={{color:T.muted,fontSize:12}}>/ {g.target} {g.unit}</span>
                      {pct>=100&&<span style={{fontSize:11,background:T.incomeLight,color:T.income,padding:"2px 8px",borderRadius:20,fontWeight:700}}>🎉 Atteint !</span>}
                    </div>
                    <Bar pct={pct} color={pct>=100?T.income:T.orange} h={7}/>
                    <div style={{fontSize:10,color:T.muted,marginTop:3,textAlign:"right"}}>{pct.toFixed(1)} %</div>
                  </div>
                );
              })
            }
          </>)}
        </div>
      )}

      {/* ════ BOTTOM NAV ════ */}
      <div style={S.nav}>
        <Nav icon="🏠" label="Accueil" target="dashboard" color={T.mint}/>
        <Nav icon="🍽" label="Aliments" target="food" color={T.mint}/>
        <Nav icon="＋" label="Ajouter" target="add" color={addCtx==="sport"?T.orange:T.mint}/>
        <Nav icon="🏋" label="Sport" target="sport" color={T.orange}/>
        <Nav icon="⚙️" label="Gérer" target="manage" color={T.mint}/>
      </div>
    </div>
  );
}
