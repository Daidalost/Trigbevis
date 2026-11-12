// Kør med: npm test
import { checks } from './checks.js'
import { parseInput, inputToLatex } from './expr.js'

let fails = 0
function expect(step, src, status, extra = {}, ctx) {
  const r = checks[step](src, ctx)
  const ok = r.status === status && Object.entries(extra).every(([k, v]) => r[k] === v)
  if (!ok) {
    fails++
    console.log(`FEJL trin ${step}: "${src}" gav ${JSON.stringify(r)}, ventede ${status} ${JSON.stringify(extra)}`)
  }
}

// Trin 7: k = c/1
expect(7, 'c/1', 'correct')
expect(7, 'k = c/1', 'correct')
expect(7, '(c)/(1)', 'correct')
expect(7, 'c', 'form')
expect(7, 'b/cos(A)', 'form')
expect(7, '1/c', 'wrong')
expect(7, 'c/', 'error')
expect(7, 'A', 'error')

// Trin 8: k = b/cos(A)
expect(8, 'b/cos(A)', 'correct')
expect(8, 'b/cosA', 'correct')
expect(8, 'b/Cos(A)', 'correct')
expect(8, 'k=b/cos A', 'correct')
expect(8, 'b·1/cos(A)', 'form')
expect(8, 'c', 'form')
expect(8, 'a/sin(A)', 'form')
expect(8, 'cos(A)/b', 'wrong')
expect(8, 'a/cos(A)', 'wrong')
expect(8, 'b/cos(a)', 'error')

// Trin 9: frie linjer
const start = 'c/1 = b/cos(A)'
expect(9, 'c = b/cos(A)', 'correct', { final: undefined }, { prev: start })
expect(9, 'c·cos(A) = b', 'correct', {}, { prev: 'c = b/cos(A)' })
expect(9, 'c cos(A) = b', 'correct', {}, { prev: 'c = b/cos(A)' })
expect(9, 'cos(A) = b/c', 'correct', { final: true }, { prev: 'c·cos(A) = b' })
expect(9, 'b/c = cos(A)', 'correct', { final: true })
expect(9, 'cos(A) = b/c', 'correct', { final: true }, { prev: start })
expect(9, 'cos(A) = c·cos(A)/c·b/c', 'wrong')
expect(9, 'c/1 = b/cos(A)', 'form', {}, { prev: start })
expect(9, 'c = b·cos(A)', 'wrong')
expect(9, 'cos(A) = c/b', 'wrong')
expect(9, 'b = b', 'wrong')
expect(9, 'c·cos(A)', 'form')
expect(9, 'cos(A) = (b)/(c)', 'correct', { final: true })
expect(9, 'c/b = 1/cos(A)', 'correct')

// Læsning
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
