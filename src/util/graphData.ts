export function getNodePositioner(nodeID: number): string {
    return `${nodeID}-node-positioner`;
}

export function getEdgePositioner(edgeID: number, targetNodeID: number): string {
    return `${edgeID}-edge-to-node-${targetNodeID}-positioner`;
}

export function getNode(nodeID: number): string {
    return `node-${nodeID}`;
}
