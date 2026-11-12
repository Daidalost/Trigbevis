import { useEffect, useState } from 'react'
import { Tex, Rich } from './Tex.jsx'
import ExprInput from './ExprInput.jsx'
import { goal } from '../lib/steps.js'

function Feedback({ result, attempts }) {
  const [showHint, setShowHint] = useState(false)
  useEffect(() => setShowHint(false), [result])
  if (!result) return null
  if (result.status === 'ok' || result.status === 'error' || result.status === 'form') {
    const cls = { ok: 'fb-ok', error: 'fb-error', form: 'fb-form' }[result.status]
    return (
      <p className={`fb ${cls}`}>
        <Rich text={result.msg} />
      </p>
    )
  }
  if (showHint) {
    return (
      <p className="fb fb-wrong">
        <strong>Ikke korrekt. </strong>
        <Rich text={result.hint} />
      </p>
    )
  }
  return (
    <p className="fb fb-wrong">
      <strong>Ikke korrekt.</strong> Prøv igen.
      {attempts >= 2 && (
        <button type="button" className="link" onClick={() => setShowHint(true)}>
          Vis hint
        </button>
      )}
    </p>
  )
}

/** Det aktive trin: overskrift og svarfelt. Nøgles på trinnummer, så alt nulstilles ved nyt trin. */
function CurrentStep({ s, answers, onAnswer, onLine, onDraft }) {
  const [result, setResult] = useState(null)
  const [attempts, setAttempts] = useState(0)
  const lines = answers[s.n]?.lines || []
  // Trin 10 starter med elevens egen ligning fra trin 9
  const prev = lines.length ? lines[lines.length - 1].raw : answers[s.n - 1]?.raw

  function submit(src) {
    const r = s.check(src, { prev })
    if (r.status === 'correct') {
      if (s.kind === 'chain') {
        onLine(src, !!r.final)
        setResult(r.final ? null : { status: 'ok', msg: 'Rigtigt! Linjen er skrevet på blokken. Fortsæt med næste omformning.' })
        setAttempts(0)
      } else {
        onAnswer(s.n, src)
      }
      return
    }
    setResult({ ...r }) // ny reference, så samme fejl vises igen
    if (r.status === 'wrong') setAttempts((a) => a + 1)
  }

  return (
    <>
      <h2 className="work-title">
        <Rich text={s.title} />
      </h2>
      {s.instr && (
        <p className="instr">
          <Rich text={s.instr} />
        </p>
      )}
      {s.kind !== 'build' && (
        <>
          <ExprInput
            key={lines.length}
            inputId={`svar-${s.n}-${lines.length}`}
            prefix={s.lhs ? `${s.lhs} =` : undefined}
            initial={s.kind === 'chain' ? prev || '' : ''}
            onSubmit={submit}
            onDraft={onDraft}
          />
          <Feedback result={result} attempts={attempts} />
        </>
      )}
    </>
  )
}

export default function StepWork({ steps, step, variant, answers, onAnswer, onLine, onDraft, onRestart }) {
  const finished = step > steps.length
  const g = goal(variant)

  if (finished) {
    const other =
      variant === 'cos'
        ? 'Prøv også det andet bevis: Brug kateterne over for vinkel $A$, og vis på samme måde, at $\\sin(A) = \\tfrac{a}{c}$.'
        : 'Prøv også det andet bevis: Brug kateterne ved vinkel $A$, og vis på samme måde, at $\\cos(A) = \\tfrac{b}{c}$.'
    return (
      <section className="work finale">
        <h2 className="work-title">Beviset er færdigt</h2>
        <Tex display>{g.tex}</Tex>
        <p>I en retvinklet trekant er {g.words}.</p>
        <p className="finale-extra">
          <Rich text={other} />
        </p>
        <button type="button" className="primary" onClick={onRestart}>
          Start forfra
        </button>
      </section>
    )
  }

  const s = steps[step - 1]
  return (
    <section className="work" aria-label={`Trin ${s.n} af ${steps.length}`}>
      <div className="work-head">
        <span className="work-count">
          Trin {s.n} af {steps.length}
        </span>
        <ol className="progress" aria-hidden="true">
          {steps.map((x) => (
            <li key={x.n} className={x.n < step ? 'is-done' : x.n === step ? 'is-active' : ''} />
          ))}
        </ol>
      </div>
      <CurrentStep key={s.n} s={s} answers={answers} onAnswer={onAnswer} onLine={onLine} onDraft={onDraft} />
    </section>
  )
}
