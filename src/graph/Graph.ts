import { Graph, GraphNode, GraphEdge } from './types';

class GraphManipulationError extends Error { }
class GraphQueryError extends Error { }

export class GraphIterables<T> implements Iterable<T> {
    constructor(
        public graphObject: Map<number, T>
    ) {
    }

    *[Symbol.iterator](): Iterator<T> {
        for (const graphObject of this.graphObject.values()) {
            yield graphObject;
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
    // node upsertion can mean adding new edges to an existing node
    upsertNode(id: number, edgeIDs: number[] = []): GraphNode {
        const newEdges: Set<GraphEdge> = new Set(this.nodes.get(id)?.edges) ?? [];

        for (const edgeID of edgeIDs) {
            if (!this.edges.has(edgeID)) {
                throw new GraphManipulationError(`cannot add edge with id '${edgeID}' to node as it does not exist`);
            }
            newEdges.add(this.edges.get(edgeID)!);
        }

        const existingNode = this.nodes.get(id);
        if (existingNode === undefined) {
            this.nodes.set(id, new GraphNodeImp(id, [...newEdges]));
        } else {
            existingNode.edges = [...newEdges];
        }


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

    neighboursOf(id: number): GraphNode[] {
        const node = this.nodes.get(id);

        if (node === undefined) {
            return [];
        }

        return node.edges.map((edge) => {
            if (edge.leftNode.id !== id) {
                return edge.leftNode
            }
            return edge.rightNode;
        });

    }

    connectionBetween(nodeID: number, otherNodeID: number): GraphEdge | null {
        const node = this.nodes.get(nodeID);

        if (node === undefined) {
            throw new GraphQueryError(
                `cannot get connection between nodes '${nodeID}', '${otherNodeID}' because '${nodeID}' does not exist`
            );
        }

        const connecting = node.edges.filter((edge) => {
            return (edge.leftNode.id === nodeID && edge.rightNode.id === otherNodeID) ||
                (edge.rightNode.id === nodeID && edge.leftNode.id === otherNodeID)
        })

        if (connecting.length < 1) {
            return null;
        }

        if (connecting.length > 1) {
            throw new GraphQueryError(`found '${connecting.length}' connections between nodes '${nodeID}' and '${otherNodeID}'`);
        }

        return connecting[0];
    }

    hasNode(nodeID: number): boolean {
        return this.nodes.has(nodeID);
    }

    edgesCopyOf(nodeID: number): GraphEdge[] {
        const node = this.nodes.get(nodeID);
        if (node === undefined) {
            return [];
        }

        return node.edges;
    }
}
