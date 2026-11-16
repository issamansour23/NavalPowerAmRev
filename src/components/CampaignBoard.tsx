import { same } from '../game/board';
import type { Action, GameState, Position, Unit } from '../game/types';
import { classification } from '../game/units';
import { ShipArt } from './ShipArt';

export function CampaignBoard({ game, selected, actions, portTargetId, onSelect, onOrder, onPortTarget }: {
  game: GameState;
  selected: Unit | undefined;
  actions: Action[];
  portTargetId: string | null;
  onSelect: (unit: Unit) => void;
  onOrder: (action: Action) => void;
  onPortTarget: (unit: Unit) => void;
}) {
  return <div className="board-frame" role="region" aria-label="Engagement chart. Scroll horizontally on smaller screens." tabIndex={0}>
    <div className="board campaign-chart"><div className="campaign-board-row"><span />{'ABCDEFGHIJKL'.split('').map(letter => <span key={letter} className="coordinate">{letter}</span>)}</div>
      {Array.from({ length: 12 }, (_, y) => <div className="campaign-board-row" key={y}><span className="coordinate">{y + 1}</span>{Array.from({ length: 12 }, (_, x) => {
        const position: Position = [x, y];
        const tile = game.scenario.tiles.find(t => same(t.position, position));
        const unit = game.units.find(u => u.status === 'active' && same(u.position, position));
        const move = actions.find(a => a.type === 'move' && same(a.to, position));
        const attack = actions.find(a => (a.type === 'attack' || a.type === 'french-intervention') && a.targetId === unit?.id);
        const portTarget = Boolean(unit && actions.some(a => a.type === 'port-advantage' && a.targetIds.includes(unit.id)));
        const portSelected = unit?.id === portTargetId;
        const port = game.scenario.portAdvantage && same(game.scenario.portAdvantage, position);
        const coordinate = `${'ABCDEFGHIJKL'[x]}${y + 1}`;
        return <div key={x} className={`cell ${tile?.type === 'land' ? 'coast' : ''} ${port ? 'port-reserved' : ''}`}>
          {port && <span className="reserved-port" title="Port Advantage Square G7"><span>◇</span><small>Port · G7</small></span>}
          {move && <button className="move-target" aria-label={`Move to ${coordinate}${port ? ', Port Advantage square G7' : ''}`} onClick={() => onOrder(move)}>·</button>}
          {unit && <button className={`unit ${unit.owner} ${unit.class === 'privateer' ? 'privateer' : ''} ${unit.class === 'merchantman' ? 'merchant' : ''} ${selected?.id === unit.id ? 'selected' : ''} ${attack || portTarget ? 'attack-target' : ''} ${portSelected ? 'port-target-selected' : ''}`}
            aria-label={`${unit.name}, ${classification(unit)}, ${coordinate}, hull ${unit.hp}/${unit.maxHp}${attack || portTarget ? ', attack target' : ''}${port ? ', Port Advantage square G7' : ''}`}
            aria-pressed={selected?.id === unit.id || portSelected} onClick={() => portTarget ? onPortTarget(unit) : attack ? onOrder(attack) : onSelect(unit)}>
            <ShipArt /><small>{unit.owner === 'british' ? unit.class === 'merchantman' ? 'M' : 'GB' : unit.owner === 'french' ? 'FR' : unit.class === 'privateer' ? 'P' : 'AM'} {unit.hp}/{unit.maxHp}</small>
          </button>}
        </div>;
      })}</div>)}
    </div>
    <div className="board-caption"><span>Testing chart · Full fleet visibility</span><span>Not a historical map</span></div>
    {selected && <span className="sr-only">Selected vessel at {'ABCDEFGHIJKL'[selected.position[0]]}{selected.position[1] + 1}.</span>}
  </div>;
}
