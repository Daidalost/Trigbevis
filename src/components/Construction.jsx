import { useEffect, useMemo, useRef, useState } from 'react'
import { Rich } from './Tex.jsx'
import { U, R_START, TH_MIN, TH_MAX, K_START, K_MIN, K_MAX, rad, polar, fit, trayLayout, isNarrow } from '../lib/geometry.js'

// ---------- Konstanter ----------
// Skriftstørrelse i forhold til figurens bredde (så teksten er lige stor ved zoom)
const EM = { 'cos(A)': 3.0, 'sin(A)': 2.85, 1: 0.62, a: 0.62, b: 0.62, c: 0.62, A: 0.8, B: 0.8, C: 0.8 }

const CHIPS = {
  labels3: [
    { id: 'cos3', text: 'cos(A)' },
    { id: 'sin3', text: 'sin(A)' },
  ],
  letters: [
    { id: 'A', text: 'A' },
    { id: 'B', text: 'B' },
    { id: 'C', text: 'C' },
  ],
  lengths: [
    { id: 'l1', text: '1' },
    { id: 'lcos', text: 'cos(A)' },
    { id: 'lsin', text: 'sin(A)' },
    { id: 'la', text: 'a' },
    { id: 'lb', text: 'b' },
    { id: 'lc', text: 'c' },
  ],
}
const ALL_CHIPS = Object.fromEntries(Object.values(CHIPS).flat().map((c) => [c.id, c]))

// Forklaringer, når et mærke lægges forkert
const WHY = {
  cos3: '$\\cos(A)$ er førstekoordinaten til $P$ – altså den vandrette side.',
  sin3: '$\\sin(A)$ er andenkoordinaten til $P$ – altså den lodrette side.',
  A: '$A$ er spidsen ved vinkel $A$ – i origo.',
  B: '$B$ er den øverste spids – den ligger på linjen gennem $P$.',
  C: '$C$ er spidsen ved den rette vinkel.',
  l1: '$1$ er radius i enhedscirklen – altså hypotenusen i den lille trekant.',
  lcos: '$\\cos(A)$ er den vandrette katete i den lille trekant. Den ligger ved vinkel $A$.',
  lsin: '$\\sin(A)$ er den lodrette katete i den lille trekant. Den ligger over for vinkel $A$.',
  la: '$a$ er kateten over for vinkel $A$ i trekant $ABC$ – fra $B$ til $C$.',
  lb: '$b$ er kateten fra $A$ til $C$ – den ligger ved vinkel $A$.',
  lc: '$c$ er hypotenusen i trekant $ABC$ – over for den rette vinkel.',
}
const SMALL_SET = new Set(['l1', 'lcos', 'lsin'])

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
const r2 = (x) => Math.round(x * 100) / 100
const dec = (x, d = 2) => x.toFixed(d).replace('.', ',')

// ---------- Tekst med matematik i SVG ----------
function MathText({ text, x, y, className = '', anchor }) {
  const fn = /^(cos|sin)\(A\)$/.exec(text)
  const style = anchor ? { textAnchor: anchor } : undefined
  if (fn) {
    return (
      <text x={x} y={y} className={`lbl ${className}`} style={style}>
        {fn[1]}(<tspan className="it">A</tspan>)
      </text>
    )
  }
  const it = /^[a-zA-Z]$/.test(text)
  return (
    <text x={x} y={y} className={`lbl ${it ? 'it' : ''} ${className}`} style={style}>
      {text}
    </text>
  )
}

/** Mærke-positioner ved siderne i en trekant med vinkel A i (0,0), vandret katete w og højde h */
function sideTargets(layer, w, h, accepts, fs, theta) {
  const si = Math.sin(rad(theta))
  const co = Math.cos(rad(theta))
  const out = []
  if (accepts.adj) out.push({ id: `${layer}-adj`, layer, accepts: accepts.adj, x: w / 2, y: fs * 1.05 })
  if (accepts.opp) {
    const tw = EM[ALL_CHIPS[accepts.opp].text] * fs
    out.push({ id: `${layer}-opp`, layer, accepts: accepts.opp, x: w + fs * 0.45 + tw / 2, y: -h / 2 })
  }
  if (accepts.hyp) {
    const tw = EM[ALL_CHIPS[accepts.hyp].text] * fs
    const d = fs * 0.75 + tw * 0.25
    out.push({ id: `${layer}-hyp`, layer, accepts: accepts.hyp, x: w / 2 - si * d, y: -h / 2 - co * d })
  }
  return out
}

// ---------- Animeret viewBox ----------
function useAnimatedViewBox(target) {
  const [vb, setVb] = useState(target)
  const cur = useRef(vb)
  cur.current = vb
  const key = target.map((v) => v.toFixed(3)).join(',')
  useEffect(() => {
    const from = [...cur.current]
    if (from.map((v) => v.toFixed(3)).join(',') === key) return
    if (reduceMotion()) {
      setVb(target)
      return
    }
    const t0 = performance.now() + 120
    const dur = 850
    let raf
    const tick = (now) => {
      const k = clamp((now - t0) / dur, 0, 1)
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
      setVb(from.map((f, i) => f + (target[i] - f) * e))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return vb
}

export default function Construction({ step, variant, onComplete }) {
  const [narrow] = useState(isNarrow)
  const FS_K = narrow ? 0.04 : 0.026
  const aspect = narrow ? 1.05 : 1.6
  // Trin 1: passer
  const [radius, setRadius] = useState(R_START)
  const [compassAt, setCompassAt] = useState([R_START * U, 0])
  const [circleOk, setCircleOk] = useState(false)
  // Trin 2: punktet P
  const [theta, setTheta] = useState(0)
  // Trin 3 og 4: lodrette linjer og den store trekant
  const [dropP, setDropP] = useState(null)
  const [dropPOk, setDropPOk] = useState(false)
  const [k, setK] = useState(K_START)
  const [kOk, setKOk] = useState(false)
  const [dropB, setDropB] = useState(null)
  const [dropBOk, setDropBOk] = useState(false)
  // Mærker (trin 3, 4, 6) og trekanter (trin 5)
  const [chipPos, setChipPos] = useState({})
  const [placed, setPlaced] = useState({}) // chipId -> targetId
  const [tri, setTri] = useState({ small: [0, 0], big: [0, 0] })
  const [triOk, setTriOk] = useState({ small: false, big: false })
  const [wrongs, setWrongs] = useState({})
  const [msg, setMsg] = useState(null)
  const [active, setActive] = useState(null)

  const svgRef = useRef(null)
  const dragRef = useRef(null)

  // ---------- Geometri ----------
  const co = Math.cos(rad(theta))
  const si = Math.sin(rad(theta))
  const P = polar(1, theta)
  const Bp = polar(k, theta)
  const w1 = U * co
  const h1 = U * si
  const wk = k * U * co
  const hk = k * U * si
  const tray = useMemo(() => trayLayout(theta, k), [theta, k])

  // ---------- Fase og udsnit ----------
  const phase =
    step === 1 ? 'compass'
    : step === 2 ? 'point'
    : step === 3 ? (dropPOk ? 'labels3' : 'dropP')
    : step === 4 ? (!dropBOk ? 'scale' : 'letters')
    : step === 5 ? 'separate'
    : step === 6 ? 'lengths'
    : 'algebra'

  const target = useMemo(() => {
    if (step <= 2) return fit([-5.4, -5.4, 5.4, 5.4], 'center', aspect)
    if (step === 3) return fit([-5.4, -5.4, narrow ? 9.5 : 11.5, 5.4], 'left', aspect)
    if (step === 4) {
      const [bx, by] = polar(K_MAX, theta)
      return fit([-5.4, Math.min(-5.4, by - 1.6), Math.max(5.4, bx + 1.5) + 5, 2.8], 'left', aspect)
    }
    if (step === 5) return fit([-5.4, Math.min(-5.4, tray.top - 1.8), tray.xEnd, 2.8], 'left', aspect)
    if (step === 6) return fit([tray.x0 - 1.5, tray.top - 1.6, tray.xEnd - 0.5, narrow ? 5.2 : 4.2], 'center', aspect)
    return fit([tray.x0 - 1.5, tray.top - 1.6, tray.xEnd - 0.5, 2.2], 'center', aspect)
  }, [step, theta, tray, narrow, aspect])
  const vb = useAnimatedViewBox(target)
  const fs = vb[2] * FS_K // skriftstørrelse lige nu (følger zoomet)
  const fsT = target[2] * FS_K // skriftstørrelse i det udsnit, der zoomes hen til

  // ---------- Mærkernes pladser og startpladser ----------
  const targets = useMemo(() => {
    const t = []
    t.push(...sideTargets('fig', w1, h1, { adj: 'cos3', opp: 'sin3' }, fsT, theta))
    t.push(
      { id: 'v-A', layer: 'big', accepts: 'A', x: -fsT * 0.8, y: fsT * 0.6 },
      { id: 'v-B', layer: 'big', accepts: 'B', x: wk + fsT * 0.15, y: -hk - fsT * 0.85 },
      { id: 'v-C', layer: 'big', accepts: 'C', x: wk + fsT * 0.75, y: fsT * 0.65 },
    )
    t.push(...sideTargets('small', w1, h1, { adj: 'lcos', opp: 'lsin', hyp: 'l1' }, fsT, theta))
    t.push(...sideTargets('big', wk, hk, { adj: 'lb', opp: 'la', hyp: 'lc' }, fsT, theta))
    return t
  }, [w1, h1, wk, hk, fsT, theta])

  const homes = useMemo(() => {
    const h = {}
    const right = target[0] + target[2]
    // trin 3: til højre for cirklen
    CHIPS.labels3.forEach((c, i) => (h[c.id] = [right - 2.6 * fsT - 0.6, -1.2 + i * 2.4]))
    // trin 4: i en søjle til højre for den store trekant
    CHIPS.letters.forEach((c, i) => (h[c.id] = [right - 1.6 * fsT - 0.5, -3 + i * 2.2]))
    // trin 6: i en række under trekanterne
    let x = tray.x0 - 1
    let y = 2.9
    CHIPS.lengths.forEach((c) => {
      const w = (EM[c.text] + 1.1) * fsT
      if (x + w > right - 0.3) {
        x = tray.x0 - 1
        y += 2.3 * fsT
      }
      h[c.id] = [x + w / 2, y]
      x += w + 0.9 * fsT
    })
    return h
  }, [target, fsT, tray])

  const layerOffset = (layer) => (layer === 'small' ? tri.small : layer === 'big' ? tri.big : [0, 0])
  const globalOf = (t) => {
    const o = layerOffset(t.layer)
    return [o[0] + t.x, o[1] + t.y]
  }
  const chipAt = (id) => chipPos[id] || homes[id]
  const visibleChips = phase === 'labels3' ? CHIPS.labels3 : phase === 'letters' ? CHIPS.letters : phase === 'lengths' ? CHIPS.lengths : []

  // ---------- Videre til næste trin ----------
  const allPlaced = (list) => list.every((c) => placed[c.id])
  useEffect(() => {
    if (step === 1 && circleOk) onComplete(1)
    if (step === 3 && allPlaced(CHIPS.labels3)) onComplete(3)
    if (step === 4 && allPlaced(CHIPS.letters)) onComplete(4)
    if (step === 5 && triOk.small && triOk.big) onComplete(5)
    if (step === 6 && allPlaced(CHIPS.lengths)) onComplete(6)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, circleOk, placed, triOk])

  useEffect(() => setMsg(null), [step])

  // ---------- Træk ----------
  function toSvg(e) {
    const svg = svgRef.current
    const m = svg?.getScreenCTM()
    if (!m) return [0, 0]
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const r = pt.matrixTransform(m.inverse())
    return [r.x, r.y]
  }

  function move(d, [x, y]) {
    switch (d.kind) {
      case 'compass': {
        const r = clamp(Math.hypot(x, y) / U, 0.2, 1.3)
        const a = Math.atan2(y, x)
        setRadius(r)
        setCompassAt([r * U * Math.cos(a), r * U * Math.sin(a)])
        break
      }
      case 'point': {
        const deg = (Math.atan2(-y, x) * 180) / Math.PI
        setTheta(Math.round(clamp(deg, 0, 85)))
        break
      }
      case 'dropP':
        setDropP(clamp(y, P[1], 2.2 * fsT))
        break
      case 'dropB':
        setDropB(clamp(y, Bp[1], 2.2 * fsT))
        break
      case 'scale': {
        const t = (x * co - y * si) / U // projektion ind på linjen gennem P
        setK(r2(clamp(t, 1.15, K_MAX)))
        break
      }
      case 'chip':
        setChipPos((c) => ({ ...c, [d.id]: [x, y] }))
        break
      case 'tri':
        if (!triOk[d.id]) setTri((t) => ({ ...t, [d.id]: [x, y] }))
        break
      default:
    }
  }

  function release(d) {
    switch (d.kind) {
      case 'compass':
        if (Math.abs(radius - 1) < 0.09) {
          setRadius(1)
          setCompassAt([U, 0])
          setCircleOk(true)
          setMsg(null)
        } else {
          setMsg(
            radius < 1
              ? `Radius er ${dec(radius)}. Enhedscirklen har radius 1 – træk længere ud.`
              : `Radius er ${dec(radius)}. Enhedscirklen har radius 1 – træk ind igen.`,
          )
        }
        break
      case 'point':
        setMsg(
          theta < TH_MIN
            ? `Træk punktet længere op – vinklen skal være mindst ${TH_MIN}°.`
            : theta > TH_MAX
              ? `Træk punktet lidt ned – vinklen må højst være ${TH_MAX}°.`
              : null,
        )
        break
      case 'dropP':
        if (Math.abs(dropP ?? P[1]) < 1.1 * fsT) {
          setDropP(0)
          setDropPOk(true)
          setMsg(null)
        } else {
          setDropP(null)
          setMsg('Træk linjen helt ned til x-aksen.')
        }
        break
      case 'dropB':
        if (Math.abs(dropB ?? Bp[1]) < 1.1 * fsT) {
          setDropB(0)
          setDropBOk(true)
          setMsg(null)
        } else {
          setDropB(null)
          setMsg('Træk linjen helt ned til x-aksen.')
        }
        break
      case 'scale':
        if (k >= K_MIN) {
          setKOk(true)
          setMsg(null)
        } else {
          setKOk(false)
          setMsg('Træk længere ud, så den nye trekant bliver tydeligt større end den lille.')
        }
        break
      case 'chip':
        dropChip(d.id)
        break
      case 'tri': {
        const goal = tray[d.id]
        const cur = tri[d.id]
        if (Math.hypot(cur[0] - goal[0], cur[1] - goal[1]) < 3 * fsT) {
          setTri((t) => ({ ...t, [d.id]: goal }))
          setTriOk((o) => ({ ...o, [d.id]: true }))
          setMsg(null)
        }
        break
      }
      default:
    }
  }

  function dropChip(id) {
    const [x, y] = chipAt(id)
    const open = targets.filter(
      (t) => !Object.values(placed).includes(t.id) && visibleChips.some((c) => c.id === t.accepts),
    )
    let best = null
    for (const t of open) {
      const [gx, gy] = globalOf(t)
      const dist = Math.hypot(x - gx, y - gy)
      if (dist < 2.3 * fsT && (!best || dist < best.dist)) best = { t, dist }
    }
    if (!best) return
    if (best.t.accepts === id) {
      setPlaced((p) => ({ ...p, [id]: best.t.id }))
      setMsg(null)
      return
    }
    // Forkert plads: send mærket tilbage og forklar
    const n = (wrongs[id] || 0) + 1
    setWrongs((w) => ({ ...w, [id]: n }))
    setChipPos((c) => {
      const next = { ...c }
      delete next[id]
      return next
    })
    let why = WHY[id]
    if (phase === 'lengths') {
      const wantsSmall = SMALL_SET.has(id)
      if (wantsSmall && best.t.layer === 'big') why = '$1$, $\\cos(A)$ og $\\sin(A)$ er længderne i den lille trekant fra enhedscirklen.'
      if (!wantsSmall && best.t.layer === 'small') why = '$a$, $b$ og $c$ er siderne i den store trekant $ABC$.'
    }
    setMsg(n >= 2 ? why : 'Den passer ikke her. Prøv igen.')
  }

  function begin(e, d, at) {
    e.preventDefault()
    e.stopPropagation()
    const [x, y] = toSvg(e)
    dragRef.current = { ...d, pid: e.pointerId, ox: x - at[0], oy: y - at[1] }
    svgRef.current?.setPointerCapture?.(e.pointerId)
    setActive(`${d.kind}:${d.id ?? ''}`)
    setMsg(null)
  }
  function onMove(e) {
    const d = dragRef.current
    if (!d || e.pointerId !== d.pid) return
    const [x, y] = toSvg(e)
    move(d, [x - d.ox, y - d.oy])
  }
  function onUp(e) {
    const d = dragRef.current
    if (!d || e.pointerId !== d.pid) return
    dragRef.current = null
    setActive(null)
    release(d)
  }

  /** Tastatur: piletaster flytter, Enter slipper */
  function keys(d, at) {
    return (e) => {
      const s = e.shiftKey ? 1.5 : 0.3
      let dx = 0
      let dy = 0
      if (e.key === 'ArrowLeft') dx = -s
      else if (e.key === 'ArrowRight') dx = s
      else if (e.key === 'ArrowUp') dy = -s
      else if (e.key === 'ArrowDown') dy = s
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        release(d)
        return
      } else return
      e.preventDefault()
      if (d.kind === 'point') {
        setTheta((t) => clamp(t + (dx > 0 || dy < 0 ? 1 : -1) * (e.shiftKey ? 5 : 1), 0, 85))
        return
      }
      if (d.kind === 'scale') {
        setK((v) => r2(clamp(v + (dx > 0 || dy < 0 ? 0.05 : -0.05), 1.15, K_MAX)))
        return
      }
      move(d, [at[0] + dx, at[1] + dy])
    }
  }

  const handleProps = (d, at, label) => ({
    tabIndex: 0,
    role: 'button',
    'aria-label': label,
    onPointerDown: (e) => begin(e, d, at),
    onKeyDown: keys(d, at),
  })

  // ---------- Tegning ----------
  const sepDone = step > 5
  const showSmall = dropPOk
  const showBig = dropBOk
  const xAxisEnd = step >= 4 ? Math.max(5, U * K_MAX * co + 1) : 5
  const yAxisEnd = step >= 4 ? Math.max(5, U * K_MAX * si + 1) : 5
  const arcR = 1.5 * fsT
  const arc = (r) => {
    const [x, y] = polar(r / U, theta)
    return `M${r} 0 A${r} ${r} 0 0 0 ${x} ${y}`
  }
  const thetaOk = theta >= TH_MIN && theta <= TH_MAX
  const showCoord = step === 3 && allPlaced(CHIPS.labels3)
  // Trin 7: hypotenuserne fremhæves (trin 8 afslører ikke, hvilke kateter der skal bruges)
  const hl = step === 7 ? 'hyp' : null

  function handle({ at, d, label, arrow }) {
    const isActive = active === `${d.kind}:${d.id ?? ''}`
    return (
      <g key={d.kind} className={`handle${isActive ? ' is-active' : ''}`} transform={`translate(${at[0]} ${at[1]})`} {...handleProps(d, at, label)}>
        <circle className="handle-hit" r={fs * 1.5} />
        <circle className="handle-pulse" r={fs * 0.55} />
        <circle className="handle-dot" r={fs * 0.55} />
        {arrow && <path className="handle-arrow" d={`M${-fs * 0.25} ${-fs * 0.05} L0 ${fs * 0.25} L${fs * 0.25} ${-fs * 0.05}`} />}
      </g>
    )
  }

  function piece(id) {
    const small = id === 'small'
    const w = small ? w1 : wk
    const h = small ? h1 : hk
    const off = tri[id]
    const draggable = step === 5 && !triOk[id]
    const ra = Math.min(0.55 * fs, w * 0.3)
    const pts = `0,0 ${w},0 ${w},${-h}`
    const lifted = active === `tri:${id}`
    const cls = ['piece', `piece-${id}`, draggable && 'is-draggable', lifted && 'is-lifted', triOk[id] && 'is-placed']
      .filter(Boolean)
      .join(' ')
    return (
      <g
        key={id}
        className={cls}
        transform={`translate(${off[0]} ${off[1]})`}
        {...(draggable
          ? handleProps({ kind: 'tri', id }, off, small ? 'Den lille trekant. Træk den ud til højre.' : 'Trekant ABC. Træk den ud til højre.')
          : {})}
      >
        <polygon className="tri" points={pts} />
        <line className={`side side-adj${hl === 'adj' ? ' is-hl' : ''}`} x1="0" y1="0" x2={w} y2="0" />
        <line className={`side side-opp${hl === 'opp' ? ' is-hl' : ''}`} x1={w} y1="0" x2={w} y2={-h} />
        <line className={`side side-hyp${hl === 'hyp' ? ' is-hl' : ''}`} x1="0" y1="0" x2={w} y2={-h} />
        <path className="right-angle" d={`M${w - ra} 0 V${-ra} H${w}`} />
        {step >= 5 && (
          <>
            <path className="angle-arc" d={`M${1.2 * fs} 0 A${1.2 * fs} ${1.2 * fs} 0 0 0 ${1.2 * fs * co} ${-1.2 * fs * si}`} />
            {small && (
              <MathText text="A" x={2.0 * fs * Math.cos(rad(theta / 2))} y={-2.0 * fs * Math.sin(rad(theta / 2))} className="angle-name" />
            )}
          </>
        )}
        {Object.entries(placed).map(([cid, tid]) => {
          const t = targets.find((q) => q.id === tid)
          if (!t || t.layer !== id) return null
          const isVertex = t.id.startsWith('v-')
          const lit = !!hl && t.id.endsWith(hl)
          return (
            <MathText
              key={cid}
              text={ALL_CHIPS[cid].text}
              x={t.x}
              y={t.y}
              className={`${isVertex ? 'vertex' : 'side-lbl'}${lit ? ' is-hl' : ''}`}
            />
          )
        })}
      </g>
    )
  }

  // Fasens beskrivelse til skærmlæsere og som hjælpetekst under figuren
  const status = {
    compass: 'Træk det blå punkt, til cirklen har radius 1.',
    point: thetaOk ? `Vinkel A er ${theta}°.` : 'Træk punktet op ad cirklen.',
    dropP: 'Træk det blå punkt ved P lodret ned til x-aksen.',
    labels3: 'Træk mærkerne hen til de rigtige sider.',
    scale: kOk ? 'Træk nu linjen fra det nye punkt lodret ned til x-aksen.' : 'Træk det blå punkt ud ad linjen gennem P.',
    letters: 'Træk bogstaverne A, B og C hen til trekantens hjørner.',
    separate: `${(triOk.small ? 1 : 0) + (triOk.big ? 1 : 0)} af 2 trekanter trukket ud.`,
    lengths: 'Træk længderne hen til de rigtige sider.',
    algebra: null,
  }[phase]

  return (
    <div className="construction">
      <svg
        ref={svgRef}
        className={`figure phase-${phase}${active ? ' is-dragging' : ''}`}
        viewBox={vb.join(' ')}
        style={{ '--fs': fs }}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="group"
        aria-label="Figur med enhedscirklen og trekanter"
      >
        <defs>
          <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
            <path d="M1 0H0V1" fill="none" className="grid-line" />
          </pattern>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className="arrow-head" />
          </marker>
        </defs>
        <rect x="-40" y="-40" width="120" height="100" fill="url(#grid)" />

        {/* ---------- Enhedscirklen og koordinatsystemet ---------- */}
        <g className={`fig-layer${step >= 7 ? ' is-hidden' : sepDone ? ' is-faded' : ''}`}>
          <line className="axis" x1={-5} y1="0" x2={xAxisEnd} y2="0" markerEnd="url(#arrow)" />
          <line className="axis" x1="0" y1={5} x2="0" y2={-yAxisEnd} markerEnd="url(#arrow)" />
          <MathText text="x" x={xAxisEnd - 0.1} y={fs * 0.9} className="axis-name" />
          <MathText text="y" x={-fs * 0.7} y={-yAxisEnd + 0.15} className="axis-name" />
          <line className="tick" x1={U} y1={-fs * 0.25} x2={U} y2={fs * 0.25} />
          <line className="tick" x1={-fs * 0.25} y1={-U} x2={fs * 0.25} y2={-U} />
          {step === 2 && theta < 8 ? null : <MathText text="1" x={U + fs * 0.45} y={fs * 0.75} className="tick-lbl" />}
          <MathText text="1" x={-fs * 0.6} y={-U + fs * 0.7} className="tick-lbl" />
          <circle className="origin" r={fs * 0.12} />

          {circleOk ? (
            <circle className="unit-circle" r={U} />
          ) : (
            <>
              <circle className="unit-circle is-draft" r={radius * U} />
              <line className="radius-line" x1="0" y1="0" x2={compassAt[0]} y2={compassAt[1]} />
              <MathText
                text={`r = ${dec(radius)}`}
                x={compassAt[0] / 2}
                y={compassAt[1] / 2 - fs * 0.8}
                className="readout"
              />
            </>
          )}

          {step >= 2 && (
            <>
              {step === 4 && !dropBOk && (
                <line className="ray" x1={P[0]} y1={P[1]} x2={polar(K_MAX + 0.15, theta)[0]} y2={polar(K_MAX + 0.15, theta)[1]} />
              )}
              {step >= 4 && (kOk || step > 4) && (
                <line className="seg" x1={P[0]} y1={P[1]} x2={Bp[0]} y2={Bp[1]} />
              )}
              <line className="seg" x1="0" y1="0" x2={P[0]} y2={P[1]} />
              {theta > 3 && <path className="angle-arc" d={arc(arcR)} />}
              {theta > 3 && (
                <MathText
                  text="A"
                  x={(arcR + fs * 0.8) * Math.cos(rad(theta / 2))}
                  y={-(arcR + fs * 0.8) * Math.sin(rad(theta / 2))}
                  className="angle-name"
                />
              )}
              {step === 2 && theta > 3 && (
                <text className="readout" x={arcR + fs * 2.6} y={-fs * 0.5}>
                  {theta}°
                </text>
              )}
              <circle className="point" cx={P[0]} cy={P[1]} r={fs * 0.17} />
              {!showCoord && (
                <MathText text="P" x={P[0] - si * fs * 0.8} y={P[1] - co * fs * 0.8 - fs * 0.15} className="point-name" />
              )}
              {step >= 3 && <MathText text="1" x={P[0] / 2 - si * fs * 0.7} y={P[1] / 2 - co * fs * 0.7} className="side-lbl" />}
            </>
          )}

          {/* lodret linje fra P */}
          {step >= 3 && (dropPOk || dropP !== null) && (
            <line className={`drop${dropPOk ? '' : ' is-draft'}`} x1={P[0]} y1={P[1]} x2={P[0]} y2={dropPOk ? 0 : dropP} />
          )}
          {step >= 4 && (dropBOk || dropB !== null) && (
            <line className={`drop${dropBOk ? '' : ' is-draft'}`} x1={Bp[0]} y1={Bp[1]} x2={Bp[0]} y2={dropBOk ? 0 : dropB} />
          )}

          {/* koordinaterne til P */}
          {showCoord ? (
            <text className="coord" x={P[0] + fs * 0.5} y={P[1] - fs * 0.85} style={{ textAnchor: 'start' }}>
              <tspan className="it">P</tspan>(cos(<tspan className="it">A</tspan>), sin(<tspan className="it">A</tspan>))
            </text>
          ) : null}

          {/* mærkerne fra trin 3 */}
          {['cos3', 'sin3'].map((cid) => {
            const t = targets.find((q) => q.id === placed[cid])
            return t ? <MathText key={cid} text={ALL_CHIPS[cid].text} x={t.x} y={t.y} className="side-lbl" /> : null
          })}
        </g>

        {/* ---------- Pladserne til højre (trin 5) ---------- */}
        {step === 5 &&
          ['small', 'big'].map((id) => {
            const [x, y] = tray[id]
            const w = id === 'small' ? w1 : wk
            const h = id === 'small' ? h1 : hk
            return <polygon key={id} className="slot" points={`${x},${y} ${x + w},${y} ${x + w},${y - h}`} />
          })}

        {/* ---------- Trekanterne ---------- */}
        {showBig && piece('big')}
        {showSmall && piece('small')}

        {/* ---------- Håndtag ---------- */}
        {phase === 'compass' && !circleOk &&
          handle({ at: compassAt, d: { kind: 'compass' }, label: `Passer, radius ${dec(radius)}. Brug piletasterne og Enter.` })}
        {phase === 'point' &&
          handle({ at: P, d: { kind: 'point' }, label: `Punktet P, vinkel A er ${theta} grader. Brug piletasterne.` })}
        {phase === 'dropP' &&
          handle({ at: [P[0], dropP ?? P[1]], d: { kind: 'dropP' }, arrow: true, label: 'Lodret linje fra P. Træk ned med piletasterne, slip med Enter.' })}
        {phase === 'scale' && !kOk &&
          handle({ at: Bp, d: { kind: 'scale' }, label: 'Nyt punkt på linjen gennem P. Flyt med piletasterne, slip med Enter.' })}
        {phase === 'scale' && kOk &&
          handle({ at: [Bp[0], dropB ?? Bp[1]], d: { kind: 'dropB' }, arrow: true, label: 'Lodret linje fra det nye punkt. Træk ned, slip med Enter.' })}

        {/* ---------- Mærker ---------- */}
        {visibleChips
          .filter((c) => !placed[c.id])
          .map((c) => {
            const at = chipAt(c.id)
            const w = (EM[c.text] + 1.1) * fs
            const h = 1.7 * fs
            const lifted = active === `chip:${c.id}`
            return (
              <g
                key={c.id}
                className={`chip${lifted ? ' is-lifted' : ''}`}
                transform={`translate(${at[0]} ${at[1]})`}
                {...handleProps({ kind: 'chip', id: c.id }, at, `Mærke ${c.text}. Flyt med piletasterne, slip med Enter.`)}
              >
                <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.28} />
                <MathText text={c.text} x={0} y={0} />
              </g>
            )
          })}
      </svg>

      {phase !== 'algebra' && (
        <div className="toolbar">
          {phase === 'point' && (
            <button type="button" className="primary" disabled={!thetaOk} onClick={() => onComplete(2)}>
              Brug punktet{thetaOk ? ` (A = ${theta}°)` : ''}
            </button>
          )}
          <p className="fig-msg" role="status" aria-live="polite">
            <FigMsg text={msg || status} warn={!!msg} />
          </p>
        </div>
      )}
    </div>
  )
}

// Beskeder kan indeholde matematik i $…$
function FigMsg({ text, warn }) {
  if (!text) return null
  return <span className={warn ? 'is-warn' : ''}>{text.includes('$') ? <Rich text={text} /> : text}</span>
}
