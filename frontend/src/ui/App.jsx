import React, { useEffect, useMemo, useRef, useState } from 'react'

/* ========= Config & helpers ========= */
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
const safe = (s) => (s ?? '').toString()
const lower = (s) => safe(s).toLowerCase()
const getToken = () => localStorage.getItem('token') || ''
const setToken = (t) => localStorage.setItem('token', t)

async function request(method, path, body, withAuth = false) {
  const headers = { 'Content-Type': 'application/json' }
  if (withAuth) {
    const tk = getToken()
    if (!tk) throw new Error('Non authentifié')
    headers['Authorization'] = `Bearer ${tk}`
  }
  const res = await fetch(`${API_BASE}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { const j = await res.json(); msg += ` • ${JSON.stringify(j)}` } catch {}
    throw new Error(msg)
  }
  // 204 No Content
  if (res.status === 204) return null
  try { return await res.json() } catch { return null }
}
const api = {
  get: (p, auth=false) => request('GET', p, null, auth),
  post: (p, b, auth=false) => request('POST', p, b, auth),
  patch: (p, b, auth=false) => request('PATCH', p, b, auth),
}

const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: '2-digit', month: '2-digit', day: '2-digit' })
}

/* ========= UI: Navbar ========= */
function Navbar({ q, setQ, onOpenAdd, onAuthChange }) {
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [connected, setConnected] = useState(!!getToken())

  const login = async () => {
    const j = await api.post('auth/jwt/create/', { username: u, password: p })
    setToken(j.access)
    setConnected(true)
    setU(''); setP('')
    onAuthChange && onAuthChange()
  }
  const logout = () => {
    localStorage.removeItem('token')
    setConnected(false)
    onAuthChange && onAuthChange()
  }

  return (
    <div className="nav">
      <div className="logo">WEBTOONFLIX</div>
      <div className="links">
        <a href="#" onClick={(e)=>e.preventDefault()}>Accueil</a>
        <a href="#" onClick={(e)=>e.preventDefault()}>Catégories</a>
        <a href="#" onClick={(e)=>{e.preventDefault(); onOpenAdd()}}>Rajouter</a>
      </div>
      <div className="search">
        <input value={q} onChange={(e)=>setQ(e.target.value ?? '')} placeholder="Rechercher..." />
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

/* ========= UI: Hero ========= */
function Hero({ item, onRead, onMore }) {
  const bg = item?.cover_image || ''
  return (
    <section className="hero">
      <div className="bg" style={{ backgroundImage: `url(${bg})` }} />
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

/* ========= UI: Card (entièrement cliquable) ========= */
function Card({ item, progress, onPlus, onMinus, onMore }) {
  const bg = item.cover_image || ''
  return (
    <div className="card" title={item.title} onClick={() => onMore(item)}>
      <div className="cover" style={{ backgroundImage: `url(${bg})` }} />
      <div className="shade" />

      <div className="badge">Ch. {progress?.last_chapter ?? '—'}</div>

      <div className="controls">
        <button className="chipbtn" onClick={(e) => { e.stopPropagation(); onMinus(item) }}>-</button>
        <button className="chipbtn" onClick={(e) => { e.stopPropagation(); onPlus(item) }}>+</button>
      </div>

      <div className="datepill">{fmtDate(progress?.last_read_at)}</div>

      <div className="meta">
        <div className="title">{item.title}</div>
        <div className="muted">{item.language || '—'} • {item.feature_category?.name || '—'}</div>
      </div>
    </div>
  )
}

/* ========= UI: Row ========= */
function Row({ title, items, renderCard }) {
  return (
    <div className="section">
      <div className="row">
        <h3>{title}</h3>
        <div className="rail">
          {items.map(renderCard)}
        </div>
      </div>
    </div>
  )
}

/* ========= UI: Modales ========= */
function DetailModal({ open, item, onClose, onEdit }) {
  const ref = useRef()
  const [latest, setLatest] = useState(null)

  useEffect(() => { open ? ref.current?.showModal() : ref.current?.close() }, [open])
  useEffect(() => {
    if (open && item?.id) {
      fetch(`${API_BASE}/chapters/?content=${item.id}&ordering=-created_at`)
        .then(r => r.ok ? r.json() : [])
        .then(d => setLatest(Array.isArray(d) ? (d[0] || null) : (d?.results?.[0] || null)))
        .catch(() => setLatest(null))
    }
  }, [open, item?.id])

  if (!item) return null
  return (
    <dialog ref={ref} onClose={onClose}>
      <div className="modal">
        <div className="bigcover" style={{ backgroundImage: `url(${item.cover_image || ''})` }} />
        <div>
          <h2 style={{ margin: '0 0 6px 0' }}>{item.title}</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {item.feature_category?.name && <span className="tag">{item.feature_category.name}</span>}
            {item.language && <span className="tag">{item.language}</span>}
            {item.status && <span className="tag">{item.status}</span>}
            {item.rating != null && <span className="tag">★ {item.rating}</span>}
          </div>
          <p style={{ opacity: .9, marginTop: 0 }}>{(item.description || '').slice(0, 400) || '—'}</p>
          <p className="muted" style={{ marginTop: 6 }}>Dernier chapitre (global) : {latest?.chapter_number ?? '—'}</p>
          <div className="buttons" style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            {item.link && <a className="btn primary" href={item.link} target="_blank">Lire</a>}
            <button className="btn secondary" onClick={() => onEdit(item)}>Modifier</button>
            <button className="btn secondary" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

function EditModal({ open, item, onClose, onSaved }) {
  const ref = useRef()
  const [cats, setCats] = useState([])
  const [form, setForm] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => { open ? ref.current?.showModal() : ref.current?.close() }, [open])
  useEffect(() => {
    if (open && item) {
      setForm({
        title: item.title || '',
        language: item.language || '',
        status: item.status || 'unknown',
        description: item.description || '',
        cover_image: item.cover_image || '',
        link: item.link || '',
        feature_category_id: item.feature_category?.id || '',
        my_last_chapter: '',
        my_last_read_at: ''     // 'YYYY-MM-DD'
      })
      api.get('categories/?ordering=name')
        .then((d) => setCats(Array.isArray(d) ? d : (d?.results || [])))
        .catch(() => setCats([]))
    }
  }, [open, item])

  const update = (k, v) => setForm(s => ({ ...s, [k]: v }))

  const save = async () => {
    setErr('')
    try {
      // 1) PATCH du contenu
      await api.patch(`contents/${item.id}/`, {
        title: form.title,
        language: form.language,
        status: form.status,
        description: form.description,
        cover_image: form.cover_image,
        link: form.link,
        feature_category_id: form.feature_category_id || null
      }, true)

      // 2) Progress perso (optionnel)
      if (form.my_last_chapter || form.my_last_read_at) {
        const body = {}
        if (form.my_last_chapter) {
          const parsed = parseInt(form.my_last_chapter, 10)
          if (!isNaN(parsed)) body["chapter"] = parsed
        }
        if (form.my_last_read_at) body["last_read_at"] = `${form.my_last_read_at}T00:00:00Z`
        await api.post(`contents/${item.id}/progress/`, body, true)
      }

      onSaved && onSaved()
      onClose()
    } catch (e) {
      setErr(String(e.message || e))
    }
  }

  if (!item || !form) return null
  return (
    <dialog ref={ref} onClose={onClose}>
      <div className="modal" style={{ gridTemplateColumns: '1fr' }}>
        <h2 style={{ margin: '0 0 8px 0' }}>Modifier l'œuvre</h2>
        <div className="form">
          <input className="input" placeholder="Titre" value={form.title} onChange={e => update('title', e.target.value)} />
          <select className="select" value={form.feature_category_id} onChange={e => update('feature_category_id', e.target.value)}>
            <option value="">Catégorie…</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <input className="input" placeholder="Langue" value={form.language} onChange={e => update('language', e.target.value)} />
          <select className="select" value={form.status} onChange={e => update('status', e.target.value)}>
            <option value="unknown">Inconnu</option>
            <option value="ongoing">En cours</option>
            <option value="completed">Terminé</option>
            <option value="hiatus">En pause</option>
          </select>

          <input className="input" placeholder="Cover URL" value={form.cover_image} onChange={e => update('cover_image', e.target.value)} />
          <input className="input" placeholder="Lien" value={form.link} onChange={e => update('link', e.target.value)} />

          <textarea className="textarea" placeholder="Description" value={form.description} onChange={e => update('description', e.target.value)} />

          <input className="input" placeholder="Mon dernier chapitre (optionnel)" value={form.my_last_chapter} onChange={e => update('my_last_chapter', e.target.value)} />
          <input className="input" type="date" placeholder="Date de dernière lecture" value={form.my_last_read_at} onChange={e => update('my_last_read_at', e.target.value)} />

          {err && <div style={{ gridColumn: '1/-1', color: '#fca5a5', fontSize: 12 }}>{err}</div>}
          <div className="footer-actions" style={{ gridColumn: '1/-1' }}>
            <button className="btn ghost" onClick={onClose}>Annuler</button>
            <button className="btn primary" onClick={save}>Enregistrer</button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

function AddModal({ open, onClose, onCreated }) {
  const ref = useRef()
  const [cats, setCats] = useState([])
  const [form, setForm] = useState({
    title: '',
    author: '',
    language: '',
    status: 'unknown',
    rating: '',
    description: '',
    link: '',
    cover_image: '',
    release_day: '',
    feature_category_id: ''
  })
  const [err, setErr] = useState('')

  useEffect(() => { open ? ref.current?.showModal() : ref.current?.close() }, [open])
  useEffect(() => {
    if (open) {
      api.get('categories/?ordering=name')
        .then((d) => setCats(Array.isArray(d) ? d : (d?.results || [])))
        .catch(() => setCats([]))
      setForm(f => ({ ...f, title: '', author: '', language: '', status: 'unknown', rating: '', description: '', link: '', cover_image: '', release_day: '', feature_category_id: '' }))
      setErr('')
    }
  }, [open])

  const set = (k, v) => setForm(s => ({ ...s, [k]: v }))

  const create = async () => {
    setErr('')
    try {
      const payload = {
        title: form.title,
        author: form.author || null,
        language: form.language || null,
        status: form.status || 'unknown',
        rating: form.rating === '' ? null : Number(form.rating),
        description: form.description || null,
        link: form.link || null,
        cover_image: form.cover_image || null,
        release_day: form.release_day || null,
        feature_category_id: form.feature_category_id || null
      }
      await api.post('contents/', payload, true)  // auth requise si backend protège
      onCreated && onCreated()
      onClose()
    } catch (e) {
      setErr(String(e.message || e))
    }
  }

  if (!open) return null
  return (
    <dialog ref={ref} onClose={onClose}>
      <div className="modal" style={{ gridTemplateColumns: '1fr' }}>
        <h2 style={{ margin: '0 0 8px 0' }}>Rajouter</h2>
        <div className="form">
          <input className="input" placeholder="Titre *" value={form.title} onChange={(e) => set('title', e.target.value)} required />
          <select className="select" value={form.feature_category_id} onChange={(e) => set('feature_category_id', e.target.value)}>
            <option value="">Catégorie…</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <input className="input" placeholder="Auteur" value={form.author} onChange={(e) => set('author', e.target.value)} />
          <input className="input" placeholder="Langue" value={form.language} onChange={(e) => set('language', e.target.value)} />

          <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="unknown">Inconnu</option>
            <option value="ongoing">En cours</option>
            <option value="completed">Terminé</option>
            <option value="hiatus">En pause</option>
          </select>
          <input className="input" type="number" step="0.01" placeholder="Note (optionnel)" value={form.rating} onChange={(e) => set('rating', e.target.value)} />

          <input className="input" placeholder="Cover URL" value={form.cover_image} onChange={(e) => set('cover_image', e.target.value)} />
          <input className="input" placeholder="Lien" value={form.link} onChange={(e) => set('link', e.target.value)} />

          <textarea className="textarea" placeholder="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />

          <input className="input" placeholder="Jour de sortie" value={form.release_day} onChange={(e) => set('release_day', e.target.value)} />

          {err && <div style={{ gridColumn: '1/-1', color: '#fca5a5', fontSize: 12 }}>{err}</div>}
          <div className="footer-actions" style={{ gridColumn: '1/-1' }}>
            <button className="btn ghost" onClick={onClose}>Annuler</button>
            <button className="btn primary" onClick={create}>Créer</button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

/* ========= App ========= */
export default function App() {
  const [q, setQ] = useState('')
  const [all, setAll] = useState([])
  const [hero, setHero] = useState(null)
  const [focus, setFocus] = useState(null)
  const [editing, setEditing] = useState(null)
  const [openAdd, setOpenAdd] = useState(false)
  const [progressMap, setProgressMap] = useState({}) // id -> progress

  const fetchList = async () => {
    try {
      const d = await api.get('contents/?ordering=title')
      const items = Array.isArray(d) ? d : (d?.results || [])
      setAll(items)
      if (items.length) setHero(items[Math.floor(Math.random() * items.length)])
    } catch (e) { console.error(e) }
  }

  const loadProgress = async () => {
    const tk = getToken()
    if (!tk) { setProgressMap({}); return }
    try {
      const mine = await api.get('progress/mine/', true)
      const m = {}
      for (const p of (mine || [])) m[p.content] = p
      setProgressMap(m)
    } catch { setProgressMap({}) }
  }

  useEffect(() => { fetchList() }, [])
  useEffect(() => { loadProgress() }, [])

  const results = useMemo(() => {
    const s = lower(q.trim())
    if (!s) return []
    return (all || []).filter(it =>
      lower(it.title).includes(s) ||
      lower(it.description).includes(s) ||
      lower(it.language).includes(s) ||
      lower(it.feature_category?.name).includes(s)
    ).slice(0, 40)
  }, [q, all])

  const bump = async (item, delta) => {
    const tk = getToken()
    if (!tk) return alert('Connecte-toi pour modifier ta progression.')
    try {
      const res = await api.post(`contents/${item.id}/progress/`, { delta }, true)
      setProgressMap(m => ({ ...m, [item.id]: res }))
    } catch (e) { alert('Impossible de mettre à jour la progression.'); console.error(e) }
  }
  const onPlus = (it) => bump(it, +1)
  const onMinus = (it) => bump(it, -1)

  return (
    <div className="app">
      <Navbar q={q} setQ={setQ} onOpenAdd={() => setOpenAdd(true)} onAuthChange={() => { loadProgress() }} />
      <Hero item={hero} onRead={(it) => window.open(it.link, '_blank')} onMore={setFocus} />

      {q && (
        results.length
          ? <Row title={`Résultats pour "${q}"`} items={results}
              renderCard={(it) => (
                <Card
                  key={`search-${it.id}`}
                  item={it}
                  progress={progressMap[it.id]}
                  onPlus={onPlus}
                  onMinus={onMinus}
                  onMore={setFocus}
                />
              )} />
          : <div className="row"><p>Aucun résultat pour “{q}”.</p></div>
      )}

      {Object.entries(groupByCategory(all)).map(([k, items]) => (
        <Row key={k} title={k} items={items}
          renderCard={(it) => (
            <Card
              key={`cat-${k}-${it.id}`}
              item={it}
              progress={progressMap[it.id]}
              onPlus={onPlus}
              onMinus={onMinus}
              onMore={setFocus}
            />
          )}
        />
      ))}

      <DetailModal open={!!focus} item={focus} onClose={() => setFocus(null)} onEdit={setEditing} />
      <EditModal open={!!editing} item={editing} onClose={() => setEditing(null)} onSaved={() => { fetchList(); loadProgress(); }} />
      <AddModal open={openAdd} onClose={() => setOpenAdd(false)} onCreated={() => { fetchList(); loadProgress(); }} />
    </div>
  )
}

function groupByCategory(all) {
  const g = {}
  for (const it of all || []) {
    const name = it?.feature_category?.name || 'Divers'
    if (!g[name]) g[name] = []
    g[name].push(it)
  }
  return g
}
