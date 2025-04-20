import { Scene } from "phaser";
import { EntityPosition, EntityRenderData, GraphEntityPositioner, MovementPath, NodePosition } from "../graph/GraphEntity";
import { GraphModificationEvent } from "../graph/types";
import { ENTITY_DEPTH, ENTITY_GRAPHICS_STYLE, ENTITY_RADIUS } from "../scenes/vars";
import { NodeObject } from "./NodeObject";
import { SimPosition } from "../types";

export interface NodeEntityPositioner {
    addEntity(entityID: number, renderEntity: (point: SimPosition, node: NodeObject) => void): void
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
    moveEntityToNode: (nodeID: number, movementPath: MovementPath, entity: EntityRenderData) => EntityPosition;

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
            throw new EntityRenderingError(`could not create entity with id ${entity.entityID}, since it already exists`);
        }

        if (entityPosition.type === "ON_NODE") {
            this.positionAtNode(entityPosition, entity);
        }
    }

    private positionAtNode(nodePosition: NodePosition, entityRenderData: EntityRenderData) {
        if (!this.scene.data.has(`${nodePosition.nodeID}-positioner`)) {
            return;
        }

        const positioner: NodeEntityPositioner = this.scene.data.get(`${nodePosition.nodeID}-positioner`);
        const newEntity = new EntityObject(
            this.scene,
            entityRenderData,
            nodePosition
        )
        this.entities.set(entityRenderData.entityID, newEntity);
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

    renderOntoNodePoint = (point: SimPosition, node: NodeObject) => {
        node.add(this);
        this.entityGraphics.clear();
        this.setDepth(ENTITY_DEPTH);

        this.entityGraphics.fillStyle(this.renderData.colour);
        const circle = new Phaser.Geom.Circle(point.x * 2, point.y * 2, ENTITY_RADIUS);
        this.entityGraphics.fillCircleShape(circle);
        this.entityGraphics.strokeCircleShape(circle);
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
