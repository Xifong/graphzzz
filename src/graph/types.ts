export interface InteractiveGraph {
    placeNodeAt: (x: number, y: number) => void;
    moveNodeTo: (id: number, x: number, y: number) => void;
    connectNodeTo: (fromID: number, toID: number) => void;
    deleteEdge: (id: number) => boolean;
    deleteNode: (id: number) => boolean;
    getRenderData: () => GraphRenderData;
}


export interface InteractiveGraphDeserialiser {
    deserialiseGraphOnly: (graphRepresentation: string) => Graph;
    deserialiseWithPositions: (graphRepresentation: string) => InteractiveGraph;
}

export interface InteractiveGraphSerialiser {
    serialise: (graph: InteractiveGraph) => string;
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

export type GraphModificationEvent = {
    type: 'NODE_DELETED';
    nodeID: number;
} | {
    type: 'EDGE_DELETED';
    edgeID: number;
} | {
    type: 'NODE_MOVED';
    nodeID: number;
    newX: number;
    newY: number;
} | {
    type: 'NODE_ADDED';
    nodeID: number;
    x: number;
    y: number;
} | {
    type: 'EDGE_ADDED';
    edgeID: number;
    fromNodeID: number;
    toNodeID: number;
};

export interface GraphEventEmitter {
    onGraphModification: (callback: (event: GraphModificationEvent) => void) => void;
    offGraphModification: (callback: (event: GraphModificationEvent) => void) => void;
}
