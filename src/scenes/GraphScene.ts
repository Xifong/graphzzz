import { Scene } from 'phaser';
import { InteractiveGraph } from '../graph/types';
import { getPhaserRegionOf, getSimPositionOf } from '../util';
import { NodeEvents, NodeObject } from '../phaser/NodeObject';
import { BACKGROUND_BEIGE, CANVAS_DEPTH } from './vars';
import { EdgeEvents, EdgeObject } from '../phaser/EdgeObject';


export class GraphCanvas extends Phaser.GameObjects.Container {
    private nodeObjects: Map<number, NodeObject>;
    private edgeObjects: Map<number, EdgeObject>;

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
        this.edgeObjects = new Map();
        this.setDepth(CANVAS_DEPTH);
        this.setInteractive();
    }

    public renderGraph() {
        const graphRenderData = this.graph.getRenderData();

        this.edgeObjects.forEach((edge) => edge.destroy());
        this.edgeObjects.clear();


        for (const edge of graphRenderData.edges) {
            const leftNode = graphRenderData.nodes.filter((n) => n.id === edge.leftNodeID)[0];
            const rightNode = graphRenderData.nodes.filter((n) => n.id === edge.rightNodeID)[0];

            const newEdge = new EdgeObject(this.scene, edge.id, leftNode.x, leftNode.y, rightNode.x, rightNode.y);
            this.edgeObjects.set(edge.id, newEdge);
            this.scene.add.existing(newEdge);
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

        for (const edge of this.edgeObjects.values()) {
            edge.off(EdgeEvents.REQUEST_DELETE);

            edge.on(
                EdgeEvents.REQUEST_DELETE,
                (edgeID: number) => {
                    this.graph.deleteEdge(edgeID);
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
