/**
 * Generates a unique ID for node positioning elements
 * @param nodeID - The unique identifier of the node
 * @returns String identifier for node positioner element
 */
export function getNodePositioner(nodeID: number): string {
    return `${nodeID}-node-positioner`;
}

/**
 * Generates a unique ID for edge positioning elements
 * @param edgeID - The unique identifier of the edge
 * @param targetNodeID - The target node's unique identifier
 * @returns String identifier for edge positioner element
 */
export function getEdgePositioner(edgeID: number, targetNodeID: number): string {
    return `${edgeID}-edge-to-node-${targetNodeID}-positioner`;
}

/**
 * Generates a unique ID for node elements
 * @param nodeID - The unique identifier of the node
 * @returns String identifier for the node element
 */
export function getNode(nodeID: number): string {
    return `node-${nodeID}`;
}
