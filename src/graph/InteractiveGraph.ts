import { GraphRenderData, Graph, InteractiveGraph, InteractiveGraphDeserialiser, InteractiveGraphSerialiser } from './types';
import { GraphImp } from '../graph/Graph';
import { GRAPH_MAX_X, GRAPH_MAX_Y } from './vars';
import { z } from "zod";

type NodePositions = Map<number, {
    id: number,
    x: number,
    y: number
}>;

class InteractiveGraphManipulationError extends Error { }

export class InteractiveGraphImp implements InteractiveGraph {
    constructor(
        private graph: Graph,
        private positions: NodePositions,
        private nextNodeID: number,
        private nextEdgeID: number
    ) {
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
    }

    connectNodeTo(fromID: number, toID: number) {
        this.graph.upsertEdge(this.nextEdgeID, fromID, toID);
        this.nextEdgeID++;
    }

    deleteEdge(id: number): boolean {
        return this.graph.deleteIfExistsEdge(id);
    }

    deleteNode(id: number): boolean {
        this.positions.delete(id);
        return this.graph.deleteIfExistsNode(id);
    }

    placeNodeAt(x: number, y: number) {
        this.graph.upsertNode(this.nextNodeID);
        this.positions.set(this.nextNodeID, {
            id: this.nextNodeID,
            x: x,
            y: y
        });
        this.nextNodeID++;
    }

    getRenderData(): GraphRenderData {
        return {
            nodes: [...this.positions.values()],
            edges: [...this.graph.iterableEdgeCopy].map(
                (edge) => ({ id: edge.id, leftNodeID: edge.leftNode.id, rightNodeID: edge.rightNode.id })
            ),
        }
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

function deserialise(graphData: unknown): InteractiveGraphImp {
    const result = graphDataSchema.safeParse(graphData);

    if (!result.success) {
        throw new GraphDeserialisationError(`failed to validate graph data: ${result.error}`)
    }

    let largestNodeID = -1;
    for (const node of result.data.nodes) {
        if (node.id > largestNodeID) {
            largestNodeID = node.id;
        }
    }


    let largestEdgeID = -1;
    for (const edge of result.data.edges) {
        if (edge.id > largestEdgeID) {
            largestEdgeID = edge.id;
        }
    }

    return new InteractiveGraphImp(
        createGraph(result.data), getPositions(result.data), largestNodeID + 1, largestEdgeID + 1
    );
}

function serialise(_: InteractiveGraph): string {
    return ""
}

export function getGraphDeserialiser(): InteractiveGraphDeserialiser {
    return {
        deserialise: deserialise,
    }
}

export function getGraphSerialiser(): InteractiveGraphSerialiser {
    return {
        serialise: serialise,
    }
}
