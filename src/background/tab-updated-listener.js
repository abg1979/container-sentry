browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	if (changeInfo.status == 'loading') {
		const {
			urls: regexMap,
			preferences: { closeExistingTab },
		} = await browser.storage.sync.get({ urls: [], preferences: {} })

		const url = tab.url

		const urlsMatched = regexMap.reduce((matches, current) => {
			if (url.match(current.pattern)) {
				matches.push(current)
			}
			return matches
		}, [])

		if (
			urlsMatched.length > 0 &&
			tab.cookieStoreId === 'firefox-default' &&
			tab.active === true
		) {
			console.debug('URLs matched:', urlsMatched)
			const firstMatch = urlsMatched[0]
			// Use name as assumed unique container identifier, as this is how the Multi-Account
			// Containers extension handles uniqueness when syncing
			// See https://github.com/mozilla/multi-account-containers/blob/e5fa98d69e317b52b7ab107545f8ffdeb7b753a5/src/js/background/sync.js#L329
			const container = await browser.contextualIdentities.query({
				name: firstMatch.containerName,
			})
			const cookieStoreId = container[0].cookieStoreId

			if (cookieStoreId && typeof cookieStoreId === 'string') {
				browser.tabs.remove(tab.id)
				browser.tabs.create({
					url,
					cookieStoreId,
				})
			} else {
				console.debug(`Not replacing tab. cookieStoreId was '${cookieStoreId}'.`)
			}
		}
	}
})
