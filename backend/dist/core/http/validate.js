export const zodValidate = (schema, source = 'body') => (req, _res, next) => {
    const parsed = schema.parse(req[source]);
    Object.assign(req, { [source]: parsed });
    next();
};
//# sourceMappingURL=validate.js.map