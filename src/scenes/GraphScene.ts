import { Scene } from 'phaser';
import { InteractiveGraph } from '../graph/types';
import { getPhaserRegionOf, getSimPositionOf } from '../util';
import { NodeEvents, NodeObject } from '../phaser/NodeObject';
import { BACKGROUND_BEIGE, CANVAS_DEPTH } from './vars';
import { EdgeEvents, EdgeObject } from '../phaser/EdgeObject';


export class GraphCanvas extends Phaser.GameObjects.Container {
    private nodeObjects: Map<number, NodeObject>;
    private edgeObjects: Map<number, EdgeObject>;
    private shiftKey: Phaser.Input.Keyboard.Key;
    private isCreatingEdge: boolean = false;
    private edgeCreatingFrom: number;
    private moveLocked: boolean = false;

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
        this.shiftKey = this.scene.input.keyboard!.addKey("SHIFT");
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
        this.off(Phaser.Input.Events.POINTER_UP);
        this.shiftKey.off(Phaser.Input.Keyboard.Events.UP);

        for (const node of this.nodeObjects.values()) {
            node.off(NodeEvents.REQUEST_DELETE);
            node.off(NodeEvents.REQUEST_EDGE_START);
            node.off(NodeEvents.REQUEST_EDGE_END);
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

                    if (this.shiftKey.isDown) {
                        this.moveLocked = true;

                        const fromNode = this.nodeObjects.get(this.edgeCreatingFrom);
                        if (fromNode) {
                            this.continueEdgeCreation(getSimPositionOf(fromNode.x, fromNode.y), simPos);
                        }
                        return;
                    }
                    if (!this.moveLocked) {
                        this.graph.moveNodeTo(node.id, simPos.x, simPos.y);
                        this.nodeObjects.get(node.id)!.moveNodePosition(simPos.x, simPos.y);
                        this.renderGraph();
                    }
                }
            );
            node.on(
                Phaser.Input.Events.DRAG_END,
                (_: any, _2: number, _3: number) => {
                    this.moveLocked = false;

                    if (this.isCreatingEdge) {
                        this.deleteEdgePreview();
                        return;
                    }

                    // Refresh the node object to prevent positions possibly going out of sync
                    this.nodeObjects.get(node.id)?.destroy();
                    this.nodeObjects.delete(node.id);
                    this.renderGraph();
                }
            )
            node.on(
                NodeEvents.REQUEST_EDGE_START,
                (nodeID: number) => {
                    this.startEdgeCreation(nodeID);
                }
            )
            node.on(
                NodeEvents.REQUEST_EDGE_END,
                (nodeID: number) => {
                    this.finishEdgeCreation(nodeID);
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

        this.shiftKey.on(
            Phaser.Input.Keyboard.Events.UP,
            (_: any) => {
                if (this.isCreatingEdge) {
                    this.cancelEdgeCreation();
                    return;
                }
            }
        )

        this.on(
            Phaser.Input.Events.POINTER_DOWN,
            (pointer: Phaser.Input.Pointer, localX: number, localY: number, _2: any) => {
                if (pointer.rightButtonDown()) {
                    return;
                }
                const position = getSimPositionOf(localX, localY);
                this.graph.placeNodeAt(position.x, position.y);
                this.renderGraph();
            }
        );

        this.on(
            Phaser.Input.Events.POINTER_UP,
            (_: Phaser.Input.Pointer, _1: number, _2: number, _3: any) => {
                if (this.isCreatingEdge) {
                    this.cancelEdgeCreation();
                    return;
                }
            }
        );
    }

    private startEdgeCreation(fromID: number) {
        if (!this.isCreatingEdge) {
            this.edgeCreatingFrom = fromID;
            this.isCreatingEdge = true;
        }
        const fromNode = this.nodeObjects.get(fromID);
        if (fromNode) {
            const simPosition = getSimPositionOf(fromNode.x, fromNode.y);
            this.continueEdgeCreation(simPosition, simPosition);
        }
    }

    private continueEdgeCreation(fromPosition: { x: number, y: number }, toPosition: { x: number, y: number }) {
        this.deleteEdgePreview();

        const newEdge = new EdgeObject(this.scene, -1, fromPosition.x, fromPosition.y, toPosition.x, toPosition.y, false);
        this.edgeObjects.set(-1, newEdge);
        this.scene.add.existing(newEdge);
    }

    private finishEdgeCreation(toID: number) {
        if (!this.isCreatingEdge) {
            return;
        }
        this.graph.connectNodeTo(this.edgeCreatingFrom, toID);
        this.renderGraph();
        this.cancelEdgeCreation();
    }

    private cancelEdgeCreation() {
        if (!this.isCreatingEdge) {
            return;
        }
        this.deleteEdgePreview();
        this.isCreatingEdge = false;
    }

    private deleteEdgePreview() {
        this.edgeObjects.get(-1)?.destroy();
        this.edgeObjects.delete(-1);
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
