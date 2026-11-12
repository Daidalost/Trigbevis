// Kør med: npm test
import { makeChecks } from './checks.js'
import { parseInput, inputToLatex } from './expr.js'

let fails = 0
function suite(variant) {
  const checks = makeChecks(variant)
  return (step, src, status, extra = {}, ctx) => {
    const r = checks[step](src, ctx)
    const ok = r.status === status && Object.entries(extra).every(([k, v]) => r[k] === v)
    if (!ok) {
      fails++
      console.log(`FEJL ${variant} trin ${step}: "${src}" gav ${JSON.stringify(r)}, ventede ${status} ${JSON.stringify(extra)}`)
    }
  }
}

// ---------- cos(A) = b/c ----------
let expect = suite('cos')
expect(7, 'c/1', 'correct')
expect(7, 'k = c/1', 'correct')
expect(7, 'c', 'form')
expect(7, 'b/cos(A)', 'form')
expect(7, '1/c', 'wrong')
expect(7, 'c/', 'error')
expect(7, 'A', 'error')

expect(8, 'b/cos(A)', 'correct')
expect(8, 'b/cosA', 'correct')
expect(8, 'k=b/Cos A', 'correct')
expect(8, 'b·1/cos(A)', 'form')
expect(8, 'c', 'form')
expect(8, 'a/sin(A)', 'form')
expect(8, 'cos(A)/b', 'wrong')
expect(8, 'a/cos(A)', 'wrong')
expect(8, 'b/cos(a)', 'error')

expect(9, 'c/1 = b/cos(A)', 'correct')
expect(9, 'b/cos(A) = c/1', 'correct')
expect(9, 'c = b/cos(A)', 'correct')
expect(9, 'c·cos(A) = b', 'form')
expect(9, 'c/1 = a/sin(A)', 'form')
expect(9, 'c/1', 'form')
expect(9, 'k = k', 'error')
expect(9, 'c = b·cos(A)', 'wrong')

const start = 'c/1 = b/cos(A)'
expect(10, 'c = b/cos(A)', 'correct', { final: undefined }, { prev: start })
expect(10, 'c·cos(A) = b', 'correct', {}, { prev: 'c = b/cos(A)' })
expect(10, 'c cos(A) = b', 'correct', {}, { prev: 'c = b/cos(A)' })
expect(10, 'cos(A) = b/c', 'correct', { final: true }, { prev: 'c·cos(A) = b' })
expect(10, 'b/c = cos(A)', 'correct', { final: true })
expect(10, 'cos(A) = (b)/(c)', 'correct', { final: true })
expect(10, 'c/b = 1/cos(A)', 'correct')
expect(10, 'c/1 = b/cos(A)', 'form', {}, { prev: start })
expect(10, 'cos(A) = c·cos(A)/c·b/c', 'wrong')
expect(10, 'c = b·cos(A)', 'wrong')
expect(10, 'cos(A) = c/b', 'wrong')
expect(10, 'b = b', 'wrong')
expect(10, 'sin(A) = a/c', 'wrong')

// ---------- sin(A) = a/c ----------
expect = suite('sin')
expect(7, 'c/1', 'correct')
expect(8, 'a/sin(A)', 'correct')
expect(8, 'b/cos(A)', 'form')
expect(8, 'sin(A)/a', 'wrong')
expect(9, 'c/1 = a/sin(A)', 'correct')
expect(9, 'c/1 = b/cos(A)', 'form')
expect(10, 'c·sin(A) = a', 'correct', {}, { prev: 'c/1 = a/sin(A)' })
expect(10, 'sin(A) = a/c', 'correct', { final: true })
expect(10, 'cos(A) = b/c', 'wrong')
expect(10, 'sin(A) = c/a', 'wrong')

// ---------- Læsning ----------
const tex = (s) => inputToLatex(parseInput(s))
const want = [
  ['b/2c', '\\dfrac{b}{2\\,c}'],
  ['c/1 = b/cos(A)', '\\dfrac{c}{1} = \\dfrac{b}{\\cos(A)}'],
  ['cos(A)^2', '\\left(\\cos(A)\\right)^{2}'],
]
for (const [s, t] of want) {
  if (tex(s) !== t) {
    fails++
    console.log(`FEJL LaTeX: "${s}" gav ${tex(s)}`)
  }
}

console.log(fails ? `${fails} fejl` : 'Alle tests bestået')
process.exit(fails ? 1 : 0)
