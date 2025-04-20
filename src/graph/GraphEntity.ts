import { SimPosition } from "../types"
import { getDistinctEntityColours } from '../util/colours';
import { Graph } from './types';

export type NodePosition = {
    type: "ON_NODE",
    nodeID: number
}

export type EdgePosition = {
    type: "ON_EDGE",
    edgeID: number,
    toNodeID: number,
    progressRatio: number,
}

export type FreePosition = SimPosition & {
    type: "FREE",
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

export class EntityController {
    constructor(
        private graph: Graph
    ) {

    }

    public updateEntities = (positioner: GraphEntityPositioner) => {
        if (positioner.entityPositionOf(0) !== null) {
            return
        }

        const nodeIDs: number[] = [...this.graph.iterableNodeCopy].map((node) => node.id);

        const entityNum = 40;
        const colors = getDistinctEntityColours(entityNum);

        for (let i = 0; i < entityNum; i++) {
            positioner.initialiseEntity({
                type: "ON_NODE",
                nodeID: nodeIDs[Math.floor(Math.random() * nodeIDs.length)],
            }, {
                entityID: i,
                name: "blah",
                moveSpeed: 1000,
                colour: colors[i],
            });
        }
    }
}

