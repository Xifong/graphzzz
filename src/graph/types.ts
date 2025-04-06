export interface InteractiveGraph {
    placeNodeAt: (x: number, y: number) => void;
    moveNodeTo: (id: number, x: number, y: number) => void;
    connectNodeTo: (fromID: number, toID: number) => void;
    deleteEdge: (id: number) => boolean;
    deleteNode: (id: number) => boolean;
    getRenderData: () => GraphRenderData;
}


export interface InteractiveGraphDeserialiser {
    deserialise: (graphRepresentation: string) => InteractiveGraph;
}

export interface GraphEdge {
    id: number;
    leftNode: GraphNode;
    rightNode: GraphNode;
}

export interface GraphNode {
    id: number;
    edges: GraphEdge[];

    neighboursCopy: Set<GraphNode>;
}

export interface Graph {
    iterableNodeCopy: Iterable<GraphNode>;
    iterableEdgeCopy: Iterable<GraphEdge>;

    upsertNode: (id: number, edgeIDs?: number[]) => GraphNode;
    upsertEdge: (id: number, leftNodeID: number, rightNodeID: number) => GraphEdge;
    deleteIfExistsNode: (id: number) => boolean;
    deleteIfExistsEdge: (id: number) => boolean;

    serialise: () => string;
}

export interface GraphRenderData {
    nodes: {
        id: number,
        x: number,
        y: number,
    }[],
    edges: {
        id: number,
        leftNodeID: number,
        rightNodeID: number,
    }[],
}
