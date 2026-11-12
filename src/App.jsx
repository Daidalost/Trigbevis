import { useMemo, useState } from 'react'
import StartScreen from './components/StartScreen.jsx'
import Construction from './components/Construction.jsx'
import StepWork from './components/StepWork.jsx'
import Notepad from './components/Notepad.jsx'
import { makeSteps, goal } from './lib/steps.js'
import { displayParts } from './lib/display.js'

export default function App() {
  const [variant, setVariant] = useState(null) // null = startskærm, 'cos' | 'sin'
  const [run, setRun] = useState(0)
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState({})
  const [draft, setDraft] = useState('')
  const steps = useMemo(() => (variant ? makeSteps(variant) : []), [variant])
  const g = variant ? goal(variant) : null

  function start(v) {
    setVariant(v)
    setStep(1)
    setAnswers({})
    setDraft('')
    setRun((r) => r + 1)
  }

  // Et figurtrin er klaret
  function complete(n) {
    setStep((s) => (s === n ? n + 1 : s))
  }

  // Trin 7–9: udtryk for k og ligningen
  function answer(n, raw) {
    const parts = displayParts(steps[n - 1], raw)
    setAnswers((a) => ({ ...a, [n]: { raw, ...parts } }))
    setDraft('')
    setStep(n + 1)
  }

  // Trin 10: én linje i omformningen
  function line(raw, final) {
    const parts = displayParts(steps[9], raw, { flipTo: final ? g.fn : null })
    setAnswers((a) => {
      const lines = [...(a[10]?.lines || []), { raw, ...parts }]
      return { ...a, 10: { lines, done: final } }
    })
    setDraft('')
    if (final) setStep(11)
  }

  if (!variant) return <StartScreen onStart={start} />

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>{g.name} i en retvinklet trekant</h1>
          <span>bevis med enhedscirklen og ensvinklede trekanter</span>
        </div>
        <div className="topbar-actions">
          <button type="button" className="quiet" onClick={() => setVariant(null)}>
            Start forfra
          </button>
        </div>
      </header>

      <main className="workspace">
        <div className="left-col">
          <section aria-label="Figur">
            <Construction key={run} step={step} variant={variant} onComplete={complete} />
          </section>
          <StepWork
            steps={steps}
            step={step}
            variant={variant}
            answers={answers}
            onAnswer={answer}
            onLine={line}
            onDraft={setDraft}
            onRestart={() => setVariant(null)}
          />
        </div>
        <aside className="right-col" aria-label="Blok med udledningen">
          <Notepad steps={steps} step={step} variant={variant} answers={answers} draft={draft} />
        </aside>
      </main>
    </div>
  )
}
