import { useState } from 'react'
import StartScreen from './components/StartScreen.jsx'
import Construction from './components/Construction.jsx'
import StepWork from './components/StepWork.jsx'
import Notepad from './components/Notepad.jsx'
import { STEPS } from './lib/steps.js'
import { displayParts } from './lib/display.js'

export default function App() {
  const [mode, setMode] = useState(null) // null = startskærm, 'guide' | 'plain'
  const [run, setRun] = useState(0)
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState({})
  const [draft, setDraft] = useState('')
  const guide = mode === 'guide'

  function start(m) {
    setMode(m)
    setStep(1)
    setAnswers({})
    setDraft('')
    setRun((r) => r + 1)
  }

  // Et figurtrin er klaret
  function complete(n) {
    setStep((s) => (s === n ? n + 1 : s))
  }

  // Trin 7 og 8: udtrykket for k
  function answer(n, raw) {
    const parts = displayParts(STEPS[n - 1], raw)
    setAnswers((a) => ({ ...a, [n]: { raw, ...parts } }))
    setDraft('')
    setStep(n + 1)
  }

  // Trin 9: én linje i omformningen
  function line(raw, final) {
    const parts = displayParts(STEPS[8], raw, { flipToCos: final })
    setAnswers((a) => {
      const lines = [...(a[9]?.lines || []), { raw, ...parts }]
      return { ...a, 9: { lines, done: final } }
    })
    setDraft('')
    if (final) setStep(10)
  }

  if (!mode) return <StartScreen onStart={start} />

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>Cosinus i en retvinklet trekant</h1>
          <span>bevis med enhedscirklen og ensvinklede trekanter</span>
        </div>
        <div className="topbar-actions">
          <label className="switch">
            <input
              type="checkbox"
              role="switch"
              checked={guide}
              onChange={(e) => setMode(e.target.checked ? 'guide' : 'plain')}
            />
            <span className="switch-track" aria-hidden="true" />
            Sproglig guide
          </label>
          <button type="button" className="quiet" onClick={() => setMode(null)}>
            Start forfra
          </button>
        </div>
      </header>

      <main className="workspace">
        <div className="left-col">
          <section aria-label="Figur">
            <Construction key={run} step={step} guide={guide} onComplete={complete} />
          </section>
          <StepWork
            steps={STEPS}
            step={step}
            guide={guide}
            answers={answers}
            onAnswer={answer}
            onLine={line}
            onDraft={setDraft}
            onRestart={() => setMode(null)}
          />
        </div>
        <aside className="right-col" aria-label="Blok med udledningen">
          <Notepad steps={STEPS} step={step} answers={answers} draft={draft} />
        </aside>
      </main>
    </div>
  )
}
