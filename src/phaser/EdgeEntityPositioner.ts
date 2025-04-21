import { Scene } from 'phaser';
import { EdgeEntityPositioner } from './GraphEntityRenderer';
import { PhaserPosition, SimPosition } from '../types';
import { EdgeObject } from './EdgeObject';
import { getPhaserPositionOf } from '../util';

export class EdgeEntityPositionerImp extends Phaser.GameObjects.Container implements EdgeEntityPositioner {
    private entities: Map<number, (pointA: PhaserPosition, edge: EdgeObject, pointB: PhaserPosition) => void> = new Map();
    private phaserLeft: PhaserPosition;
    private phaserRight: PhaserPosition;

    constructor(
        public scene: Scene,
        public readonly startPoint: SimPosition,
        private readonly edge: EdgeObject,
        public readonly endPoint: SimPosition,
        public readonly endPointID: number,
    ) {
        super(scene);

        this.phaserLeft = getPhaserPositionOf(startPoint.x, startPoint.y);
        this.phaserRight = getPhaserPositionOf(endPoint.x, endPoint.y);
    }

    private renderEntities() {
        for (const renderEntity of this.entities.values()) {
            renderEntity(this.phaserLeft, this.edge, this.phaserRight);
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
