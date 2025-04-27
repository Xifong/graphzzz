import { Scene } from 'phaser';
import { EntityRenderFunc, NodeEntityPositioner } from './GraphEntityRenderer';
import { NodeObject } from './NodeObject';
import { PhaserPosition } from '../types';


type NodeEntity = {
    renderer: EntityRenderFunc;
    currentPoint: PhaserPosition,
}

export class NodeEntityPositionerImp extends Phaser.GameObjects.Container implements NodeEntityPositioner {
    private entities: Map<number, NodeEntity> = new Map();

    constructor(
        public scene: Scene,
        public readonly nodeBody: Phaser.Geom.Circle,
        public readonly node: NodeObject,
    ) {
        super(scene);
    }

    private renderEntities() {
        const points = this.nodeBody.getPoints(this.entities.size);

        let pointIndex = 0;
        for (const [id, entityCopy] of this.entities.entries()) {
            const newPoint = points[pointIndex];
            // multiply by 2 to render twice the radius away from the node centre
            // points used here are relative to the node centre
            newPoint.x *= 2;
            newPoint.y *= 2;

            entityCopy.renderer(entityCopy.currentPoint, this.node, newPoint);

            entityCopy.currentPoint = newPoint;

            // Not sure if write during for loop will cause issues
            this.entities.set(id, entityCopy);
            pointIndex += 1
        }
    }

    addEntity(entityID: number, initialPosition: PhaserPosition, entityRender: EntityRenderFunc) {
        const nodeEntity = {
            renderer: entityRender,
            // Need to translate this into the relative coords
            currentPoint: initialPosition,
        }
        this.entities.set(entityID, nodeEntity);
        this.renderEntities();
    }

    removeEntity(entityID: number): void {
        if (!this.entities.has(entityID)) {
            return;
        }
        this.entities.delete(entityID);
        this.renderEntities();
    }
}

