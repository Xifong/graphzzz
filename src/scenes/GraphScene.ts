import { Scene } from 'phaser';
import { GraphEventEmitter, GraphModificationEvent, InteractiveGraph } from '../graph/types';
import { getPhaserRegionOf, getSimPositionOf } from '../util/positions';
import { NodeEvents, NodeObject } from '../phaser/NodeObject';
import { BACKGROUND_BEIGE, CANVAS_DEPTH } from './vars';
import { EdgeEvents, EdgeObject } from '../phaser/EdgeObject';
import { getGraphSerialiser } from '../graph/InteractiveGraph';
import { GraphEntityRenderer, GraphEntityRendererImp } from '../phaser/GraphEntityRenderer';
import { EntityController } from '../graph/GraphEntity';
import { GRAPH_MAX_X, GRAPH_MAX_Y } from '../graph/vars';
import { SimPosition } from '../types';


export class GraphCanvas extends Phaser.GameObjects.Container {
    private nodeObjects: Map<number, NodeObject>;
    private edgeObjects: Map<number, EdgeObject>;
    private shiftKey: Phaser.Input.Keyboard.Key;
    private isCreatingEdge: boolean = false;
    private edgeCreatingFrom: number;
    private moveLocked: boolean = false;
    private edgeCandidate: number | null = null;

    constructor(
        public scene: Scene,
        private graph: InteractiveGraph,
        public phaserX: number,
        public phaserY: number,
        // width and height are needed to ensure clicks events are handled across then entire region
        public width: number,
        public height: number,
    ) {
        super(scene, phaserX, phaserY);
        this.nodeObjects = new Map();
        this.edgeObjects = new Map();
        this.setDepth(CANVAS_DEPTH);
        this.shiftKey = this.scene.input.keyboard!.addKey("SHIFT");
        this.scene.data.set("graph-scene", this);
        this.setInteractive();
    }

    public renderGraph() {
        const graphRenderData = this.graph.getRenderData();

        this.edgeObjects.forEach((edge) => edge.destroy());
        this.edgeObjects.clear();


        for (const edge of graphRenderData.edges) {
            const leftNode = graphRenderData.nodes.filter((n) => n.id === edge.leftNodeID)[0];
            const rightNode = graphRenderData.nodes.filter((n) => n.id === edge.rightNodeID)[0];

            const newEdge = new EdgeObject(this.scene, edge.id, leftNode, leftNode.id, rightNode, rightNode.id);
            this.edgeObjects.set(edge.id, newEdge);
            this.scene.add.existing(newEdge);
        }

        for (const node of graphRenderData.nodes) {
            if (this.nodeObjects.has(node.id)) {
                continue;
            }
            const newNode = new NodeObject(this.scene, node.id, node);
            this.nodeObjects.set(node.id, newNode);
            this.scene.add.existing(newNode);
        }

        this.registerEditorCallbacks();
    }

    private registerEditorCallbacks() {
        for (const node of this.nodeObjects.values()) {
            node.off(NodeEvents.REQUEST_DELETE);
            node.on(
                NodeEvents.REQUEST_DELETE,
                (nodeID: number) => {
                    this.graph.deleteNode(nodeID);
                    this.nodeObjects.get(nodeID)?.destroy();
                    this.nodeObjects.delete(nodeID);
                    this.renderGraph();
                }
            );

            node.off(Phaser.Input.Events.DRAG);
            node.on(
                Phaser.Input.Events.DRAG,
                (_pointer: Phaser.Input.Pointer, x: number, y: number) => {
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
                        this.nodeObjects.get(node.id)!.moveNodePosition(simPos);

                        this.renderGraph();
                    }
                }
            );

            node.off(Phaser.Input.Events.DRAG_END);
            node.on(
                Phaser.Input.Events.DRAG_END,
                (_pointer: Phaser.Input.Pointer, _gameObject: Phaser.GameObjects.GameObject, _dropped: boolean) => {
                    this.moveLocked = false;

                    if (this.isCreatingEdge) {
                        this.deleteEdgePreview();
                        return;
                    }

                    // Refresh the node object to prevent positions possibly going out of sync
                    const simPos = getSimPositionOf(node.x, node.y);
                    this.graph.moveNodeTo(node.id, simPos.x, simPos.y);
                    this.nodeObjects.get(node.id)?.destroy();
                    this.nodeObjects.delete(node.id);
                    this.renderGraph();
                }
            );

            node.off(NodeEvents.REQUEST_EDGE_START);
            node.on(
                NodeEvents.REQUEST_EDGE_START,
                (nodeID: number) => {
                    this.startEdgeCreation(nodeID);
                }
            );

            node.off(NodeEvents.REQUEST_EDGE_END);
            node.on(
                NodeEvents.REQUEST_EDGE_END,
                (nodeID: number) => {
                    this.finishEdgeCreation(nodeID);
                }
            );

            node.off(NodeEvents.NOTIFY_EDGE_CANDIDATE);
            node.on(
                NodeEvents.NOTIFY_EDGE_CANDIDATE,
                (nodeID: number) => {
                    this.edgeCandidate = nodeID;
                }
            );

            node.off(NodeEvents.NOTIFY_STOP_EDGE_CANDIDATE);
            node.on(
                NodeEvents.NOTIFY_STOP_EDGE_CANDIDATE,
                (nodeID: number) => {
                    if (this.edgeCandidate === nodeID) {
                        this.edgeCandidate = null;
                    }
                }
            );
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

        this.shiftKey.off(Phaser.Input.Keyboard.Events.UP);
        this.shiftKey.on(
            Phaser.Input.Keyboard.Events.UP,
            (_event: Phaser.Input.Keyboard.Key) => {
                if (!this.isCreatingEdge) {
                    return;
                }
                // Logically redundant null check to satisfy TS
                if (Number.isFinite(this.edgeCandidate) && this.edgeCandidate !== null) {
                    this.finishEdgeCreation(this.edgeCandidate);
                } else {
                    this.cancelEdgeCreation();
                }
            }
        );

        this.off(Phaser.Input.Events.POINTER_DOWN);
        this.on(
            Phaser.Input.Events.POINTER_DOWN,
            (pointer: Phaser.Input.Pointer, localX: number, localY: number, _event: Phaser.Types.Input.EventData) => {
                if (pointer.rightButtonDown()) {
                    return;
                }
                const position = getSimPositionOf(localX, localY);
                this.graph.placeNodeAt(position.x, position.y);
                this.renderGraph();
            }
        );

        this.off(Phaser.Input.Events.POINTER_UP);
        this.on(
            Phaser.Input.Events.POINTER_UP,
            (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, _event: Phaser.Types.Input.EventData) => {
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

    private continueEdgeCreation(fromPosition: SimPosition, toPosition: SimPosition) {
        this.deleteEdgePreview();

        const newEdge = new EdgeObject(this.scene, -1, fromPosition, -1, toPosition, -1, false);
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
    private graph: InteractiveGraph & GraphEventEmitter;
    private camera: Phaser.Cameras.Scene2D.Camera;
    private graphCanvas: GraphCanvas;
    private escapeKey: Phaser.Input.Keyboard.Key;
    private graphEntityRenderer: GraphEntityRenderer;
    private entityController: EntityController;

    constructor() {
        super('GraphScene');
    }

    public init({ graph, entityController }: { graph: InteractiveGraph & GraphEventEmitter, entityController: EntityController }) {
        this.graph = graph;
        this.entityController = entityController;
    }

    public create() {
        this.escapeKey = this.input.keyboard!.addKey("ESC");
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(BACKGROUND_BEIGE);

        const phaserRegion = getPhaserRegionOf(GRAPH_MAX_X / 2, GRAPH_MAX_Y / 2, GRAPH_MAX_X, GRAPH_MAX_Y);
        this.graphCanvas = new GraphCanvas(
            this,
            this.graph,
            phaserRegion.x,
            phaserRegion.y,
            phaserRegion.width,
            phaserRegion.height,
        );
        this.add.existing(this.graphCanvas);
        this.graphCanvas.renderGraph();

        this.graphEntityRenderer = new GraphEntityRendererImp(this);

        this.graph.onGraphModification(
            (event: GraphModificationEvent) => {
                this.graphEntityRenderer.queueGraphModification(event);
            }
        );

        this.graphEntityRenderer.setController(this.entityController.updateEntities);

        this.registerTemporarySave();
    }

    update(time: number, delta: number): void {
        this.graphEntityRenderer.update(time, delta);
    }

    private registerTemporarySave() {
        this.escapeKey.on(
            Phaser.Input.Keyboard.Events.UP,
            () => {
                const serialiser = getGraphSerialiser();
                console.log(serialiser.serialise(this.graph));
            }
        )
    }
}
