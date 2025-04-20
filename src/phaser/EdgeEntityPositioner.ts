import { Scene } from 'phaser';
import { EdgeEntityPositioner } from './GraphEntityRenderer';
import { PhaserPosition, SimPosition } from '../types';
import { EdgeObject } from './EdgeObject';
import { getPhaserPositionOf } from '../util';

export class EdgeEntityPositionerImp extends Phaser.GameObjects.Container implements EdgeEntityPositioner {
    private entities: Map<number, (pointA: PhaserPosition, edge: EdgeObject, pointB: PhaserPosition) => void> = new Map();
    private phaserStart: PhaserPosition;
    private phaserEnd: PhaserPosition;

    constructor(
        public scene: Scene,
        public readonly startPoint: SimPosition,
        private readonly edge: EdgeObject,
        public readonly endPoint: SimPosition,
    ) {
        super(scene);

        this.phaserStart = getPhaserPositionOf(startPoint.x, startPoint.y);
        this.phaserEnd = getPhaserPositionOf(endPoint.x, endPoint.y);
    }

    private renderEntities() {
        for (const renderEntity of this.entities.values()) {
            renderEntity(this.phaserStart, this.edge, this.phaserEnd);
        }
    }

    addEntity(entityID: number, entityRender: (pointA: PhaserPosition, edge: EdgeObject, pointB: PhaserPosition) => void): void {
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
