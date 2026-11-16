import { useState } from 'react';
import { history, historicalPage } from '../data/history';
import { instructions } from '../data/instructions';
import { ContentSection } from '../components/ContentSection';

export function Information({ kind, onPlay }: {
    kind: 'instructions' | 'history';
    onPlay: () => void;
}) {
    const historical = kind === 'history';
    const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
    const selectedTopic = history.find(section => section.id === selectedTopicId);

    return <section className="page information">
        <h1>{historical ? historicalPage.title : 'How to Play'}</h1>
        <div className="parchment">
            {historical ? selectedTopic ? <>
                <button className="history-back" onClick={() => setSelectedTopicId(null)}>← All topics</button>
                <ContentSection content={selectedTopic} number={history.indexOf(selectedTopic) + 1} />
            </> : <nav className="history-topics" aria-label="Historical background topics">
                {history.map((section, index) => <button
                    className="history-topic"
                    key={section.id}
                    onClick={() => setSelectedTopicId(section.id)}
                >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{section.title}</strong>
                    <span aria-hidden="true">→</span>
                </button>)}
            </nav> : instructions.map((section, index) => <ContentSection
                key={section.title} content={section} number={index + 1}
            />)}
        </div>
        {!historical && <button className="primary" onClick={onPlay}>Explore the battlefield →</button>}
    </section>;
}
