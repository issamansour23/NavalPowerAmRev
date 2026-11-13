import { same } from '../game/board';
import type { Action, GameState, Position, Unit } from '../game/types';
import { classification } from '../game/units';
import { ShipArt } from './ShipArt';

export function CampaignBoard({ game, selected, actions, onSelect, onOrder }: {
  game: GameState;
  selected: Unit | undefined;
  actions: Action[];
  onSelect: (unit: Unit) => void;
  onOrder: (action: Action) => void;
}) {
  return <div className="board-frame" role="region" aria-label="Engagement chart. Scroll horizontally on smaller screens." tabIndex={0}>
    <div className="board campaign-chart"><div className="campaign-board-row"><span />{'ABCDEFGHIJKL'.split('').map(letter => <span key={letter} className="coordinate">{letter}</span>)}</div>
      {Array.from({ length: 12 }, (_, y) => <div className="campaign-board-row" key={y}><span className="coordinate">{y + 1}</span>{Array.from({ length: 12 }, (_, x) => {
        const position: Position = [x, y];
        const tile = game.scenario.tiles.find(t => same(t.position, position));
        const unit = game.units.find(u => u.status === 'active' && same(u.position, position));
        const move = actions.find(a => a.type === 'move' && same(a.to, position));
        const attack = actions.find(a => a.type === 'attack' && a.targetId === unit?.id);
        const port = game.scenario.portAdvantage && same(game.scenario.portAdvantage, position);
        const coordinate = `${'ABCDEFGHIJKL'[x]}${y + 1}`;
        return <div key={x} className={`cell ${tile?.type === 'land' ? 'coast' : ''} ${port ? 'port-reserved' : ''}`}>
          {port && <span className="reserved-port" title="Port Advantage Square — inactive"><span>◇</span><small>Port · inactive</small></span>}
          {move && <button className="move-target" aria-label={`Move to ${coordinate}${port ? ', inactive port square' : ''}`} onClick={() => onOrder(move)}>·</button>}
          {unit && <button className={`unit ${unit.owner} ${unit.class === 'privateer' ? 'privateer' : ''} ${unit.class === 'merchantman' ? 'merchant' : ''} ${selected?.id === unit.id ? 'selected' : ''} ${attack ? 'attack-target' : ''}`}
            aria-label={`${unit.name}, ${classification(unit)}, ${coordinate}, hull ${unit.hp}/${unit.maxHp}${attack ? ', attack target' : ''}${port ? ', inactive port square' : ''}`}
            aria-pressed={selected?.id === unit.id} onClick={() => attack ? onOrder(attack) : onSelect(unit)}>
            <ShipArt /><small>{unit.owner === 'british' ? unit.class === 'merchantman' ? 'M' : 'GB' : unit.owner === 'french' ? 'FR' : unit.class === 'privateer' ? 'P' : 'AM'} {unit.hp}/{unit.maxHp}</small>
          </button>}
        </div>;
      })}</div>)}
    </div>
    <div className="board-caption"><span>Testing chart · Full fleet visibility</span><span>Not a historical map</span></div>
    {selected && <span className="sr-only">Selected vessel at {'ABCDEFGHIJKL'[selected.position[0]]}{selected.position[1] + 1}. Distances use orthogonal steps.</span>}
  </div>;
}
