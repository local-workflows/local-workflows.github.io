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

        // A tab of this plugin's own in the run panel, beside Logs and
        // Artifacts. Content only - markdown here; `table` and `json`
        // are the other two shapes. Nothing downstream reads it; it is
        // for the person looking at the run.
        const ui = {
            type: "markdown",
            label: "Greeting",
            content: `# ${greeting}\n\n| Arg | Value |\n|---|---|\n| name | ${args.name} |\n| excited | ${args.excited} |\n\n`
                + `Token ${token ? "was" : "was not"} provided.`
        };

        // The plugin's own table. `ctx.db` is this plugin's SQLite file
        // and nobody else's; absent when the engine has nowhere to write.
        if (ctx.db) {
            await ctx.db.run("CREATE TABLE IF NOT EXISTS greetings (id INTEGER PRIMARY KEY, name TEXT, at TEXT)");
            await ctx.db.run("INSERT INTO greetings (name, at) VALUES (?, ?)", [args.name, new Date().toISOString()]);
        }

        return { success: true, artifacts: { greeting }, ui };
    },

    /**
     * The back end of the plugin's own tab (ui/index.html). The page
     * calls `lw.call(name, payload)`; this answers it. Same sandbox as
     * `execute`, a fresh process per call, and what comes back is JSON.
     */
    async handle(request, ctx) {

        switch (request.name) {

            case "hello":
                return { text: `Hello, ${request.payload && request.payload.name || "stranger"}. This came from index.js.` };

            case "history":
                return ctx.db
                    ? ctx.db.all("SELECT name, at FROM greetings ORDER BY id DESC LIMIT 20")
                    : [];

            case "clear":
                if (ctx.db)
                    await ctx.db.run("DELETE FROM greetings");
                return { cleared: true };

            default:
                throw new Error(`greet@1 has no handler named '${request.name}'.`);
        }
    }
};
