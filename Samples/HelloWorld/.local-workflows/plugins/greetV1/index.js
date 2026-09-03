/*
 * A minimal user plugin.
 *
 * Copy this *folder* to ~/.local-workflows/plugins/ and it becomes available
 * to every workflow as `uses: greet@1`. No build step, no dependency on
 * this repo - plain CommonJS JavaScript.
 *
 *   - name: Say hello
 *     uses: greet@1
 *     args:
 *       name: World
 *     artifact: GREETING
 *
 * Then a later task can read `${{ run.context.GREETING }}` (a single
 * declared artifact means the variable *is* that value).
 *
 * The folder name matters: `greetV1` is `<id>V<major>`, and it must
 * agree with the `version` in plugin.json. Two majors are two folders,
 * side by side, and `uses: greet@1` names exactly one of them.
 *
 * What this plugin *is* - id, version, args, artifacts - lives next door
 * in plugin.json. This file is only the implementation, which is what lets
 * a task be validated before any of it runs.
 */
module.exports = {

    /**
     * @param args resolved `args:` - templates already expanded, and
     *             already checked against the manifest's declarations
     * @param ctx  the only capabilities a plugin gets (see PluginContext)
     */
    async execute(args, ctx) {

        const greeting = `Hello, ${args.name}${args.excited ? "!" : "."}`;

        ctx.log(greeting);

        // Read a secret by env var name. Never cached, and registered
        // with the run's masker so it is redacted if it ever hits a log.
        //
        // Declared as `secrets` in plugin.json - a plugin runs in a sandboxed
        // process with no access to the environment, so anything not
        // declared there is simply not present.
        const token = ctx.secret("GREET_TOKEN");

        if (token)
            ctx.log("A GREET_TOKEN was provided (its value will be masked in logs).");

        return { success: true, artifacts: { greeting } };
    }
};
