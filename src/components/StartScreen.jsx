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
      <text className="lbl it" x={bx * 0.74 - 0.18} y={by * 0.74 - 0.14}>c</text>
    </svg>
  )
}

export default function StartScreen({ onStart }) {
  return (
    <main className="start">
      <div className="start-inner">
        <StartFigure />
        <div className="start-text">
          <h1>Sinus og cosinus i en retvinklet trekant</h1>
          <p className="lede">
            Tegn enhedscirklen, find en lille trekant med siderne <Tex>{'\\cos(A)'}</Tex> og <Tex>{'\\sin(A)'}</Tex>, og
            brug forstørrelsesfaktoren til at bevise sammenhængen i trekant <Tex>{'ABC'}</Tex>.
          </p>
          <p className="choose">Hvad vil du bevise?</p>
          <div className="choices choices-row">
            <button type="button" className="choice choice-formula" onClick={() => onStart('sin')}>
              <Tex display>{'\\sin(A) = \\dfrac{a}{c}'}</Tex>
              <span>Den modstående katete divideret med hypotenusen</span>
            </button>
            <button type="button" className="choice choice-formula" onClick={() => onStart('cos')}>
              <Tex display>{'\\cos(A) = \\dfrac{b}{c}'}</Tex>
              <span>Den hosliggende katete divideret med hypotenusen</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
