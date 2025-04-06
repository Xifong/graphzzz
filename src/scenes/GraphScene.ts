import { Scene } from 'phaser';
import { InteractiveGraph } from '../graph/types';
import { BACKGROUND_BEIGE } from './vars';
import { getPhaserPositionOf, getPhaserRegionOf, getSimPositionOf } from '../util';
import { DebugGraphics, SceneWithDebug } from '../DebugGraphics';

const graphicsStyle = {
    lineStyle: {
        width: 1.8,
        color: 0x000000,
        alpha: 1,
    },
    fillStyle: {
        color: BACKGROUND_BEIGE,
        alpha: 1,
    }
}

const NODE_RADIUS = 22;

export const NodeEvents = {
    REQUEST_DELETE: 'requestdelete'
};

export class NodeObject extends Phaser.GameObjects.Container {
    private graphics: Phaser.GameObjects.Graphics;

    constructor(
        public scene: Scene,
        public readonly id: number,
        public simX: number,
        public simY: number,

    ) {
        const phaserPosition = getPhaserPositionOf(simX, simY);
        super(scene, phaserPosition.x, phaserPosition.y);

        this.setData("id", id);
        this.setName(`id: ${this.id}`);

        this.graphics = this.scene.add.graphics(graphicsStyle);
        this.add(this.graphics);

        this.drawNode();

        this.setSize(NODE_RADIUS * 2, NODE_RADIUS * 2);
        this.setInteractive(
            new Phaser.Geom.Circle(20, 20, NODE_RADIUS),
            Phaser.Geom.Circle.Contains
        );

        this.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                pointer.event.preventDefault();
                this.emit(NodeEvents.REQUEST_DELETE, this.id);
            }
        });

        this.on(
            Phaser.Input.Events.POINTER_OVER,
            () => this.graphics.setAlpha(0.7)
        );

        this.on(
            Phaser.Input.Events.POINTER_OUT,
            () => this.graphics.setAlpha(1.0)
        );
    }

    private drawNode() {
        this.graphics.clear();

        this.graphics.fillCircle(0, 0, NODE_RADIUS);
        this.graphics.strokeCircle(0, 0, NODE_RADIUS);
    }
}

export class GraphCanvas extends Phaser.GameObjects.Container {
    private edgeGraphics: Phaser.GameObjects.Graphics;
    private nodes: Map<number, NodeObject>;

    constructor(
        public scene: SceneWithDebug,
        public simX: number,
        public simY: number,
        public width: number,
        public height: number,
        private graph: InteractiveGraph
    ) {
        super(scene, simX, simY);
        this.nodes = new Map();
        this.setInteractive();
    }

    public renderGraph() {
        this.edgeGraphics?.destroy();
        this.edgeGraphics = this.scene.add.graphics(graphicsStyle);

        this.nodes.forEach(node => node.destroy());
        this.nodes.clear();

        const graphRenderData = this.graph.getRenderData();

        for (const edge of graphRenderData.edges) {
            const leftNode = graphRenderData.nodes.filter((n) => n.id === edge.leftNodeID)[0];
            const rightNode = graphRenderData.nodes.filter((n) => n.id === edge.rightNodeID)[0];

            const phaserPositionL = getPhaserPositionOf(leftNode.x, leftNode.y);
            const phaserPositionR = getPhaserPositionOf(rightNode.x, rightNode.y);

            this.edgeGraphics.lineBetween(phaserPositionL.x, phaserPositionL.y, phaserPositionR.x, phaserPositionR.y);
        }

        for (const node of graphRenderData.nodes) {
            const newNode = new NodeObject(this.scene, node.id, node.x, node.y);
            this.nodes.set(node.id, newNode);
            this.scene.add.existing(newNode);
        }

        this.registerEditorCallbacks();
    }

    private registerEditorCallbacks() {
        this.off(Phaser.Input.Events.POINTER_DOWN);
        this.off(Phaser.Input.Events.DRAG_START);

        for (const node of this.nodes.values()) {
            node.off(NodeEvents.REQUEST_DELETE);
            node.on(
                NodeEvents.REQUEST_DELETE,
                (nodeID: number) => {
                    this.graph.deleteNode(nodeID);
                    this.renderGraph();
                }
            );

        }

        this.on(
            Phaser.Input.Events.POINTER_DOWN,
            (pointer: any, localX: any, localY: any, _2: any) => {
                if (pointer.rightButtonDown()) {
                    return;
                }
                const position = getSimPositionOf(localX, localY);
                this.graph.placeNodeAt(position.x, position.y);
                this.renderGraph();
            }
        );

        this.on(
            Phaser.Input.Events.DRAG_START,
            (pointer: any, _: number, _2: number) => {
                console.log("drag start");
                if (pointer.rightButtonDown()) {
                    return;
                }
            }
        );
    }
}

export class GraphScene extends Scene {
    private graph: InteractiveGraph;
    private camera: Phaser.Cameras.Scene2D.Camera;
    private graphCanvas: GraphCanvas;
    public debugGraphicsGroup: Phaser.GameObjects.Group;

    constructor() {
        super('GraphScene');
    }

    public init(graph: InteractiveGraph) {
        this.graph = graph;
    }

    public create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(BACKGROUND_BEIGE);

        const phaserRegion = getPhaserRegionOf(500, 500, 1000, 1000);
        this.graphCanvas = new GraphCanvas(
            this,
            phaserRegion.x,
            phaserRegion.y,
            phaserRegion.width,
            phaserRegion.height,
            this.graph
        );
        this.add.existing(this.graphCanvas);

        this.graphCanvas.renderGraph();
    }

    public update(_: number, _2: number) {
        if (this.debugGraphicsGroup) {
            Phaser.Actions.Call(
                this.debugGraphicsGroup.getChildren(),
                (obj: Phaser.GameObjects.GameObject) => {
                    (obj as DebugGraphics).drawDebug();
                },
                this
            );
        }
    }
}
