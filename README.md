# cos(A) = b/c – interaktivt bevis

Eleverne tegner selv enhedscirklen og den lille trekant med siderne $\cos(A)$, $\sin(A)$ og $1$, tegner en større ensvinklet trekant $ABC$, trækker de to trekanter ud ved siden af hinanden og bruger forstørrelsesfaktoren til at vise $\cos(A) = \tfrac{b}{c}$. Ni trin:

1. Tegn enhedscirklen (træk passeren ud til radius 1)
2. Træk punktet $P$ op ad cirklen og vælg vinkel $A$ (25°–65°)
3. Træk en lodret linje fra $P$ ned til $x$-aksen, og læg mærkerne $\cos(A)$ og $\sin(A)$ på de rigtige sider
4. Træk et punkt ud ad linjen gennem $P$, træk linjen ned til $x$-aksen, og navngiv trekanten $ABC$
5. Træk de to trekanter ud og stil dem ved siden af hinanden
6. Læg længderne $1$, $\cos(A)$, $\sin(A)$, $a$, $b$, $c$ på de rigtige sider
7. Skriv forstørrelsesfaktoren som $k = \tfrac{c}{1}$
8. Skriv forstørrelsesfaktoren som $k = \tfrac{b}{\cos(A)}$
9. Omskriv $\tfrac{c}{1} = \tfrac{b}{\cos(A)}$ linje for linje, til der står $\cos(A) = \tfrac{b}{c}$

Ved start vælges **med sproglig guide** (forklaringer med fagbegreber og målrettede hint ved fejl) eller **uden guide** (kun overskrifter; hint kan hentes efter to forkerte forsøg). Guiden kan slås til og fra undervejs.

Til højre ligger en ternet blok, hvor beviset skrives ind linje for linje med trinnummer i margenen og lighedstegnene under hinanden. I trin 9 skriver eleven selv så mange mellemregninger, som de har brug for. Hver linje tjekkes for, om den følger af den forrige (er ensbetydende), og trinnet er færdigt, når $\cos(A) = \tfrac{b}{c}$ står.

## Læg appen på Vercel

1. Gå til [vercel.com](https://vercel.com) → **Add New… → Project** → vælg repoet `Trigbevis` → **Deploy**.
   Vercel genkender selv Vite (build: `npm run build`, output: `dist`).

Hver gang der ændres noget i repoet, bygger Vercel automatisk en ny version.

## Kør lokalt (valgfrit)

```bash
npm install
npm run dev      # åbner på http://localhost:5173
npm test         # tester svarkontrollen
```

## Hvor ændrer jeg hvad?

| Fil | Indhold |
|---|---|
| `src/lib/steps.js` | Trinenes overskrifter, guidetekster, betjeningsvejledning og teksterne på blokken |
| `src/components/Construction.jsx` | Figuren: passer, punkt, lodrette linjer, mærker og trekanter (trin 1–6). Øverst: forklaringerne ved forkert placerede mærker (`WHY`) |
| `src/lib/geometry.js` | Tilladte vinkler (`TH_MIN`, `TH_MAX`) og størrelsen på den store trekant (`K_MIN`, `K_MAX`) |
| `src/lib/checks.js` | Svarkontrol og hint for trin 7–9 |
| `src/components/Notepad.jsx` | Blokken med beviset |
| `src/styles.css` | Farver og layout |

Matematik i teksterne skrives i LaTeX mellem `$…$`.

## Hvad eleven kan skrive

- `cos(A)`, `cosA`, `cos A` (også med stort C) – og tilsvarende `sin(A)`
- Brøk: `b/c`, `b/cos(A)`. Usynligt gangetegn binder stærkest, så `b/2c` læses som $\tfrac{b}{2c}$
- Gange: `*`, `·` eller intet tegn (`c cos(A)`)
- Ligninger med `=`; i trin 7–8 må `k =` gerne skrives med

Under feltet vises, hvordan appen har læst svaret, og der er et lille tastatur med symbolerne til tablets.

Figuren kan også betjenes med tastaturet: Tab til et blåt punkt eller et mærke, flyt med piletasterne, slip med Enter.
