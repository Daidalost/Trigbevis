// Trinenes tekster. Matematik skrives i $…$ (LaTeX).
//   title  – vises over svarfeltet under tegningen
//   instr  – betjening af appen; vises altid på det aktive trin
//   guide  – sproglig guide med fagbegreber; vises kun når guiden er slået til
//   note   – det, der skrives på blokken, når et figurtrin (1–6) er klaret
//   kind   – 'build' (på figuren), 'expr' (udtryk for k) eller 'chain' (frie linjer)
import { checks } from './checks.js'

export const STEPS = [
  {
    n: 1,
    kind: 'build',
    title: 'Tegn enhedscirklen',
    instr: 'Træk det blå punkt væk fra origo. Cirklen følger med – slip, når radius er 1.',
    guide:
      'Enhedscirklen er cirklen med centrum i origo $(0,0)$ og radius $1$. Alle punkter på cirklen har afstanden $1$ til origo.',
    note: 'Enhedscirklen har centrum i $(0,0)$ og radius $1$.',
  },
  {
    n: 2,
    kind: 'build',
    title: 'Tegn en linje op til et punkt på cirklen',
    instr: `Træk punktet $P$ op ad cirklen. Vælg selv vinklen, og tryk på knappen under figuren.`,
    guide:
      'Linjen fra origo til $P$ danner vinklen $A$ med $x$-aksen. Da $P$ ligger på enhedscirklen, er linjestykket fra origo til $P$ en radius – længden er $1$.',
    note: 'Punktet $P$ på enhedscirklen bestemmer vinklen $A$, og $|OP| = 1$.',
  },
  {
    n: 3,
    kind: 'build',
    title: 'Angiv $\\cos(A)$ og $\\sin(A)$ på figuren',
    instr:
      'Træk først det blå punkt ved $P$ lodret ned til $x$-aksen. Træk derefter mærkerne $\\cos(A)$ og $\\sin(A)$ hen til de rigtige sider.',
    guide:
      'Koordinaterne til $P$ er $(\\cos(A), \\sin(A))$. Den lodrette linje fra $P$ står vinkelret på $x$-aksen, så der opstår en retvinklet trekant. Den vandrette katete er $P$’s førstekoordinat, og den lodrette katete er $P$’s andenkoordinat.',
    note: '$P = (\\cos(A), \\sin(A))$, så den lille trekant er retvinklet med kateterne $\\cos(A)$ og $\\sin(A)$ og hypotenusen $1$.',
  },
  {
    n: 4,
    kind: 'build',
    title: 'Tegn en større retvinklet trekant $ABC$',
    instr:
      'Træk det blå punkt ud ad linjen gennem $P$. Træk så linjen lodret ned til $x$-aksen. Træk til sidst bogstaverne $A$, $B$ og $C$ hen til hjørnerne.',
    guide:
      'Den store trekant har samme vinkel $A$ som den lille, og den har også en ret vinkel. Navngiv den, så den rette vinkel er $C$, og hypotenusen går fra $A$ til $B$.',
    note: 'Trekant $ABC$ har også vinklen $A$ og en ret vinkel i $C$, så de to trekanter er ensvinklede.',
  },
  {
    n: 5,
    kind: 'build',
    title: 'Træk de to trekanter ud og stil dem ved siden af hinanden',
    instr: 'Træk den lille trekant og trekant $ABC$ hen på de stiplede pladser til højre.',
    guide:
      'De to trekanter er ensvinklede: de har samme vinkler, men ikke samme størrelse. Den store trekant er en forstørrelse af den lille.',
    note: 'Trekant $ABC$ er en forstørrelse af den lille trekant.',
  },
  {
    n: 6,
    kind: 'build',
    title: 'Skriv sidelængderne på',
    instr: 'Træk de seks længder hen til de rigtige sider i de to trekanter.',
    guide:
      'Ensliggende sider ligger samme sted i forhold til vinklerne: hypotenusen over for den rette vinkel, den vandrette katete ved vinkel $A$ og den lodrette katete over for vinkel $A$.',
    note: 'Ensliggende sider: $1$ og $c$, $\\cos(A)$ og $b$, $\\sin(A)$ og $a$.',
  },
  {
    n: 7,
    kind: 'expr',
    title: 'Forstørrelsesfaktoren ud fra hypotenuserne',
    lhs: 'k',
    instr: 'Skriv $k$ som en brøk.',
    guide:
      'Forstørrelsesfaktoren $k$ er en side i den store trekant divideret med den ensliggende side i den lille trekant. Brug de to hypotenuser.',
  },
  {
    n: 8,
    kind: 'expr',
    title: 'Forstørrelsesfaktoren ud fra de vandrette kateter',
    lhs: 'k',
    instr: 'Skriv $k$ som en brøk. Tryk på cos(A)-tasten, eller skriv cos(A).',
    guide:
      'Det er den samme forstørrelsesfaktor $k$ – den gælder for alle sider. Brug nu kateterne, der ligger ved vinkel $A$.',
  },
  {
    n: 9,
    kind: 'chain',
    title: 'Omskriv ligningen, til der står $\\cos(A) = \\dfrac{b}{c}$',
    instr: 'Ligningen fra forrige linje står i feltet – ret den til. Hver ny linje skrives på blokken.',
    guide:
      'Begge brøker er lig $k$, så de er lig hinanden. Isolér $\\cos(A)$ ved at gøre det samme på begge sider af lighedstegnet: gang begge sider med $\\cos(A)$, og divider begge sider med $c$.',
    start: 'c/1 = b/cos(A)',
  },
].map((s) => ({ ...s, check: checks[s.n] }))
