// Figurens mål. SVG: x mod højre, y NEDAD – så punktet (x, y) i matematik er (x·U, −y·U) i SVG.
export const U = 4 // én enhed (radius i enhedscirklen) i SVG-enheder

export const R_START = 0.5 // passerens startradius
export const TH_MIN = 25 // tilladte vinkler (grader), så figuren bliver tydelig
export const TH_MAX = 65
export const K_START = 1.3 // den store trekants startstørrelse (gange enhedscirklen)
export const K_MIN = 1.6
export const K_MAX = 2.7

export const rad = (deg) => (deg * Math.PI) / 180

/** Punkt i SVG ud fra afstand (i enheder) og vinkel (grader) */
export const polar = (r, deg) => [r * U * Math.cos(rad(deg)), -r * U * Math.sin(rad(deg))]

// Figurens bredde/højde er fast, så tegningen ikke hopper i højden. Smalle skærme får et mere kvadratisk udsnit.
export const isNarrow = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 600px)').matches

/** viewBox, der rummer kassen [x0, y0, x1, y1] med det faste højde-bredde-forhold */
export function fit([x0, y0, x1, y1], align = 'center', aspect = 1.6) {
  let w = x1 - x0
  let h = y1 - y0
  if (w / h < aspect) w = h * aspect
  else h = w / aspect
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const left = align === 'left' ? x0 : cx - w / 2
  return [left, cy - h / 2, w, h]
}

/**
 * Placering af de to trekanter, når de er trukket ud til højre for figuren.
 * Begge står på x-aksens højde med vinkel A nederst til venstre.
 */
export function trayLayout(theta, k) {
  const co = Math.cos(rad(theta))
  const si = Math.sin(rad(theta))
  const x0 = Math.max(U * 1.3, k * U * co) + 3.2
  const small = [x0, 0]
  const big = [x0 + U * co + 3.4, 0]
  const xEnd = big[0] + k * U * co + 3.2
  const top = -k * U * si
  return { small, big, x0, xEnd, top }
}
