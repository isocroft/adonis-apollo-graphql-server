'use strict'

function isString(value) {
    return Object.prototype.toString.call(value) === '[object String]';
}

/**
 * adonis-graphql-server is a provider that gives you power to use GraphQL whitout limitation
 *
 * @constructor
 * @singleton
 * @uses (['Adonis/Src/Config'])
 *
 * @class AdonisGraphQLServer
 */
class AdonisGraphQLServer {
    constructor({ Config, runHttpQuery, GraphiQL, makeExecutableSchema, print, GraphQLUpload, gql, processRequest }) {
        this.Config = Config;
        this.options = this.Config.get('graphql');
        this.runHttpQuery = runHttpQuery;
        this.GraphiQL = GraphiQL;
        this.makeExecutableSchema = makeExecutableSchema;
        this.print = print;
        this.GraphQLUpload = GraphQLUpload;
        this.gql = gql;
        this.processRequest = processRequest;
    }

    _isObject(obj = {}) {
        return !!obj && !Array.isArray(obj) && Object.entries(obj).length && typeof obj === 'object';
    }

    _sanitizeObject(obj) {
        let tmpValues = [];
        const retorno = Object.fromEntries(
            Object.entries(obj).map(([key, value]) => {
                if (/.*\[\d+\]/.test(key)) {
                    tmpValues = [...tmpValues, value];
                    return [key.split('[')[0], tmpValues];
                }
                return [key, value];
            }),
        );
        return retorno;
    }

    _checkIfHasBrackets(obj) {
        const filtered = Object.entries(obj).find(([key]) => /.*\[\d+\]/.test(key));
        return !!filtered;
    }

    _deepLookObject(obj, checker, callback) {
        if (obj && !!checker(obj)) {
            return callback(obj);
        }

        if (Array.isArray(obj)) {
            return obj.map(value => this._deepLookObject(value, checker, callback));
        }

        if (this._isObject(obj)) {
            return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, this._deepLookObject(value, checker, callback)]));
        }

        return obj;
    }

    _getQueryObject(body) {
        const { query, variables, operationName } = body;
        if (variables) {
            if (isString(query)) {
                if (isString(operationName)) {
                    return { operationName, query, variables }
                }
                return { query, variables };
            }
            return { query: this.print(query), variables };
        }
        if (isString(query)) {
            return { query };
        }
        return { query: this.print(query) };
    }

    _insertUploadTypeAndRateLimitDirective(typeDefs, resolvers) {
        const typeDefsWithUpload = this.gql`
            directive @rateLimit(
              max: Int,
              window: String,
              message: String,
              identityArgs: [String],
              arrayLengthField: String
            ) on FIELD_DEFINITION
            
            ${typeDefs}
            
            scalar Upload
        `;
        const resolversWithUpload = {
            ...resolvers,
            Upload: this.GraphQLUpload,
        };
        return { typeDefsWithUpload, resolversWithUpload };
    }

    _getSchemaValues(schemaDef, resolversDef) {
        const { typeDefs, resolvers, schemaDirectives } = Object.assign(
            this.options, { typeDefs: schemaDef, resolvers: resolversDef }
        );

        if (!typeDefs || !resolvers) {
            throw new Error('Apollo Server: typeDefs and resolvers are required');
        }
        const { typeDefsWithUpload, resolversWithUpload } = this._insertUploadTypeAndRateLimitDirective(
            typeDefs,
            resolvers
        );

        if (schemaDirectives) {
            return { typeDefs: typeDefsWithUpload, resolvers: resolversWithUpload, schemaDirectives };
        }
        return { typeDefs: typeDefsWithUpload, resolvers: resolversWithUpload };
    }

    _isRequestJSON(request) {
        return request.is(['application/json']) === 'application/json';
    }

    async _getRequestData(request, response, fileUploadOptions) {
        if (this._isRequestJSON(request)) {
            return request.method() === 'POST' ? request.post() : request.get();
        }
        if (this.Config.get('bodyParser.files.autoProcess')) {
            throw new Error('You need to disable autoProcess flag in config/bodyParser.js to use form-data');
        }
        return this.processRequest(request.request, response.response, fileUploadOptions);
    }

    async graphql({ request, response, ...context }, { validationRules, formatError, formatResponse }) {
        const { schemaFilePath, resolversFilePath, fileUploadOptions, endpointPath, ...options } = this.options;
        if (!this.options) {
            throw new Error('Apollo Server: Options is required.');
        }
        const { query, variables, operatioName, extensions } = await this._getRequestData(
            request,
            response,
            fileUploadOptions
        );

        const transformedVariables = this._deepLookObject(
            variables,
            this._checkIfHasBrackets,
            this._sanitizeObject
        );

        try {
            const { graphqlResponse } = await this.runHttpQuery([request], {
                method: request.method(),
                options: {
                    schema: this.makeExecutableSchema(this._getSchemaValues(
                        require(schemaFilePath),
                        require(resolversFilePath)
                    )),
                    context: typeof context === 'function' ? context(request) : context,
                    ...options,
                    validationRules,
                    formatError,
                    formatResponse
                },
                query: this._getQueryObject({ query, variables: transformedVariables, operatioName, extensions }),
            });
            response.safeHeader('Content-type', 'application/json');
            return response.json(graphqlResponse);
        } catch (error) {
            if (error.name !== 'HttpQueryError') {
                throw error;
            }
            if (error.headers) {
                Object.keys(error.headers).forEach(header => {
                    response.header(header, error.headers[header]);
                });
            }
            return response.status(error.statusCode).send(error.message);
        }
    }

    async graphiql({ response }) {
        const { endpointPath } = this.options;
        try {
            const graphqlOptions = { endpoint: endpointPath || '/graphql' };
            const playground = this.GraphiQL.renderPlaygroundPage(graphqlOptions);
            return response.header('Content-Type', 'text/html').send(playground);
        } catch (error) {
            if (error.headers) {
                Object.keys(error.headers).forEach(header => {
                    response.header(header, error.headers[header]);
                });
            }
            return response.status(error.statusCode).send(error.message);
        }
    }
}

module.exports = AdonisGraphQLServer;