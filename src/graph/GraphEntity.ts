import { SimPosition } from "../types"

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

    positioner.initialiseEntity({
        type: "node",
        nodeID: 0
    }, {
        entityID: 0,
        name: "blah",
        moveSpeed: 1000,
        colour: 0x1155AA,
    })

    positioner.initialiseEntity({
        type: "node",
        nodeID: 0
    }, {
        entityID: 1,
        name: "blah",
        moveSpeed: 1000,
        colour: 0x000000,
    })

    positioner.initialiseEntity({
        type: "node",
        nodeID: 5
    }, {
        entityID: 2,
        name: "blah",
        moveSpeed: 1000,
        colour: 0x000000,
    })

    positioner.initialiseEntity({
        type: "node",
        nodeID: 5
    }, {
        entityID: 3,
        name: "blah",
        moveSpeed: 1000,
        colour: 0x000000,
    })

    positioner.initialiseEntity({
        type: "node",
        nodeID: 5
    }, {
        entityID: 4,
        name: "blah",
        moveSpeed: 1000,
        colour: 0x000000,
    })
}
