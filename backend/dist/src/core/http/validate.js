export const zodValidate = (schema, source = 'body') => (req, _res, next) => {
    const parsed = schema.parse(req[source]);
    if (source === 'query') {
        Object.assign(req.query, parsed);
    }
    else if (source === 'params') {
        Object.assign(req.params, parsed);
    }
    else {
        req.body = parsed;
    }
    next();
};
