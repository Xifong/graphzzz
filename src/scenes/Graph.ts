import { z } from "zod";

interface GraphEdge {
    id: number;
    leftNode: GraphNode;
    rightNode: GraphNode;
}

interface GraphNode {
    id: number;
    edges: GraphEdge[];
}

interface Graph {
    nodes: Map<number, GraphNode>;
    edges: Map<number, GraphEdge>;

    upsertNode: (id: number, edgeIDs: number[]) => GraphNode;
    upsertEdge: (id: number, leftNodeID: number, rightNodeID: number) => GraphEdge;
    deleteIfExistsNode: (id: number) => void;
    deleteIfExistsEdge: (id: number) => void;

    serialise: () => string;
}

class GraphManipulationError extends Error { }

class GraphImp implements Graph {
    nodes: Map<number, GraphNode> = new Map();
    edges: Map<number, GraphEdge> = new Map();

    // any edgeIDs must already exist
    upsertNode(id: number, edgeIDs: number[] = []): GraphNode {
        const newEdges: Set<GraphEdge> = new Set(this.nodes.get(id)?.edges) ?? [];

        for (const edgeID of edgeIDs) {
            if (!this.edges.has(edgeID)) {
                throw new GraphManipulationError(`cannot add edge with id '${edgeID}' to node as it does not exist`);
            }
            newEdges.add(this.edges.get(edgeID)!);
        }

        this.nodes.set(id, {
            id: id,
            edges: [...newEdges],
        });

        return this.nodes.get(id)!;
    }

    // nodes may optionally already exist
    upsertEdge(id: number, leftNodeID: number, rightNodeID: number): GraphEdge {
        this.deleteIfExistsEdge(id);

        const leftNode = this.upsertNode(leftNodeID);
        const rightNode = this.upsertNode(rightNodeID);

        const newEdge = {
            id: id,
            leftNode: leftNode,
            rightNode: rightNode,
        }
        this.edges.set(id, newEdge);

        this.upsertNode(leftNodeID, [id]);
        this.upsertNode(rightNodeID, [id]);

        return newEdge;
    }

    deleteIfExistsNode(id: number) {
        const node = this.nodes.get(id);

        if (node === undefined) {
            return
        }

        // Iterate over a copy in case deleteIfExistsEdge modifies the original
        const edgesToDelete = [...node.edges];
        for (const edge of edgesToDelete) {
            this.deleteIfExistsEdge(edge.id);
        }

        this.nodes.delete(id);
    }

    deleteIfExistsEdge(id: number) {
        const edge = this.edges.get(id);

        if (edge === undefined) {
            return
        }

        if (edge.leftNode) {
            edge.leftNode.edges = edge.leftNode.edges.filter(e => e.id !== id);
        }

        if (edge.rightNode) {
            edge.rightNode.edges = edge.rightNode.edges.filter(e => e.id !== id);
        }

        this.edges.delete(id);
    }

    serialise(): string {
        const nodes = [...this.nodes.values()].map((node) => ({
            id: node.id
        }));

        const edges = [...this.edges.values()].map((edge) => ({
            id: edge.id,
            leftNodeID: edge.leftNode.id,
            rightNodeID: edge.rightNode.id,
        }));

        return JSON.stringify({
            nodes: nodes,
            edges: edges
        });
    }
}

interface GraphDeserialiser {
    deserialise: (graphRepresentation: string) => Graph;
}

class GraphDeserialisationError extends Error { }

const graphSchema = z.object({
    nodes: z.array(z.object({
        id: z.number().int(),
    })),
    edges: z.array(z.object({
        id: z.number().int(),
        leftNodeID: z.number().int(),
        rightNodeID: z.number().int(),
    })),
})
type GraphSchema = z.infer<typeof graphSchema>;

class GraphDeserialiserImp implements GraphDeserialiser {
    createGraph(graphSchema: GraphSchema): Graph {
        const graph = new GraphImp();
        for (const edge of graphSchema.edges) {
            graph.upsertEdge(edge.id, edge.leftNodeID, edge.rightNodeID);
        }
        for (const node of graphSchema.nodes) {
            graph.upsertNode(node.id);
        }
        return graph;
    }

    deserialise(graphData: string): Graph {
        let graphDataObject: unknown;
        try {
            graphDataObject = JSON.parse(graphData);
        }
        catch (error: unknown) {
            throw new GraphDeserialisationError(`failed to parse graph data: ${error}`)
        }

        const result = graphSchema.safeParse(graphDataObject);

        if (!result.success) {
            throw new GraphDeserialisationError(`failed to validate graph data: ${result.error.format()}`)
        }

        return this.createGraph(result.data);
    }
}

