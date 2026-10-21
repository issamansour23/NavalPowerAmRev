/** Integration slots only: no rules, balance, or victory conditions are assigned. */
export interface PlannedSystem {
    id: string;
    title: string;
    status: 'pending-research-and-approval';
    description: string;
    sourceIds: string[];
}
export const plannedSystems: PlannedSystem[] = [
    { id: 'british-naval-power', title: 'British naval power', status: 'pending-research-and-approval', description: '[Faction mechanics pending research and approval]', sourceIds: [] },
    { id: 'american-privateering', title: 'American privateering', status: 'pending-research-and-approval', description: '[Privateering mechanics pending research and approval]', sourceIds: [] },
    { id: 'french-intervention', title: 'French intervention', status: 'pending-research-and-approval', description: '[Intervention mechanics pending research and approval]', sourceIds: [] },
    { id: 'merchant-shipping', title: 'Merchant shipping', status: 'pending-research-and-approval', description: '[Merchant mechanics pending research and approval]', sourceIds: [] },
    { id: 'blockades', title: 'Blockades', status: 'pending-research-and-approval', description: '[Blockade mechanics pending research and approval]', sourceIds: [] },
    { id: 'ports', title: 'Ports', status: 'pending-research-and-approval', description: '[Port mechanics pending research and approval]', sourceIds: [] },
];
export const objectivesPlaceholder = '[Objectives and victory conditions pending approval]';
