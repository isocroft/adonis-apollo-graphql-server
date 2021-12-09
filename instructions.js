/*
 * adonis-graphql-server
 *
 * 
 * @copyright (c) -  Santos de Brito <edu.santos.brito@gmail.com>
 * @extended Isocroft - Ifeora Okechukwu <isocroft@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const path = require('path');

module.exports = async cli => {
    try {
        await cli.makeConfig('graphql.js', path.join(__dirname, 'config/garphql.js'));
        cli.command.completed('create', 'config/graphql.js');
    } catch (error) {
        // ignore errors
    }
};
