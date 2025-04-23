import { SimPosition } from "../types"
import { randomFrom, getSimPositionOf } from "../util";
import { getDistinctEntityColours } from '../util/colours';
import { Graph, InteractiveGraph } from './types';

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
    toNodeID?: number,
}

export type EntityPosition = NodePosition | EdgePosition | FreePosition

export type EntityRenderData = {
    entityID: number
    name: string
    simMoveSpeed: number
    colour: number
}

type Entity = EntityPosition & EntityRenderData;


export interface GraphEntityPositioner {
    initialiseEntity: (entityPosition: EntityPosition, entity: EntityRenderData) => void;
    moveEntityToNode: (nodeID: number, entity: EntityRenderData, edgeID?: number) => void;
    entityPositionOf: (entityID: number) => EntityPosition | null;
}

class EntityCreationError extends Error { }

export class EntityController {
    private entities: Map<number, Entity> = new Map();
    private lastMoved: number;

    constructor(
        private graph: Graph,
        private interactiveGraph: InteractiveGraph
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
        const edgeToUse = this.graph.connectionBetween(currentNodeID, moveTo.id);

        if (edgeToUse === null) {
            throw new EntityCreationError("could not move random entity because inconsistency between graph.connectionBeteen and graph.neighboursOf found");
        }

        positioner.moveEntityToNode(moveTo.id, entity, edgeToUse.id);
    }

    private initialiseEntities(positioner: GraphEntityPositioner) {
        const nodeIDs: number[] = [...this.graph.iterableNodeCopy].map((node) => node.id);

        const entityNum = 80;
        const colors = getDistinctEntityColours(entityNum);

        for (let i = 0; i < entityNum; i++) {
            const position: NodePosition = {
                type: "ON_NODE",
                nodeID: nodeIDs[Math.floor(Math.random() * nodeIDs.length)],
            }
            const renderData: EntityRenderData = {
                entityID: i,
                name: "blah",
                simMoveSpeed: 100,
                colour: colors[i],
            }
            positioner.initialiseEntity(position, renderData);
            this.entities.set(i, {
                ...position,
                ...renderData
            });
        }
    }

    private syncEntities(positioner: GraphEntityPositioner) {
        // staying in sync with the latest entity positions from the positioner
        // assumes that the positioner never independently creates entities
        for (const [id, entity] of this.entities.entries()) {
            const entityRenderData: EntityRenderData = {
                entityID: entity.entityID,
                name: entity.name,
                simMoveSpeed: entity.simMoveSpeed,
                colour: entity.colour,
            }

            const entityPosition: EntityPosition | null = positioner.entityPositionOf(id);

            if (entityPosition === null) {
                return;
            }

            const newEntity: Entity = {
                ...entityPosition,
                ...entityRenderData,
            }

            this.entities.set(id, newEntity);
        }
    }

    public updateEntities = (positioner: GraphEntityPositioner, time: number, _delta: number) => {
        this.syncEntities(positioner);

        // initialise entities if not already existing
        if (this.entities.size === 0) {
            this.initialiseEntities(positioner);
            this.lastMoved = time;
        }

        for (const [_, entity] of this.entities.entries()) {
            if (entity.type === "FREE" && entity.toNodeID === undefined) {
                // Convert Phaser coordinates to Simulation coordinates before finding nearest node
                const simPosition = getSimPositionOf(entity.x, entity.y);
                positioner.moveEntityToNode(this.interactiveGraph.nearestNodeTo(simPosition.x, simPosition.y), entity);
            }
        }

        if (time - this.lastMoved > 100) {
            this.moveRandomEntityToAdjacentNode(positioner);
            this.lastMoved = time;
        }
    }
}

