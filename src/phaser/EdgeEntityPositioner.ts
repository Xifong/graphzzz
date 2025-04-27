import { Scene } from 'phaser';
import { EdgeEntityPositioner } from './GraphEntityRenderer';
import { PhaserPosition, SimPosition } from '../types';
import { EdgeObject } from './EdgeObject';
import { distanceBetween, getPhaserPositionOf, getPositionBetween } from '../util/positions';
import { ENTITY_DISPLAY_RADIUS_MULTIPLE, NODE_RADIUS } from '../scenes/vars';

// How far from the ends of the edge (ending at node centres) to stop movement
const MOVE_POINT_DISTANCE = NODE_RADIUS * ENTITY_DISPLAY_RADIUS_MULTIPLE;

export class EdgeEntityPositionerImp extends Phaser.GameObjects.Container implements EdgeEntityPositioner {
    private entities: Map<number, (pointA: PhaserPosition, edge: EdgeObject, pointB: PhaserPosition) => void> = new Map();
    private startMovingFrom: PhaserPosition;
    private stopMovingAt: PhaserPosition;

    constructor(
        public scene: Scene,
        public readonly startPoint: SimPosition,
        private readonly edge: EdgeObject,
        public readonly endPoint: SimPosition,
        public readonly endPointID: number,
    ) {
        super(scene);

        const pEdgeStart = getPhaserPositionOf(startPoint.x, startPoint.y);
        const pEdgeEnd = getPhaserPositionOf(endPoint.x, endPoint.y);

        const edgeLength = distanceBetween(pEdgeStart, pEdgeEnd);
        // if two nodes overlap, just immediately transfer across (by setting the start and end to be the same point)
        const resolvedMovePointDistance = edgeLength >= MOVE_POINT_DISTANCE * 2 ? MOVE_POINT_DISTANCE : edgeLength / 2;

        this.startMovingFrom = getPositionBetween(pEdgeStart, resolvedMovePointDistance, pEdgeEnd);
        this.stopMovingAt = getPositionBetween(pEdgeEnd, resolvedMovePointDistance, pEdgeStart);
    }

    addEntity(entityID: number, entityRender: (pointA: PhaserPosition, edge: EdgeObject, pointB: PhaserPosition) => void): void {
        this.entities.set(entityID, entityRender);
        entityRender(this.startMovingFrom, this.edge, this.stopMovingAt);
    }

    removeEntity(entityID: number): void {
        if (!this.entities.has(entityID)) {
            return;
        }
        this.entities.delete(entityID);
    }
}
