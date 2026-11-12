// Trinenes tekster. Matematik skrives i $…$ (LaTeX).
//   title  – vises over svarfeltet under tegningen
//   instr  – betjening af appen; vises på det aktive trin
//   note   – det, der skrives på blokken, når et figurtrin (1–6) er klaret
//   kind   – 'build' (på figuren), 'expr' (udtryk for k), 'eq' (ligning) eller 'chain' (frie linjer)
import { makeChecks, VARIANTS } from './checks.js'

/** Det, der bevises: cos(A) = b/c eller sin(A) = a/c */
export function goal(variant) {
  const V = VARIANTS[variant]
  return {
    tex: `${V.fnTex} = \\dfrac{${V.leg}}{c}`,
    name: variant === 'cos' ? 'Cosinus' : 'Sinus',
    words:
      variant === 'cos'
        ? 'cosinus til en spids vinkel lig med den hosliggende katete divideret med hypotenusen'
        : 'sinus til en spids vinkel lig med den modstående katete divideret med hypotenusen',
    fn: V.fn,
  }
}

const BUILD = [
  {
    n: 1,
    title: 'Tegn enhedscirklen',
    instr: 'Træk det blå punkt væk fra origo. Cirklen følger med – slip, når radius er 1.',
    note: 'Enhedscirklen har centrum i $(0,0)$ og radius $1$.',
  },
  {
    n: 2,
    title: 'Tegn en linje op til et punkt på cirklen',
    instr: 'Træk punktet $P$ op ad cirklen. Vælg selv vinklen, og tryk på knappen under figuren.',
    note: 'Punktet $P$ på enhedscirklen bestemmer vinklen $A$, og $|OP| = 1$.',
  },
  {
    n: 3,
    title: 'Angiv $\\cos(A)$ og $\\sin(A)$ på figuren',
    instr:
      'Træk først det blå punkt ved $P$ lodret ned til $x$-aksen. Træk derefter mærkerne $\\cos(A)$ og $\\sin(A)$ hen til de rigtige sider.',
    note: '$P = (\\cos(A), \\sin(A))$, så den lille trekant er retvinklet med kateterne $\\cos(A)$ og $\\sin(A)$ og hypotenusen $1$.',
  },
  {
    n: 4,
    title: 'Tegn en større retvinklet trekant $ABC$',
    instr:
      'Træk det blå punkt ud ad linjen gennem $P$. Træk så linjen lodret ned til $x$-aksen. Træk til sidst bogstaverne $A$, $B$ og $C$ hen til hjørnerne – den rette vinkel er $C$.',
    note: 'Trekant $ABC$ har også vinklen $A$ og en ret vinkel i $C$, så de to trekanter er ensvinklede.',
  },
  {
    n: 5,
    title: 'Træk de to trekanter ud og stil dem ved siden af hinanden',
    instr: 'Træk den lille trekant og trekant $ABC$ hen på de stiplede pladser til højre.',
    note: 'Trekant $ABC$ er en forstørrelse af den lille trekant.',
  },
  {
    n: 6,
    title: 'Skriv sidelængderne på',
    instr: 'Træk de seks længder hen til de rigtige sider i de to trekanter.',
    note: 'Ensliggende sider: $1$ og $c$, $\\cos(A)$ og $b$, $\\sin(A)$ og $a$.',
  },
].map((s) => ({ ...s, kind: 'build' }))

export function makeSteps(variant) {
  const checks = makeChecks(variant)
  const g = goal(variant)
  return [
    ...BUILD,
    { n: 7, kind: 'expr', lhs: 'k', title: 'Skriv forstørrelsesfaktoren op som de to hypotenuser divideret med hinanden' },
    { n: 8, kind: 'expr', lhs: 'k', title: 'Skriv nu forstørrelsesfaktoren op ud fra kateterne' },
    { n: 9, kind: 'eq', title: 'Sæt de to forstørrelsesfaktorer lig med hinanden' },
    {
      n: 10,
      kind: 'chain',
      title: `Omskriv ligningen, til der står $${g.tex}$`,
      instr: 'Din ligning fra forrige trin står i feltet – ret den til. Hver ny linje skrives på blokken.',
    },
  ].map((s) => ({ ...s, check: checks[s.n] }))
}
