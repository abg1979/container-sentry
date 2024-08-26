<template>
	<div class="row" v-for="url in urls" :key="url.id">
		<div class="col">
			<label>URL pattern: <input type="text" v-model="url.pattern" /></label>
		</div>
		<div class="col">
			<label
				>Container:
				<select v-model="url.containerName">
					<option
						v-for="container in contextualIdentities"
						:key="container.cookieStoreId"
						:value="container.name"
					>
						{{ container.name }}
					</option>
				</select></label
			>
		</div>
	</div>
	<div class="row">
		<button @click="save">Save</button>
		<button @click="addUrl">+</button>
	</div>
</template>

<script>
import { toRaw } from 'vue'
import { v4 as uuid } from 'uuid'

export default {
	data() {
		return {
			urls: [],
			contextualIdentities: [],
			preferences: {},
		}
	},
	async mounted() {
		console.debug('Load storage:', await browser.storage.sync.get({ urls: [] }))
		const { urls, preferences } = await browser.storage.sync.get({ urls: [], preferences: {} })
		this.urls = urls
		this.preferences = preferences
		browser.storage.sync.onChanged.addListener(this.syncStorage)
		this.contextualIdentities = await browser.contextualIdentities.query({})
	},
	unmounted() {
		browser.storage.sync.onChanged.addListener(this.syncStorage)
	},
	methods: {
		addUrl() {
			this.urls.push({
				id: uuid(),
				pattern: '',
				// Use name as assumed unique container identifier, as this is how the Multi-Account
				// Containers extension handles uniqueness when syncing
				// See https://github.com/mozilla/multi-account-containers/blob/e5fa98d69e317b52b7ab107545f8ffdeb7b753a5/src/js/background/sync.js#L329
				containerName: this.contextualIdentities[0].name,
			})
		},
		save() {
			console.debug('Save URLs:', toRaw(this.urls))
			console.debug('Save Preferences:', toRaw(this.preferences))
			// TODO: If any URL patterns are empty, remove them
			browser.storage.sync.set({
				urls: toRaw(this.urls),
				preferences: toRaw(this.preferences),
			})
		},
		syncStorage(changes) {
			console.debug('Storage updated:', changes)
			if (changes.urls) {
				this.urls = changes.urls.newValue
			}
			if (changes.preferences) {
				this.preferences = changes.preferences.newValue
			}
		},
		// TODO: add function to remove urls
	},
}
</script>

<style lang="scss" scoped>
.row {
	display: flex;
	width: 100%;
}
</style>
