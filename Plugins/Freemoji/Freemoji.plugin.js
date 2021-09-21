/**
* @name Freemojis
* @displayName Freemojis
* @description Send emoji external emoji and animated emoji without Nitro.
* @author Zenz
* @updateUrl https://raw.githubusercontent.com/QbDesu/BetterDiscordAddons/potato/Plugins/Freemoji/Freemoji.plugin.js
* @version 1.5.3
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
            name: 'Freemojis',
            authors: [
                {
                    name: 'Zenz',
                    github_username: 'csgo fever'
                },
                {
                    name: 'Skidded from An0 and Qb',
                    github_username: 'csgo fever'
                }
            ],
            version: '1.0.0',
            description: 'Send emoji external emoji and animated emoji without Nitro.',
            github: 'https://github.com/QbDesu/BetterDiscordAddons/blob/potato/Plugins/Freemoji',
            github_raw: 'https://raw.githubusercontent.com/QbDesu/BetterDiscordAddons/potato/Plugins/Freemoji/Freemoji.plugin.js'
        },
        changelog: [
            { title: 'Skidded', type: 'fix', items: ['BY ZENZ | SKIDDED FROM Qb AND An0'] }
        ],
        defaultConfig: [
            {
                type: 'switch',
                id: 'sendDirectly',
                name: 'Send Directly',
                note: 'Send the emoji link in a message directly instead of putting it in the chat box.',
                value: false
            },
            {
                type: 'slider',
                id: 'size',
                name: 'Emoji Size',
                note: 'The size of the emoji in pixels. 40 is recommended.',
                value: 40,
                markers:[16,20,32,40,64],
                stickToMarkers:true
            },
            {
                type: 'dropdown',
                id: 'removeGrayscale',
                name: 'Remove Grayscale Filter',
                note: 'Remove the grayscale filter on emoji that would normally not be usable.',
                value: 'embedPerms',
                options: [
                    {
                        label: 'Always',
                        value: 'always'
                    },
                    {
                        label: 'With Embed Perms',
                        value: 'embedPerms'
                    },
                    {
                        label: 'Never',
                        value: 'never'
                    }
                ]
            },
            {
                type: 'dropdown',
                id: 'missingEmbedPerms',
                name: 'Missing Embed Perms Behaviour',
                note: 'What should happen if you select an emoji even though you have no embed permissions.',
                value: 'showDialog',
                options: [
                    {
                        label: 'Show Confirmation Dialog',
                        value: 'showDialog'
                    },
                    {
                        label: 'Insert Anyway',
                        value: 'insert'
                    },
                    {
                        label: 'Nothing',
                        value: 'nothing'
                    }
                ]
            },
            {
                type: 'dropdown',
                id: 'unavailable',
                name: 'Allow Unavailable Emoji',
                note: 'Allow using emoji that would normally even be unavailable to Nitro users. For example emoji which became unavailable because a server lost it\'s boost tier.',
                value: 'allow',
                options: [
                    {
                        label: 'Allow',
                        value: 'allow'
                    },
                    {
                        label: 'Show Confirmation Dialog',
                        value: 'showDialog'
                    },
                    {
                        label: 'Don\'t Allow',
                        value: 'off'
                    }
                ]
            },
            {
                type: 'dropdown',
                id: 'external',
                name: 'Allow External Emoji',
                note: 'Allow External Emoji for servers that have them disabled.',
                value: 'off',
                options: [
                    {
                        label: 'Don\'t Allow',
                        value: 'off'
                    },
                    {
                        label: 'Show Confirmation Dialog',
                        value: 'showDialog'
                    },
                    {
                        label: 'Allow',
                        value: 'allow'
                    }
                ]
            }
        ]
    };
    return !global.ZeresPluginLibrary ? class {
        constructor() { this._config = config; }
        load() {
            BdApi.showConfirmationModal('Library plugin is needed',
                [`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`], {
                confirmText: 'Download',
                cancelText: 'Cancel',
                onConfirm: () => {
                    require('request').get('https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js', async (error, response, body) => {
                        if (error) return require('electron').shell.openExternal('https://betterdiscord.app/Download?id=9');
                        await new Promise(r => require('fs').writeFile(require('path').join(BdApi.Plugins.folder, '0PluginLibrary.plugin.js'), body, r));
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
                PluginUtilities,
                WebpackModules,
                Toasts,
                Logger,
                Utilities,
                DOMTools,
                DiscordModules: {
                    Permissions,
                    DiscordPermissions,
                    UserStore,
                    SelectedChannelStore,
                    ChannelStore,
                    DiscordConstants: {
                        EmojiDisabledReasons,
                        EmojiIntention
                    }
                }
            } = Api;

            const Emojis = WebpackModules.findByUniqueProperties(['getDisambiguatedEmojiContext','search']);
            const EmojiParser = WebpackModules.findByUniqueProperties(['parse', 'parsePreprocessor', 'unparse']);
            const EmojiPicker = WebpackModules.findByUniqueProperties(['useEmojiSelectHandler']);
            const ExpressionPicker = WebpackModules.getModule(e => e.type?.displayName === "ExpressionPicker");
            const MessageUtilities = WebpackModules.getByProps("sendMessage");
            const EmojiFilter = WebpackModules.getByProps('getEmojiUnavailableReason');

            const disabledEmojiSelector = new DOMTools.Selector(WebpackModules.getByProps('emojiItemDisabled')?.emojiItemDisabled);
            const removeGrayscaleClass = `${config.info.name}--remove-grayscale`;

            return class Freemoji extends Plugin {
                removeGrayscaleCss = `
                .${removeGrayscaleClass} ${disabledEmojiSelector} {
                    filter: grayscale(0%);
                }
                `;
                currentUser = null;

                addStyles() {
                    PluginUtilities.addStyle(removeGrayscaleClass, this.removeGrayscaleCss);
                }

                replaceEmoji(text, emoji) {
                    const emojiString = `<${emoji.animated ? "a" : ""}:${emoji.originalName || emoji.name}:${emoji.id}>`;
                    const emojiURL = `${emoji.url}&size=${this.settings.size}`;
                    return text.replace(emojiString, emojiURL);
                }

                patch() {
                    // make emote pretend locked emoji are unlocked
                    Patcher.after(Emojis, 'search', (_, args, ret) => {
                        ret.unlocked = ret.unlocked.concat(ret.locked);
                        ret.locked.length = [];
                        return ret;
                    });

                    // replace emoji with links in messages
                    Patcher.after(EmojiParser, 'parse', (_, args, ret) => {
                        for(const emoji of ret.invalidEmojis) {
                            ret.content = this.replaceEmoji(ret.content, emoji);
                        }
                        if (this.settings.allowUnavailable) {
                            for(const emoji of ret.validNonShortcutEmojis) {
                                if (!emoji.available) {
                                    ret.content = this.replaceEmoji(ret.content, emoji);
                                }
                            }
                        }
                        if (this.settings.external) {
                            for(const emoji of ret.validNonShortcutEmojis) {
                                if (this.getEmojiUnavailableReason(emoji) === EmojiDisabledReasons.DISALLOW_EXTERNAL) {
                                    ret.content = this.replaceEmoji(ret.content, emoji);
                                }
                            }
                        }
                        return ret;
                    });

                    // override emoji picker to allow selecting emotes
                    Patcher.after(EmojiPicker, 'useEmojiSelectHandler', (_, args, ret) => {
                        const { onSelectEmoji, closePopout, selectedChannel } = args[0];
                        const self = this;

                        return function (data, state) {
                            if (state.toggleFavorite) return ret.apply(this, arguments);

                            const emoji = data.emoji;
                            const isFinalSelection = state.isFinalSelection;

                            if (self.getEmojiUnavailableReason(emoji, selectedChannel) === EmojiDisabledReasons.DISALLOW_EXTERNAL) {
                                if (self.settings.external == 'off') return;

                                if (self.settings.external == 'showDialog') {
                                    BdApi.showConfirmationModal(
                                        "Sending External Emoji",
                                        [`It looks like you are trying to send an an External Emoji in a server that would normally allow it. Do you still want to send it?`], {
                                        confirmText: "Send External Emoji",
                                        cancelText: "Cancel",
                                        onConfirm: () => {
                                            self.selectEmoji({emoji, isFinalSelection, onSelectEmoji, selectedChannel, closePopout, disabled: true});
                                        }
                                    });
                                    return;
                                }
                                self.selectEmoji({emoji, isFinalSelection, onSelectEmoji, closePopout, selectedChannel, disabled: true});

                            } else if (!emoji.available) {
                                if (self.settings.unavailable == 'off') return;

                                if (self.settings.external == 'showDialog') {
                                    BdApi.showConfirmationModal(
                                        "Sending Unavailable Emoji",
                                        [`It looks like you are trying to send an an Emoji that would normally even be unavailable to Nitro users. Do you still want to send it?`], {
                                        confirmText: "Send Unavailable Emoji",
                                        cancelText: "Cancel",
                                        onConfirm: () => {
                                            self.selectEmoji({emoji, isFinalSelection, onSelectEmoji, closePopout, selectedChannel, disabled: true});
                                        }
                                    });
                                    return;
                                }
                                self.selectEmoji({emoji, isFinalSelection, onSelectEmoji, closePopout, selectedChannel, disabled: true});

                            } else {

                                self.selectEmoji({emoji, isFinalSelection, onSelectEmoji, closePopout, selectedChannel, disabled: data.isDisabled});

                            }
                        }
                    });

                    // add remove grayscale class to expression picker
                    Patcher.after(ExpressionPicker, 'type', (_, args, ret) => {
                        if (this.settings.removeGrayscale=='never') return;
                        if (this.settings.removeGrayscale!='always' && !this.hasEmbedPerms()) return;
                        Utilities.getNestedProp(ret, "props.children.props").className += ` ${removeGrayscaleClass}`
                    });

                    Patcher.after(EmojiFilter, 'getEmojiUnavailableReason', (_, [{intention, bypassPatch}], ret) => {
                        if (intention!==EmojiIntention.CHAT || bypassPatch || !this.settings.external) return;
                        return ret===EmojiDisabledReasons.DISALLOW_EXTERNAL ? null : ret;
                    })
                }

                selectEmoji({emoji, isFinalSelection, onSelectEmoji, closePopout, selectedChannel, disabled}) {
                    if (disabled) {
                        const perms = this.hasEmbedPerms(selectedChannel);
                        if (!perms && this.settings.missingEmbedPerms == 'nothing') return;
                        if (!perms && this.settings.missingEmbedPerms == 'showDialog') {
                            BdApi.showConfirmationModal(
                                "Missing Image Embed Permissions",
                                [`It looks like you are trying to send an Emoji using Freemoji but you dont have the permissions to send embeded images in this channel. You can choose to send it anyway but it will only show as a link.`], {
                                confirmText: "Send Anyway",
                                cancelText: "Cancel",
                                onConfirm: () => {
                                    if (this.settings.sendDirectly) {
                                        MessageUtilities.sendMessage(selectedChannel.id, {content: `${emoji.url}&size=${this.settings.size}`});
                                    } else {
                                        onSelectEmoji(emoji, isFinalSelection);
                                    }
                                }
                            });
                            return;
                        }
                        if (this.settings.sendDirectly) {
                            MessageUtilities.sendMessage(SelectedChannelStore.getChannelId(), {content: `${emoji.url}&size=${this.settings.size}`});
                        } else {
                            onSelectEmoji(emoji, isFinalSelection);
                        }
                    } else {
                        onSelectEmoji(emoji, isFinalSelection);
                    }

                    if(isFinalSelection) closePopout();
                }

                getEmojiUnavailableReason(emoji, channel, intention) {
                    return EmojiFilter.getEmojiUnavailableReason({
                        channel: channel || ChannelStore.getChannel(SelectedChannelStore.getChannelId()),
                        emoji,
                        intention: EmojiIntention.CHAT || intention,
                        bypassPatch:true
                    })
                }

                hasEmbedPerms(channelParam) {
                    if (!this.currentUser) this.currentUser = UserStore.getCurrentUser();
                    const channel = channelParam || ChannelStore.getChannel(SelectedChannelStore.getChannelId());
                    if (!channel.guild_id) return true;
                    return Permissions.can(DiscordPermissions.EMBED_LINKS, channel, this.currentUser.id)
                }

                cleanup() {
                    Patcher.unpatchAll();
                    this.removeStyles();
                }

                removeStyles() {
                    PluginUtilities.removeStyle(removeGrayscaleClass);
                }

                onStart() {
                    try{
                        this.patch();
                        this.addStyles();
                    } catch (e) {
                        Toasts.error(`${config.info.name}: An error occured during intialiation: ${e}`);
                        Logger.error(`Error while patching: ${e}`);
                        console.error(e);
                    }
                }

                onStop() {
                    this.cleanup();
                }

                getSettingsPanel() {
                    const panel = this.buildSettingsPanel();
                    panel.addListener(() => {
                        this.removeStyles();
                        this.addStyles();
                    });
                    return panel.getElement();
                }
            };
        };
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
