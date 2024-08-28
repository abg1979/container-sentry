;(async function () {

    /*
     * Ignore any pages which were assigned in Multi-Account Containers (MAC)
     */
    const MAC_ADDON_ID = '@testpilot-containers';

    let macAddonEnabled = await (async function () {
        try {
            const macAddonInfo = await browser.management.get(MAC_ADDON_ID);
            return true;
        } catch (e) {
            return false;
        }
    }());

    const onMACAddonEnabledChange = enabled => info => {
        if (info.id !== MAC_ADDON_ID) return;
        macAddonEnabled = enabled;
    };
    browser.management.onInstalled.addListener(onMACAddonEnabledChange(true));
    browser.management.onEnabled.addListener(onMACAddonEnabledChange(true));
    browser.management.onUninstalled.addListener(onMACAddonEnabledChange(false));
    browser.management.onDisabled.addListener(onMACAddonEnabledChange(false));

    const isMACAssigned = async function (url) {
        if (!macAddonEnabled) return false;

        try {
            const assignment = await browser.runtime.sendMessage(MAC_ADDON_ID, {
                method: 'getAssignment',
                url,
            });
            return Boolean(assignment);
        } catch (e) {
            return false;
        }
    };

    const hasURLException = async function (url) {
        // return true if multi account container is disabled
        if (!macAddonEnabled) return true;

        try {
            console.debug("Fetching URL exceptions: ", url);
            const {urlContainerMappings, urlExceptions} = await browser.storage.sync.get({urlContainerMappings: [], urlExceptions: []})
            console.debug("Loaded exceptions : ", urlExceptions);
            const urlsMatched = urlExceptions.reduce((matches, current) => {
                if (url.match(current.pattern)) {
                    matches.push(current)
                }
                return matches
            }, [])
            console.debug("Following urls matched...", url, urlsMatched);
            return urlsMatched.length > 0;
        } catch (e) {
            return false;
        }
    };

    const doURLContainerMatchSwitch = async function (url, currentTab) {
        // return true if multi account container is disabled
        if (!macAddonEnabled) return false;

        try {
            console.debug("Fetching URL container mappings", url);
            const {urlContainerMappings, urlExceptions} = await browser.storage.sync.get({urlContainerMappings: [], urlExceptions: []})
            console.debug("Loaded url container mappings", urlContainerMappings);
            const urlsMatched = urlContainerMappings.reduce((matches, current) => {
                if (url.match(current.pattern)) {
                    matches.push(current)
                }
                return matches
            }, [])
            console.debug("Following urls matched...", url, urlsMatched);
            // if there are multiple matches, we will use the first one
            let containerName = urlsMatched.length > 0 ? urlsMatched[0].containerName : null;
            if (!containerName) {
                console.debug("No container assigned for URL: ", url);
                return false;
            }
            console.debug("URL has a container assigned... Trying to switch to it: ", url, containerName);
            const container = await browser.contextualIdentities.query({
                name: containerName,
            });
            if (container.length === 0) {
                console.debug("Container not found... Skipping switch: ", url, containerName);
                return false;
            }
            const cookieStoreId = container[0].cookieStoreId;
            if (cookieStoreId && typeof cookieStoreId === 'string') {
                console.debug(`Replacing tab. cookieStoreId was '${cookieStoreId}'.`);
                const { active, index, windowId } = currentTab;
                browser.tabs.create({ url: url + '', active, cookieStoreId, index, windowId });
                console.debug(`Successfully replaced tab. cookieStoreId was '${cookieStoreId}'.`);
                console.debug(`Removing current tab. Tab ID was '${currentTab.id}'.`);
                browser.tabs.remove(currentTab.id);
                console.debug(`Successfully removed current tab. Tab Id was '${currentTab.id}'.`);
                return true;
            }
            console.debug(`Not replacing tab. cookieStoreId was '${cookieStoreId}'.`);
            return false;
        } catch (e) {
            console.debug("Not replacing tab. error was:", e);
            return false;
        }
    };

    /*
     * Check such pages and ask user to choose a container
     */
    /** @type {Map<number, { requestIds: Set<string>, urls: Set<string> }>} */
    const canceledRequests = new Map();

    const cleanCancelledRequest = tabId => {
        if (canceledRequests.has(tabId)) {
            canceledRequests.delete(tabId);
        }
    };
    browser.webRequest.onCompleted.addListener(options => {
        cleanCancelledRequest(options.tabId);
    }, {urls: ['<all_urls>'], types: ['main_frame']});

    browser.webRequest.onErrorOccurred.addListener(options => {
        cleanCancelledRequest(options.tabId);
    }, {urls: ['<all_urls>'], types: ['main_frame']});

    const shouldCancelEarly = function (tab, request) {
        const tabId = tab.id;
        const {requestId, url} = request;
        if (!canceledRequests.has(tabId)) {
            canceledRequests.set(tabId, {
                requestIds: new Set([requestId]),
                urls: new Set([url]),
            });
            setTimeout(() => {
                canceledRequests.delete(tabId);
            }, 2000);
            return false;
        }
        const tabInfo = canceledRequests.get(tabId);
        const shouldCancel = tabInfo.requestIds.has(requestId) || tabInfo.urls.has(url);
        tabInfo.requestIds.add(requestId);
        tabInfo.urls.add(url);
        return shouldCancel;
    };

    browser.webRequest.onBeforeRequest.addListener(async function containTab(request) {
        console.debug("Received request for: ", request.url);
        const tab = await browser.tabs.get(request.tabId);

        if (request.tabId === -1) return void 0;
        if (tab.incognito) return void 0;

        try {
            console.debug("Checking already contained: ", request.url);
            await browser.contextualIdentities.get(tab.cookieStoreId);
            console.debug("Already contained... Returning: ", request.url);
            return void 0;
        } catch (e) {
            /* we are not contained yet */
        }

        console.debug("Checking if MAC is enabled: ", request.url);
        if (await isMACAssigned(request.url)) {
            console.debug("MAC is disabled... Not doing anything: ", request.url);
            return void 0;
        }
        console.debug("MAC is enabled... Continuing: ", request.url);
        console.debug("Checking if URL has exception: ", request.url);
        if (await hasURLException(request.url)) {
            console.debug("URL has exception... Not doing anything: ", request.url);
            return void 0;
        }
        console.debug("URL does not have exception... Continuing: ", request.url);

        if (request && shouldCancelEarly(tab, request)) {
            return {cancel: true};
        }

        // check if url has a container assigned
        console.debug("Checking if URL has container assigned: ", request.url);
        if (await doURLContainerMatchSwitch(request.url, tab)) {
            console.debug("URL has container assigned... Switched: ", request.url);
            return {cancel: true};
        }

        console.debug("Building container chooser UI: ", request.url);
        const choseUrl = new URL(browser.runtime.getURL('/togo/index.html'));
        choseUrl.searchParams.set('go', request.url);
        await browser.tabs.create({
            url: choseUrl + '',
            active: tab.active,
            index: tab.index,
            windowId: tab.windowId,
        });
        browser.tabs.remove(tab.id);

        return {cancel: true};

    }, {urls: ['<all_urls>'], types: ['main_frame']}, ['blocking']);

}());
