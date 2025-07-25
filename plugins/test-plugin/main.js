export default class TestPlugin {
  async init(settings, context) {
    // Ensure settings is an object and tstCount is initialized
    this.settings = settings || {}; // Ensure settings is an object
    if (typeof this.settings.tstCount !== 'number') {
      this.settings.tstCount = 0; // Initialize to 0 if not a number
    }
    this.context = context;   
  }

  async onLocationChange(newLocation, state) {
    // Find this plugin's settings in the main application state
    // It's better to use this.settings directly if it's guaranteed to be up-to-date
    // or if the plugin's internal state is the source of truth.
    // However, if the state object passed to onLocationChange is the canonical source,
    // then finding it there is correct. Let's assume state.plugins is the canonical source.
    const thisPlugin = state.plugins.find(p => p.name === "test-plugin");
    if (!thisPlugin) {
      console.warn("TestPlugin: Could not find self in state.plugins during onLocationChange.");
      return;
    }

    // Directly modify the tstCount in the draft's settings
    if (typeof thisPlugin.settings.tstCount !== 'number') {
        console.error("TestPlugin: tstCount is not a number in onLocationChange, re-initializing to 0.");
        thisPlugin.settings.tstCount = 0;
    }
    thisPlugin.settings.tstCount++; // Increment the count directly on the draft
    console.log("TestPlugin: tstCount after increment in onLocationChange:", thisPlugin.settings.tstCount);

    // No need to call this.context.saveSettings(newSettings); here.
    // The changes to the 'state' draft will be committed by engine.ts's setAsync.
    console.log("TestPlugin: tstCount incremented to", thisPlugin.settings.tstCount);
  }
}