import { Scene } from 'phaser';
import { NodeEntityPositioner } from './GraphEntityRenderer';
import { NodeObject } from './NodeObject';
import { PhaserPosition } from '../types';

export class NodeEntityPositionerImp extends Phaser.GameObjects.Container implements NodeEntityPositioner {
    private entities: Map<number, (point: PhaserPosition, node: NodeObject) => void> = new Map();

    constructor(
        public scene: Scene,
        public readonly nodeBody: Phaser.Geom.Circle,
        public readonly node: NodeObject,
    ) {
        super(scene);
    }

    private renderEntities() {
        // console.log(`node positioner for node '${this.node.id}', has '${this.entities.size}' to render`);
        const points = this.nodeBody.getPoints(this.entities.size);

        const entityArray = Array.from(this.entities.values());
        for (const [i, renderEntity] of entityArray.entries()) {
            renderEntity(points[i], this.node);
        }
    }

    addEntity(entityID: number, entityRender: (point: PhaserPosition, node: NodeObject) => void): void {
        this.entities.set(entityID, entityRender);
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

