import { Scene } from "phaser";
import { EntityPosition } from "../graph/GraphEntity";

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
            const positioner = this.scene.data.get(`${entityPosition.nodeID}-positioner`);
            positioner.addEntity(entity);
        }
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
