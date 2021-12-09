'use strict'

const { createRateLimitDirective } = require('graphql-rate-limit');

const rateLimitDirective = createRateLimitDirective(
    { identifyContext: (context) => context.id }
);

const Env = use('Env')
const Helpers = use('Helpers')

module.exports = {

  /*
   |--------------------------------------------------------------------------
   | GraphQL Enable Http Compression (GZIP)
   |--------------------------------------------------------------------------
   |
   |
   |
   |
   */

  // ensureHttpCompression: Env.get('ENABLE_HTTP_COMPRESSION_ON_RESPONSE', false),

  /*
   |--------------------------------------------------------------------------
   | GraphQL File Upload Options
   |--------------------------------------------------------------------------
   |
   |
   |
   |
   */

   fileUploadOptions: {
        maxFieldSize: parseInt(Env.get('MAX_FORM_FIELD_SIZE', '100000'), 10), // bytes
        maxFileSize: parseInt(Env.get('MAX_FORM_FILE_UPLOAD_SIZE', '2000'), 10), // bytes
        maxFiles: parseInt(Env.get('MAX_FORM_FILES_COUNT', '1'), 10)
   },

   /*
   |--------------------------------------------------------------------------
   | GraphQL Resolvers Root File Path
   |--------------------------------------------------------------------------
   |
   |
   |
   |
   */

  resolversFilePath: Helpers.appRoot(Env.get('RESOLVERS_FILE_PATH', 'app/GraphQL/Http/Resolvers')),

  /*
   |--------------------------------------------------------------------------
   | GraphQL Schema Root File Path
   |--------------------------------------------------------------------------
   |
   |
   |
   |
   */

   schemaFilePath: Helpers.appRoot(Env.get('SCHEMA_FILE_PATH', 'app/GraphQL/Http/Schema')),

   /*
   |--------------------------------------------------------------------------
   | GraphQL Endpoint Path
   |--------------------------------------------------------------------------
   |
   |
   |
   |
   */

   endpointPath: '/graphql',

   /*
   |--------------------------------------------------------------------------
   | GraphQL Cache Control
   |--------------------------------------------------------------------------
   |
   |
   |
   |
   */

   cacheControl: {
        defaultMaxAge: 2
   },

   /*
   |--------------------------------------------------------------------------
   | GraphQL Schema Directives
   |--------------------------------------------------------------------------
   |
   |
   |
   |
   */

   schemaDirectives: {
        rateLimit: rateLimitDirective
   },
}