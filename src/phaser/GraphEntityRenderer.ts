import { Scene } from "phaser";
import { EdgePosition, EntityPosition, EntityRenderData, GraphEntityPositioner, MovementPath, NodePosition } from "../graph/GraphEntity";
import { GraphModificationEvent } from "../graph/types";
import { ENTITY_DEPTH, ENTITY_GRAPHICS_STYLE, ENTITY_RADIUS } from "../scenes/vars";
import { NodeObject } from "./NodeObject";
import { PhaserPosition } from "../types";
import { EdgeObject } from "./EdgeObject";
import { getPhaserDuration } from "../util";

export interface NodeEntityPositioner {
    addEntity(entityID: number, renderEntity: (point: PhaserPosition, node: NodeObject) => void): void
    removeEntity(entityID: number): void
}

export interface EdgeEntityPositioner {
    addEntity(entityID: number, renderEntity: (pointA: PhaserPosition, edge: EdgeObject, pointB: PhaserPosition) => void): void
    removeEntity(entityID: number): void
}


class EntityRenderingError extends Error {
}

export interface GraphEntityRenderer {
    update: (time: number, delta: number) => void;
    setController: (handler: (positioner: GraphEntityPositioner) => void) => void;
    queueGraphModification: (event: GraphModificationEvent) => void;
}

export class GraphEntityRendererImp extends Phaser.GameObjects.Container implements GraphEntityPositioner, GraphEntityRenderer {
    private pendingEvents: GraphModificationEvent[] = [];
    private entities: Map<number, EntityObject> = new Map();
    private decisionHandler: (positioner: GraphEntityPositioner) => void;

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
            position
        );

        if (this.entities.has(entityRenderData.entityID)) {
            this.entities.get(entityRenderData.entityID)!.destroy();
        }

        this.entities.set(entityRenderData.entityID, newEntity);
        return newEntity;
    }

    private positionAtEdge(edgePosition: EdgePosition, entityRenderData: EntityRenderData) {
        if (!this.scene.data.has(`${edgePosition.edgeID}-edge-positioner`)) {
            throw new EntityRenderingError(
                `could not render entity with id '${entityRenderData.entityID}' on edge '${edgePosition.edgeID}', ` +
                `since no edge positioner was found for this edge`
            );
        }

        const newEntity = this.upsertEntityObject(edgePosition, entityRenderData);

        const positioner: EdgeEntityPositioner = this.scene.data.get(`${edgePosition.edgeID}-edge-positioner`);
        positioner.addEntity(entityRenderData.entityID, newEntity.renderOntoEdgeSide);
    }

    private positionAtNode(nodePosition: NodePosition, entityRenderData: EntityRenderData) {
        if (!this.scene.data.has(`${nodePosition.nodeID}-node-positioner`)) {
            throw new EntityRenderingError(
                `could not render entity with id '${entityRenderData.entityID}' at node '${nodePosition.nodeID}', ` +
                `since no node positioner was found for this node`
            );
        }

        const newEntity = this.upsertEntityObject(nodePosition, entityRenderData);

        const positioner: NodeEntityPositioner = this.scene.data.get(`${nodePosition.nodeID}-node-positioner`);
        positioner.addEntity(entityRenderData.entityID, newEntity.renderOntoNodePoint);
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

    update(time: number, delta: number) {
        for (const event of this.pendingEvents) {
            this.handleGraphModification(event);
        }
        this.pendingEvents = [];

        this.decisionHandler(this);
        for (const entity of this.entities.values()) {
            entity.update(time, delta);
        }
    }

    queueGraphModification = (event: GraphModificationEvent) => {
        this.pendingEvents.push(event);
    }

    setController(handler: (positioner: GraphEntityPositioner) => void) {
        this.decisionHandler = handler;
    }
}

export class EntityObject extends Phaser.GameObjects.Container {
    private entityGraphics: Phaser.GameObjects.Graphics;

    constructor(
        public scene: Scene,
        public renderData: EntityRenderData,
        public entityPosition: EntityPosition,
    ) {
        super(scene);

        this.entityGraphics = this.scene.add.graphics(ENTITY_GRAPHICS_STYLE);
        this.add(this.entityGraphics);
    }

    private renderOnto(point: PhaserPosition) {
        this.entityGraphics.clear();
        this.setDepth(ENTITY_DEPTH);
        this.entityGraphics.setPosition(point.x, point.y);

        this.entityGraphics.fillStyle(this.renderData.colour);
        const circle = new Phaser.Geom.Circle(0, 0, ENTITY_RADIUS);
        this.entityGraphics.fillCircleShape(circle);
        this.entityGraphics.strokeCircleShape(circle);
    }

    renderOntoNodePoint = (point: PhaserPosition, node: NodeObject) => {
        node.add(this);
        // multiply by 2 to double the render twice the radius away from the node centre
        // points used here are relative to the node centre
        this.renderOnto({ x: point.x * 2, y: point.y * 2 });
    }

    renderOntoEdgeSide = (startPoint: PhaserPosition, _edge: EdgeObject, endPoint: PhaserPosition) => {
        this.scene.add.existing(this);
        // points used here are absolute
        this.renderOnto(startPoint);

        this.scene.tweens.add({
            targets: this.entityGraphics,
            x: endPoint.x,
            y: endPoint.y,
            duration: getPhaserDuration(startPoint, this.renderData.simMoveSpeed, endPoint) * 1000,
            ease: 'Linear',
            onComplete: () => {
                // something to manage lifecycle of tween?
                console.log(`finished at (${this.x},${this.y})`);
            }
        })
    }

    handleGraphModification(event: GraphModificationEvent) {
        switch (event.type) {
            case "NODE_DELETED":
                console.log(`entity '${this.renderData.entityID}', handling NODE_DELETED`);
                break;
            case "EDGE_DELETED":
                console.log(`entity '${this.renderData.entityID}', handling EDGE_DELETED`);
                break;
            case "NODE_MOVED":
                console.log(`entity '${this.renderData.entityID}', handling NODE_MOVED`);
                break;
            case "NODE_ADDED":
                console.log(`entity '${this.renderData.entityID}', handling NODE_ADDED`);
                break;
            case "EDGE_ADDED":
                console.log(`entity '${this.renderData.entityID}', handling EDGE_ADDED`);
                break;
        }
    }
}
