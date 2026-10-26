import { useEffect, useReducer, useState } from 'react';
import { GameBoard } from '../components/GameBoard';
import { SHIPS } from '../battleship/config';
import { createGame, gameReducer, isSunk, nextShip, remaining } from '../battleship/engine';
import { canPlace, coordinate, shipCells, validFleet } from '../battleship/placement';
import { boardView } from '../battleship/view';
import type { Position, Side } from '../battleship/types';
import { gameplayNote, upcomingNote } from '../data/gameContent';
import '../battleship/battleship.css';

function newSeed() { return crypto.getRandomValues(new Uint32Array(1))[0]; }

export function Battlefield() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createGame(newSeed()));
  const [hover, setHover] = useState<Position | null>(null);
  const [placementError, setPlacementError] = useState('');
  const [confirmNew, setConfirmNew] = useState(false);
  const pending = nextShip(state);
  const placing = state.phase === 'placement';
  const ready = validFleet(state.boards.american.ships);
  const preview = placing && pending && hover ? shipCells(pending.class, hover, state.orientation) : [];
  const previewValid = !!(pending && hover && canPlace(state.boards.american.ships, pending.class, hover, state.orientation));
  useEffect(() => {
    if (state.phase !== 'british') return;
    const timer = window.setTimeout(() => dispatch({ type: 'computer', matchId: state.matchId, turnNumber: state.turnNumber }), 650);
    return () => window.clearTimeout(timer);
  }, [state.phase, state.matchId, state.turnNumber]);
  function reset() {
    dispatch({ type: 'new-game', seed: newSeed() });
    setHover(null); setPlacementError(''); setConfirmNew(false);
  }
  function place(position: Position) {
    if (!pending) return;
    if (!canPlace(state.boards.american.ships, pending.class, position, state.orientation)) {
      setPlacementError(`Cannot place ${pending.label} at ${coordinate(position)}. Keep every square inside the grid and clear of other ships.`);
      return;
    }
    dispatch({ type: 'place', position }); setPlacementError(''); setHover(null);
  }
  const turnLabel = placing ? 'Fleet placement' : state.phase === 'american' ? 'Your turn' : state.phase === 'british' ? 'British turn' : state.winner === 'american' ? 'Victory' : 'Defeat';
  return <section className="page battleship-page">
    <div className="page-heading"><div><p className="eyebrow">REVOLUTION AT SEA</p><h1>{placing ? 'Prepare your fleet' : 'The battle at sea'}</h1><p>{placing ? 'Place three American vessels, then enter British Waters.' : 'Choose one unexplored square. Sink the enemy fleet to win.'}</p></div>
      <div className="turn" aria-live="polite"><small>{placing ? 'PREPARATION' : state.winner ? 'BATTLE COMPLETE' : `TURN ${Math.ceil(state.turnNumber / 2)}`}</small><strong>{turnLabel}</strong><small>{placing ? `${state.boards.american.ships.length} of 3 ships placed` : state.phase === 'british' ? 'Opponent is choosing a coordinate…' : state.winner ? 'Both fleets now revealed' : 'One attack per turn'}</small></div></div>
    <div className="battle-status-bar"><div className="american"><span className="status-dot" /> American Fleet <strong>{placing ? state.boards.american.ships.length : remaining(state.boards.american)} / 3</strong><small>{placing ? 'placed' : 'afloat'}</small></div><div className="british"><span className="status-dot" /> British Fleet <strong>{remaining(state.boards.british)} / 3</strong><small>afloat</small></div><button className="secondary" onClick={() => placing ? reset() : setConfirmNew(true)}>New Game</button></div>
    {confirmNew && <div className="notice" role="alert"><p>Start a new game? Current placements and attacks will be cleared.</p><button className="primary" onClick={reset}>Confirm New Game</button> <button className="secondary" onClick={() => setConfirmNew(false)}>Keep Playing</button></div>}
    {state.winner && <section className="result" role="status"><p className="eyebrow">BATTLE COMPLETE</p><h2>{state.winner === 'american' ? 'Victory at sea' : 'Your fleet has been sunk'}</h2><p>{state.winner === 'american' ? 'Every British vessel has been sunk. The American fleet wins.' : 'Every American vessel has been sunk. The British fleet wins.'}</p><button className="primary" onClick={reset}>Play Again</button></section>}
    {placing && <section className="placement-panel" aria-label="Ship placement controls">
      <div className="placement-heading"><div><p className="eyebrow">FLEET DEPLOYMENT</p><h2>{pending ? `Place your ${pending.label}` : 'Your fleet is ready'}</h2><p>{pending ? `${pending.length} squares · ${state.orientation}. Select a starting square on your chart.` : 'All three vessels are placed. Start Game when ready.'}</p></div><button className="primary" disabled={!ready} onClick={() => { setHover(null); dispatch({ type: 'start' }); }}>Start Game <span aria-hidden="true">→</span></button></div>
      <ol className="placement-roster">{SHIPS.map(ship => {
        const placed = state.boards.american.ships.some(s => s.class === ship.class);
        return <li key={ship.class} className={placed ? 'placed' : pending?.class === ship.class ? 'current' : ''} aria-current={pending?.class === ship.class ? 'step' : undefined}><span>{placed ? '✓' : String(SHIPS.indexOf(ship) + 1).padStart(2, '0')}</span><div><strong>{ship.label}</strong><small>{ship.length} squares · {placed ? 'Placed' : pending?.class === ship.class ? 'Place now' : 'Next'}</small></div><div className="length-mark" aria-hidden="true">{Array.from({ length: ship.length }, (_, i) => <i key={i} />)}</div></li>;
      })}</ol>
      <div className="placement-actions"><button className="secondary" disabled={ready} onClick={() => { dispatch({ type: 'rotate' }); setPlacementError(''); }}>Orientation: {state.orientation === 'horizontal' ? 'Horizontal' : 'Vertical'} ↻</button><button className="secondary" onClick={() => { dispatch({ type: 'randomize' }); setHover(null); setPlacementError(''); }}>Randomize Fleet</button><button className="text-button" disabled={!state.boards.american.ships.length} onClick={() => { dispatch({ type: 'clear-placement' }); setHover(null); setPlacementError(''); }}>Clear Placement</button></div>
      <p className="placement-feedback" role="status">{placementError || 'Ships may touch, but cannot overlap or extend beyond the chart.'}</p>
    </section>}
    <div className="battle-announcement" role="status" aria-live="polite">{state.log.at(-1)}</div>
    <div className="fleet-boards">{(['american', 'british'] as Side[]).map(side => <section className={`fleet-section ${side}`} key={side}>
      <div className="fleet-section-heading"><div><p className="eyebrow">{side === 'american' ? 'FRIENDLY WATERS' : 'ENEMY WATERS'}</p><h2>{side === 'american' ? 'American Fleet' : 'British Waters'}</h2></div><span>{side === 'american' ? placing ? 'Place ships here' : 'Your positions are visible' : state.winner ? 'Fleet revealed' : placing ? 'Hidden fleet' : state.phase === 'american' ? 'Select a square to attack' : 'Awaiting your turn'}</span></div>
      <GameBoard side={side} cells={boardView(state, side)} enabled={side === 'american' ? placing && !!pending : state.phase === 'american'} placing={side === 'american' && placing} preview={side === 'american' ? preview : []} previewValid={previewValid} onHover={side === 'american' ? setHover : undefined} onChoose={side === 'american' ? place : position => dispatch({ type: 'attack', position })} />
      <ul className="fleet-manifest" aria-label={`${side} ship status`}>{SHIPS.map(ship => {
        const placed = state.boards[side].ships.find(s => s.class === ship.class);
        const sunk = placed && isSunk(placed, state.boards[side]);
        return <li key={ship.class}><span>{ship.label} <small>({ship.length})</small></span><span className={sunk ? 'sunk-label' : ''}>{sunk ? 'Sunk' : placed ? placing && side === 'american' ? 'Placed' : 'Afloat' : 'Not placed'}</span></li>;
      })}</ul>
    </section>)}</div>
    <div className="shot-legend" aria-label="Chart symbols"><span><i className="legend-water" /> Unexplored water</span><span><i className="legend-ship" /> Friendly / revealed ship</span><span><b className="legend-hit">×</b> Hit</span><span><b className="legend-miss">•</b> Miss</span><span><i className="legend-sunk" /> Sunk ship</span></div>
    <div className="battle-bottom"><section className="activity" aria-label="Combat event log"><h2>Combat event log</h2><ol>{state.log.map((entry, i) => <li key={i}>{entry}</li>)}</ol></section><section className="battle-instructions"><h2>Commander's notes</h2><p>{placing ? 'Place ships horizontally or vertically. Use Orientation to rotate the next ship, or Randomize Fleet to place all three.' : 'Attack British Waters once per turn. Hits do not grant an extra turn. The British computer then attacks your fleet.'}</p><p>Use Tab to focus a square and Enter or Space to select it. Arrow keys move between available squares.</p><p className="fine">{gameplayNote}</p><details className="research-details"><summary>Still to come</summary><p className="fine">{upcomingNote}</p></details></section></div>
  </section>;
}
