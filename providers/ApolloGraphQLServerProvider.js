const { ServiceProvider } = require('@adonisjs/fold');

class AdonisGraphQLServerProvider extends ServiceProvider {
    _registerApolloServerUtils () {
        this.bind('Addons/Apollo/Utils', () => {
            return require('apollo-server-core');
        })
    }

    _registerApolloServer () {
        this.app.singleton('Addons/Apollo/GraphQLServer', () => {
            const Config = this.app.use('Adonis/Src/Config');
            const { runHttpQuery, gql } = this.app.use('Addon/Apollo/Utils');
            const GraphiQL = require('graphql-playground-html');
            const { makeExecutableSchema } = require('graphql-tools');
            const { print } = require('graphql/language/printer');
            const { GraphQLUpload, processRequest } = require('graphql-upload');

            return new (require('../src/AdonisGraphQLServer'))({
                Config,
                runHttpQuery,
                GraphiQL,
                makeExecutableSchema,
                print,
                GraphQLUpload,
                gql,
                processRequest,
            });
        });
    }

    register () {
        this._registerApolloServerUtils()
        this._registerApolloServer()
    }
}

module.exports = AdonisGraphQLServerProvider;