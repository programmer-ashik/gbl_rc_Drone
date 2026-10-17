export class HttpError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'HttpError';
    }
}
export class NotFoundError extends HttpError {
    constructor(message = 'Resource not found') {
        super(404, 'NOT_FOUND', message);
    }
}
export class UnauthorizedError extends HttpError {
    constructor(message = 'Unauthorized') {
        super(401, 'UNAUTHORIZED', message);
    }
}
export class ForbiddenError extends HttpError {
    constructor(message = 'Forbidden') {
        super(403, 'FORBIDDEN', message);
    }
}
export class BadRequestError extends HttpError {
    constructor(message = 'Bad request', details) {
        super(400, 'BAD_REQUEST', message, details);
    }
}
//# sourceMappingURL=errors.js.map