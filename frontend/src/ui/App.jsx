import React, {useEffect, useMemo, useRef, useState} from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
const getToken = () => localStorage.getItem('token') || ''
const setToken = (t) => localStorage.setItem('token', t)
const fmtDate = (iso) => {
  if(!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {year:'2-digit', month:'2-digit', day:'2-digit'})
}

async function apiGET(path, token){
  const headers = {}
  if(token) headers['Authorization'] = `Bearer ${token}`
  const r = await fetch(`${API_BASE}/${path}`, {headers})
  if(!r.ok) throw new Error('HTTP '+r.status)
  return r.json()
}
async function apiPOST(path, body, token){
  const headers = {'Content-Type':'application/json'}
  if(token) headers['Authorization'] = `Bearer ${token}`
  const r = await fetch(`${API_BASE}/${path}`, {method:'POST', headers, body: JSON.stringify(body)})
  if(!r.ok) throw new Error('HTTP '+r.status)
  return r.json()
}
async function apiPATCH(path, body, token){
  const headers = {'Content-Type':'application/json'}
  if(token) headers['Authorization'] = `Bearer ${token}`
  const r = await fetch(`${API_BASE}/${path}`, {method:'PATCH', headers, body: JSON.stringify(body)})
  if(!r.ok) throw new Error('HTTP '+r.status)
  return r.json()
}

function useFetch(url){
  const [data,setData] = useState(null)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState(null)
  const run = async ()=>{
    setLoading(true); setError(null)
    try{ setData(await (await fetch(url)).json()) }catch(e){ setError(e.message) }finally{ setLoading(false) }
  }
  useEffect(()=>{ run() },[url])
  return {data,loading,error,refresh:run}
}

/* ---------------- UI ---------------- */
function Navbar({q,setQ,onOpenAdd,onLogin}){
  const [u,setU] = useState('')
  const [p,setP] = useState('')
  const [connected,setConnected] = useState(!!getToken())

  const login = async ()=>{
    const j = await apiPOST('auth/jwt/create/', {username:u, password:p})
    setToken(j.access); setConnected(true); setU(''); setP('')
    onLogin && onLogin()
  }
  const logout = ()=>{ localStorage.removeItem('token'); setConnected(false); onLogin && onLogin() }

  return (
    <div className="nav">
      <div className="logo">WEBTOONFLIX</div>
      <div className="links">
        <a href="#">Accueil</a>
        <a href="#" onClick={(e)=>e.preventDefault()}>Catégories</a>
        <a href="#" onClick={(e)=>{e.preventDefault();onOpenAdd()}}>Ajouter</a>
      </div>
      <div className="search">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher..." />
      </div>
      <div style={{display:'flex', gap:8, alignItems:'center', marginLeft:12}}>
        {connected ? (
          <>
            <span style={{fontSize:12,opacity:.8}}>Connecté</span>
            <button className="btn secondary" onClick={logout}>Quitter</button>
          </>
        ) : (
          <>
            <input style={{width:130}} placeholder="user" value={u} onChange={e=>setU(e.target.value)} />
            <input style={{width:130}} type="password" placeholder="pass" value={p} onChange={e=>setP(e.target.value)} />
            <button className="btn primary" onClick={login}>Se connecter</button>
          </>
        )}
      </div>
    </div>
  )
}

function Hero({item, onRead, onMore}){
  const bg = item?.cover_image || ''
  return (
    <section className="hero">
      <div className="bg" style={{backgroundImage:`url(${bg})`}}></div>
      <div className="content">
        <h1>{item?.title || "Découvrez votre prochaine lecture"}</h1>
        <p>{(item?.description||"Parcourez des milliers de titres triés par genre, langue et popularité.").slice(0,180)}</p>
        <div className="buttons">
          {item?.link && <button className="btn primary" onClick={()=>onRead(item)}>Lire maintenant</button>}
          <button className="btn secondary" onClick={()=>onMore(item)}>Plus d'infos</button>
        </div>
      </div>
    </section>
  )
}

function Card({item, progress, onPlus, onMinus, onMore}){
  const bg = item.cover_image || ''
  return (
    <div className="card" title={item.title}>
      <div className="cover" style={{backgroundImage:`url(${bg})`}}></div>
      <div className="shade"></div>

      {/* top-left: dernier chapitre */}
      <div className="badge">Ch. {progress?.last_chapter ?? '—'}</div>

      {/* top-right: - / + */}
      <div className="controls">
        <button className="chipbtn" onClick={(e)=>{e.stopPropagation(); onMinus(item)}}>-</button>
        <button className="chipbtn" onClick={(e)=>{e.stopPropagation(); onPlus(item)}}>+</button>
      </div>

      {/* bottom-right: date */}
      <div className="datepill">{fmtDate(progress?.last_read_at)}</div>

      <div className="meta" onClick={()=>onMore(item)}>
        <div className="title">{item.title}</div>
        <div className="muted">{item.language || '—'} • {item.feature_category?.name || '—'}</div>
      </div>
    </div>
  )
}

function DetailModal({open, item, onClose, onEdit}){
  const ref = useRef()
  const [latest,setLatest] = useState(null)
  useEffect(()=>{ if(open) ref.current?.showModal(); else ref.current?.close() },[open])
  useEffect(()=>{
    if(open && item?.id){
      fetch(`${API_BASE}/chapters/?content=${item.id}&ordering=-created_at`)
        .then(r=>r.ok?r.json():[])
        .then(d=> setLatest(d?.[0] || null))
        .catch(()=> setLatest(null))
    }
  },[open, item?.id])
  if(!item) return null
  return (
    <dialog ref={ref} onClose={onClose}>
      <div className="modal">
        <div className="bigcover" style={{backgroundImage:`url(${item.cover_image||''})`}} />
        <div>
          <h2 style={{margin:'0 0 6px 0'}}>{item.title}</h2>
          <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:10}}>
            {item.feature_category?.name && <span className="tag">{item.feature_category.name}</span>}
            {item.language && <span className="tag">{item.language}</span>}
            {item.status && <span className="tag">{item.status}</span>}
            {item.rating!=null && <span className="tag">★ {item.rating}</span>}
          </div>
          <p style={{opacity:.9, marginTop:0}}>{(item.description||'').slice(0,400) || '—'}</p>
          <p className="muted" style={{marginTop:6}}>Dernier chapitre (global) : {latest?.chapter_number ?? '—'}</p>
          <div className="buttons" style={{marginTop:8, display:'flex', gap:8}}>
            {item.link && <a className="btn primary" href={item.link} target="_blank">Lire</a>}
            <button className="btn secondary" onClick={()=>onEdit(item)}>Modifier</button>
            <button className="btn secondary" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

function EditModal({open, item, onClose, onSaved}){
  const ref = useRef()
  const [cats,setCats] = useState([])
  const [form,setForm] = useState(null)
  const [err,setErr] = useState('')
  useEffect(()=>{ if(open) ref.current?.showModal(); else ref.current?.close() },[open])
  useEffect(()=>{
    if(open && item){
      setForm({
        title: item.title || '',
        language: item.language || '',
        status: item.status || 'unknown',
        description: item.description || '',
        cover_image: item.cover_image || '',
        link: item.link || '',
        feature_category_id: item.feature_category?.id || '',
        my_last_chapter: '',   // pour MAJ perso
        my_last_read_at: ''    // YYYY-MM-DD
      })
      fetch(`${API_BASE}/categories/?ordering=name`).then(r=>r.json()).then(setCats)
    }
  },[open,item])

  const update=(k,v)=> setForm(s=>({...s,[k]:v}))
  const save = async ()=>{
    setErr('')
    try{
      const token = getToken()
      await apiPATCH(`contents/${item.id}/`, {
        title: form.title,
        language: form.language,
        status: form.status,
        description: form.description,
        cover_image: form.cover_image,
        link: form.link,
        feature_category_id: form.feature_category_id || null
      }, token)

      // Si l'utilisateur a rempli chapitre/date → MAJ de sa progression
      if(form.my_last_chapter || form.my_last_read_at){
        const body = {}
        if(form.my_last_chapter) body["chapter"] = String(form.my_last_chapter)
        if(form.my_last_read_at) body["last_read_at"] = `${form.my_last_read_at}T00:00:00Z`
        await apiPOST(`contents/${item.id}/progress/`, body, token)
      }

      onSaved && onSaved()
      onClose()
    }catch(e){ setErr(String(e)) }
  }

  if(!item || !form) return null
  return (
    <dialog ref={ref} onClose={onClose}>
      <div className="modal" style={{gridTemplateColumns:'1fr'}}>
        <h2 style={{margin:'0 0 8px 0'}}>Modifier l'œuvre</h2>
        <div className="form">
          <input className="input" placeholder="Titre" value={form.title} onChange={e=>update('title',e.target.value)} />
          <select className="select" value={form.feature_category_id} onChange={e=>update('feature_category_id',e.target.value)}>
            <option value="">Catégorie…</option>
            {cats.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <input className="input" placeholder="Langue" value={form.language} onChange={e=>update('language',e.target.value)} />
          <select className="select" value={form.status} onChange={e=>update('status',e.target.value)}>
            <option value="unknown">Inconnu</option>
            <option value="ongoing">En cours</option>
            <option value="completed">Terminé</option>
            <option value="hiatus">En pause</option>
          </select>

          <input className="input" placeholder="Cover URL" value={form.cover_image} onChange={e=>update('cover_image',e.target.value)} />
          <input className="input" placeholder="Lien" value={form.link} onChange={e=>update('link',e.target.value)} />

          <textarea className="textarea" placeholder="Description" value={form.description} onChange={e=>update('description',e.target.value)}></textarea>

          <input className="input" placeholder="Mon dernier chapitre (optionnel)" value={form.my_last_chapter} onChange={e=>update('my_last_chapter',e.target.value)} />
          <input className="input" type="date" placeholder="Date de dernière lecture" value={form.my_last_read_at} onChange={e=>update('my_last_read_at',e.target.value)} />

          {err && <div style={{gridColumn:'1/-1', color:'#fca5a5', fontSize:12}}>{err}</div>}
          <div className="footer-actions" style={{gridColumn:'1/-1'}}>
            <button className="btn ghost" onClick={onClose}>Annuler</button>
            <button className="btn primary" onClick={save}>Enregistrer</button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

function AddModal({open, onClose, onCreated}){
  // (garde ton modal d’ajout actuel si tu l’as déjà)
  return null
}

/* ---------------- App ---------------- */
export default function App(){
  const [q,setQ] = useState('')
  const {data:allRaw, refresh:refreshAll} = useFetch(`${API_BASE}/contents/?ordering=title`)
  const [all,setAll] = useState([])
  const [hero,setHero] = useState(null)
  const [focus,setFocus] = useState(null)
  const [editing,setEditing] = useState(null)
  const [openAdd, setOpenAdd] = useState(false)
  const [progressMap,setProgressMap] = useState({}) // contentId -> {last_chapter,last_read_at}

  // quand on (re)charge les contenus
  useEffect(()=>{ if(allRaw){ setAll(allRaw); if(allRaw.length) setHero(allRaw[Math.floor(Math.random()*allRaw.length)]) } },[allRaw])

  // au login / refresh, charge les progress de l'utilisateur
  const loadProgress = async ()=>{
    const tok = getToken()
    if(!tok){ setProgressMap({}); return }
    try{
      const mine = await apiGET('progress/mine/', tok)
      const m = {}
      for(const p of mine){ m[p.content] = p }
      setProgressMap(m)
    }catch{ /* sans importance si non connecté */ }
  }
  useEffect(()=>{ loadProgress() },[])

  // recherche
  const results = useMemo(()=>{
    const s = q.trim().toLowerCase()
    if(!all || !s) return []
    return all.filter(it =>
      (it.title||'').toLowerCase().includes(s) ||
      (it.description||'').toLowerCase().includes(s)
    ).slice(0,20)
  },[q,all])

  // + / - handlers
  const bump = async (item, delta)=>{
    const tok = getToken()
    if(!tok) return alert('Connecte-toi pour modifier ta progression.')
    const res = await apiPOST(`contents/${item.id}/progress/`, {delta}, tok)
    setProgressMap(m => ({...m, [item.id]: res}))
  }
  const onPlus  = (item)=> bump(item, +1)
  const onMinus = (item)=> bump(item, -1)

  return (
    <div className="app">
      <Navbar q={q} setQ={setQ} onOpenAdd={()=>setOpenAdd(true)} onLogin={loadProgress} />
      <Hero item={hero} onRead={(it)=>window.open(it.link,'_blank')} onMore={setFocus} />

      {q && results.length>0 && (
        <Row
          title={`Résultats pour "${q}"`}
          items={results}
          onMore={setFocus}
          renderCard={(it)=>(
            <Card
              key={`search-${it.id}`}
              item={it}
              progress={progressMap[it.id]}
              onPlus={onPlus}
              onMinus={onMinus}
              onMore={setFocus}
            />
          )}
        />
      )}

      {Object.entries(groupByCategory(all)).map(([k,items])=>(
        <div className="section" key={k}>
          <div className="row">
            <h3>{k}</h3>
            <div className="rail">
              {items.map(it=>(
                <Card
                  key={`cat-${k}-${it.id}`}
                  item={it}
                  progress={progressMap[it.id]}
                  onPlus={onPlus}
                  onMinus={onMinus}
                  onMore={setFocus}
                />
              ))}
            </div>
          </div>
        </div>
      ))}

      <div className="footer"></div>

      <DetailModal open={!!focus} item={focus} onClose={()=>setFocus(null)} onEdit={setEditing} />
      <EditModal open={!!editing} item={editing} onClose={()=>setEditing(null)} onSaved={()=>{ refreshAll(); loadProgress(); }} />
      {/* <AddModal open={openAdd} onClose={()=>setOpenAdd(false)} onCreated={()=>{ refreshAll(); loadProgress(); }} /> */}
    </div>
  )
}

function groupByCategory(all){
  const g = {}
  for(const it of all || []){
    const name = (it.feature_category?.name) || 'Divers'
    if(!g[name]) g[name] = []
    g[name].push(it)
  }
  return g
}
