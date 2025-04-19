import { Scene } from "phaser";
import { EntityPosition, EntityRenderData, GraphEntityPositioner, MovementPath, NodePosition } from "../graph/GraphEntity";
import { GraphModificationEvent } from "../graph/types";

export interface NodeEntityPositioner {
    addEntity(entity: EntityRenderData): void
    removeEntity(entityID: number): void
}

class EntityRenderingError extends Error {
}

export interface GraphEntityRenderer {
    update: (time: number, delta: number) => void;
    setDecisionHandler: (handler: (positioner: GraphEntityPositioner) => void) => void;
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

        if (entityPosition.type === "node") {
            this.positionAtNode(entityPosition, entity);
        }
    }

    private positionAtNode(nodePosition: NodePosition, entityRenderData: EntityRenderData) {
        if (!this.scene.data.has(`${nodePosition.nodeID}-positioner`)) {
            return;
        }

        const positioner = this.scene.data.get(`${nodePosition.nodeID}-positioner`);
        positioner.addEntity(entityRenderData);
        this.entities.set(entityRenderData.entityID, new EntityObject(this.scene, entityRenderData, nodePosition));
    }

    update(time: number, delta: number) {
        for (const event of this.pendingEvents) {
            for (const entity of this.entities.values()) {
                entity.handleGraphModification(event);
            }
        }
        this.pendingEvents = [];

        this.decisionHandler(this);
        for (const entity of this.entities.values()) {
            entity.update(time, delta);
        }
    }

    handleGraphModification(event: GraphModificationEvent) {
        this.pendingEvents.push(event);
    }

    setDecisionHandler(handler: (positioner: GraphEntityPositioner) => void) {
        this.decisionHandler = handler;
    }
}

export class EntityObject extends Phaser.GameObjects.Container {
    constructor(
        public scene: Scene,
        public renderData: EntityRenderData,
        public entityPosition: EntityPosition
    ) {
        super(scene);
    }

    create() {

    }

    handleGraphModification(_: GraphModificationEvent) {
        return
    }
}
