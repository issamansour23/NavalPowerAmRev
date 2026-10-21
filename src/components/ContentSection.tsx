import type { HistoricalContent } from '../data/sources';

/** Shared rendering for research-backed text once verified content is supplied. */
export function ContentSection({ content, number, citationPlaceholder }: {
    content: Pick<HistoricalContent, 'title' | 'text'>;
    number: number;
    citationPlaceholder?: string;
}) {
    return <article>
        <span>{String(number).padStart(2, '0')}</span>
        <div><h2>{content.title}</h2><p>{content.text}</p>
            {citationPlaceholder && <p>{citationPlaceholder}</p>}
        </div>
    </article>;
}
