import type { HistoricalContent } from './sources';

export const historicalPage = {
    title: 'Historical Background',
    introduction: 'Background notes are still in progress. These are the topics this section will cover.',
    sourceNotice: 'Sources will be listed here alongside the finished notes.',
};

export const history: HistoricalContent[] = [
    {
        id: 'naval-power',
        title: 'British naval power',
        text: `The Royal Navy, Britain’s maritime fighting force, was central to British military operations during the American Revolution. The British had a plethora of naval resources, but as David Syrett explained, this did not guarantee control of the American coastline. The British naval force in North America was spread across the eastern seaboard of the continent, with thirty warships under the command of Vice Admiral Samuel Graves distributed between Nova Scotia and Florida in 1775. When fighting broke out, this dispersion created significant challenges to quelling the rebellion.

Syrett described the early British response as: “Without instructions, hampered by poor communications and lacking co-ordination”. However, the British did possess a significant advantage in their conventional warships and capacity to support military operations on the American coastline. The amphibious strength of the British also allowed them to transport troops across the Atlantic Ocean. During the 1776 campaign in the waters of New York, the Royal Navy put ashore approximately 4,500 soldiers under Lord Cornwallis, forcing the American garrison at Fort Lee to abandon its position. The British shortly thereafter launched an offensive against Newport, Rhode Island, where Syrett describes how 7,000 troops and 15 warships occupied the city without opposition.

The Royal Navy strengthened as the Revolution progressed. By March 1778, Admiral Lord Howe had command over 92 warships in American waters, with his vessels stationed to defend major British positions, patrol the coastline, and escort military convoys. In September of 1780, Admiral George Rodney arrived from the British West Indies with 10 additional ships, giving Britain strength described by Syrett as “total naval superiority in American waters”.

By September 1781, British ships under the command of Admiral Thomas Graves confronted a French fleet near the Chesapeake Bay. The engagement was not decisively won by either side, but the French were able to maintain control of the Chesapeake Bay, preventing the British from effectively reinforcing General Cornwallis’ army at Yorktown. The Royal Navy’s considerable advantages could not secure an overall victory, as geographic challenges, competing military priorities, and American and French intervention proved too great to alter the war more in favor of the British.

Syrett, David. The Royal Navy in American Waters, 1775–1783. Scolar Press, 1989.

Syrett, David. Shipping and the American War, 1775–83: A Study of British Transport Organization. Bloomsbury Academic, 2015.`,
        sourceIds: [],
        status: 'placeholder',
    },
    { id: 'privateering', title: 'American privateering', text: '', sourceIds: [], status: 'placeholder' },
    { id: 'intervention', title: 'French intervention', text: '', sourceIds: [], status: 'placeholder' },
    { id: 'shipping', title: 'Merchant shipping, blockades & ports', text: '', sourceIds: [], status: 'placeholder' },
];
