
export class EntityRenderingError extends Error {
    public cause?: unknown;

    constructor(message: string, cause?: unknown) {
        super(message);
        this.name = 'EntityRenderingError';
        this.cause = cause;
    }
}
