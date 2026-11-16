import { history, historicalPage } from '../data/history';
import { instructions } from '../data/instructions';
import { ContentSection } from '../components/ContentSection';

export function Information({ kind, onPlay }: {
    kind: 'instructions' | 'history';
    onPlay: () => void;
}) {
    const historical = kind === 'history';
    return <section className="page information">
        {!historical && <p className="eyebrow">HOW TO PLAY</p>}
        <h1>{historical ? historicalPage.title : 'How to Play'}</h1>
        {!historical && <p className="lead">Place your fleet, search enemy waters, and learn the rules of Revolution at Sea.</p>}
        <div className="parchment">
            {(historical ? history : instructions).map((section, index) => <ContentSection
                key={section.title} content={section} number={index + 1}
            />)}
            {historical && <div className="reading"><h3>Sources</h3></div>}
        </div>
        <button className="primary" onClick={onPlay}>Explore the battlefield →</button>
    </section>;
}
