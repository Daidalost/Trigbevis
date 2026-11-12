// Kontrol af elevsvar i trin 7–9.
// Hvert tjek returnerer et af:
//   { status: 'correct' }            (trin 9: også { final: true }, når cos(A) = b/c står)
//   { status: 'form',  msg }   – matematisk rigtigt, men ikke på den form trinnet beder om
//   { status: 'wrong', hint }  – forkert; hint vises med guide (eller når eleven beder om det)
//   { status: 'error', msg }   – udtrykket kunne ikke læses
import {
  parseInput, expr, sameValue, holdsCount, samples, uses, strip, isVar, isFraction, toLatex, ParseError,
} from './expr.js'

const E = {
  c: expr('c'),
  invC: expr('1/c'),
  bCos: expr('b/cos(A)'),
  cosB: expr('cos(A)/b'),
  aSin: expr('a/sin(A)'),
  sinA: expr('sin(A)/a'),
  aCos: expr('a/cos(A)'),
  bSin: expr('b/sin(A)'),
  bc: expr('b/c'),
  cb: expr('c/b'),
}

function firstHint(node, list, fallback) {
  for (const [ref, hint] of list) if (sameValue(node, ref)) return hint
  return fallback
}

function guard(fn) {
  return (src, ctx) => {
    try {
      return fn(src, ctx)
    } catch (e) {
      if (e instanceof ParseError) return { status: 'error', msg: e.message }
      throw e
    }
  }
}

/** Udtrykket for k. "k = …" må gerne skrives med. */
function kExpression(src) {
  const p = parseInput(src)
  let node = p.lhs
  if (p.rhs) {
    if (!isVar(p.lhs, 'k')) return { early: { status: 'form', msg: 'Skriv kun udtrykket for $k$ – $k =$ står der allerede.' } }
    node = p.rhs
  }
  if (uses(node, 'k')) return { early: { status: 'error', msg: 'Udtrykket for $k$ må ikke selv indeholde $k$.' } }
  return { node }
}

const RATIO =
  'Forstørrelsesfaktoren er en side i den store trekant divideret med den tilsvarende side i den lille trekant.'

// ---------- Trin 9: sammenhængen, som alle linjer skal opfylde ----------
// Med uafhængige værdier af a, b, cos(A), sin(A) og c = b/cos(A).
const ON = samples(10, 11).map((e) => ({ ...e, c: e.b / e.cosA }))
const OFF = samples(10, 23)
// Typiske fejl: c = b·cos(A) og cos(A) = c/b
const WRONG_MUL = samples(10, 31).map((e) => ({ ...e, c: e.b * e.cosA }))

const sig = (p) => toLatex(p.lhs) + '=' + toLatex(p.rhs)

export const checks = {
  7: guard((src) => {
    const { early, node } = kExpression(src)
    if (early) return early
    if (isFraction(node, 'c', 1)) return { status: 'correct' }
    if (sameValue(node, E.c)) {
      return {
        status: 'form',
        msg: 'Rigtigt, $k = c$. Men skriv $k$ som en brøk: den store hypotenuse divideret med den lille hypotenuse.',
      }
    }
    if (sameValue(node, E.bCos) || sameValue(node, E.aSin)) {
      return {
        status: 'form',
        msg: 'Det er også forstørrelsesfaktoren – men i dette trin skal du bruge de to hypotenuser.',
      }
    }
    return {
      status: 'wrong',
      hint: firstHint(
        node,
        [
          [E.invC, 'Du har divideret den lille side med den store. ' + RATIO],
          [expr('1'), 'Den lille trekants hypotenuse er $1$. Hvad er den store trekants hypotenuse?'],
        ],
        RATIO + ' Hypotenusen er $c$ i den store trekant og $1$ i den lille.',
      ),
    }
  }),

  8: guard((src) => {
    const { early, node } = kExpression(src)
    if (early) return early
    if (isFraction(node, 'b', 'cosA')) return { status: 'correct' }
    if (sameValue(node, E.bCos)) {
      return { status: 'form', msg: 'Rigtigt – men skriv det som én brøk: $b$ over $\\cos(A)$.' }
    }
    if (sameValue(node, E.c)) {
      return {
        status: 'form',
        msg: 'Ja, $k = c$. Men nu skal $k$ findes ud fra de vandrette kateter: $b$ i den store trekant og $\\cos(A)$ i den lille.',
      }
    }
    if (sameValue(node, E.aSin)) {
      return {
        status: 'form',
        msg: 'Det er også rigtigt (de lodrette kateter). Men her skal du bruge de vandrette kateter, der ligger ved vinkel $A$.',
      }
    }
    return {
      status: 'wrong',
      hint: firstHint(
        node,
        [
          [E.cosB, 'Du har divideret den lille side med den store. ' + RATIO],
          [E.aCos, 'Siderne skal svare til hinanden: $a$ svarer til $\\sin(A)$, og $b$ svarer til $\\cos(A)$.'],
          [E.bSin, 'Siderne skal svare til hinanden: $b$ svarer til $\\cos(A)$, og $a$ svarer til $\\sin(A)$.'],
          [E.bc, 'Begge sider i brøken skal være kateter, der ligger ved vinkel $A$ – én fra hver trekant.'],
        ],
        RATIO + ' Brug den vandrette katete: $b$ i den store trekant og $\\cos(A)$ i den lille.',
      ),
    }
  }),

  /** Én linje i omformningen. ctx.prev er den forrige linje (rå tekst). */
  9: guard((src, ctx = {}) => {
    const p = parseInput(src)
    if (!p.rhs) return { status: 'form', msg: 'Skriv en hel ligning med lighedstegn.' }
    if (uses(p.lhs, 'k') || uses(p.rhs, 'k')) {
      return { status: 'error', msg: 'Skriv ligningen uden $k$ – brug $a$, $b$, $c$ og $\\cos(A)$.' }
    }
    if (ctx.prev) {
      try {
        if (sig(parseInput(ctx.prev)) === sig(p)) {
          return { status: 'form', msg: 'Det er den samme linje som før. Lav en omformning – gør det samme på begge sider.' }
        }
      } catch {
        /* forrige linje kan altid læses */
      }
    }

    const on = holdsCount(p.lhs, p.rhs, ON)
    const off = holdsCount(p.lhs, p.rhs, OFF)
    if (on === ON.length && off <= 2) {
      const [L, R] = [strip(p.lhs), strip(p.rhs)]
      const final =
        (isVar(L, 'cosA') && isFraction(R, 'b', 'c')) || (isVar(R, 'cosA') && isFraction(L, 'b', 'c'))
      if (final) return { status: 'correct', final: true }
      return { status: 'correct' }
    }
    if (on === ON.length) {
      return {
        status: 'wrong',
        hint: 'Den ligning er altid sand – den siger ikke noget om $\\cos(A)$. Tag udgangspunkt i den forrige linje.',
      }
    }
    const [L0, R0] = [strip(p.lhs), strip(p.rhs)]
    const other = isVar(L0, 'cosA') ? R0 : isVar(R0, 'cosA') ? L0 : null
    if (other && sameValue(other, E.cb)) {
      return {
        status: 'wrong',
        hint: 'Brøken er vendt forkert: der står $\\frac{c}{b}$ i stedet for $\\frac{b}{c}$. Tjek, hvilken side $c$ og $b$ står på i den forrige linje.',
      }
    }
    if (holdsCount(p.lhs, p.rhs, WRONG_MUL) === WRONG_MUL.length) {
      return {
        status: 'wrong',
        hint:
          'Det ser ud, som om $\\cos(A)$ er havnet på den forkerte side af brøkstregen. Når du ganger begge sider med $\\cos(A)$, forsvinder $\\cos(A)$ fra nævneren på den ene side og kommer op i tælleren på den anden.',
      }
    }
    return {
      status: 'wrong',
      hint:
        'Den nye linje passer ikke med den forrige. Gør det samme på begge sider af lighedstegnet – fx gang begge sider med $\\cos(A)$, eller divider begge sider med $c$.',
    }
  }),
}
