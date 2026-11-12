import { useEffect, useRef } from 'react'
import { Tex, Rich } from './Tex.jsx'
import { displayParts } from '../lib/display.js'

// Blokken: figurtrinene (1–6) skrives som tekstlinjer. Trin 7–8 (k) og trin 9 (omformningen)
// er ligninger med lighedstegnene under hinanden.

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

export default function Notepad({ steps, step, answers, draft }) {
  const finished = step > steps.length
  const active = steps[step - 1]
  const sheetRef = useRef(null)

  // Rul med ned, når der kommer en ny linje på blokken
  const lineCount = (answers[9]?.lines?.length || 0) + step
  useEffect(() => {
    const el = sheetRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [lineCount])

  function exprRow(n) {
    if (answers[n]) return <EqRow key={n} n={n} parts={answers[n]} state="done" />
    if (n !== step) return null
    const parts = displayParts(active, draft) || { lhs: active.lhs, rhs: '\\phantom{x}' }
    return <EqRow key={n} n={n} parts={parts} state="draft" />
  }

  // Trin 9: startligningen og elevens linjer
  const s9 = steps[8]
  const chain = answers[9]?.lines || []
  const chainRows = []
  if (step >= 9) {
    chainRows.push(
      <EqRow key="start" n={9} parts={displayParts(s9, s9.start)} state="done" note="(begge er k)" />,
    )
    chain.forEach((l, i) => {
      const last = i === chain.length - 1 && answers[9]?.done
      chainRows.push(<EqRow key={i} n="" parts={l} state="done" result={last} />)
    })
    if (step === 9) {
      const parts = displayParts(s9, draft)
      chainRows.push(<EqRow key="draft" n="" parts={parts} state="draft" />)
    }
  }

  return (
    <div className="notepad">
      <div className="spiral" aria-hidden="true" />
      <div className="sheet" ref={sheetRef}>
        <h2 className="sheet-title">Cosinus i en retvinklet trekant</h2>
        <p className="sheet-line">
          <Rich text="Trekant $ABC$ er retvinklet i $C$. Vis, at $\cos(A) = \dfrac{b}{c}$." />
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

        {step >= 7 && <div className="eq-group">{[7, 8].map(exprRow).filter(Boolean)}</div>}
        {chainRows.length > 0 && <div className="eq-group">{chainRows}</div>}

        {finished && (
          <p className="sheet-line qed is-done">
            <span className="cell">
              <Rich text="Altså er $\cos(A) = \dfrac{b}{c}$ – den hosliggende katete divideret med hypotenusen." />
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
