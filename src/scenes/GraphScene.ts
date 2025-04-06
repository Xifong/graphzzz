import { Scene } from 'phaser';
import { InteractiveGraph } from '../graph/types';
import { BACKGROUND_BEIGE } from './vars';
import { getPhaserPositionOf, getPhaserRegionOf, getSimPositionOf } from '../util';

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
const NODE_DEPTH = 0;
const EDGE_DEPTH = -1;

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
        this.scene.input.setDraggable(this);

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

export class GraphCanvas extends Phaser.GameObjects.Container {
    private edgeGraphics: Phaser.GameObjects.Graphics;
    private nodeObjects: Map<number, NodeObject>;

    constructor(
        public scene: Scene,
        public simX: number,
        public simY: number,
        public width: number,
        public height: number,
        private graph: InteractiveGraph
    ) {
        super(scene, simX, simY);
        this.nodeObjects = new Map();
        this.setInteractive();
    }

    public renderGraph() {
        this.edgeGraphics?.destroy();
        this.edgeGraphics = this.scene.add.graphics(graphicsStyle);

        const graphRenderData = this.graph.getRenderData();

        for (const edge of graphRenderData.edges) {
            const leftNode = graphRenderData.nodes.filter((n) => n.id === edge.leftNodeID)[0];
            const rightNode = graphRenderData.nodes.filter((n) => n.id === edge.rightNodeID)[0];

            const phaserPositionL = getPhaserPositionOf(leftNode.x, leftNode.y);
            const phaserPositionR = getPhaserPositionOf(rightNode.x, rightNode.y);

            this.edgeGraphics.lineBetween(phaserPositionL.x, phaserPositionL.y, phaserPositionR.x, phaserPositionR.y);
            this.edgeGraphics.setDepth(EDGE_DEPTH);
        }

        for (const node of graphRenderData.nodes) {
            if (this.nodeObjects.has(node.id)) {
                continue;
            }
            const newNode = new NodeObject(this.scene, node.id, node.x, node.y);
            this.nodeObjects.set(node.id, newNode);
            this.scene.add.existing(newNode);
        }

        this.registerEditorCallbacks();
    }

    private registerEditorCallbacks() {
        this.off(Phaser.Input.Events.POINTER_DOWN);
        this.off(Phaser.Input.Events.DRAG_START);

        for (const node of this.nodeObjects.values()) {
            node.off(NodeEvents.REQUEST_DELETE);
            node.off(Phaser.Input.Events.DRAG);
            node.off(Phaser.Input.Events.DRAG_END);

            node.on(
                NodeEvents.REQUEST_DELETE,
                (nodeID: number) => {
                    this.graph.deleteNode(nodeID);
                    this.nodeObjects.get(nodeID)?.destroy();
                    this.nodeObjects.delete(nodeID);
                    this.renderGraph();
                }
            );
            node.on(
                Phaser.Input.Events.DRAG,
                (_: any, x: number, y: number) => {
                    const simPos = getSimPositionOf(x, y);
                    this.graph.moveNodeTo(node.id, simPos.x, simPos.y);
                    this.nodeObjects.get(node.id)!.moveNodePosition(simPos.x, simPos.y);
                    this.renderGraph();
                }
            );
            node.on(
                Phaser.Input.Events.DRAG_END,
                (_: any, _2: number, _3: number) => {
                    // Refresh the node object to prevent positions possibly going out of sync
                    this.nodeObjects.get(node.id)?.destroy();
                    this.nodeObjects.delete(node.id);
                    this.renderGraph();
                }
            )
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
    }
}

export class GraphScene extends Scene {
    private graph: InteractiveGraph;
    private camera: Phaser.Cameras.Scene2D.Camera;
    private graphCanvas: GraphCanvas;

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
}
