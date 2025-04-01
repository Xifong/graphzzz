import { GraphRenderData, Graph, InteractiveGraph, InteractiveGraphDeserialiser } from './types';
import { GraphImp } from '../graph/Graph';
import { GRAPH_MAX_X, GRAPH_MAX_Y } from './vars';
import { z } from "zod";

type NodePositions = {
    id: number,
    x: number,
    y: number
}[];

export class InteractiveGraphImp implements InteractiveGraph {
    graph: Graph;
    positions: NodePositions;

    constructor(graph: Graph, positions: NodePositions) {
        this.graph = graph;
        this.positions = positions;
    }

    getRenderData(): GraphRenderData {
        return {
            nodes: this.positions,
            edges: [...this.graph.edges.values()].map(
                (edge) => ({ leftNodeID: edge.leftNode.id, rightNodeID: edge.rightNode.id })
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

export class GraphDataDeserialiserImp implements InteractiveGraphDeserialiser {
    createGraph(graphSchema: GraphDataSchema): Graph {
        const graph = new GraphImp();
        for (const edge of graphSchema.edges) {
            graph.upsertEdge(edge.id, edge.leftNodeID, edge.rightNodeID);
        }
        for (const node of graphSchema.nodes) {
            graph.upsertNode(node.id);
        }
        return graph;
    }

    getPositions(graphSchema: GraphDataSchema): NodePositions {
        return graphSchema.nodes;
    }

    deserialise(graphData: unknown): InteractiveGraphImp {
        const result = graphDataSchema.safeParse(graphData);

        if (!result.success) {
            throw new GraphDeserialisationError(`failed to validate graph data: ${result.error}`)
        }

        return new InteractiveGraphImp(this.createGraph(result.data), this.getPositions(result.data));
    }
}
