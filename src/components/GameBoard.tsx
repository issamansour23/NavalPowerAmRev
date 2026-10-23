import type { Action, GameState, Position, Unit } from '../game/types';
import { same } from '../game/board';
import { ShipArt } from './ShipArt';
export function GameBoard({ state, selected, actions, onSelect, onMove, onAttack }: {
  state: GameState; selected: Unit | undefined; actions: Action[];
  onSelect: (unit: Unit) => void; onMove: (position: Position) => void; onAttack: (id: string) => void;
}) {
  return <div className="board-frame" role="region" aria-label="Battlefield chart — scroll horizontally on smaller screens" tabIndex={0}><div className="board"><div />{'ABCDEFGHIJKL'.split('').map(c => <span className="coordinate" key={c}>{c}</span>)}
    {Array.from({ length: 12 }, (_, y) => <div className="row" key={y}><span className="coordinate">{y + 1}</span>{Array.from({ length: 12 }, (_, x) => {
      const position: Position = [x, y];
      const tile = state.scenario.tiles.find(t => same(t.position, position));
      const unit = state.units.find(u => u.status === 'active' && same(u.position, position));
      const move = actions.some(a => a.type === 'move' && same(a.to, position));
      const attack = unit && actions.some(a => a.type === 'attack' && a.targetId === unit.id);
      const beacon = same(position, state.scenario.objective);
      return <div className={`cell ${tile?.type === 'land' ? 'coast' : ''} ${beacon ? 'beacon' : ''}`} key={x}>
        {tile?.type === 'port' && <span className="port">◇<small>Mock port · AM</small></span>}
        {beacon && <span className="beacon-label">◎<small>Demo beacon</small></span>}
        {move && <button className="move-target" aria-label={`Move to ${'ABCDEFGHIJKL'[x]}${y + 1}`} onClick={() => onMove(position)}>·</button>}
        {unit && <button aria-label={`${unit.name}, ${'ABCDEFGHIJKL'[x]}${y + 1}, HP ${unit.hp}/${unit.maxHp}${attack ? ', attack target' : ''}`} aria-pressed={selected?.id === unit.id}
          className={`unit ${unit.owner} ${selected?.id === unit.id ? 'selected' : ''} ${attack ? 'attack-target' : ''}`}
          onClick={() => attack ? onAttack(unit.id) : onSelect(unit)}><ShipArt /><small>{unit.owner === 'american' ? 'AM' : 'GB'} {unit.hp}/{unit.maxHp}</small></button>}
      </div>;
    })}</div>)}
  </div><div className="board-caption"><span>◇ Mock port · ◎ Demo objective</span><span>Provisional chart · Full visibility</span></div></div>;
}
