import { Graph, GraphNode, GraphEdge } from './types';

class GraphManipulationError extends Error { }

export class GraphIterables<T> implements Iterable<T> {
    nodes: Map<number, T>;

    constructor(nodes: Map<number, T>) {
        this.nodes = nodes;
    }

    *[Symbol.iterator](): Iterator<T> {
        for (const node of this.nodes.values()) {
            yield node;
        }
    }
}

export class GraphImp implements Graph {
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

        // node upsertion can mean adding new edges to an existing node
        this.nodes.set(id, {
            id: id,
            edges: [...newEdges],
        });

        return this.nodes.get(id)!;
    }

    // nodes may optionally already exist
    upsertEdge(id: number, leftNodeID: number, rightNodeID: number): GraphEdge {
        // must delete first to clean up references to the old edge, if the upserted edge
        // is to safely replace an old edge with the same id but different nodes
        this.deleteIfExistsEdge(id);

        const leftNode = this.upsertNode(leftNodeID);
        const rightNode = this.upsertNode(rightNodeID);

        const newEdge = {
            id: id,
            leftNode: leftNode,
            rightNode: rightNode,
        }
        this.edges.set(id, newEdge);

        // now that the eddge exists, reupsert the nodes to give them references to the
        // current edge
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
        const nodes = [...this.iterableNodeCopy].map((node) => ({
            id: node.id
        }));

        const edges = [...this.iterableEdgeCopy].map((edge) => ({
            id: edge.id,
            leftNodeID: edge.leftNode.id,
            rightNodeID: edge.rightNode.id,
        }));

        return JSON.stringify({
            nodes: nodes,
            edges: edges
        });
    }

    get iterableNodeCopy(): Iterable<GraphNode> {
        return new GraphIterables<GraphNode>(this.nodes);
    }

    get iterableEdgeCopy(): Iterable<GraphEdge> {
        return new GraphIterables<GraphEdge>(this.edges);
    }
}
