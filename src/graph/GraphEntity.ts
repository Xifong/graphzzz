import { SimPosition } from "../types"
import { getDistinctEntityColours } from '../util/colours';

export type NodePosition = {
    type: "node",
    nodeID: number
}

export type EdgePosition = {
    type: "edge",
    edgeID: number,
    toNodeID: number,
    progressRatio: number,
}

export type FreePosition = SimPosition & {
    type: "free",
    toNodeID: number,
}

export type EntityPosition = NodePosition | EdgePosition | FreePosition


export type EntityRenderData = {
    entityID: number
    name: string
    moveSpeed: number
    colour: number
}

export type MovementPath = {
    edgeID: number
} | null;


export interface GraphEntityPositioner {
    initialiseEntity: (entityPosition: EntityPosition, entity: EntityRenderData) => void;
    moveEntityToNode: (nodeID: number, movementPath: MovementPath, entity: EntityRenderData) => EntityPosition;
    entityPositionOf: (entityID: number) => EntityPosition | null;
}

export function enactEntityDecisions(positioner: GraphEntityPositioner) {
    if (positioner.entityPositionOf(0) !== null) {
        return
    }

    // Get 5 distinct colors for our 5 entities
    const colors = getDistinctEntityColours(5);

    // Create entities with distinct colors
    const entities = [
        { nodeID: 0, entityID: 0 },
        { nodeID: 0, entityID: 1 },
        { nodeID: 5, entityID: 2 },
        { nodeID: 5, entityID: 3 },
        { nodeID: 5, entityID: 4 },
    ];

    entities.forEach((entity, index) => {
        positioner.initialiseEntity({
            type: "node",
            nodeID: entity.nodeID
        }, {
            entityID: entity.entityID,
            name: "blah",
            moveSpeed: 1000,
            colour: colors[index],
        });
    });
}
