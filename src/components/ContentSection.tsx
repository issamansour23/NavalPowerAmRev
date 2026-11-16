import type { HistoricalContent } from '../data/sources';
import type { ReactNode } from 'react';

function renderLinks(text: string): ReactNode[] {
    const parts: ReactNode[] = [];
    const pattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
    let lastIndex = 0;

    for (const match of text.matchAll(pattern)) {
        const [markdown, label, url] = match;
        const index = match.index ?? 0;
        parts.push(text.slice(lastIndex, index));
        parts.push(<a key={index} href={url} target="_blank" rel="noreferrer">{label}</a>);
        lastIndex = index + markdown.length;
    }

    parts.push(text.slice(lastIndex));
    return parts;
}

/** Shared rendering for research-backed text once verified content is supplied. */
export function ContentSection({ content, number, citationPlaceholder }: {
    content: Pick<HistoricalContent, 'title' | 'text'>;
    number: number;
    citationPlaceholder?: string;
}) {
    const paragraphs = content.text.split(/\n\s*\n/).filter(Boolean);
    return <article>
        <span>{String(number).padStart(2, '0')}</span>
        <div><h2>{content.title}</h2>{paragraphs.map((paragraph, index) => <p key={index}>{renderLinks(paragraph)}</p>)}
            {citationPlaceholder && <p>{citationPlaceholder}</p>}
        </div>
    </article>;
}
