// Gør et svar klar til blokken: venstreside og højreside hver for sig,
// så lighedstegnene kan stå under hinanden.
import { parseInput, toLatex, isVar, strip } from './expr.js'

/** Returnerer { lhs, rhs } som LaTeX – eller null, hvis svaret (endnu) ikke kan læses. */
export function displayParts(step, src, { flipToCos = false } = {}) {
  if (!src || !src.trim()) return null
  try {
    const p = parseInput(src)
    if (step.kind === 'expr') {
      if (p.rhs) return isVar(p.lhs, 'k') ? { lhs: step.lhs, rhs: toLatex(p.rhs) } : null
      return { lhs: step.lhs, rhs: toLatex(p.lhs) }
    }
    if (!p.rhs) return null
    let [L, R] = [p.lhs, p.rhs]
    // Til sidst skal cos(A) stå til venstre
    if (flipToCos && !isVar(strip(L), 'cosA') && isVar(strip(R), 'cosA')) [L, R] = [R, L]
    return { lhs: toLatex(L), rhs: toLatex(R) }
  } catch {
    return null
  }
}
