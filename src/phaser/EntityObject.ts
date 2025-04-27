import { Scene } from "phaser";
import { EntityPosition, EntityRenderData } from "../graph/GraphEntity";
import { PhaserPosition } from "../types";
import { ENTITY_DEPTH, ENTITY_GRAPHICS_STYLE, ENTITY_RADIUS } from "../scenes/vars";
import { NodeObject } from "./NodeObject";
import { EdgeObject } from "./EdgeObject";
import { getPhaserDuration } from "../util/positions";
import { GraphModificationEvent } from "../graph/types";
import { EntityRenderingError } from "./EntityRenderingError";

export type TweenCompletionEvent = {
    type: "MOVE_COMPLETE",
    entityID: number,
}

export class EntityObject extends Phaser.GameObjects.Container {
    private entityGraphics: Phaser.GameObjects.Graphics;
    private currentTween?: Phaser.Tweens.Tween;
    private previouslyRendered: boolean = false;

    constructor(
        public scene: Scene,
        public renderData: EntityRenderData,
        public entityPosition: EntityPosition,
        private onTweenComplete: (event: TweenCompletionEvent) => void
    ) {
        super(scene);

        this.entityGraphics = this.scene.add.graphics(ENTITY_GRAPHICS_STYLE);
        this.add(this.entityGraphics);
    }

    private renderOnto(point: PhaserPosition) {
        this.previouslyRendered = true;
        this.entityGraphics.clear();
        this.setDepth(ENTITY_DEPTH);
        this.entityGraphics.setPosition(point.x, point.y);

        this.entityGraphics.fillStyle(this.renderData.colour);
        const circle = new Phaser.Geom.Circle(0, 0, ENTITY_RADIUS);
        this.entityGraphics.fillCircleShape(circle);
        this.entityGraphics.strokeCircleShape(circle);
    }

    private tweenBetween(duration: number, endPoint: PhaserPosition) {
        if (this.currentTween && this.entityPosition.type !== "ON_NODE") {
            throw new EntityRenderingError("should never cancel tween unless on a node");
        }

        if (this.currentTween) {
            this.currentTween.destroy();
        }

        const newTween = {
            targets: this.entityGraphics,
            x: endPoint.x,
            y: endPoint.y,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                this.currentTween = undefined;
                this.onTweenComplete({
                    type: "MOVE_COMPLETE",
                    entityID: this.renderData.entityID,
                });
            }
        }

        this.currentTween = this.scene.tweens.add(newTween);
    }

    renderOntoNodePoint = (suggestedStart: PhaserPosition, node: NodeObject, endPoint: PhaserPosition) => {
        node.add(this);
        if (!this.previouslyRendered) {
            this.renderOnto(suggestedStart);
        }

        const currentPosition = {
            x: this.entityGraphics.x,
            y: this.entityGraphics.y,
        }
        const duration = getPhaserDuration(currentPosition, this.renderData.simMoveSpeed, endPoint) * 1000;
        this.tweenBetween(duration, endPoint);
    }

    renderOntoEdgeSide = (startPoint: PhaserPosition, _edge: EdgeObject, endPoint: PhaserPosition) => {
        this.scene.add.existing(this);
        // points used here are absolute
        this.renderOnto(startPoint);

        const duration = getPhaserDuration(startPoint, this.renderData.simMoveSpeed, endPoint) * 1000;
        this.tweenBetween(duration, endPoint);
    }

    renderOntoGraphCanvas = (startPoint: PhaserPosition, node?: NodeObject) => {
        this.scene.add.existing(this);
        this.renderOnto(startPoint);

        if (node !== undefined) {
            const duration = getPhaserDuration(startPoint, this.renderData.simMoveSpeed, node) * 1000;
            this.tweenBetween(duration, { x: node.x, y: node.y });
        }
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

    currentPosition(): PhaserPosition {
        const { tx, ty } = this.entityGraphics.getWorldTransformMatrix();
        return { x: tx, y: ty };
    }

    preDestroy(): void {
        this.currentTween?.destroy();
    }
}
