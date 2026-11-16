import type { HistoricalContent } from '../data/sources';

/** Shared rendering for research-backed text once verified content is supplied. */
export function ContentSection({ content, number, citationPlaceholder }: {
    content: Pick<HistoricalContent, 'title' | 'text'>;
    number: number;
    citationPlaceholder?: string;
}) {
    const paragraphs = content.text.split(/\n\s*\n/).filter(Boolean);
    return <article>
        <span>{String(number).padStart(2, '0')}</span>
        <div><h2>{content.title}</h2>{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            {citationPlaceholder && <p>{citationPlaceholder}</p>}
        </div>
    </article>;
}
