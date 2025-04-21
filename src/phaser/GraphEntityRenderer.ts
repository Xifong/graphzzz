import { Scene } from "phaser";
import { EdgePosition, EntityPosition, EntityRenderData, GraphEntityPositioner, MovementPath, NodePosition } from "../graph/GraphEntity";
import { GraphModificationEvent } from "../graph/types";
import { NodeObject } from "./NodeObject";
import { PhaserPosition } from "../types";
import { EdgeObject } from "./EdgeObject";
import { EntityObject, TweenCompletionEvent } from "./EntityObject";
import { getEdgePositioner, getNodePositioner } from "../util/positioners";

export interface NodeEntityPositioner {
    addEntity(entityID: number, renderEntity: (point: PhaserPosition, node: NodeObject) => void): void
    removeEntity(entityID: number): void
}

export interface EdgeEntityPositioner {
    addEntity(entityID: number, renderEntity: (pointA: PhaserPosition, edge: EdgeObject, pointB: PhaserPosition) => void): void
    removeEntity(entityID: number): void
}


class EntityRenderingError extends Error {
    public cause?: unknown;

    constructor(message: string, cause?: unknown) {
        super(message);
        this.name = 'EntityRenderingError';
        this.cause = cause;
    }
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

    moveEntityToNode(nodeID: number, movementPath: MovementPath, entityRenderData: EntityRenderData) {
        const entity = this.entities.get(entityRenderData.entityID);

        if (entity === undefined) {
            return;
        }
        if (movementPath === null) {
            return;
        }

        const edgePosition: EdgePosition = {
            type: "ON_EDGE",
            edgeID: movementPath.edgeID,
            toNodeID: nodeID,
            progressRatio: 0,
        };

        this.positionAtEdge(edgePosition, entityRenderData);
    }

    private upsertEntityObject(position: EntityPosition, entityRenderData: EntityRenderData): EntityObject {
        const newEntity = new EntityObject(
            this.scene,
            entityRenderData,
            position,
            this.queueTweencompletion,
        );

        if (this.entities.has(entityRenderData.entityID)) {
            this.deleteEntityOld(entityRenderData.entityID);
        }

        this.entities.set(entityRenderData.entityID, newEntity);
        return newEntity;
    }

    private getNodePositioner(nodePosition: NodePosition): NodeEntityPositioner {
        if (!this.scene.data.has(getNodePositioner(nodePosition.nodeID))) {
            throw new EntityRenderingError(
                `could not get node positioner for node '${nodePosition.nodeID}'`
            );
        }
        return this.scene.data.get(getNodePositioner(nodePosition.nodeID));
    }

    private getEdgePositioner(edgePosition: EdgePosition): EdgeEntityPositioner {
        if (!this.scene.data.has(getEdgePositioner(edgePosition.edgeID, edgePosition.toNodeID))) {
            throw new EntityRenderingError(
                `could not get edge positioner for edge '${edgePosition.edgeID}'`
            );
        }

        return this.scene.data.get(getEdgePositioner(edgePosition.edgeID, edgePosition.toNodeID));
    }

    private deleteEntityOld(id: number) {
        const entity = this.entities.get(id);

        if (entity === undefined) {
            return;
        }

        switch (entity.entityPosition.type) {
            case "ON_NODE":
                this.getNodePositioner(entity.entityPosition).removeEntity(id);
                break;
            case "ON_EDGE":
                this.getEdgePositioner(entity.entityPosition).removeEntity(id);
                break;
            case "FREE":
                break;
        }

        this.entities.get(id)!.destroy();
    }

    private positionAtEdge(edgePosition: EdgePosition, entityRenderData: EntityRenderData) {
        try {
            const positioner = this.getEdgePositioner(edgePosition);
            const newEntity = this.upsertEntityObject(edgePosition, entityRenderData);

            positioner.addEntity(entityRenderData.entityID, newEntity.renderOntoEdgeSide);
        } catch (error) {
            throw new EntityRenderingError(`could not render entity '${entityRenderData.entityID}'`, error);
        }
    }

    private positionAtNode(nodePosition: NodePosition, entityRenderData: EntityRenderData) {
        try {
            const positioner = this.getNodePositioner(nodePosition);

            const newEntity = this.upsertEntityObject(nodePosition, entityRenderData);
            positioner.addEntity(entityRenderData.entityID, newEntity.renderOntoNodePoint);
        } catch (error) {
            throw new EntityRenderingError(`could not render entity '${entityRenderData.entityID}'`, error);
        }
    }

    private reattachEntitiesToNode(nodeID: number) {
        for (const entity of this.entities.values()) {
            if (entity.entityPosition.type === "ON_NODE" && entity.entityPosition.nodeID === nodeID) {
                this.positionAtNode(entity.entityPosition, entity.renderData);
            }
        }
    }

    private handleGraphModification(event: GraphModificationEvent) {
        switch (event.type) {
            case "NODE_DELETED":
                console.log(`renderer handling NODE_DELETED`);
                break;
            case "EDGE_DELETED":
                console.log(`renderer handling EDGE_DELETED`);
                break;
            case "NODE_MOVED":
                console.log(`renderer handling NODE_MOVED`);
                this.reattachEntitiesToNode(event.nodeID);
                break;
            case "NODE_ADDED":
                console.log(`renderer handling NODE_ADDED`);
                break;
            case "EDGE_ADDED":
                console.log(`renderer handling EDGE_ADDED`);
                break;
        }
    }

    private attachEntityToDestinationNode(entityID: number) {
        const entity = this.entities.get(entityID);

        if (entity === undefined) {
            return;
        }

        const entityEdgePosition = entity.entityPosition;
        if (entityEdgePosition.type !== "ON_EDGE") {
            return;
        }

        const position: NodePosition = {
            type: "ON_NODE",
            nodeID: entityEdgePosition.toNodeID,
        }

        this.positionAtNode(position, entity.renderData);
    }

    private handleTweenCompletion(event: TweenCompletionEvent) {
        switch (event.type) {
            case "MOVE_COMPLETE":
                console.log(`renderer handling MOVE_COMPLETE`);
                this.attachEntityToDestinationNode(event.entityID);
                break;
        }
    }

    update(time: number, delta: number) {
        for (const event of this.pendingTweenEvents) {
            this.handleTweenCompletion(event);
        }
        this.pendingTweenEvents = [];

        for (const event of this.pendingGraphEvents) {
            this.handleGraphModification(event);
        }
        this.pendingGraphEvents = [];

        this.decisionHandler(this, time, delta);
        for (const entity of this.entities.values()) {
            entity.update(time, delta);
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
