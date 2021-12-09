## Registering provider

Make sure to register the adonis-graphql-server provider to make use of `GraphQLServer`. The providers are registered inside `start/app.js`

```js
const providers = ['adonisjs-apollo-graphql-server/providers/ApolloGraphQLServerProvider'];
```

### Config for Apollo Graphql

the config is automatically created into the `config/graphql.js` file

Now we need to configure routes

```js
// start/routes.js

'use strict';

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

const url = require('url');
const querystring = require('querystring');
// Optionally Install package 'graphql-crunch' : v2.1.0
const { crunch } = require('graphql-crunch');
// Optionally Install package 'graphql-depth-limit' : v1.1.0
const depthLimit = require('graphql-depth-limit')

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route');
/** @type {typeof import('@adonisjs/framework/src/Logger')} */
const Route = use('Logger');

/** @type {import('adonis-graphql-server/src/AdonisGraphQLServer')} */
const GraphQL = use('Addons/Apollo/GraphQLServer');

Route.route('/graphql', httpCcontext => {
    return GraphQL.graphql(httpCcontext, {
       formatError: err => {
          return err.message;
       },
       formatResponse: (res, opts) => {
          const parsed = url.parse(opts.context.request.url);
          const query = querystring.parse(parsed.query);

          if(query.crunch && res.data) {
            const version = parseInt(query.crunch) || 1;
            res.data = crunch(res.data, version);
          }

          return res;
       },
       validationRules: [
        depthLimit(
          10,
          { ignore: [ /_trusted$/, 'idontcare' ] },
          depths => Logger.info(depths)
        )
       ]
    });
}, ['GET', 'POST']);
```

> If you want to upload files, you **have** to disable `autoProcess` flag in config/bodyParser.js

And **that's it**! Now you're free to use GraphQL Server.