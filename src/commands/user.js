const { OpenProcessingClient } = require('../api/client');
const { selectFields } = require('../fieldSelector');
const { formatObject, formatArray } = require('../formatters');
const { validateId } = require('../validator');

/**
 * Handle user-related commands
 * @param {Object} args - Command arguments
 * @param {string} [args.subcommand] - Subcommand ('sketches', 'followers', 'following', or undefined for info)
 * @param {string|number} args.id - User ID
 * @param {Object} args.options - Command options
 */
async function handleUserCommand(args) {
  const client = new OpenProcessingClient(process.env.OP_API_KEY);

  // Validate user ID
  const idValidation = validateId(args.id);
  if (!idValidation.valid) {
    throw new Error(idValidation.message);
  }
  const userId = idValidation.data;

  const listOptions = {
    limit: args.options.limit,
    offset: args.options.offset,
    sort: args.options.sort
  };

  if (!args.subcommand) {
    // opdl user <id> --info ... (client validates the response)
    const user = await client.getUser(userId);

    let output = user;
    if (args.options.info) {
      output = selectFields(user, {
        fields: args.options.info,
        fieldSetName: 'user'
      });
    }

    if (!args.options.quiet) {
      console.log(formatObject(output, { json: args.options.json }));
    }
  } else if (args.subcommand === 'sketches') {
    // opdl user sketches <id> [--info ...]
    const sketches = await client.getUserSketches(userId, listOptions);

    let output = sketches;
    if (args.options.info) {
      output = selectFields(sketches, {
        fields: args.options.info,
        fieldSetName: 'user.sketches'
      });
    }

    if (!args.options.quiet) {
      console.log(formatArray(output, { json: args.options.json }));
    }
  } else if (args.subcommand === 'followers') {
    // opdl user followers <id> [--info ...]
    const followers = await client.getUserFollowers(userId, listOptions);

    let output = followers;
    if (args.options.info) {
      output = selectFields(followers, {
        fields: args.options.info,
        fieldSetName: 'user.followers'
      });
    }

    if (!args.options.quiet) {
      console.log(formatArray(output, { json: args.options.json }));
    }
  } else if (args.subcommand === 'following') {
    // opdl user following <id> [--info ...]
    const following = await client.getUserFollowing(userId, listOptions);

    let output = following;
    if (args.options.info) {
      output = selectFields(following, {
        fields: args.options.info,
        fieldSetName: 'user.following'
      });
    }

    if (!args.options.quiet) {
      console.log(formatArray(output, { json: args.options.json }));
    }
  } else {
    throw new Error(`Unknown user subcommand: ${args.subcommand}`);
  }
}

module.exports = {
  handleUserCommand,
};
