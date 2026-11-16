import { useEffect, useReducer, useState } from 'react';
import { CampaignBoard } from '../components/CampaignBoard';
import { ShipArt } from '../components/ShipArt';
import { createCampaign, campaignReducer } from '../campaign/reducer';
import { engagements } from '../campaign/scenarios';
import { scoring } from '../campaign/config';
import { getLegalActions } from '../game/rules';
import { stats } from '../game/config';
import { classification, isAlive, isCombatant, sideOf } from '../game/units';
import type { Action, Unit } from '../game/types';
import '../campaign/campaign.css';

type ActionMode = 'move' | 'reposition' | 'attack' | 'french-intervention' | 'port-advantage' | null;

export function Battlefield() {
  const [campaign, dispatch] = useReducer(campaignReducer, undefined, () => createCampaign());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<ActionMode>(null);
  const [portTargetId, setPortTargetId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'engagement' | 'campaign' | null>(null);
  const [showBriefing, setShowBriefing] = useState(true);
  const game = campaign.game;
  const definition = engagements[campaign.engagementIndex];
  const selected = game.units.find(unit => unit.id === selectedId);
  const playerTurn = campaign.status === 'playing' && game.phase === 'american';
  const legal = playerTurn ? getLegalActions(game).filter(action => action.unitId === selectedId) : [];
  const actions = legal.filter(action => action.type === mode);
  const latest = campaign.results.at(-1);

  useEffect(() => {
    if (campaign.status !== 'playing' || (game.phase !== 'british' && game.phase !== 'operations')) return;
    const timer = window.setTimeout(
      () => dispatch({ type: game.phase === 'british' ? 'ai-step' : 'resolve', revision: campaign.revision }),
      250,
    );
    return () => window.clearTimeout(timer);
  }, [campaign.status, campaign.revision, game.phase]);

  function order(action: Action) {
    dispatch({ type: 'order', action, revision: campaign.revision });
    setMode(null);
    setPortTargetId(null);
  }

  function resetSelection() {
    setSelectedId(null);
    setMode(null);
    setPortTargetId(null);
  }

  function selectMode(nextMode: ActionMode) {
    setMode(mode === nextMode ? null : nextMode);
    setPortTargetId(null);
  }

  function choosePortTarget(target: Unit) {
    if (!portTargetId) {
      setPortTargetId(target.id);
      return;
    }
    if (portTargetId === target.id) {
      setPortTargetId(null);
      return;
    }
    const action = actions.find(candidate =>
      candidate.type === 'port-advantage' &&
      candidate.targetIds.includes(portTargetId) &&
      candidate.targetIds.includes(target.id));
    if (action) order(action);
    else setPortTargetId(target.id);
  }

  const unitsLeft = (side: 'american' | 'british') =>
    game.units.filter(unit => sideOf(unit.owner) === side && isAlive(unit) && isCombatant(unit)).length;

  return <section className="page campaign-page">
    <div className="page-heading">
      <div>
        <p className="eyebrow">THREE-ROUND CAMPAIGN · ROUND {definition.number} OF 3</p>
        <h1>{definition.title}</h1>
        <p>{definition.date} · {definition.location}{definition.alternativeName && ` · Also known as the ${definition.alternativeName}`}</p>
        <p>{definition.theme}{definition.portBattle && <span className="port-battle-tag">STRATEGIC SEA CONTROL</span>}</p>
      </div>
      <div className="campaign-score"><small>CAMPAIGN SCORE</small><strong>{campaign.score}</strong><small>Provisional game points</small></div>
    </div>

    <ol className="campaign-overview" aria-label="Campaign engagements">
      {engagements.map((engagement, index) => {
        const result = campaign.results.find(item => item.number === engagement.number);
        return <li key={engagement.number} className={index === campaign.engagementIndex ? 'current' : ''} aria-current={index === campaign.engagementIndex ? 'step' : undefined}>
          <span>0{engagement.number}</span>
          <div><strong>{engagement.date}: {engagement.title}</strong><small>{result ? result.outcome : index === campaign.engagementIndex ? 'Current engagement' : 'Upcoming'}</small></div>
        </li>;
      })}
    </ol>

    {showBriefing && campaign.status === 'playing' ? <section className="round-briefing" aria-labelledby="round-briefing-title">
      <p className="eyebrow">HISTORICAL INTRODUCTION · {definition.date}</p>
      <h2 id="round-briefing-title">{definition.title}</h2>
      {definition.alternativeName && <p className="fine">Also known as the {definition.alternativeName}</p>}
      <p>{definition.historicalIntroduction}</p>
      <p className="fine">Game objective: {definition.objectiveText}</p>
      <button className="primary" onClick={() => setShowBriefing(false)}>Begin Battle</button>
    </section> : <>
      <div className="game-toolbar">
        <div className="mission-brief">
          <span className="eyebrow">ENGAGEMENT OBJECTIVE</span>
          <p>{definition.objectiveText}</p>
          <small>At turn {game.scenario.roundLimit}, more remaining combat hull wins; equal hull is a draw.</small>
        </div>
        <button className="secondary" onClick={() => setConfirm('engagement')}>Restart Engagement</button>
        <button className="secondary" onClick={() => setConfirm('campaign')}>Restart Campaign</button>
      </div>

      <details className="prototype-disclosure">
        <summary>About the game rules</summary>
        <p>Fleet sizes, positions, hull, movement, damage, turn limits, and scores are simplified game rules, not historical measurements. Attack ranges follow each ship’s listed range. All fleets are visible. Round 2 is a fictionalized engagement inspired by the Newport Naval Campaign, not a decisive historical fleet battle.</p>
        <p>Scoring: +{scoring.engagementWin} for a win, +{scoring.britishWarshipSunk} per British warship sunk, and +{scoring.chesapeakeWinBonus} for a Round 3 win. Fresh fleets start each engagement; scores carry forward. Restart Engagement discards only that engagement's points.</p>
      </details>

      {confirm && <div className="notice" role="alert">
        <p>{confirm === 'campaign' ? 'Restart the whole campaign? All results and points will be cleared.' : 'Restart this engagement? Its points and result will be cleared. Earlier results will stay.'}</p>
        <button className="primary" onClick={() => {
          dispatch({ type: confirm === 'campaign' ? 'restart-campaign' : 'restart-engagement' });
          resetSelection();
          setShowBriefing(true);
          setConfirm(null);
        }}>Confirm Restart</button>
        <button className="secondary" onClick={() => setConfirm(null)}>Cancel</button>
      </div>}

      {campaign.status !== 'playing' && latest && <section className="result" role="status">
        <p className="eyebrow">{campaign.status === 'complete' ? 'CAMPAIGN COMPLETE' : `ROUND ${definition.number} RESULTS`}</p>
        <h2>{campaign.status === 'complete' ? 'Final campaign results' : latest.outcome === 'victory' ? 'Engagement won' : latest.outcome === 'defeat' ? 'Engagement lost' : 'Engagement drawn'}</h2>
        <p>{latest.reason}</p>
        <p>This engagement: {latest.score} points ({latest.sinkPoints} from warships, {latest.winPoints} from victory, {latest.bonus} bonus). Campaign total: {campaign.score}.</p>
        {campaign.status === 'engagement-results' ? <button className="primary" onClick={() => {
          dispatch({ type: 'continue', revision: campaign.revision });
          resetSelection();
          setShowBriefing(true);
        }}>Continue to Next Engagement</button> : <>
          <div className="campaign-results-table"><table>
            <caption>Performance across all three engagements</caption>
            <thead><tr><th scope="col">Round</th><th scope="col">Engagement</th><th scope="col">Location</th><th scope="col">Outcome</th><th scope="col">Warships sunk</th><th scope="col">Points</th></tr></thead>
            <tbody>{campaign.results.map(result => <tr key={result.number}>
              <td>{result.number}</td><td>{result.date}: {result.title}</td><td>{result.location}</td><td>{result.outcome}</td><td>{result.sunkWarships.length}</td><td>{result.score}</td>
            </tr>)}</tbody>
          </table></div>
          <button className="primary" onClick={() => setConfirm('campaign')}>Play Campaign Again</button>
        </>}
      </section>}

      <div className="command-status">
        <div>
          <span className="eyebrow">{campaign.status !== 'playing' ? 'ENGAGEMENT COMPLETE' : game.phase === 'american' ? 'REVOLUTIONARY ALLIANCE COMMAND' : game.phase === 'british' ? 'BRITISH COMMAND' : 'RESOLVING TURN'}</span>
          <strong>Turn {game.round} / {game.scenario.roundLimit}</strong>
          <span>{game.orders} of 3 orders remaining</span>
        </div>
        <div className="order-meter" aria-hidden="true">{[0, 1, 2].map(number => <span key={number} className={number < game.orders ? 'available' : ''} />)}</div>
        <button className="primary" disabled={!playerTurn} onClick={() => {
          dispatch({ type: 'end-turn', revision: campaign.revision });
          setMode(null);
          setPortTargetId(null);
        }}>End Turn</button>
      </div>

      <div className="campaign-legend">
        <span className="american"><i /> Continental Navy</span>
        <span className="privateer"><i /> American Privateers</span>
        {definition.fleet.french > 0 && <span className="french"><i /> French Allies</span>}
        <span className="british"><i /> British Warships</span>
      </div>
      <p className="fine fleet-counts">Revolutionary Alliance: {unitsLeft('american')} combat vessels afloat · British: {unitsLeft('british')} warships afloat. All American and French units share three player orders.</p>
      {definition.portBattle && <p className="port-notice">◇ Port Advantage Square: G7 · Control: {game.portControl}. {game.portControl === 'american' ? 'An eligible Allied ship can attack two different British ships in range once this turn.' : 'Move an Allied combat ship onto G7 to enable Port Advantage.'}</p>}

      <div className="battle-layout">
        <div>
          <CampaignBoard
            game={game}
            selected={selected}
            actions={actions}
            portTargetId={portTargetId}
            onSelect={unit => { setSelectedId(unit.id); setMode(null); setPortTargetId(null); }}
            onOrder={order}
            onPortTarget={choosePortTarget}
          />
          <p className="fine chart-hint">Select a vessel, choose an available action, then select highlighted tiles or targets. Keyboard: Tab and Enter or Space.</p>
          <section className="activity" aria-label="Engagement activity log">
            <h2>Activity log</h2><p role="status">{game.log.at(-1)}</p>
            <ol>{game.log.map((message, index) => <li key={index}>{message}</li>)}</ol>
          </section>
        </div>
        <aside aria-label="Ship information">
          <div className="panel-title">VESSEL INSPECTION <span>GAME VALUES</span></div>
          <div className="ship-detail">
            {selected ? <>
              <div className={`portrait ${selected.owner} ${selected.class === 'privateer' ? 'privateer' : ''} ${selected.class === 'merchantman' ? 'merchant' : ''}`}>
                <ShipArt /><span>{classification(selected)} · {selected.status}</span>
              </div>
              <h2>{selected.name}</h2>
              <p className="vessel-class">{classification(selected)} · {selected.class.replaceAll('_', ' ')}</p>
              <p className="fine">Position: {'ABCDEFGHIJKL'[selected.position[0]]}{selected.position[1] + 1}</p>
              <dl>
                <div><dt>Hull</dt><dd>{selected.hp}/{selected.maxHp}</dd></div>
                <div><dt>Movement</dt><dd>{stats[selected.class].move}<small>tiles</small></dd></div>
                <div><dt>Damage</dt><dd>{stats[selected.class].damage}</dd></div>
                <div><dt>Range</dt><dd>{stats[selected.class].range}</dd></div>
              </dl>
              <p className="fine">Move: {selected.movedThisRound ? 'used' : 'available'} · Attack: {selected.attackedThisRound ? 'used' : 'available'}</p>
              <div className="order-buttons">
                <button className="secondary" aria-pressed={mode === 'move'} disabled={!legal.some(action => action.type === 'move')} onClick={() => selectMode('move')}>Move</button>
                <button className="secondary" aria-pressed={mode === 'attack'} disabled={!legal.some(action => action.type === 'attack')} onClick={() => selectMode('attack')}>Attack</button>
                {selected.owner === 'american' && selected.class === 'privateer' && <button className="secondary" aria-pressed={mode === 'reposition'} disabled={!legal.some(action => action.type === 'reposition')} onClick={() => selectMode('reposition')}>Privateer Reposition</button>}
                {selected.owner === 'french' && definition.number >= 2 && <button className="secondary" aria-pressed={mode === 'french-intervention'} disabled={!legal.some(action => action.type === 'french-intervention')} onClick={() => selectMode('french-intervention')}>French Intervention</button>}
                {definition.portBattle && game.portControl === 'american' && sideOf(selected.owner) === 'american' && <button className="secondary" aria-pressed={mode === 'port-advantage'} disabled={!legal.some(action => action.type === 'port-advantage')} onClick={() => selectMode('port-advantage')}>Port Advantage</button>}
              </div>
              <p className="fine">
                {!isCombatant(selected) ? 'This vessel has no conventional attack or scoring role.' :
                  selected.status === 'sunk' ? 'This vessel has sunk.' :
                    !playerTurn ? 'Orders are unavailable outside Alliance command.' :
                      sideOf(selected.owner) === 'british' ? 'British vessels are controlled by the computer.' :
                        mode === 'port-advantage' ? portTargetId ? 'Select a second highlighted British ship; both targets will be attacked.' : 'Select two different highlighted British ships in range.' :
                          mode ? `Select a highlighted ${mode === 'move' || mode === 'reposition' ? 'destination' : 'target'}.` :
                            `Each move or normal attack costs one order.${definition.number >= 2 ? ' French Intervention is a bonus attack.' : ''} Privateer reposition is once per engagement.`}
              </p>
              <details className="research-details"><summary>Historical context</summary><p className="fine">{definition.historicalIntroduction}</p></details>
            </> : <div className="empty"><ShipArt /><h2>Select a vessel</h2><p>Inspect its classification, hull, and available actions.</p></div>}
          </div>
        </aside>
      </div>

      <section className="campaign-roster">
        <h2>Fleet roster</h2><p className="fine">Testing composition · Select any vessel to inspect it, including sunk ships.</p>
        <div>{game.units.map(unit => <button className={`roster-unit ${unit.owner} ${unit.class === 'privateer' ? 'privateer' : ''} ${unit.class === 'merchantman' ? 'merchant' : ''}`} key={unit.id} aria-pressed={selected?.id === unit.id} onClick={() => {
          setSelectedId(unit.id);
          setMode(null);
          setPortTargetId(null);
        }}>
          <strong>{unit.name}</strong><span>{classification(unit)} · {unit.status === 'sunk' ? 'Sunk' : `${unit.hp}/${unit.maxHp} hull`}</span>
        </button>)}</div>
      </section>

      <details className="objectives"><summary>Historical framing</summary><div>
        <article><h3>{definition.title}</h3><p>{definition.historicalIntroduction}</p></article>
        {definition.fictionalized && <p>This game encounter is fictionalized and should not be read as a decisive historical fleet battle.</p>}
      </div></details>
    </>}
  </section>;
}
