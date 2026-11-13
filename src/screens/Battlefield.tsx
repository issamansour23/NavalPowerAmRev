import { useEffect, useReducer, useState } from 'react';
import { CampaignBoard } from '../components/CampaignBoard';
import { ShipArt } from '../components/ShipArt';
import { createCampaign, campaignReducer } from '../campaign/reducer';
import { engagements } from '../campaign/scenarios';
import { futureAbilities, scoring } from '../campaign/config';
import { getLegalActions } from '../game/rules';
import { stats } from '../game/config';
import { classification, isAlive, isCombatant, sideOf } from '../game/units';
import type { Action } from '../game/types';
import '../campaign/campaign.css';

export function Battlefield() {
  const [campaign, dispatch] = useReducer(campaignReducer, undefined, () => createCampaign());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'move' | 'attack' | null>(null);
  const [confirm, setConfirm] = useState<'engagement' | 'campaign' | null>(null);
  const game = campaign.game;
  const definition = engagements[campaign.engagementIndex];
  const selected = game.units.find(u => u.id === selectedId);
  const playerTurn = campaign.status === 'playing' && game.phase === 'american';
  const legal = playerTurn ? getLegalActions(game).filter(a => a.unitId === selectedId) : [];
  const actions = legal.filter(a => a.type === mode);
  const latest = campaign.results.at(-1);
  useEffect(() => {
    if (campaign.status !== 'playing' || (game.phase !== 'british' && game.phase !== 'operations')) return;
    const timer = window.setTimeout(() => dispatch({ type: game.phase === 'british' ? 'ai-step' : 'resolve', revision: campaign.revision }), 250);
    return () => window.clearTimeout(timer);
  }, [campaign.status, campaign.revision, game.phase]);
  function order(action: Action) {
    dispatch({ type: 'order', action, revision: campaign.revision }); setMode(null);
  }
  function resetSelection() { setSelectedId(null); setMode(null); }
  const unitsLeft = (side: 'american' | 'british') => game.units.filter(u => sideOf(u.owner) === side && isAlive(u) && isCombatant(u)).length;
  return <section className="page campaign-page">
    <div className="page-heading"><div><p className="eyebrow">THREE-ROUND CAMPAIGN · ROUND {definition.number} OF 3</p><h1>{definition.location}</h1><p>{definition.theme}{definition.portBattle && <span className="port-battle-tag">PORT BATTLE</span>}</p></div><div className="campaign-score"><small>CAMPAIGN SCORE</small><strong>{campaign.score}</strong><small>Provisional game points</small></div></div>
    <ol className="campaign-overview" aria-label="Campaign engagements">{engagements.map((engagement, i) => {
      const result = campaign.results.find(r => r.number === engagement.number);
      return <li key={engagement.number} className={i === campaign.engagementIndex ? 'current' : ''} aria-current={i === campaign.engagementIndex ? 'step' : undefined}><span>0{engagement.number}</span><div><strong>{engagement.location}</strong><small>{result ? result.outcome : i === campaign.engagementIndex ? 'Current engagement' : 'Upcoming'}</small></div></li>;
    })}</ol>
    <div className="game-toolbar"><div className="mission-brief"><span className="eyebrow">TESTING OBJECTIVE</span><p>{definition.objectiveText}</p><small>At turn {game.scenario.roundLimit}, more remaining combat hull wins; equal hull is a draw. Merchants do not count.</small></div><button className="secondary" onClick={() => setConfirm('engagement')}>Restart Engagement</button><button className="secondary" onClick={() => setConfirm('campaign')}>Restart Campaign</button></div>
    <details className="prototype-disclosure"><summary>About the testing rules</summary><p>Fleet sizes, positions, hull, movement, damage, turn limits, and scores are game fixtures, not historical findings. The three locations and themes are scenario labels. Attacks use Manhattan range and ignore intervening terrain and ships. All fleets are visible. No special abilities are active.</p><p>Scoring: +{scoring.engagementWin} for a win, +{scoring.britishWarshipSunk} per British warship sunk, and +{scoring.chesapeakeWinBonus} for a Round 3 win. Fresh fleets start each engagement; scores carry forward. Restart Engagement discards only that engagement's points.</p></details>
    {confirm && <div className="notice" role="alert"><p>{confirm === 'campaign' ? 'Restart the whole campaign? All results and points will be cleared.' : 'Restart this engagement? Its points and result will be cleared. Earlier results will stay.'}</p><button className="primary" onClick={() => { dispatch({ type: confirm === 'campaign' ? 'restart-campaign' : 'restart-engagement' }); resetSelection(); setConfirm(null); }}>Confirm Restart</button> <button className="secondary" onClick={() => setConfirm(null)}>Cancel</button></div>}
    {campaign.status !== 'playing' && latest && <section className="result" role="status"><p className="eyebrow">{campaign.status === 'complete' ? 'CAMPAIGN COMPLETE' : `ROUND ${definition.number} RESULTS`}</p><h2>{campaign.status === 'complete' ? 'Final campaign results' : latest.outcome === 'victory' ? 'Engagement won' : latest.outcome === 'defeat' ? 'Engagement lost' : 'Engagement drawn'}</h2><p>{latest.reason}</p><p>This engagement: {latest.score} points ({latest.sinkPoints} from warships, {latest.winPoints} from victory, {latest.bonus} bonus). Campaign total: {campaign.score}.</p>
      {campaign.status === 'engagement-results' ? <button className="primary" onClick={() => { dispatch({ type: 'continue', revision: campaign.revision }); resetSelection(); }}>Continue to Next Engagement</button> : <><div className="campaign-results-table"><table><caption>Performance across all three engagements</caption><thead><tr><th scope="col">Round</th><th scope="col">Location</th><th scope="col">Outcome</th><th scope="col">Warships sunk</th><th scope="col">Points</th></tr></thead><tbody>{campaign.results.map(result => <tr key={result.number}><td>{result.number}</td><td>{result.location}</td><td>{result.outcome}</td><td>{result.sunkWarships.length}</td><td>{result.score}</td></tr>)}</tbody></table></div><button className="primary" onClick={() => setConfirm('campaign')}>Play Campaign Again</button></>}
    </section>}
    <div className="command-status"><div><span className="eyebrow">{campaign.status !== 'playing' ? 'ENGAGEMENT COMPLETE' : game.phase === 'american' ? 'REVOLUTIONARY ALLIANCE COMMAND' : game.phase === 'british' ? 'BRITISH COMMAND' : 'RESOLVING TURN'}</span><strong>Turn {game.round} / {game.scenario.roundLimit}</strong><span>{game.orders} of 3 orders remaining</span></div><div className="order-meter" aria-hidden="true">{[0, 1, 2].map(n => <span key={n} className={n < game.orders ? 'available' : ''} />)}</div><button className="primary" disabled={!playerTurn} onClick={() => { dispatch({ type: 'end-turn', revision: campaign.revision }); setMode(null); }}>End Turn</button></div>
    <div className="campaign-legend"><span className="american"><i /> American Navy</span><span className="privateer"><i /> American Privateers</span>{definition.fleet.french > 0 && <span className="french"><i /> French Allies</span>}<span className="british"><i /> British Warships</span>{definition.fleet.merchants > 0 && <span className="merchant"><i /> Merchant fixtures</span>}</div>
    <p className="fine fleet-counts">Revolutionary Alliance: {unitsLeft('american')} combat vessels afloat · British: {unitsLeft('british')} warships afloat. All American and French units share three player orders.</p>
    {definition.portBattle && <p className="port-notice">◇ Port Advantage Square: G7 · Inactive · Port control: {game.portControl}. No attack bonus or objective effect.</p>}
    <div className="battle-layout"><div><CampaignBoard game={game} selected={selected} actions={actions} onSelect={unit => { setSelectedId(unit.id); setMode(null); }} onOrder={order} /><p className="fine chart-hint">Select a vessel, choose Move or Attack, then select a highlighted tile or target. Keyboard: Tab and Enter or Space.</p>
      <section className="activity" aria-label="Engagement activity log"><h2>Activity log</h2><p role="status">{game.log.at(-1)}</p><ol>{game.log.map((message, i) => <li key={i}>{message}</li>)}</ol></section></div>
      <aside aria-label="Ship information"><div className="panel-title">VESSEL INSPECTION <span>TEST VALUES</span></div><div className="ship-detail">{selected ? <><div className={`portrait ${selected.owner} ${selected.class === 'privateer' ? 'privateer' : ''} ${selected.class === 'merchantman' ? 'merchant' : ''}`}><ShipArt /><span>{classification(selected)} · {selected.status}</span></div><h2>{selected.name}</h2><p className="vessel-class">{classification(selected)} · {selected.class.replaceAll('_', ' ')}</p><p className="fine">Position: {'ABCDEFGHIJKL'[selected.position[0]]}{selected.position[1] + 1}</p>
        <dl><div><dt>Hull</dt><dd>{selected.hp}/{selected.maxHp}</dd></div><div><dt>Movement</dt><dd>{stats[selected.class].move}<small>orthogonal tiles</small></dd></div><div><dt>Damage</dt><dd>{stats[selected.class].damage}</dd></div><div><dt>Range</dt><dd>{stats[selected.class].range}</dd></div></dl>
        <p className="fine">Move: {selected.movedThisRound ? 'used' : 'available'} · Attack: {selected.attackedThisRound ? 'used' : 'available'}</p><div className="order-buttons"><button className="secondary" aria-pressed={mode === 'move'} disabled={!legal.some(a => a.type === 'move')} onClick={() => setMode(mode === 'move' ? null : 'move')}>Move</button><button className="secondary" aria-pressed={mode === 'attack'} disabled={!legal.some(a => a.type === 'attack')} onClick={() => setMode(mode === 'attack' ? null : 'attack')}>Attack</button></div>
        <p className="fine">{!isCombatant(selected) ? 'Merchant fixture only. No conventional attacks, interception, or scoring.' : selected.status === 'sunk' ? 'This vessel has sunk.' : !playerTurn ? 'Orders are unavailable outside Alliance command.' : sideOf(selected.owner) === 'british' ? 'British vessels are controlled by the computer.' : !game.orders ? 'No orders remain. End your turn.' : mode ? `Select a highlighted ${mode === 'move' ? 'destination' : 'target'}.` : 'Each move or attack costs one order. Each vessel can do each once per turn.'}</p><details className="research-details"><summary>Historical notes</summary><p className="fine">Ship specifications and source notes are still to come.</p></details></> : <div className="empty"><ShipArt /><h2>Select a vessel</h2><p>Inspect its classification, hull, and available orders.</p></div>}</div></aside>
    </div>
    <section className="campaign-roster"><h2>Fleet roster</h2><p className="fine">Testing composition · Select any vessel to inspect it, including sunk ships.</p><div>{game.units.map(unit => <button className={`roster-unit ${unit.owner} ${unit.class === 'privateer' ? 'privateer' : ''} ${unit.class === 'merchantman' ? 'merchant' : ''}`} key={unit.id} aria-pressed={selected?.id === unit.id} onClick={() => { setSelectedId(unit.id); setMode(null); }}><strong>{unit.name}</strong><span>{classification(unit)} · {unit.status === 'sunk' ? 'Sunk' : `${unit.hp}/${unit.maxHp} hull`}</span></button>)}</div></section>
    <details className="objectives"><summary>Later abilities <span>Not active in this version</span></summary><div>{futureAbilities.map(ability => <article key={ability.id}><h3>{ability.label}</h3><p>Reserved for Milestone 2C.</p></article>)}</div></details>
  </section>;
}
