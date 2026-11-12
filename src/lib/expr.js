// Læser og regner med elevernes udtryk i a, b, c, cos(A) og sin(A).
// Udtryk omsættes til et syntakstræ, der bruges til
//   – visning (LaTeX) og formkontrol (står der fx en brøk c/1?)
//   – numerisk kontrol af, om to udtryk/ligninger er ensbetydende.

export class ParseError extends Error {
  constructor(msg) {
    super(msg)
    this.name = 'ParseError'
  }
}

// ---------- Tokens ----------
const MINUS = new Set(['-', '−', '–', '—'])
const TIMES = new Set(['*', '·', '×', '⋅', '•'])
const DIVIDE = new Set(['/', '÷', ':'])
const FRAC = { '½': [1, 2], '¼': [1, 4], '¾': [3, 4] }
const SUP = { '²': 2, '³': 3 }

export function tokenize(src) {
  const out = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    const rest = src.slice(i)
    if (/\s/.test(ch)) { i++; continue }

    // cos(A), sin(A) – også cosA, cos A, Cos(A)
    const fn = /^(cos|sin)\s*(\(\s*([A-Za-zvVθ])\s*\)|([A-Za-zvVθ])(?![a-z]))?/i.exec(rest)
    if (fn) {
      const name = fn[1].toLowerCase()
      const arg = fn[3] || fn[4]
      if (!arg) throw new ParseError(`Skriv vinklen efter ${name}, fx ${name}(A).`)
      if (arg !== 'A') throw new ParseError(`Vinklen hedder A (stort bogstav). Skriv ${name}(A).`)
      out.push({ t: 'var', name: name === 'cos' ? 'cosA' : 'sinA' })
      i += fn[0].length
      continue
    }

    const m = /^\d+(?:[.,]\d+)?/.exec(rest)
    if (m) {
      out.push({ t: 'num', raw: m[0], v: parseFloat(m[0].replace(',', '.')) })
      i += m[0].length
      continue
    }
    if (FRAC[ch]) {
      const [n, d] = FRAC[ch]
      out.push({ t: 'num', raw: ch, v: n / d, frac: [n, d] })
    } else if (ch === 'a' || ch === 'b' || ch === 'c' || ch === 'k') {
      out.push({ t: 'var', name: ch })
    } else if (ch === 'A') {
      throw new ParseError('A er vinklen. Skriv cos(A) eller sin(A).')
    } else if (SUP[ch]) {
      out.push({ t: 'sup', exp: SUP[ch] })
    } else if (ch === '+') {
      out.push({ t: 'op', v: '+' })
    } else if (MINUS.has(ch)) {
      out.push({ t: 'op', v: '-' })
    } else if (TIMES.has(ch)) {
      out.push({ t: 'op', v: '*' })
    } else if (DIVIDE.has(ch)) {
      out.push({ t: 'op', v: '/' })
    } else if (ch === '^') {
      out.push({ t: 'op', v: '^' })
    } else if (ch === '(' || ch === '[') {
      out.push({ t: '(' })
    } else if (ch === ')' || ch === ']') {
      out.push({ t: ')' })
    } else if (ch === '=') {
      out.push({ t: '=' })
    } else {
      throw new ParseError(`Tegnet »${ch}« kan ikke bruges her.`)
    }
    i++
  }
  return out
}

// ---------- Parser ----------
// expr    := term (('+' | '-') term)*
// term    := factor (('*' | '/') factor)*        eksplicit gange/division, fra venstre
// factor  := '-' factor | product
// product := power power*                          usynligt gangetegn binder stærkest: b/2c = b/(2c)
// power   := atom ('^' (atom | '-' atom) | '²')*
function parser(tokens) {
  let pos = 0
  const peek = () => tokens[pos]
  const next = () => tokens[pos++]
  const isOp = (v) => peek()?.t === 'op' && peek().v === v

  function expr() {
    let n = term()
    while (isOp('+') || isOp('-')) {
      const op = next().v
      n = { type: op === '+' ? 'add' : 'sub', left: n, right: term() }
    }
    return n
  }
  function term() {
    let n = factor()
    while (isOp('*') || isOp('/')) {
      const op = next().v
      n = { type: op === '*' ? 'mul' : 'div', left: n, right: factor() }
    }
    return n
  }
  function factor() {
    if (isOp('-')) {
      next()
      return { type: 'neg', arg: factor() }
    }
    if (isOp('+')) {
      next()
      return factor()
    }
    return product()
  }
  const startsAtom = (t) => t && (t.t === 'var' || t.t === '(' || t.t === 'num')
  function product() {
    let n = power()
    while (startsAtom(peek()) && !(peek().t === 'num' && n.type !== 'group')) {
      n = { type: 'mul', implicit: true, left: n, right: power() }
    }
    return n
  }
  function power() {
    let n = atom()
    for (;;) {
      if (peek()?.t === 'sup') {
        n = { type: 'pow', base: n, exp: { type: 'num', v: next().exp, raw: '' } }
      } else if (isOp('^')) {
        next()
        let neg = false
        if (isOp('-')) {
          next()
          neg = true
        }
        const e = atom()
        n = { type: 'pow', base: n, exp: neg ? { type: 'neg', arg: e } : e }
      } else break
    }
    return n
  }
  function atom() {
    const t = next()
    if (!t) throw new ParseError('Udtrykket slutter for tidligt.')
    if (t.t === 'num') return { type: 'num', v: t.v, raw: t.raw, frac: t.frac }
    if (t.t === 'var') return { type: 'var', name: t.name }
    if (t.t === '(') {
      if (peek()?.t === ')') throw new ParseError('Der står en tom parentes.')
      const inner = expr()
      if (next()?.t !== ')') throw new ParseError('Der mangler en slutparentes.')
      return { type: 'group', arg: inner }
    }
    if (t.t === ')') throw new ParseError('Der er en slutparentes for meget.')
    if (t.t === '=') throw new ParseError('Der mangler noget foran lighedstegnet.')
    if (t.t === 'sup') throw new ParseError('Potensen mangler et grundtal.')
    throw new ParseError('Der står to regnetegn efter hinanden.')
  }

  return {
    parse() {
      if (!tokens.length) throw new ParseError('Skriv et udtryk.')
      const lhs = expr()
      let rhs = null
      if (peek()?.t === '=') {
        next()
        if (!peek()) throw new ParseError('Der mangler noget efter lighedstegnet.')
        rhs = expr()
      }
      if (peek()) {
        if (peek().t === '=') throw new ParseError('Skriv kun ét lighedstegn.')
        if (peek().t === ')') throw new ParseError('Der er en slutparentes for meget.')
        throw new ParseError('Udtrykket kan ikke læses – mangler der et regnetegn?')
      }
      return { lhs, rhs }
    },
  }
}

/** Returnerer { lhs, rhs } – rhs er null, hvis der ikke er et lighedstegn. */
export function parseInput(src) {
  return parser(tokenize(src)).parse()
}

// ---------- Numerisk værdi ----------
export function evaluate(n, env) {
  switch (n.type) {
    case 'num': return n.v
    case 'var': return env[n.name]
    case 'group': return evaluate(n.arg, env)
    case 'neg': return -evaluate(n.arg, env)
    case 'add': return evaluate(n.left, env) + evaluate(n.right, env)
    case 'sub': return evaluate(n.left, env) - evaluate(n.right, env)
    case 'mul': return evaluate(n.left, env) * evaluate(n.right, env)
    case 'div': return evaluate(n.left, env) / evaluate(n.right, env)
    case 'pow': return Math.pow(evaluate(n.base, env), evaluate(n.exp, env))
    default: throw new Error('ukendt knude ' + n.type)
  }
}

export function uses(n, name) {
  if (n.type === 'var') return n.name === name
  return ['left', 'right', 'arg', 'base', 'exp'].some((k) => n[k] && uses(n[k], name))
}

// Fast "tilfældig" talrække, så kontrollen altid giver samme resultat
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const VARS = ['a', 'b', 'c', 'cosA', 'sinA', 'k']
/** Tilfældige, uafhængige værdier af variablene (cos og sin mellem 0,1 og 0,95). */
export function samples(count = 10, seed = 7) {
  const r = rng(seed)
  return Array.from({ length: count }, () => {
    const env = {}
    for (const v of VARS) env[v] = v === 'cosA' || v === 'sinA' ? 0.1 + 0.85 * r() : 0.4 + 3.1 * r()
    return env
  })
}

const close = (x, y) => Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= 1e-7 * (1 + Math.abs(x) + Math.abs(y))

/** Er to udtryk ens for alle (positive) værdier af variablene? */
export function sameValue(n, m, envs = samples()) {
  let tested = 0
  for (const env of envs) {
    const x = evaluate(n, env)
    const y = evaluate(m, env)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    tested++
    if (!close(x, y)) return false
  }
  return tested > 0
}

/** Hvor mange af punkterne opfylder ligningen L = R? */
export function holdsCount(L, R, envs) {
  let ok = 0
  for (const env of envs) if (close(evaluate(L, env), evaluate(R, env))) ok++
  return ok
}

export const expr = (src) => parseInput(src).lhs

// ---------- Struktur ----------
export const strip = (n) => (n.type === 'group' ? strip(n.arg) : n)
export const isVar = (n, name) => {
  const s = strip(n)
  return s.type === 'var' && s.name === name
}
export const isNum = (n, v) => {
  const s = strip(n)
  return s.type === 'num' && s.v === v
}
/** Er n brøken teller/nævner (med de givne variable/tal)? */
export function isFraction(n, top, bottom) {
  const s = strip(n)
  if (s.type !== 'div') return false
  const match = (x, want) => (typeof want === 'number' ? isNum(x, want) : isVar(x, want))
  return match(s.left, top) && match(s.right, bottom)
}

// ---------- LaTeX ----------
const VAR_TEX = { a: 'a', b: 'b', c: 'c', k: 'k', cosA: '\\cos(A)', sinA: '\\sin(A)' }

function numTex(n) {
  if (n.frac) return `\\tfrac{${n.frac[0]}}{${n.frac[1]}}`
  return String(n.raw || n.v).replace('.', '{,}').replace(/,(?!\})/, '{,}')
}

export function toLatex(n) {
  switch (n.type) {
    case 'num': return numTex(n)
    case 'var': return VAR_TEX[n.name]
    case 'group': return `\\left(${toLatex(n.arg)}\\right)`
    case 'neg': return `-${toLatex(n.arg)}`
    case 'add': return `${toLatex(n.left)}+${toLatex(n.right)}`
    case 'sub': return `${toLatex(n.left)}-${toLatex(n.right)}`
    case 'mul': {
      const L = toLatex(n.left)
      const R = toLatex(n.right)
      if (!n.implicit) return `${L}\\cdot ${R}`
      // usynligt gangetegn: tal foran tal skal stadig adskilles
      const needDot = /\d$/.test(L) && /^\d/.test(R)
      return needDot ? `${L}\\cdot ${R}` : `${L}\\,${R}`
    }
    case 'div': return `\\dfrac{${toLatex(strip(n.left))}}{${toLatex(strip(n.right))}}`
    case 'pow': {
      const b = n.base.type === 'var' && n.base.name.length > 1 ? `\\left(${toLatex(n.base)}\\right)` : toLatex(n.base)
      return `${b}^{${toLatex(strip(n.exp))}}`
    }
    default: return ''
  }
}

export function inputToLatex(parsed) {
  const L = toLatex(parsed.lhs)
  return parsed.rhs ? `${L} = ${toLatex(parsed.rhs)}` : L
}
