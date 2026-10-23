/** Populate only with user-provided, verified source records. */
export interface SourceReference {
    id: string;
    kind: 'primary' | 'secondary';
    title: string;
    creators: string[];
    date: string;
    archiveName: string;
    collection: string;
    documentUrl: string;
    imageCredits: string;
    citation: string;
    rights?: string;
    linkedMechanicIds?: string[];
    quotation?: string;
    notes?: string;
}

export const sources: SourceReference[] = [];

export interface HistoricalContent {
    id: string;
    title: string;
    text: string;
    sourceIds: string[];
    status: 'placeholder' | 'verified';
}
