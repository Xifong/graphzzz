import { Scene } from 'phaser';
import { getPhaserPositionOf } from '../util';
import { GRAPH_GRAPHICS_STYLE, NODE_RADIUS, NODE_DEPTH, ENTITY_DEPTH, ENTITY_GRAPHICS_STYLE, ENTITY_RADIUS } from '../scenes/vars';
import { EntityRenderData, NodeEntityPositioner } from './GraphEntityRenderer';

export const NodeEvents = {
    REQUEST_DELETE: 'request-delete',
    REQUEST_EDGE_START: 'request-edge-start',
    REQUEST_EDGE_END: 'request-edge-end',
    NOTIFY_EDGE_CANDIDATE: 'notify-edge-candidate',
    NOTIFY_STOP_EDGE_CANDIDATE: 'notify-stop-edge-candidate'
};

export class NodeEntityPositionerImp extends Phaser.GameObjects.Container implements NodeEntityPositioner {
    private entityGraphics: Phaser.GameObjects.Graphics;
    private entities: Map<number, EntityRenderData> = new Map();

    constructor(
        public scene: Scene,
        public nodeBody: Phaser.Geom.Circle,
    ) {
        super(scene);

        this.entityGraphics = this.scene.add.graphics(ENTITY_GRAPHICS_STYLE);
        this.add(this.entityGraphics);
    }

    private renderEntities() {
        this.entityGraphics.clear();
        this.setDepth(ENTITY_DEPTH);

        const points = this.nodeBody.getPoints(this.entities.size);

        const entityArray = Array.from(this.entities.values());
        for (const [i, _] of entityArray.entries()) {
            const point = points[i];
            const circle = new Phaser.Geom.Circle(point.x * 2, point.y * 2, ENTITY_RADIUS);
            this.entityGraphics.fillCircleShape(circle);
            this.entityGraphics.strokeCircleShape(circle);
        }
    }

    addEntity(entity: EntityRenderData): void {
        this.entities.set(entity.entityID, entity);
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

export class NodeObject extends Phaser.GameObjects.Container {
    private graphics: Phaser.GameObjects.Graphics;
    private shiftKey: Phaser.Input.Keyboard.Key | null = null;
    private nodeBody: Phaser.Geom.Circle;
    public positioner: NodeEntityPositionerImp;

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

        this.graphics = this.scene.add.graphics(GRAPH_GRAPHICS_STYLE);
        this.add(this.graphics);


        this.nodeBody = this.drawNode();
        this.positioner = new NodeEntityPositionerImp(this.scene, this.nodeBody);
        this.add(this.positioner);

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

    private drawNode(): Phaser.Geom.Circle {
        this.graphics.clear();
        this.setDepth(NODE_DEPTH);

        const circle = new Phaser.Geom.Circle(0, 0, NODE_RADIUS);
        this.graphics.fillCircleShape(circle);
        this.graphics.strokeCircleShape(circle);
        return circle;
    }

    public moveNodePosition(simX: number, simY: number) {
        this.simX = simX;
        this.simY = simY;
        const phaserPosition = getPhaserPositionOf(simX, simY);
        this.setPosition(phaserPosition.x, phaserPosition.y);
        this.drawNode();
    }
}


