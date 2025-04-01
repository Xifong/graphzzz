export interface GraphEdge {
    id: number;
    leftNode: GraphNode;
    rightNode: GraphNode;
}

export interface GraphNode {
    id: number;
    edges: GraphEdge[];
}

export interface Graph {
    nodes: Map<number, GraphNode>;
    edges: Map<number, GraphEdge>;

    upsertNode: (id: number, edgeIDs?: number[]) => GraphNode;
    upsertEdge: (id: number, leftNodeID: number, rightNodeID: number) => GraphEdge;
    deleteIfExistsNode: (id: number) => void;
    deleteIfExistsEdge: (id: number) => void;

    serialise: () => string;
}

export interface GraphRenderData {
    nodes: {
        id: number,
        x: number,
        y: number,
    }[],
    edges: {
        leftNodeID: number,
        rightNodeID: number,
    }[],
}
