import { useEffect, useRef } from 'react'
import { Tex, Rich } from './Tex.jsx'
import { displayParts } from '../lib/display.js'
import { goal } from '../lib/steps.js'

// Blokken: figurtrinene (1–6) skrives som tekstlinjer. Trin 7–8 (k) er ét afsnit,
// trin 9 (ligningen) og trin 10 (omformningen) et andet – lighedstegnene står under hinanden.

function EqRow({ n, parts, state, result, note }) {
  return (
    <div className={`eq-row is-${state}${result ? ' is-result' : ''}`}>
      <span className="margin-num">{n}</span>
      {parts ? (
        <>
          <span className="cell lhs">
            <Tex>{parts.lhs}</Tex>
          </span>
          <span className="cell eq">
            <Tex>{'='}</Tex>
          </span>
          <span className="cell rhs">
            <Tex>{parts.rhs}</Tex>
            {note && <span className="row-note">{note}</span>}
          </span>
        </>
      ) : (
        <span className="cell blank" aria-hidden="true" />
      )}
    </div>
  )
}

export default function Notepad({ steps, step, variant, answers, draft }) {
  const finished = step > steps.length
  const active = steps[step - 1]
  const g = goal(variant)
  const sheetRef = useRef(null)

  // Rul med ned, når der kommer en ny linje på blokken
  const lineCount = (answers[10]?.lines?.length || 0) + step
  useEffect(() => {
    const el = sheetRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [lineCount])

  /** Linje for trin 7, 8 eller 9: færdig, kladde (det aktive trin) eller ingenting */
  function answerRow(n, note) {
    if (answers[n]) return <EqRow key={n} n={n} parts={answers[n]} state="done" note={note} />
    if (n !== step) return null
    let parts = displayParts(active, draft)
    if (!parts && active.kind === 'expr') parts = { lhs: active.lhs, rhs: '\\phantom{x}' }
    return <EqRow key={n} n={n} parts={parts} state="draft" />
  }

  const chain = answers[10]?.lines || []
  const lastRows = [answerRow(9, '(begge er k)')]
  chain.forEach((l, i) => {
    const last = i === chain.length - 1 && answers[10]?.done
    lastRows.push(<EqRow key={`l${i}`} n={i === 0 ? 10 : ''} parts={l} state="done" result={last} />)
  })
  if (step === 10) {
    lastRows.push(<EqRow key="draft" n={chain.length ? '' : 10} parts={displayParts(active, draft)} state="draft" />)
  }

  return (
    <div className="notepad">
      <div className="spiral" aria-hidden="true" />
      <div className="sheet" ref={sheetRef}>
        <h2 className="sheet-title">{g.name} i en retvinklet trekant</h2>
        <p className="sheet-line">
          <Rich text={`Trekant $ABC$ er retvinklet i $C$. Vis, at $${g.tex}$.`} />
        </p>
        <p className="sheet-line sheet-proof">Bevis:</p>

        {steps
          .filter((s) => s.kind === 'build')
          .map((s) =>
            step > s.n ? (
              <div key={s.n} className="note-row is-done">
                <span className="margin-num">{s.n}</span>
                <span className="cell text">
                  <Rich text={s.note} />
                </span>
              </div>
            ) : step === s.n ? (
              <div key={s.n} className="note-row is-draft">
                <span className="margin-num">{s.n}</span>
                <span className="cell blank" aria-hidden="true" />
              </div>
            ) : null,
          )}

        {step >= 7 && <div className="eq-group">{[answerRow(7), answerRow(8)].filter(Boolean)}</div>}
        {step >= 9 && <div className="eq-group">{lastRows.filter(Boolean)}</div>}

        {finished && (
          <p className="sheet-line qed is-done">
            <span className="cell">
              <Rich text={`Altså er $${g.tex}$.`} />
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
