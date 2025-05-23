import { Scene } from "phaser";
import { EdgePosition, EntityPosition, EntityRenderData, FreePosition, GraphEntityPositioner, NodePosition } from "../graph/GraphEntity";
import { GraphModificationEvent } from "../graph/types";
import { NodeObject } from "./NodeObject";
import { PhaserPosition } from "../types";
import { EdgeObject } from "./EdgeObject";
import { EntityObject, TweenCompletionEvent } from "./EntityObject";
import { getEdgePositioner, getNode, getNodePositioner } from "../util/graphData";
import { EntityRenderingError } from "./EntityRenderingError";
import { GRAPH_ENTITY_NUM } from "../graph/vars";


export type EntityRenderFunc = (oldPoint: PhaserPosition, node: NodeObject, newPoint: PhaserPosition) => void;


export interface NodeEntityPositioner {
    addEntity(entityID: number, entityRenderer: EntityRenderFunc, initialPosition?: PhaserPosition): void
    removeEntity(entityID: number): void
}

export interface EdgeEntityPositioner {
    addEntity(entityID: number, renderEntity: (pointA: PhaserPosition, edge: EdgeObject, pointB: PhaserPosition) => void): void
    removeEntity(entityID: number): void
}


export interface GraphEntityRenderer {
    update: (time: number, delta: number) => void;
    setController: (handler: (positioner: GraphEntityPositioner, time: number, delta: number) => void) => void;
    queueGraphModification: (event: GraphModificationEvent) => void;
}

export class GraphEntityRendererImp extends Phaser.GameObjects.Container implements GraphEntityPositioner, GraphEntityRenderer {
    private pendingGraphEvents: GraphModificationEvent[] = [];
    private pendingTweenEvents: TweenCompletionEvent[] = [];
    private entities: Map<number, EntityObject> = new Map();
    private decisionHandler: (positioner: GraphEntityPositioner, time: number, delta: number) => void;

    constructor(
        public scene: Scene,
    ) {
        super(scene);
    }

    entityPositionOf(entityID: number): EntityPosition | null {
        return this.entities.get(entityID)?.entityPosition ?? null;
    }

    initialiseEntity(entityPosition: EntityPosition, entity: EntityRenderData) {
        if (this.entities.has(entity.entityID)) {
            throw new EntityRenderingError(`could not create entity with id '${entity.entityID}', since it already exists`);
        }

        switch (entityPosition.type) {
            case "ON_NODE":
                this.positionAtNode(entityPosition, entity);
                break;
            case "ON_EDGE":
                this.positionAtEdge(entityPosition, entity);
                break;
            case "FREE":
        }
    }

    private moveEntityToNodeViaEdge(nodeID: number, entityRenderData: EntityRenderData, edgeID: number) {
        const edgePosition: EdgePosition = {
            type: "ON_EDGE",
            edgeID: edgeID,
            toNodeID: nodeID,
            progressRatio: 0,
        };

        this.positionAtEdge(edgePosition, entityRenderData);
    }

    private moveEntityToNodeFreely(nodeID: number, entityRenderData: EntityRenderData) {
        const entity = this.entities.get(entityRenderData.entityID);

        if (entity === undefined) {
            return;
        }

        const realPosition = entity.currentPosition();
        const freePosition: FreePosition = {
            type: "FREE",
            x: realPosition.x,
            y: realPosition.y,
            toNodeID: nodeID,
        };
        this.positionFreely(freePosition, entityRenderData);
    }

    moveEntityToNode(nodeID: number, entityRenderData: EntityRenderData, edgeID?: number) {
        const entity = this.entities.get(entityRenderData.entityID);

        if (entity === undefined) {
            return;
        }

        if (edgeID === undefined) {
            this.moveEntityToNodeFreely(nodeID, entityRenderData);
            return;
        }
        this.moveEntityToNodeViaEdge(nodeID, entityRenderData, edgeID);
    }

    private upsertEntityObject(position: EntityPosition, entityRenderData: EntityRenderData): EntityObject {
        const oldEntity = this.entities.get(entityRenderData.entityID);

        let oldPosition = undefined;
        if (oldEntity !== undefined) {
            oldPosition = oldEntity.currentPosition();
            this.deleteEntityOld(entityRenderData.entityID);
        }

        const newEntity = new EntityObject(
            this.scene,
            entityRenderData,
            position,
            this.queueTweencompletion,
            oldPosition,
        );

        if (this.entities.has(entityRenderData.entityID)) {
            this.deleteEntityOld(entityRenderData.entityID);
        }

        this.entities.set(entityRenderData.entityID, newEntity);
        return newEntity;
    }

    private getNodePositioner(nodePosition: NodePosition): NodeEntityPositioner | null {
        return this.scene.data.get(getNodePositioner(nodePosition.nodeID));
    }

    private getEdgePositioner(edgePosition: EdgePosition): EdgeEntityPositioner | null {
        return this.scene.data.get(getEdgePositioner(edgePosition.edgeID, edgePosition.toNodeID));
    }

    private deleteEntityOld(id: number) {
        const entity = this.entities.get(id);

        if (entity === undefined) {
            return;
        }

        switch (entity.entityPosition.type) {
            case "ON_NODE":
                this.getNodePositioner(entity.entityPosition)?.removeEntity(id);
                break;
            case "ON_EDGE":
                this.getEdgePositioner(entity.entityPosition)?.removeEntity(id);
                break;
            case "FREE":
                break;
        }

        entity.destroy();
    }

    private positionAtEdge(edgePosition: EdgePosition, entityRenderData: EntityRenderData) {
        try {
            const positioner = this.getEdgePositioner(edgePosition);

            if (!positioner) {
                throw new EntityRenderingError(`could not get positioner for edge '${edgePosition.edgeID}'`);
            }

            const newEntity = this.upsertEntityObject(edgePosition, entityRenderData);

            positioner.addEntity(entityRenderData.entityID, newEntity.renderOntoEdgeSide);
        } catch (error) {
            throw new EntityRenderingError(`could not render entity '${entityRenderData.entityID}'`, error);
        }
    }

    private positionAtNode(nodePosition: NodePosition, entityRenderData: EntityRenderData) {
        try {
            const positioner = this.getNodePositioner(nodePosition);

            if (!positioner) {
                throw new EntityRenderingError(`could not get positioner for node '${nodePosition.nodeID}'`);
            }

            const previousPosition = this.entities.get(entityRenderData.entityID)?.currentPosition();
            const newEntity = this.upsertEntityObject(nodePosition, entityRenderData);

            positioner.addEntity(entityRenderData.entityID, newEntity.renderOntoNodePoint, previousPosition);
        } catch (error) {
            throw new EntityRenderingError(`could not render entity '${entityRenderData.entityID}'`, error);
        }
    }

    private positionFreely(freePosition: FreePosition, entityRenderData: EntityRenderData) {
        const newEntity = this.upsertEntityObject(freePosition, entityRenderData);
        if (freePosition.toNodeID !== undefined) {
            const nodeObject = this.scene.data.get(getNode(freePosition.toNodeID));

            if (nodeObject === undefined) {
                throw new EntityRenderingError(`attempted to move to non-existent node object for node id '${freePosition.toNodeID}'`);
            }

            newEntity.renderOntoGraphCanvas({ x: freePosition.x, y: freePosition.y }, nodeObject);
            return
        }
        newEntity.renderOntoGraphCanvas({ x: freePosition.x, y: freePosition.y });
    }

    private reattachEntitiesToNode(nodeID: number) {
        for (const entity of this.entities.values()) {
            if (entity.entityPosition.type === "ON_NODE" && entity.entityPosition.nodeID === nodeID) {
                this.positionAtNode(entity.entityPosition, entity.renderData);
            }
        }
    }

    private detachEntity(entity: EntityObject) {
        const exactPosition = entity.currentPosition();
        const position: FreePosition = {
            type: "FREE",
            x: exactPosition.x,
            y: exactPosition.y,
        }
        this.positionFreely(position, entity.renderData);
    }

    private detachEntitiesFromNode(nodeID: number) {
        for (const entity of this.entities.values()) {
            switch (entity.entityPosition.type) {
                case "ON_NODE":
                    if (!(entity.entityPosition.nodeID === nodeID)) {
                        continue;
                    }
                    break;
                case "ON_EDGE":
                    if (!(entity.entityPosition.toNodeID === nodeID)) {
                        continue;
                    }
                    break;
                case "FREE":
                    if (!(entity.entityPosition.toNodeID === nodeID)) {
                        continue;
                    }
                    break;
            }

            this.detachEntity(entity);
        }
    }

    private detachMovingEntitiesFromNode(nodeID: number) {
        for (const entity of this.entities.values()) {
            switch (entity.entityPosition.type) {
                case "ON_NODE":
                    continue;
                case "ON_EDGE":
                    if (!(entity.entityPosition.toNodeID === nodeID)) {
                        continue;
                    }
                    break;
                case "FREE":
                    if (!(entity.entityPosition.toNodeID === nodeID)) {
                        continue;
                    }
                    break;
            }

            this.detachEntity(entity);
        }
    }

    private detachEntitesFromEdge(edgeID: number) {
        for (const entity of this.entities.values()) {
            switch (entity.entityPosition.type) {
                case "ON_NODE":
                    continue;
                case "ON_EDGE":
                    if (!(entity.entityPosition.edgeID === edgeID)) {
                        continue;
                    }
                    break;
                case "FREE":
                    continue;
            }

            this.detachEntity(entity);
        }
    }

    private handleGraphModification(event: GraphModificationEvent) {
        switch (event.type) {
            case "NODE_DELETED":
                this.detachEntitiesFromNode(event.nodeID);
                break;
            case "EDGE_DELETED":
                this.detachEntitesFromEdge(event.edgeID);
                break;
            case "NODE_MOVED":
                this.reattachEntitiesToNode(event.nodeID);
                this.detachMovingEntitiesFromNode(event.nodeID);
                break;
            case "EDGE_MOVED":
                this.detachEntitesFromEdge(event.edgeID);
                break;
        }
    }

    private attachEntityToDestinationNode(entityID: number) {
        const entity = this.entities.get(entityID);

        if (entity === undefined) {
            return;
        }

        const entityPosition = entity.entityPosition;
        if (entityPosition.type === "ON_NODE") {
            return;
        }

        if (entityPosition.toNodeID === undefined) {
            return;
        }

        const position: NodePosition = {
            type: "ON_NODE",
            nodeID: entityPosition.toNodeID,
        }

        this.positionAtNode(position, entity.renderData);
    }

    private handleTweenCompletion(event: TweenCompletionEvent) {
        switch (event.type) {
            case "MOVE_COMPLETE":
                this.attachEntityToDestinationNode(event.entityID);
                break;
        }
    }

    update(time: number, delta: number) {
        for (const event of this.pendingGraphEvents) {
            this.handleGraphModification(event);
        }
        this.pendingGraphEvents = [];

        for (const event of this.pendingTweenEvents) {
            this.handleTweenCompletion(event);
        }
        this.pendingTweenEvents = [];


        this.decisionHandler(this, time, delta);
        for (const entity of this.entities.values()) {
            entity.update(time, delta);
        }

        if (this.entities.size < GRAPH_ENTITY_NUM) {
            throw Error("we've lost entities (rend)!");
        }
    }

    queueTweencompletion = (event: TweenCompletionEvent) => {
        this.pendingTweenEvents.push(event);
    }

    queueGraphModification = (event: GraphModificationEvent) => {
        this.pendingGraphEvents.push(event);
    }

    setController(handler: (positioner: GraphEntityPositioner, time: number, delta: number) => void) {
        this.decisionHandler = handler;
    }
}
