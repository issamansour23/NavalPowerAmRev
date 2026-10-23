import { useEffect, useReducer, useState } from 'react';
import { GameBoard } from '../components/GameBoard';
import { ShipArt } from '../components/ShipArt';
import { createGame, gameReducer } from '../game/reducer';
import { chooseBritishAction } from '../game/ai';
import { getLegalActions } from '../game/rules';
import { stats } from '../game/config';
import { factions } from '../data/fleet';
import { plannedSystems } from '../data/systems';

export function Battlefield() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createGame());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'move' | 'attack' | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const selected = state.units.find(u => u.id === selectedId);
  const playerTurn = state.phase === 'american' && !state.result;
  const legal = playerTurn ? getLegalActions(state).filter(a => a.unitId === selectedId) : [];
  const actions = legal.filter(a => a.type === mode);
  useEffect(() => {
    if (state.phase !== 'british' && state.phase !== 'operations') return;
    const timer = window.setTimeout(() => {
      if (state.phase === 'operations') dispatch({ type: 'resolve' });
      else dispatch(chooseBritishAction(state) ?? { type: 'end-phase', side: 'british' });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [state]);
  return <section className="page battlefield">
    <div className="page-heading"><div><p className="eyebrow">THE COMMAND CHART</p><h1>Chart the Atlantic</h1><p>A playable fleet demonstration with provisional rules and statistics.</p></div>
      <div className="turn"><small>{state.phase === 'american' ? 'YOUR COMMAND' : state.phase === 'british' ? 'BRITISH COMMAND' : state.phase === 'operations' ? 'RESOLVING ROUND' : 'DEMO COMPLETE'}</small><strong>Round {String(state.round).padStart(2, '0')}</strong><div className="order-meter" aria-hidden="true">{[0, 1, 2].map(order => <span key={order} className={order < state.orders ? 'available' : ''} />)}</div><small>{state.orders} of 3 orders available</small></div></div>
    <details className="prototype-disclosure"><summary><span className="status-dot" /> Prototype rules & research notice</summary><p>All statistics and rules are playtest fixtures, not historical specifications. Combat uses Manhattan range and ignores intervening terrain and ships. No historical interpretation is implied.</p></details>
    <div className="legend"><span className="american"><i /> American · Player</span><span className="british"><i /> British · AI</span></div>
    <div className="game-toolbar"><div className="mission-brief"><span className="eyebrow">DEMO OBJECTIVE</span><p>Hold the beacon at <strong>I6</strong> through British command.</p><small>Deadline: round {state.scenario.roundLimit} · Defeat if your fleet is lost or time expires.</small></div>
      <button className="secondary" disabled={!playerTurn} onClick={() => { setMode(null); dispatch({ type: 'end-phase', side: 'american' }); }}>End Turn</button>
      <button className="secondary" onClick={() => setConfirmRestart(true)}>Restart</button></div>
    {confirmRestart && <div className="notice" role="alert"><p>Restart the demo? Current progress will be lost.</p><button className="primary" onClick={() => { dispatch({ type: 'restart' }); setSelectedId(null); setMode(null); setConfirmRestart(false); }}>Confirm restart</button> <button className="secondary" onClick={() => setConfirmRestart(false)}>Cancel</button></div>}
    {state.result && <section className="result" role="status"><h2>{state.result === 'victory' ? 'Victory' : 'Defeat'}</h2><p>{state.log.at(-1)}</p><p>Provisional demo outcome only. Restart to play again.</p><button className="primary" onClick={() => setConfirmRestart(true)}>Play again</button></section>}
    <div className="battle-layout"><div><GameBoard state={state} selected={selected} actions={actions} onSelect={unit => { setSelectedId(unit.id); setMode(null); }}
      onMove={to => { if (playerTurn && selectedId) dispatch({ type: 'move', unitId: selectedId, to }); setMode(null); }}
      onAttack={targetId => { if (playerTurn && selectedId) dispatch({ type: 'attack', unitId: selectedId, targetId }); setMode(null); }} />
      <p className="fine chart-hint">Select a vessel → Choose an order → Select a highlighted destination or target.</p>
      <section className="activity" aria-label="Activity log"><h2>Activity log</h2><p role="status">{state.log.at(-1)}</p><ol>{state.log.map((entry, i) => <li key={i}>{entry}</li>)}</ol></section></div>
      <aside><div className="panel-title">VESSEL INSPECTION <span>LIVE STATUS</span></div><div className="ship-detail">{selected ? <>
        <div className={`portrait ${selected.owner}`}><ShipArt /><span>{factions[selected.owner]} · {selected.status}</span></div><h2>{selected.name}</h2>
        <p className="vessel-class">Prototype class: {selected.class.replaceAll('_', ' ')}</p>
        <dl><div><dt>Hull HP</dt><dd>{selected.hp}/{selected.maxHp}</dd></div><div><dt>Movement</dt><dd>{stats[selected.class].move}<small>orthogonal tiles</small></dd></div><div><dt>Damage</dt><dd>{stats[selected.class].damage}</dd></div><div><dt>Range</dt><dd>{stats[selected.class].range}</dd></div></dl>
        <p className="fine">Move: {selected.movedThisRound ? 'used' : 'unused'} · Attack: {selected.attackedThisRound ? 'used' : 'unused'}</p>
        <div className="order-buttons"><button className="secondary" aria-pressed={mode === 'move'} disabled={!legal.some(a => a.type === 'move')} onClick={() => setMode(mode === 'move' ? null : 'move')}>Move</button>
          <button className="secondary" aria-pressed={mode === 'attack'} disabled={!legal.some(a => a.type === 'attack')} onClick={() => setMode(mode === 'attack' ? null : 'attack')}>Attack</button></div>
        <p className="fine">{!playerTurn ? 'Orders unavailable outside American command.' : selected.owner !== 'american' ? 'Enemy vessels are read-only.' : !state.orders ? 'No orders remain. End your turn.' : mode ? `Choose a highlighted ${mode === 'move' ? 'tile' : 'target'}.` : 'Each move or attack costs one order.'}</p>
        <details className="research-details"><summary>Historical specifications & sources</summary><p className="fine">[Ship specifications pending research]</p><p className="fine">[Ship description pending research]</p><p className="fine">[Primary source citation needed]</p></details>
      </> : <div className="empty"><ShipArt /><h2>Awaiting your command</h2><p>Select a mock vessel to inspect its provisional stats.</p></div>}</div></aside></div>
    <details className="objectives"><summary>Future systems <span>Not yet implemented</span></summary><div>{plannedSystems.map(system => <article key={system.id}><h3>{system.title}</h3><p>{system.description}</p></article>)}</div></details>
  </section>;
}
