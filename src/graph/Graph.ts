import { Graph, GraphNode, GraphEdge } from './types';

class GraphManipulationError extends Error { }

export class GraphIterables<T> implements Iterable<T> {
    constructor(
        public nodes: Map<number, T>
    ) {
    }

    *[Symbol.iterator](): Iterator<T> {
        for (const node of this.nodes.values()) {
            yield node;
        }
    }
}

export class GraphNodeImp implements GraphNode {
    constructor(
        public id: number,
        public edges: GraphEdge[]
    ) {
    }

    get neighboursCopy(): Set<GraphNode> {
        const neighbours = new Set<GraphNode>();
        for (const edge of this.edges) {
            const otherNode = this.id === edge.leftNode.id ? edge.rightNode : edge.leftNode;
            if (otherNode.id === this.id) {
                continue;
            }
            neighbours.add(otherNode);
        }
        return neighbours;
    }
}

export class GraphImp implements Graph {
    private nodes: Map<number, GraphNode> = new Map();
    private edges: Map<number, GraphEdge> = new Map();

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
        this.nodes.set(id, new GraphNodeImp(id, [...newEdges]));

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

        // now that the edge exists, reupsert the nodes to give them references to the
        // current edge
        this.upsertNode(leftNodeID, [id]);
        this.upsertNode(rightNodeID, [id]);

        return newEdge;
    }

    deleteIfExistsNode(id: number): boolean {
        const node = this.nodes.get(id);

        if (node === undefined) {
            return false;
        }

        // Iterate over a copy in case deleteIfExistsEdge modifies the original
        const edgesToDelete = [...node.edges];
        for (const edge of edgesToDelete) {
            this.deleteIfExistsEdge(edge.id);
        }

        this.nodes.delete(id);
        return true;
    }

    deleteIfExistsEdge(id: number): boolean {
        const edge = this.edges.get(id);

        if (edge === undefined) {
            return false;
        }

        if (edge.leftNode) {
            edge.leftNode.edges = edge.leftNode.edges.filter(e => e.id !== id);
        }

        if (edge.rightNode) {
            edge.rightNode.edges = edge.rightNode.edges.filter(e => e.id !== id);
        }

        this.edges.delete(id);
        return true;
    }

    get iterableNodeCopy(): Iterable<GraphNode> {
        return new GraphIterables<GraphNode>(this.nodes);
    }

    get iterableEdgeCopy(): Iterable<GraphEdge> {
        return new GraphIterables<GraphEdge>(this.edges);
    }
}
