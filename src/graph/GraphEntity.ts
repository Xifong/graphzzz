import { SimPosition } from "../types"
import { randomFrom } from "../util";
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
    simMoveSpeed: number
    colour: number
}

type Entity = EntityPosition & EntityRenderData;

export type MovementPath = {
    edgeID: number
} | null;


export interface GraphEntityPositioner {
    initialiseEntity: (entityPosition: EntityPosition, entity: EntityRenderData) => void;
    moveEntityToNode: (nodeID: number, movementPath: MovementPath, entity: EntityRenderData) => void;
    entityPositionOf: (entityID: number) => EntityPosition | null;
}

class EntityCreationError extends Error { }

export class EntityController {
    private entities: Map<number, Entity> = new Map();
    private lastMoved: number;

    constructor(
        private graph: Graph
    ) {

    }

    private moveRandomEntityToAdjacentNode(positioner: GraphEntityPositioner) {
        const entitiesOnNodes: Entity[] =
            Array.from(this.entities.values()).filter((position: EntityPosition) => position.type == "ON_NODE");

        if (entitiesOnNodes.length === 0) {
            return;
        }

        const entity: Entity = randomFrom(entitiesOnNodes);

        const currentNodeID = (entity as NodePosition).nodeID;
        const neighbours = this.graph.neighboursOf(currentNodeID);

        if (neighbours.length === 0) {
            return;
        }

        const moveTo = randomFrom(neighbours);
        const edgeToUse = this.graph.connectionBeteen(currentNodeID, moveTo.id);

        if (edgeToUse === null) {
            throw new EntityCreationError("could not move random entity because inconsistency between graph.connectionBeteen and graph.neighboursOf found");
        }

        positioner.moveEntityToNode(moveTo.id, { edgeID: edgeToUse.id }, entity);
    }

    private initialiseEntities(positioner: GraphEntityPositioner) {
        const nodeIDs: number[] = [...this.graph.iterableNodeCopy].map((node) => node.id);

        const entityNum = 40;
        const colors = getDistinctEntityColours(entityNum);

        for (let i = 0; i < entityNum; i++) {
            const position: NodePosition = {
                type: "ON_NODE",
                nodeID: nodeIDs[Math.floor(Math.random() * nodeIDs.length)],
            }
            const renderData: EntityRenderData = {
                entityID: i,
                name: "blah",
                simMoveSpeed: 1000,
                colour: colors[i],
            }
            positioner.initialiseEntity(position, renderData);
            this.entities.set(i, {
                ...position,
                ...renderData
            });
        }
    }

    public updateEntities = (positioner: GraphEntityPositioner, time: number, _delta: number) => {
        for (const [id, entity] of this.entities.entries()) {
            // TODO: this is pretty dire! Should have a single entity source of truth
            this.entities.set(id, {
                ...entity,
                ...positioner.entityPositionOf(id),
            });
        }

        if (this.entities.size === 0) {
            this.initialiseEntities(positioner);
            this.lastMoved = time;
        }

        if (time - this.lastMoved > 50) {
            this.moveRandomEntityToAdjacentNode(positioner);
            this.lastMoved = time;
        }
    }
}

