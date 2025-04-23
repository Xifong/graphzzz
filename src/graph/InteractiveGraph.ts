import { GraphRenderData, Graph, InteractiveGraph, InteractiveGraphDeserialiser, InteractiveGraphSerialiser, GraphEventEmitter, GraphModificationEvent } from './types';
import { GraphImp } from '../graph/Graph';
import { GRAPH_MAX_X, GRAPH_MAX_Y } from './vars';
import { z } from "zod";
import { distanceBetween } from '../util';

type NodePositions = Map<number, {
    id: number,
    x: number,
    y: number
}>;

class InteractiveGraphManipulationError extends Error { }

export class InteractiveGraphImp implements InteractiveGraph, GraphEventEmitter {
    private graphModificationListener: (event: GraphModificationEvent) => void;

    constructor(
        private graph: Graph,
        private positions: NodePositions,
        private nextNodeID: number,
        private nextEdgeID: number
    ) {
    }

    private emitEvent(event: GraphModificationEvent) {
        this.graphModificationListener(event);
    }

    moveNodeTo(id: number, x: number, y: number) {
        if (!this.positions.get(id)) {
            throw new InteractiveGraphManipulationError(`cannot move node with id '${id}' because there were no entries with this id`);
        }
        this.positions.delete(id);

        this.positions.set(id, {
            id: id,
            x: x,
            y: y
        });

        this.emitEvent({
            type: "NODE_MOVED",
            nodeID: id,
            newX: x,
            newY: y,
        });
    }

    connectNodeTo(fromID: number, toID: number) {
        this.graph.upsertEdge(this.nextEdgeID, fromID, toID);

        this.emitEvent({
            type: "EDGE_ADDED",
            edgeID: this.nextEdgeID++,
            fromNodeID: fromID,
            toNodeID: toID,
        });
    }

    deleteEdge(id: number): boolean {
        const wasDeleted = this.graph.deleteIfExistsEdge(id);
        if (wasDeleted) {
            this.emitEvent({
                type: "EDGE_DELETED",
                edgeID: id,
            });
        }
        return wasDeleted;
    }

    deleteNode(id: number): boolean {
        if (!this.graph.hasNode(id)) {
            return false;
        }

        const wasDeletedFromPositions = this.positions.delete(id);
        if (!wasDeletedFromPositions) {
            throw new InteractiveGraphManipulationError(
                `corrupt state while deleting node '${id}', no positioner found`
            );
        }

        const edges = this.graph.edgesCopyOf(id);

        this.graph.deleteIfExistsNode(id);

        for (const edge of edges) {
            this.emitEvent({
                type: "EDGE_DELETED",
                edgeID: edge.id,
            })
        }

        this.emitEvent({
            type: "NODE_DELETED",
            nodeID: id,
        });

        return true;
    }

    placeNodeAt(x: number, y: number) {
        this.graph.upsertNode(this.nextNodeID);
        this.positions.set(this.nextNodeID, {
            id: this.nextNodeID,
            x: x,
            y: y
        });

        this.emitEvent({
            type: "NODE_ADDED",
            nodeID: this.nextNodeID++,
            x: x,
            y: y,
        });
    }

    nearestNodeTo(x: number, y: number): number {
        let minDist = Number.MAX_VALUE;
        let minID = null;
        for (const [id, position] of this.positions.entries()) {
            const distance = distanceBetween(position, { x: x, y: y });
            if (distance < minDist) {
                minDist = distance;
                minID = id;
            }
        }

        if (minID === null) {
            throw new InteractiveGraphManipulationError("cannot get nearest node when there are no nodes");
        }

        return minID;
    }

    getRenderData(): GraphRenderData {
        return {
            nodes: [...this.positions.values()],
            edges: [...this.graph.iterableEdgeCopy].map(
                (edge) => ({ id: edge.id, leftNodeID: edge.leftNode.id, rightNodeID: edge.rightNode.id })
            ),
        }
    }

    onGraphModification(handler: (event: GraphModificationEvent) => void) {
        this.graphModificationListener = handler;
    }
}

class GraphDeserialisationError extends Error { }

const graphDataSchema = z.object({
    nodes: z.array(z.object({
        id: z.number().int().nonnegative(),
        x: z.number().nonnegative().lte(GRAPH_MAX_X),
        y: z.number().nonnegative().lte(GRAPH_MAX_Y),
    })),
    edges: z.array(z.object({
        id: z.number().int().nonnegative(),
        leftNodeID: z.number().int().nonnegative(),
        rightNodeID: z.number().int().nonnegative(),
    })),
})
type GraphDataSchema = z.infer<typeof graphDataSchema>;

function createGraph(graphSchema: GraphDataSchema): Graph {
    const graph = new GraphImp();
    for (const edge of graphSchema.edges) {
        graph.upsertEdge(edge.id, edge.leftNodeID, edge.rightNodeID);
    }
    for (const node of graphSchema.nodes) {
        graph.upsertNode(node.id);
    }
    return graph;
}

function getPositions(graphSchema: GraphDataSchema): NodePositions {
    let nodePositions = new Map();
    for (const node of graphSchema.nodes) {
        nodePositions.set(node.id, node);
    }
    return nodePositions;
}

export class GraphDeserialiser implements InteractiveGraphDeserialiser {
    private graphData: GraphDataSchema;
    private graph: Graph;

    deserialiseGraphOnly(graphData: unknown): Graph {
        if (!this.graph) {
            const result = graphDataSchema.safeParse(graphData);

            if (!result.success) {
                throw new GraphDeserialisationError(`failed to validate graph data: ${result.error}`)
            }

            this.graphData = result.data;
            this.graph = createGraph(this.graphData);
        }

        return this.graph;
    }

    deserialiseWithPositions(graphData: unknown): InteractiveGraph {
        this.deserialiseGraphOnly(graphData);

        let largestNodeID = -1;
        for (const node of this.graphData.nodes) {
            if (node.id > largestNodeID) {
                largestNodeID = node.id;
            }
        }

        let largestEdgeID = -1;
        for (const edge of this.graphData.edges) {
            if (edge.id > largestEdgeID) {
                largestEdgeID = edge.id;
            }
        }

        return new InteractiveGraphImp(
            this.graph, getPositions(this.graphData), largestNodeID + 1, largestEdgeID + 1
        );
    }
}

function serialise(graph: InteractiveGraph): string {
    return JSON.stringify(graph.getRenderData(), null, 4);
}

export function getGraphSerialiser(): InteractiveGraphSerialiser {
    return {
        serialise: serialise,
    }
}
