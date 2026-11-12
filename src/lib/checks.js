// Kontrol af elevsvar i trin 7–10. Afhænger af, om der bevises cos(A) = b/c eller sin(A) = a/c.
// Hvert tjek returnerer et af:
//   { status: 'correct' }            (trin 10: også { final: true }, når målet står)
//   { status: 'form',  msg }   – matematisk rigtigt, men ikke det, trinnet beder om
//   { status: 'wrong', hint }  – forkert; hint kan hentes efter to forsøg
//   { status: 'error', msg }   – udtrykket kunne ikke læses
import {
  parseInput, expr, sameValue, holdsCount, samples, uses, strip, isVar, isFraction, toLatex, ParseError,
} from './expr.js'

// De to varianter: kateten i ABC, den tilsvarende side i den lille trekant, og hvor den ligger
export const VARIANTS = {
  cos: { leg: 'b', fn: 'cosA', fnSrc: 'cos(A)', fnTex: '\\cos(A)', where: 'ved vinkel $A$', other: 'sin' },
  sin: { leg: 'a', fn: 'sinA', fnSrc: 'sin(A)', fnTex: '\\sin(A)', where: 'over for vinkel $A$', other: 'cos' },
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
  'Forstørrelsesfaktoren er en side i den store trekant divideret med den ensliggende side i den lille trekant.'

const sig = (p) => toLatex(p.lhs) + '=' + toLatex(p.rhs)

export function makeChecks(variant) {
  const V = VARIANTS[variant]
  const O = VARIANTS[V.other]
  const E = {
    c: expr('c'),
    invC: expr('1/c'),
    k: expr(`${V.leg}/${V.fnSrc}`), // b/cos(A) eller a/sin(A)
    kOther: expr(`${O.leg}/${O.fnSrc}`),
    kInv: expr(`${V.fnSrc}/${V.leg}`),
    mixed1: expr(`${V.leg}/${O.fnSrc}`),
    mixed2: expr(`${O.leg}/${V.fnSrc}`),
    goal: expr(`${V.leg}/c`),
    goalFlip: expr(`c/${V.leg}`),
  }
  const goalTex = `${V.fnTex} = \\dfrac{${V.leg}}{c}`

  // Sammenhængen, som ligningen i trin 9 og alle linjer i trin 10 skal opfylde:
  // uafhængige værdier af a, b, cos(A), sin(A) og c = kateten / cos(A) (eller sin(A))
  const ON = samples(10, 11).map((e) => ({ ...e, c: e[V.leg] / e[V.fn] }))
  const OFF = samples(10, 23)
  const WRONG_MUL = samples(10, 31).map((e) => ({ ...e, c: e[V.leg] * e[V.fn] })) // fejlen c = b·cos(A)

  /** Er ligningen ensbetydende med c = b/cos(A) (eller c = a/sin(A))? */
  const equivalent = (p) =>
    holdsCount(p.lhs, p.rhs, ON) === ON.length && holdsCount(p.lhs, p.rhs, OFF) <= 2

  function equation(src) {
    const p = parseInput(src)
    if (!p.rhs) return { early: { status: 'form', msg: 'Skriv en hel ligning med lighedstegn.' } }
    if (uses(p.lhs, 'k') || uses(p.rhs, 'k')) {
      return { early: { status: 'error', msg: 'Skriv ligningen uden $k$ – brug $a$, $b$, $c$, $\\cos(A)$ og $\\sin(A)$.' } }
    }
    return { p }
  }

  return {
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
      if (sameValue(node, E.k) || sameValue(node, E.kOther)) {
        return { status: 'form', msg: 'Det er også forstørrelsesfaktoren – men i dette trin skal du bruge de to hypotenuser.' }
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
      if (isFraction(node, V.leg, V.fn)) return { status: 'correct' }
      if (sameValue(node, E.k)) {
        return { status: 'form', msg: `Rigtigt – men skriv det som én brøk: $${V.leg}$ over $${V.fnTex}$.` }
      }
      if (sameValue(node, E.c)) {
        return { status: 'form', msg: 'Ja, $k = c$. Men nu skal $k$ findes ud fra kateterne – én fra hver trekant.' }
      }
      if (sameValue(node, E.kOther)) {
        return {
          status: 'form',
          msg: `Det er også forstørrelsesfaktoren. Men for at bevise $${goalTex}$ skal du bruge kateterne, der ligger ${V.where}.`,
        }
      }
      return {
        status: 'wrong',
        hint: firstHint(
          node,
          [
            [E.kInv, 'Du har divideret den lille side med den store. ' + RATIO],
            [E.mixed1, 'Siderne skal være ensliggende: $b$ svarer til $\\cos(A)$, og $a$ svarer til $\\sin(A)$.'],
            [E.mixed2, 'Siderne skal være ensliggende: $b$ svarer til $\\cos(A)$, og $a$ svarer til $\\sin(A)$.'],
            [E.goal, 'Begge sider i brøken skal være kateter – én fra den store trekant og den ensliggende fra den lille.'],
          ],
          RATIO + ` Brug kateterne, der ligger ${V.where}.`,
        ),
      }
    }),

    9: guard((src) => {
      const { early, p } = equation(src)
      if (early) return early
      const [L, R] = [strip(p.lhs), strip(p.rhs)]
      const isPair = (x, y) => sameValue(x, E.c) && sameValue(y, E.k)
      if (isPair(L, R) || isPair(R, L)) return { status: 'correct' }
      const isOtherPair = (x, y) => sameValue(x, E.c) && sameValue(y, E.kOther)
      if (isOtherPair(L, R) || isOtherPair(R, L)) {
        return { status: 'form', msg: 'Brug forstørrelsesfaktoren fra kateterne i trin 8.' }
      }
      if (equivalent(p)) {
        return {
          status: 'form',
          msg: 'Ligningen er rigtig, men du har allerede omformet den. Skriv først de to forstørrelsesfaktorer lig med hinanden – som de står i trin 7 og 8.',
        }
      }
      return {
        status: 'wrong',
        hint: 'Begge brøker er lig $k$, så de er lig med hinanden. Skriv brøken fra trin 7 på den ene side af lighedstegnet og brøken fra trin 8 på den anden.',
      }
    }),

    /** Én linje i omformningen. ctx.prev er den forrige linje (rå tekst). */
    10: guard((src, ctx = {}) => {
      const { early, p } = equation(src)
      if (early) return early
      if (ctx.prev) {
        try {
          if (sig(parseInput(ctx.prev)) === sig(p)) {
            return { status: 'form', msg: 'Det er den samme linje som før. Lav en omformning – gør det samme på begge sider.' }
          }
        } catch {
          /* forrige linje kan altid læses */
        }
      }
      const [L, R] = [strip(p.lhs), strip(p.rhs)]
      if (equivalent(p)) {
        const final =
          (isVar(L, V.fn) && isFraction(R, V.leg, 'c')) || (isVar(R, V.fn) && isFraction(L, V.leg, 'c'))
        return final ? { status: 'correct', final: true } : { status: 'correct' }
      }
      if (holdsCount(p.lhs, p.rhs, ON) === ON.length) {
        return {
          status: 'wrong',
          hint: `Den ligning er altid sand – den siger ikke noget om $${V.fnTex}$. Tag udgangspunkt i den forrige linje.`,
        }
      }
      const other = isVar(L, V.fn) ? R : isVar(R, V.fn) ? L : null
      if (other && sameValue(other, E.goalFlip)) {
        return {
          status: 'wrong',
          hint: `Brøken er vendt forkert: der står $\\frac{c}{${V.leg}}$ i stedet for $\\frac{${V.leg}}{c}$. Tjek, hvilken side $c$ og $${V.leg}$ står på i den forrige linje.`,
        }
      }
      if (holdsCount(p.lhs, p.rhs, WRONG_MUL) === WRONG_MUL.length) {
        return {
          status: 'wrong',
          hint: `Det ser ud, som om $${V.fnTex}$ er havnet på den forkerte side af brøkstregen. Når du ganger begge sider med $${V.fnTex}$, forsvinder den fra nævneren på den ene side og kommer op i tælleren på den anden.`,
        }
      }
      return {
        status: 'wrong',
        hint: `Den nye linje passer ikke med den forrige. Gør det samme på begge sider af lighedstegnet – fx gang begge sider med $${V.fnTex}$, eller divider begge sider med $c$.`,
      }
    }),
  }
}
