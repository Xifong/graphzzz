import { Scene } from 'phaser';
import { getPhaserPositionOf } from '../util';
import { GRAPHICS_STYLE, NODE_RADIUS, NODE_DEPTH } from '../scenes/vars';

export const NodeEvents = {
    REQUEST_DELETE: 'request-delete',
    REQUEST_EDGE_START: 'request-edge-start',
    REQUEST_EDGE_END: 'request-edge-end',
    NOTIFY_EDGE_CANDIDATE: 'notify-edge-candidate',
    NOTIFY_STOP_EDGE_CANDIDATE: 'notify-stop-edge-candidate'
};


export class NodeObject extends Phaser.GameObjects.Container {
    private graphics: Phaser.GameObjects.Graphics;
    private shiftKey: Phaser.Input.Keyboard.Key | null = null;

    constructor(
        public scene: Scene,
        public readonly id: number,
        public simX: number,
        public simY: number,

    ) {
        const phaserPosition = getPhaserPositionOf(simX, simY);
        super(scene, phaserPosition.x, phaserPosition.y);

        if (this.scene.input.keyboard) {
            this.shiftKey = this.scene.input.keyboard.addKey("SHIFT");
        }

        this.setData("id", id);
        this.setName(`Node '${this.id}'`);

        this.graphics = this.scene.add.graphics(GRAPHICS_STYLE);
        this.add(this.graphics);

        this.drawNode();

        this.setSize(NODE_RADIUS * 2, NODE_RADIUS * 2);
        this.setInteractive(
            new Phaser.Geom.Circle(NODE_RADIUS, NODE_RADIUS, NODE_RADIUS),
            Phaser.Geom.Circle.Contains
        );
        this.scene.input.setDraggable(this);

        this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
            if (this.shiftKey?.isDown) {
                pointer.event.preventDefault();
                this.emit(NodeEvents.REQUEST_EDGE_START, this.id);
                return;
            }

            if (pointer.rightButtonDown()) {
                pointer.event.preventDefault();
                this.emit(NodeEvents.REQUEST_DELETE, this.id);
                return;
            }
        });

        this.on(
            Phaser.Input.Events.GAMEOBJECT_POINTER_OVER,
            () => {
                this.graphics.setAlpha(0.7)
                this.emit(NodeEvents.NOTIFY_EDGE_CANDIDATE, this.id);
            }
        );

        this.on(
            Phaser.Input.Events.GAMEOBJECT_POINTER_OUT,
            () => {
                this.graphics.setAlpha(1.0)
                this.emit(NodeEvents.NOTIFY_STOP_EDGE_CANDIDATE, this.id);
            }
        );

        this.on(
            Phaser.Input.Events.GAMEOBJECT_POINTER_UP,
            (pointer: Phaser.Input.Pointer) => {
                if (this.shiftKey?.isDown) {
                    pointer.event.preventDefault();
                    this.emit(NodeEvents.REQUEST_EDGE_END, this.id);
                }
            }
        );
    }

    private drawNode() {
        this.graphics.clear();

        this.setDepth(NODE_DEPTH);
        this.graphics.fillCircle(0, 0, NODE_RADIUS);
        this.graphics.strokeCircle(0, 0, NODE_RADIUS);
    }

    public moveNodePosition(simX: number, simY: number) {
        this.simX = simX;
        this.simY = simY;
        const phaserPosition = getPhaserPositionOf(simX, simY);
        this.setPosition(phaserPosition.x, phaserPosition.y);
        this.drawNode();
    }
}
