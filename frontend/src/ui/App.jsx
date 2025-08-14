import React, { useEffect, useMemo, useRef, useState } from 'react'

/* ========= Config & helpers ========= */
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
const AUTH_SCHEME = (import.meta.env.VITE_AUTH_SCHEME || 'Bearer').trim()
const safe = (s) => (s ?? '').toString()
const lower = (s) => safe(s).toLowerCase()
const LS_ACCESS = 'token'
const LS_REFRESH = 'refresh'
const getAccess = () => localStorage.getItem(LS_ACCESS) || ''
const setAccess = (t) => localStorage.setItem(LS_ACCESS, t)
const getRefresh = () => localStorage.getItem(LS_REFRESH) || ''
const setRefresh = (t) => localStorage.setItem(LS_REFRESH, t)
const clearTokens = () => { localStorage.removeItem(LS_ACCESS); localStorage.removeItem(LS_REFRESH) }

function isExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Math.floor(Date.now()/1000)
    return payload.exp && now >= payload.exp
  } catch { return true }
}

async function rawRequest(method, path, body, withAuth, accessOverride) {
  const headers = { 'Content-Type': 'application/json' }
  if (withAuth) {
    const tk = accessOverride || getAccess()
    if (!tk) throw new Error('Non authentifié')
    headers['Authorization'] = `${AUTH_SCHEME} ${tk}`
  }
  const res = await fetch(`${API_BASE}/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  return res
}

async function request(method, path, body, withAuth=false) {
  if (withAuth && getAccess() && isExpired(getAccess()) && getRefresh()) {
    const ok = await tryRefresh(); if (!ok) { clearTokens(); throw new Error('Session expirée') }
  }
  let res = await rawRequest(method, path, body, withAuth)
  if (res.status !== 401) { if (!res.ok) throw await toError(res); return toJSON(res) }
  if (withAuth && getRefresh()) {
    const ok = await tryRefresh()
    if (ok) {
      res = await rawRequest(method, path, body, withAuth)
      if (!res.ok) throw await toError(res)
      return toJSON(res)
    }
  }
  clearTokens()
  throw new Error('Non authentifié (401)')
}

async function tryRefresh() {
  try {
    const res = await fetch(`${API_BASE}/auth/jwt/refresh/`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ refresh: getRefresh() })
    })
    if (!res.ok) return false
    const data = await res.json()
    if (data?.access) { setAccess(data.access); return true }
    return false
  } catch { return false }
}
async function toError(res){ let msg=`HTTP ${res.status}`; try{const j=await res.json(); msg+=` • ${JSON.stringify(j)}`}catch{}; return new Error(msg) }
async function toJSON(res){ try{ return await res.json() } catch{ return null } }

const api = { get:(p,a=false)=>request('GET',p,null,a), post:(p,b,a=false)=>request('POST',p,b,a), patch:(p,b,a=false)=>request('PATCH',p,b,a) }
const fmtDate = (iso) => { if(!iso) return '—'; const d=new Date(iso); return d.toLocaleDateString(undefined,{year:'2-digit',month:'2-digit',day:'2-digit'}) }

/* ========= Hooks utils ========= */
function useBodyLock(active){
  useEffect(()=>{ if(!active) return; const prev=document.body.style.overflow; document.body.style.overflow='hidden'; return ()=>{document.body.style.overflow=prev} },[active])
}
function useInterval(cb, delay){
  const saved = useRef(cb)
  useEffect(()=>{ saved.current = cb }, [cb])
  useEffect(()=>{ if(delay==null) return; const id=setInterval(()=>saved.current(), delay); return ()=>clearInterval(id) }, [delay])
}

/* ========= UI: Navbar ========= */
function Navbar({ q, setQ, onOpenAdd, onAuthChange }) {
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [connected, setConnected]=useState(!!getAccess())
  useEffect(()=>{ const id=setInterval(()=>setConnected(!!getAccess() && !isExpired(getAccess())),10000); return ()=>clearInterval(id)},[])
  const login = async () => { const j=await api.post('auth/jwt/create/',{username:u,password:p}); if(j?.access) setAccess(j.access); if(j?.refresh) setRefresh(j.refresh); setConnected(true); setU(''); setP(''); onAuthChange&&onAuthChange() }
  const logout = () => { clearTokens(); setConnected(false); onAuthChange&&onAuthChange() }
  return (
    <div className="nav">
      <div className="logo">WEBTOONFLIX</div>
      <div className="links">
        <a href="#" onClick={(e)=>e.preventDefault()}>Accueil</a>
        <a href="#" onClick={(e)=>e.preventDefault()}>Catégories</a>
        <a href="#" onClick={(e)=>{e.preventDefault(); onOpenAdd()}}>Rajouter</a>
      </div>
      <div className="search"><input value={q} onChange={(e)=>setQ(e.target.value ?? '')} placeholder="Rechercher..." /></div>
      <div style={{display:'flex', gap:8, alignItems:'center', marginLeft:12}}>
        {connected ? (<><span style={{fontSize:12,opacity:.8}}>Connecté</span><button className="btn secondary" onClick={logout}>Quitter</button></>) : (<><input style={{width:130}} placeholder="user" value={u} onChange={e=>setU(e.target.value)} /><input style={{width:130}} type="password" placeholder="pass" value={p} onChange={e=>setP(e.target.value)} /><button className="btn primary" onClick={login}>Se connecter</button></>)}
      </div>
    </div>
  )
}

/* ========= UI: Hero (rotatif 10s, fade) ========= */
function Hero({ item, onRead, onMore, fading }) {
  const bg = item?.cover_image || ''
  return (
    <section className={`hero ${fading ? 'fade' : ''}`}>
      <div className="bg" style={{ backgroundImage:`url(${bg})` }} />
      <div className="content">
        <h1>{item?.title || "Découvrez votre prochaine lecture"}</h1>
        <p>{(item?.description || "Parcourez des milliers de titres triés par genre, langue et popularité.").slice(0, 180)}</p>
        <div className="buttons">
          {item?.link && <button className="btn primary" onClick={() => onRead(item)}>Lire</button>}
          <button className="btn secondary" onClick={() => onMore(item)}>Plus d'infos</button>
        </div>
      </div>
    </section>
  )
}

/* ========= Card & Row (Row auto-scroll 15s par 3) ========= */
function Card({ item, progress, onPlus, onMinus, onMore }) {
  const bg=item.cover_image||''
  return (
    <div className="card" title={item.title} onClick={()=>onMore(item)}>
      <div className="cover" style={{backgroundImage:`url(${bg})`}} />
      <div className="shade" />
      <div className="badge">Ch. {progress?.last_chapter ?? '—'}</div>
      <div className="controls">
        <button className="chipbtn" onClick={(e)=>{e.stopPropagation(); onMinus(item)}}>-</button>
        <button className="chipbtn" onClick={(e)=>{e.stopPropagation(); onPlus(item)}}>+</button>
      </div>
      <div className="datepill">{fmtDate(progress?.last_read_at)}</div>
      <div className="meta"><div className="title">{item.title}</div><div className="muted">{item.language || '—'} • {item.feature_category?.name || '—'}</div></div>
    </div>
  )
}
function Row({ title, items, renderCard }) {
  const railRef = useRef(null)
  useInterval(()=> {
    const rail=railRef.current; if(!rail) return
    const card=rail.querySelector('.card'); const gap=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap'))||12
    const step = card ? (card.clientWidth + gap) * 3 : 600
    const maxLeft = rail.scrollWidth - rail.clientWidth
    let next = rail.scrollLeft + step
    if (next >= maxLeft - 5) next = 0
    rail.scrollTo({ left: next, behavior: 'smooth' })
  }, 15000)
  return (
    <div className="section">
      <div className="row">
        <h3>{title}</h3>
        <div className="rail" ref={railRef}>
          {items.map(renderCard)}
        </div>
      </div>
    </div>
  )
}

/* ========= Detail (fiche info) ========= */
function DetailModal({ open, item, onClose, onEdit }) {
  const ref = useRef(); useEffect(()=>{ open ? ref.current?.showModal() : ref.current?.close() },[open])
  if (!item) return null
  return (
    <dialog ref={ref} onClose={onClose}>
      <div className="modal">
        <div className="bigcover" style={{ backgroundImage: `url(${item.cover_image || ''})` }} />
        <div>
          <h2 style={{ margin: '0 0 6px 0' }}>{item.title}</h2>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
            {item.feature_category?.name && <span className="tag">{item.feature_category.name}</span>}
            {item.language && <span className="tag">{item.language}</span>}
            {item.status && <span className="tag">{item.status}</span>}
            {item.rating != null && <span className="tag">★ {item.rating}</span>}
          </div>
          <p style={{ opacity:.9, marginTop:0 }}>{(item.description || '').slice(0,400) || '—'}</p>
          <div className="buttons" style={{ marginTop: 8, display:'flex', gap:8 }}>
            {item.link && <a className="btn primary" href={item.link} target="_blank">Lire</a>}
            <button className="btn secondary" onClick={()=>onEdit(item)}>Modifier</button>
            <button className="btn secondary" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

/* ========= Edit overlay (texte optionnel + aperçu live) ========= */
function EditOverlay({ open, original, onClose, onSaved }) {
  useBodyLock(open)
  const [cats, setCats] = useState([]); const [form,setForm]=useState(null); const [err,setErr]=useState(''); const [saving,setSaving]=useState(false)
  useEffect(()=>{ if(!open||!original) return
    setForm({ title:original.title||'', language:original.language||'', status:original.status||'unknown', description:original.description||'', cover_image:original.cover_image||'', link:original.link||'', feature_category_id:original.feature_category?.id||'', my_last_chapter:'', my_last_read_at:'' })
    api.get('categories/?ordering=name').then(d=>setCats(Array.isArray(d)?d:(d?.results||[]))).catch(()=>setCats([])); setErr('')
  },[open,original])
  if(!open||!original||!form) return null
  const update=(k,v)=>setForm(s=>({...s,[k]:v}))
  const preview={ ...original, title:form.title, language:form.language||original.language, status:form.status||original.status, description:form.description||original.description, cover_image:form.cover_image||original.cover_image, link:form.link||original.link, feature_category: form.feature_category_id ? { id:Number(form.feature_category_id), name: cats.find(c=>c.id===Number(form.feature_category_id))?.name || (original.feature_category?.name??'—') } : original.feature_category }
  const save = async () => {
    setErr('')
    if(!getAccess()){ const m='Tu dois être connecté pour modifier.'; setErr(m); alert(m); return }
    setSaving(true)
    try{
      // IMPORTANT: on n'envoie plus null pour les champs texte => restent optionnels
      const updated = await api.patch(`contents/${original.id}/`, {
        title: form.title,
        language: form.language,                 // "" accepté
        status: form.status || 'unknown',
        description: form.description,           // "" accepté
        cover_image: form.cover_image,           // "" accepté
        link: form.link,                         // "" accepté
        feature_category_id: form.feature_category_id || null,
      }, true)

      if(form.my_last_chapter || form.my_last_read_at){
        const body={}
        if(form.my_last_chapter){ const n=parseInt(form.my_last_chapter,10); if(!isNaN(n)) body["chapter"]=n }
        if(form.my_last_read_at){ body["last_read_at"]=`${form.my_last_read_at}T00:00:00Z` }
        await api.post(`contents/${original.id}/progress/`, body, true)
      }

      onSaved && onSaved(updated || preview)
      onClose()
    }catch(e){ console.error('PATCH failed:',e); setErr(String(e.message||e)); alert("Échec de la modification. Voir console pour le détail.") }
    finally{ setSaving(false) }
  }
  return (
    <div className="edit-overlay">
      <div className="edit-modal pop">
        <div className="preview-panel">
          <div className="preview-image" style={{ backgroundImage:`url(${preview.cover_image || ''})` }} />
          <div className="preview-gradient"></div>
          <div className="preview-info">
            <div className="preview-title">{preview.title || 'Sans titre'}</div>
            <div className="preview-chips">
              {preview.feature_category?.name && <span className="preview-chip">{preview.feature_category.name}</span>}
              {preview.language && <span className="preview-chip">{preview.language}</span>}
              {preview.status && <span className="preview-chip">{preview.status}</span>}
              {preview.rating != null && <span className="preview-chip">★ {preview.rating}</span>}
            </div>
            <div className="preview-desc">{(preview.description || '—').slice(0,260)}</div>
          </div>
        </div>
        <div className="edit-panel">
          <div className="edit-header"><div className="edit-title">Modifier l’œuvre</div><button className="btn ghost" onClick={onClose}>Fermer</button></div>
          <div className="form">
            <input className="input" placeholder="Titre" value={form.title} onChange={e=>update('title', e.target.value)} />
            <select className="select" value={form.feature_category_id} onChange={e=>update('feature_category_id', e.target.value)}>
              <option value="">Catégorie…</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="input" placeholder="Langue" value={form.language} onChange={e=>update('language', e.target.value)} />
            <select className="select" value={form.status} onChange={e=>update('status', e.target.value)}>
              <option value="unknown">Inconnu</option><option value="ongoing">En cours</option><option value="completed">Terminé</option><option value="hiatus">En pause</option>
            </select>
            <input className="input" placeholder="Cover URL" value={form.cover_image} onChange={e=>update('cover_image', e.target.value)} />
            <input className="input" placeholder="Lien" value={form.link} onChange={e=>update('link', e.target.value)} />
            <textarea className="textarea" placeholder="Description" value={form.description} onChange={e=>update('description', e.target.value)} />
            <input className="input" placeholder="Mon dernier chapitre (optionnel)" value={form.my_last_chapter} onChange={e=>update('my_last_chapter', e.target.value)} />
            <input className="input" type="date" placeholder="Date de dernière lecture" value={form.my_last_read_at} onChange={e=>update('my_last_read_at', e.target.value)} />
            {err && <div style={{ gridColumn:'1/-1', color:'#fca5a5', fontSize:12 }}>{err}</div>}
          </div>
          <div className="footer-actions"><button className="btn primary" onClick={save} disabled={saving}>{saving ? '…' : 'Enregistrer'}</button></div>
        </div>
      </div>
    </div>
  )
}

/* ========= App (hero rotatif + auto-scroll + MAJ optimiste) ========= */
export default function App() {
  const [q, setQ] = useState(''); const [all,setAll]=useState([]); const [hero,setHero]=useState(null)
  const [fading,setFading]=useState(false)
  const [focus,setFocus]=useState(null); const [editing,setEditing]=useState(null)
  const [openAdd,setOpenAdd]=useState(false); const [progressMap,setProgressMap]=useState({})

  const fetchList = async ()=>{ try{ const d=await api.get('contents/?ordering=title'); const items=Array.isArray(d)?d:(d?.results||[]); setAll(items); if(items.length && !hero) setHero(items[Math.floor(Math.random()*items.length)]) }catch(e){console.error(e)} }
  const loadProgress = async ()=>{ if(!getAccess()){ setProgressMap({}); return } try{ const mine=await api.get('progress/mine/', true); const m={}; for(const p of (mine||[])) m[p.content]=p; setProgressMap(m) }catch{ setProgressMap({}) } }

  useEffect(()=>{ fetchList() },[])
  useEffect(()=>{ loadProgress() },[])

  // Hero rotatif 10s
  useInterval(()=> {
    if(!all.length) return
    setFading(true)
    setTimeout(()=> {
      const others = all.filter(x => x.id !== hero?.id)
      const next = others.length ? others[Math.floor(Math.random()*others.length)] : all[Math.floor(Math.random()*all.length)]
      setHero(next)
      setFading(false)
    }, 600) // le temps du fade-out
  }, 10000)

  const results = useMemo(()=> {
    const s=lower(q.trim()); if(!s) return []
    return (all||[]).filter(it => lower(it.title).includes(s) || lower(it.description).includes(s) || lower(it.language).includes(s) || lower(it.feature_category?.name).includes(s)).slice(0,40)
  },[q,all])

  const bump = async (item, delta)=>{ if(!getAccess()) return alert('Connecte-toi pour modifier ta progression.')
    try{ const res=await api.post(`contents/${item.id}/progress/`, { delta }, true); setProgressMap(m=>({...m,[item.id]:res})) }catch(e){ alert('Impossible de mettre à jour la progression.'); console.error(e) } }
  const onPlus = (it)=>bump(it,+1); const onMinus = (it)=>bump(it,-1)

  const openEditFromDetail = (it)=>{ setFocus(null); setTimeout(()=>setEditing(it), 0) }
  const applyUpdated = (updated)=>{ if(!updated?.id) return; setAll(list=>list.map(x=>x.id===updated.id?{...x,...updated}:x)); if(hero?.id===updated.id) setHero({...hero,...updated}); setTimeout(fetchList,200) }

  return (
    <div className="app">
      <Navbar q={q} setQ={setQ} onOpenAdd={()=>setOpenAdd(true)} onAuthChange={()=>{loadProgress()}} />
      <Hero item={hero} fading={fading} onRead={(it)=>window.open(it.link,'_blank')} onMore={setFocus} />

      {q && (
        results.length
          ? <Row title={`Résultats pour "${q}"`} items={results} renderCard={(it)=>(<Card key={`search-${it.id}`} item={it} progress={progressMap[it.id]} onPlus={onPlus} onMinus={onMinus} onMore={setFocus} />)} />
          : <div className="row"><p>Aucun résultat pour “{q}”.</p></div>
      )}

      {Object.entries(groupByCategory(all)).map(([k,items])=>(
        <Row key={k} title={k} items={items} renderCard={(it)=>(<Card key={`cat-${k}-${it.id}`} item={it} progress={progressMap[it.id]} onPlus={onPlus} onMinus={onMinus} onMore={setFocus} />)} />
      ))}

      <DetailModal open={!!focus} item={focus} onClose={()=>setFocus(null)} onEdit={openEditFromDetail} />
      <EditOverlay open={!!editing} original={editing} onClose={()=>setEditing(null)} onSaved={applyUpdated} />

      {openAdd && (<AddModal open={openAdd} onClose={()=>setOpenAdd(false)} onCreated={()=>{fetchList(); loadProgress();}} />)}
    </div>
  )
}

/* ========= Add modal (texte optionnel) ========= */
function AddModal({ open, onClose, onCreated }) {
  const [cats,setCats]=useState([])
  const [form,setForm]=useState({ title:'', author:'', language:'', status:'unknown', rating:'', description:'', link:'', cover_image:'', release_day:'', feature_category_id:'' })
  const [err,setErr]=useState('')
  useEffect(()=>{ if(open){ api.get('categories/?ordering=name').then(d=>setCats(Array.isArray(d)?d:(d?.results||[]))).catch(()=>setCats([])); setErr('') } },[open])
  const set=(k,v)=>setForm(s=>({...s,[k]:v}))
  const create = async ()=>{ setErr('')
    try{
      const payload = {
        title: form.title,
        author: form.author,               // "" ok
        language: form.language,           // "" ok
        status: form.status || 'unknown',
        rating: form.rating === '' ? null : Number(form.rating),
        description: form.description,     // "" ok
        link: form.link,                   // "" ok
        cover_image: form.cover_image,     // "" ok
        release_day: form.release_day,     // "" ok
        feature_category_id: form.feature_category_id || null
      }
      await api.post('contents/', payload, true)
      onCreated && onCreated(); onClose()
    }catch(e){ setErr(String(e.message||e)); alert('Échec de la création.') }
  }
  if(!open) return null
  return (
    <div className="edit-overlay">
      <div className="edit-modal pop" style={{gridTemplateColumns:'1fr'}}>
        <div className="edit-header"><div className="edit-title">Rajouter</div><button className="btn ghost" onClick={onClose}>Fermer</button></div>
        <div className="form">
          <input className="input" placeholder="Titre *" value={form.title} onChange={(e)=>set('title', e.target.value)} required />
          <select className="select" value={form.feature_category_id} onChange={(e)=>set('feature_category_id', e.target.value)}><option value="">Catégorie…</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input className="input" placeholder="Auteur" value={form.author} onChange={(e)=>set('author', e.target.value)} />
          <input className="input" placeholder="Langue" value={form.language} onChange={(e)=>set('language', e.target.value)} />
          <select className="select" value={form.status} onChange={(e)=>set('status', e.target.value)}><option value="unknown">Inconnu</option><option value="ongoing">En cours</option><option value="completed">Terminé</option><option value="hiatus">En pause</option></select>
          <input className="input" type="number" step="0.01" placeholder="Note" value={form.rating} onChange={(e)=>set('rating', e.target.value)} />
          <input className="input" placeholder="Cover URL" value={form.cover_image} onChange={(e)=>set('cover_image', e.target.value)} />
          <input className="input" placeholder="Lien" value={form.link} onChange={(e)=>set('link', e.target.value)} />
          <textarea className="textarea" placeholder="Description" value={form.description} onChange={(e)=>set('description', e.target.value)} />
          <input className="input" placeholder="Jour de sortie" value={form.release_day} onChange={(e)=>set('release_day', e.target.value)} />
          {err && <div style={{ gridColumn:'1/-1', color:'#fca5a5', fontSize:12 }}>{err}</div>}
        </div>
        <div className="footer-actions"><button className="btn primary" onClick={create}>Créer</button></div>
      </div>
    </div>
  )
}

function groupByCategory(all){ const g={}; for(const it of all||[]){ const name=it?.feature_category?.name||'Divers'; (g[name]??=[]).push(it) } return g }
