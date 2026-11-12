import { Tex } from './Tex.jsx'

// Enhedscirklen med den lille trekant og den store trekant ABC
function StartFigure() {
  const R = 1.6
  const t = (38 * Math.PI) / 180
  const [px, py] = [R * Math.cos(t), -R * Math.sin(t)]
  const k = 2.05
  const [bx, by] = [k * px, k * py]
  return (
    <svg className="start-figure" viewBox="-2.1 -2.75 6.1 4.6" aria-hidden="true" style={{ '--fs': 0.26 }}>
      <defs>
        <pattern id="grid-start" width="0.4" height="0.4" patternUnits="userSpaceOnUse">
          <path d="M0.4 0H0V0.4" fill="none" className="grid-line" />
        </pattern>
      </defs>
      <rect x="-5" y="-5" width="20" height="20" fill="url(#grid-start)" />
      <line className="axis" x1="-1.9" y1="0" x2="3.8" y2="0" />
      <line className="axis" x1="0" y1="1.75" x2="0" y2="-2.6" />
      <circle className="unit-circle" r={R} />
      <polygon className="start-big" points={`0,0 ${bx},0 ${bx},${by}`} />
      <polygon className="start-small" points={`0,0 ${px},0 ${px},${py}`} />
      <text className="lbl it" x={-0.2} y={0.22}>A</text>
      <text className="lbl it" x={bx + 0.15} y={by - 0.12}>B</text>
      <text className="lbl it" x={bx + 0.18} y={0.2}>C</text>
      <text className="lbl it" x={px - 0.12} y={py - 0.18}>P</text>
      <text className="lbl it" x={bx / 2} y={0.24}>b</text>
      <text className="lbl it" x={bx + 0.16} y={by / 2}>a</text>
      <text className="lbl it" x={bx / 2 - 0.2} y={by / 2 - 0.2}>c</text>
    </svg>
  )
}

export default function StartScreen({ onStart }) {
  return (
    <main className="start">
      <div className="start-inner">
        <StartFigure />
        <div className="start-text">
          <h1>Cosinus i en retvinklet trekant</h1>
          <p className="lede">
            Tegn enhedscirklen, find en lille trekant med siderne <Tex>{'\\cos(A)'}</Tex> og <Tex>{'\\sin(A)'}</Tex>, og
            brug forstørrelsesfaktoren til at bevise, at <Tex>{'\\cos(A) = \\dfrac{b}{c}'}</Tex>.
          </p>
          <div className="choices">
            <button type="button" className="choice" onClick={() => onStart('guide')}>
              <strong>Med sproglig guide</strong>
              <span>Hvert trin forklares med fagbegreber, og du får et hint, når et svar ikke er rigtigt.</span>
            </button>
            <button type="button" className="choice" onClick={() => onStart('plain')}>
              <strong>Uden guide</strong>
              <span>Kun trinenes overskrifter. Du kan hente et hint, hvis du sidder fast.</span>
            </button>
          </div>
          <p className="note">Guiden kan slås til og fra undervejs.</p>
        </div>
      </div>
    </main>
  )
}
