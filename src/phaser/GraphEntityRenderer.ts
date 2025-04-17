import { Scene } from "phaser";
import { EntityPosition, NodePosition } from "../graph/GraphEntity";

export type EntityRenderData = {
    entityID: number
    name: string
    moveSpeed: number
}

export type MovementPath = {
    edgeID: number
} | null;

export interface GraphEntityRenderer {
    initialiseEntity: (entityPosition: EntityPosition, entity: EntityRenderData) => void;
    moveEntityToNode: (nodeID: number, movementPath: MovementPath, entity: EntityRenderData) => EntityPosition;
    queryEntityPosition: (entityID: number) => EntityPosition;
    renderEntities: () => void;
}

export interface NodeEntityPositioner {
    addEntity(entity: EntityRenderData): void
    removeEntity(entityID: number): void
}


export class GraphEntityRendererImp extends Phaser.GameObjects.Container implements GraphEntityRenderer {
    moveEntityToNode: (nodeID: number, movementPath: MovementPath, entity: EntityRenderData) => EntityPosition;
    queryEntityPosition: (entityID: number) => EntityPosition;
    renderEntities: () => void;

    private entities: Map<number, EntityRenderData> = new Map();

    constructor(
        public scene: Scene,
    ) {
        super(scene);
    }

    initialiseEntity(entityPosition: EntityPosition, entity: EntityRenderData) {
        if (entityPosition.type === "node") {
            this.positionAtNode(entityPosition, entity);
        }
    }

    private positionAtNode(nodePosition: NodePosition, entity: EntityRenderData) {
        if (!this.scene.data.has(`${nodePosition.nodeID}-positioner`)) {
            return;
        }

        const positioner = this.scene.data.get(`${nodePosition.nodeID}-positioner`);
        positioner.addEntity(entity);
        this.entities.set(entity.entityID, entity);
    }
}

export class EntityObject extends Phaser.GameObjects.Container {
    constructor(
        public scene: Scene,
    ) {
        super(scene);
    }

    create() {

    }
}
