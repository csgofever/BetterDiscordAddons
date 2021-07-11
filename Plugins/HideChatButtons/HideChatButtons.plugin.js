/**
* @name HideChatButtons
* @displayName HideChatButtons
* @description Remove annoying buttons like the Gift button from the chat box.
* @author Qb
* @authorId 133659541198864384
* @version 1.0.0
* @invite gj7JFa6mF8
* @source https://github.com/QbDesu/BetterDiscordAddons/blob/potato/Plugins/HideChatButtons
* @updateUrl https://raw.githubusercontent.com/QbDesu/BetterDiscordAddons/potato/Plugins/HideChatButtons/HideChatButtons.plugin.js
*/
/*@cc_on
@if (@_jscript)
    
    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
    var pathSelf = WScript.ScriptFullName;
    // Put the user at ease by addressing them in the first person
    shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();

@else@*/

module.exports = (() => {
    const config = {
        info: {
            name: "HideChatButtons",
            authors: [
                {
                    name: "Qb",
                    discord_id: "133659541198864384",
                    github_username: "QbDesu"
                }
            ],
            version: "1.0.0",
            description: "Remove annoying buttons like the Gift button from the chat box.",
            github: "https://github.com/QbDesu/BetterDiscordAddons/blob/potato/Plugins/HideChatButtons",
            github_raw: "https://raw.githubusercontent.com/QbDesu/BetterDiscordAddons/potato/Plugins/HideChatButtons/HideChatButtons.plugin.js"
        },
        defaultConfig: [
            {
                type: "switch",
                id: "giftButton",
                name: "Remove Gift Button",
                note: "Removes the Gift Nitro button from the chat.",
                value: true,
            },
            {
                type: "switch",
                id: "gifButton",
                name: "Remove GIF Button",
                note: "Removes the GIF button from the chat.",
                value: true,
            },
            {
                type: "switch",
                id: "stickerButton",
                name: "Remove Sticker Button",
                note: "Removes the Sticker button from the chat.",
                value: true,
            },
            {
                type: "switch",
                id: "emojiButton",
                name: "Remove Emoji Button",
                note: "Removes the Emoji button from the chat.",
                value: false,
            },
            {
                type: "switch",
                id: "attachButton",
                name: "Attach Button",
                note: "Removes the Attach button from the chat.",
                value: false,
            }
        ]
    };
    return !global.ZeresPluginLibrary ? class {
        constructor() { this._config = config; }
        load() {
            BdApi.showConfirmationModal("Library plugin is needed", 
            [`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`], {
                confirmText: "Download",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                    if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                    await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                });
            }
        });
    }
    start() { }
    stop() { }
}
: (([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
            const {
                Patcher,
                WebpackModules
            } = Api;

            // thanks to Strencher and InvisibleTyping for finding this
            const ChannelTextAreaContainer = WebpackModules.find(m => m?.type?.render?.displayName === "ChannelTextAreaContainer")?.type;
            const buttonClasses = WebpackModules.getByProps('emojiButton','stickerButton');
            const buttonsSelector = new DOMTools.Selector(buttonClasses.buttons);
            const emojiButtonSelector = new DOMTools.Selector(buttonClasses.emojiButton);
            const stickerButtonSelector = new DOMTools.Selector(buttonClasses.stickerButton);
            return class Freemoji extends Plugin {
                hideEmojiButton = `${buttonsSelector} ${emojiButtonSelector} { display: none }`;
                hideStickerButton = `${buttonsSelector} ${stickerButtonSelector} { display: none }`;

                
                initialize() {
                    Patcher.before(ChannelTextAreaContainer, "render", (_, [props]) => {
                        if(this.settings.giftButton) props.shouldRenderPremiumGiftButton = false;
                        if(this.settings.attachButton) props.renderAttachButton = ()=>{}
                    });

                    // TODO: Detect locale changes and update hideGifButton css snippet
                    if (this.settings.gifButton)
                        PluginUtilities.addStyle(`${config.info.name}--hideGifButton`, `${buttonsSelector} [aria-label="${DiscordModules.Strings.GIF_BUTTON_LABEL}"] { display: none }`);
                    
                    if (this.settings.emojiButton) 
                        PluginUtilities.addStyle(`${config.info.name}--hideEmojiButton`, this.hideEmojiButton);
                    
                    if (this.settings.stickerButton) 
                        PluginUtilities.addStyle(`${config.info.name}--hideStickerButton`, this.hideStickerButton);
                }

                cleanup() {
                    Patcher.unpatchAll();
                    PluginUtilities.removeStyle(`${config.info.name}--hideEmojiButton`);
                    PluginUtilities.removeStyle(`${config.info.name}--hideGifButton`);
                    PluginUtilities.removeStyle(`${config.info.name}--hideStickerButton`);
                }

                onStart() {
                    if (!ChannelTextAreaContainer) {
                        this.initialize = ()=>{};
                        return Toasts.error(`Couldn't start ${config.info.name}: Couldn't find ChannelTextAreaContainer`);
                    }
                    this.initialize();
                }
                
                onStop() {
                    this.cleanup();
                }
            
                getSettingsPanel() {
                    const panel = this.buildSettingsPanel();
                    panel.addListener(() => {
                        this.cleanup();
                        this.initialize();
                    });
                    return panel.getElement();
                }
            };
        };
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/