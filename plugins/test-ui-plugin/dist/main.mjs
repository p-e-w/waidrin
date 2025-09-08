var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// main.tsx
var React;
var TestUIAttributeDisplay = ({ initialAttributeValue, injectedReact, injectedRadixThemes, onSave }) => {
  const [inputValue, setInputValue] = injectedReact.useState("");
  const [displayValue, setDisplayValue] = injectedReact.useState("");
  const handleChange = async (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    await onSave(newValue);
  };
  const handleApply = async () => {
    await onSave(inputValue);
    setDisplayValue(inputValue);
  };
  injectedReact.useEffect(() => {
    setInputValue(initialAttributeValue);
    setDisplayValue(initialAttributeValue);
  }, [initialAttributeValue]);
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(injectedRadixThemes.Text, null, "Custom Attribute:"), /* @__PURE__ */ React.createElement(
    injectedRadixThemes.TextField.Root,
    {
      value: inputValue,
      onChange: handleChange
    }
  ), /* @__PURE__ */ React.createElement(injectedRadixThemes.Button, { onClick: handleApply }, "Apply"), /* @__PURE__ */ React.createElement(injectedRadixThemes.Text, null, " (Persisted: ", displayValue, ")"));
};
var PluginCharacterUIPage = ({ injectedReact, injectedImmer, injectedRadixThemes, injectedReactIconsGi, getGlobalState, onSave, injectedUseShallow }) => {
  const pluginSettings = injectedReact.useMemo(() => {
    const state = getGlobalState();
    const plugin = state.plugins.find((p) => p.name === "test-ui-plugin");
    return plugin ? plugin.settings : {};
  }, [getGlobalState]);
  const customAttribute = pluginSettings.customAttribute || "Default Value";
  return /* @__PURE__ */ React.createElement(
    TestUIAttributeDisplay,
    {
      initialAttributeValue: customAttribute,
      injectedReact,
      injectedRadixThemes,
      onSave
    }
  );
};
var TestUIPlugin = class {
  // Internal copy of plugin settings.
  /**
   * @method init
   * @description Initializes the plugin. This method is called by the main application
   * during plugin loading. It receives the plugin's settings and the Context object.
   * @param {Record<string, unknown>} settings - The initial settings for this plugin.
   * @param {Context} context - The Context object providing access to main application functionalities.
   * @returns {Promise<void>}
   */
  async init(settings, context) {
    this.context = context;
    this.settings = settings;
    React = this.context.appLibs.react;
    this.context.addCharacterUI(
      this.context.pluginName,
      // GameRuleName: Display name for the UI tab.
      /* @__PURE__ */ React.createElement("span", null, "Test UI Tab"),
      // GameRuleTab: The ReactNode for the tab trigger.
      /* @__PURE__ */ React.createElement(
        PluginCharacterUIPage,
        {
          injectedReact: this.context.appLibs.react,
          injectedImmer: this.context.appLibs.immer,
          injectedRadixThemes: this.context.appLibs.radixThemes,
          injectedReactIconsGi: this.context.appLibs.reactIconsGi,
          injectedUseShallow: this.context.appLibs.useShallow,
          getGlobalState: this.context.appStateManager.getGlobalState,
          onSave: async (newValue) => {
            this.context.appStateManager.savePluginSettings(this.context.pluginName, { customAttribute: newValue });
            this.settings = __spreadProps(__spreadValues({}, this.settings), { customAttribute: newValue });
          }
        }
      )
    );
  }
};
export {
  TestUIPlugin as default
};
