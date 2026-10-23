import { history, historicalPage } from '../data/history';
import { instructions } from '../data/instructions';
import { ContentSection } from '../components/ContentSection';

export function Information({ kind, onPlay }: {
    kind: 'instructions' | 'history';
    onPlay: () => void;
}) {
    const historical = kind === 'history';
    return <section className="page information">
        <p className="eyebrow">{historical ? 'RESEARCH PENDING' : 'YOUR FIRST ORDERS'}</p>
        <h1>{historical ? historicalPage.title : 'How to Play'}</h1>
        <p className="lead">{historical ? historicalPage.introduction : 'Learn the core controls, plan your orders, and play the provisional fleet demonstration.'}</p>
        <div className="parchment">
            {(historical ? history : instructions).map((section, index) => <ContentSection
                key={section.title} content={section} number={index + 1}
                citationPlaceholder={historical ? historicalPage.citationPlaceholder : undefined}
            />)}
            {historical && <div className="reading"><h3>Source references</h3><p>{historicalPage.sourceNotice}</p></div>}
        </div>
        <button className="primary" onClick={onPlay}>Explore the battlefield →</button>
    </section>;
}
