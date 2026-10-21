import { factions, fleet, ports } from '../data/fleet';
import type { Ship } from '../data/fleet';
import { ShipArt } from './ShipArt';
export function GameBoard({ selected, onSelect }: {
    selected: Ship | undefined;
    onSelect: (ship: Ship) => void;
}) {
    return <div className="board-frame"><div className="board"><div />{'ABCDEFGHIJKL'.split('').map(c => <span className="coordinate" key={c}>{c}</span>)}{Array.from({ length: 12 }, (_, y) => <div className="row" key={y}><span className="coordinate">{y + 1}</span>{Array.from({ length: 12 }, (_, x) => { const ship = fleet.find(s => s.position[0] === x && s.position[1] === y); const port = ports.find(p => p.x === x && p.y === y); return <div className={`cell ${x === 0 || (x === 1 && y < 4) ? 'coast' : ''}`} key={x}>{port && <span className="port">◇<small>{port.name}</small></span>}{ship && <button aria-label={`${ship.name}, ${factions[ship.faction]}, ${'ABCDEFGHIJKL'[x]}${y + 1}`} aria-pressed={selected?.id === ship.id} className={`unit ${ship.faction} ${selected?.id === ship.id ? 'selected' : ''}`} onClick={() => onSelect(ship)}><ShipArt /><small>{ship.faction === 'american' ? 'AM' : ship.faction === 'british' ? 'GB' : 'FR'}</small></button>}</div>; })}</div>)}</div><div className="board-caption"><span>◇ Strategic port</span><span>Schematic chart · Not to geographic scale</span></div></div>;
}
