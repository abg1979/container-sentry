# open-urls-in-container

open-urls-in-container is a [Firefox](https://www.mozilla.org/firefox/) extension to open any URL (not just those with a specific domain) in a multi-account container.

The extension consists of a [settings page](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Implement_a_settings_page) (`src/settings/`) built with [Vue.js](https://vuejs.org/), and a [background script]() (`src/background/`). The settings page allows users to define regex patterns that, when matched against a URL loaded in the browser, will open that URL in a specified container tab. The background script listens for update events in browser tabs and performs the regex matching and opening of container tabs.

Firefox's [Multi-Account Containers](https://support.mozilla.org/kb/containers) extension provides similar functionality out of the box, but only allows for matching URLs based on a domain. This extension allows for regex matching against the whole URL as opposed to exact matches based on domain.

## Installation

This extension can be installed at [addons.mozilla.org](https://addons.mozilla.org/firefox/addon/open-urls-in-container/).

## Contributing

### Prerequisites

Development on, or building of, this extension requires Firefox, [Node.js](https://nodejs.org) v16+, and [Yarn](https://yarnpkg.com/getting-started) or [npm](https://docs.npmjs.com/). Older versions of Node will probably work, they just haven't been tested.

### Development

To load the extension in a development instance of Firefox with automatic reloading enabled, run:

```
yarn install
yarn start
```

### Building

To build and package the extension for distribution, run:

```
yarn install
yarn build
```

This will run a webpack build an place output in `build/webpack/`, followed by packaging the extension using `web-ext` and placing output in `web-ext-artifacts/`.
