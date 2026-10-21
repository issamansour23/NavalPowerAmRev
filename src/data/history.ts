import type { HistoricalContent } from './sources';

export const historicalPage = {
    title: 'Historical Background',
    introduction: '[Historical background to be added]',
    citationPlaceholder: '[Primary source citation needed]',
    sourceNotice: 'No source records have been added. Historical content awaits user-provided research.',
};

export const history: HistoricalContent[] = [
    { id: 'naval-power', title: 'British naval power', text: '[Historical background to be added]', sourceIds: [], status: 'placeholder' },
    { id: 'privateering', title: 'American privateering', text: '[Historical background to be added]', sourceIds: [], status: 'placeholder' },
    { id: 'intervention', title: 'French intervention', text: '[Historical background to be added]', sourceIds: [], status: 'placeholder' },
    { id: 'shipping', title: 'Merchant shipping, blockades & ports', text: '[Historical background to be added]', sourceIds: [], status: 'placeholder' },
];
