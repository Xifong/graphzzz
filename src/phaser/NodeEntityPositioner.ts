import { Scene } from 'phaser';
import { EntityRenderFunc, NodeEntityPositioner } from './GraphEntityRenderer';
import { NodeObject } from './NodeObject';
import { PhaserPosition } from '../types';
import { ENTITY_DISPLAY_RADIUS_MULTIPLE } from '../scenes/vars';

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
            newPoint.x *= ENTITY_DISPLAY_RADIUS_MULTIPLE;
            newPoint.y *= ENTITY_DISPLAY_RADIUS_MULTIPLE;

            entityCopy.renderer(entityCopy.currentPoint, this.node, newPoint);

            entityCopy.currentPoint = newPoint;

            // Not sure if write during for loop will cause issues
            this.entities.set(id, entityCopy);
            pointIndex += 1
        }
    }

    addEntity(entityID: number, entityRender: EntityRenderFunc, initialPosition?: PhaserPosition) {
        let relativePosition = { x: 0, y: 0 };
        if (initialPosition !== undefined) {
            relativePosition = {
                x: initialPosition.x - this.node.x,
                y: initialPosition.y - this.node.y
            }
        }

        const nodeEntity = {
            renderer: entityRender,
            // Need to translate this into the relative coords
            currentPoint: relativePosition,
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

