<template>
    <table>
        <thead>
        <tr>
            <th colspan="5">URL Pattern Mappings</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="url in urlContainerMappings" :key="url.id">
            <td>URL Pattern</td>
            <td><input type="text" v-model="url.pattern"/></td>
            <td>Container</td>
            <td>
                <select v-model="url.containerName">
                    <option v-for="container in contextualIdentities" :key="container.cookieStoreId" :value="container.name">
                        {{ container.name }}
                    </option>
                </select>
            </td>
            <td>
                <button @click="removeUrl(url.id)">Remove</button>
            </td>
        </tr>
        <tr>
            <td colspan="2" class="actions">
                <button @click="save">Save</button>
            </td>
            <td>&nbsp;</td>
            <td colspan="2" class="actions">
                <button @click="addUrlContainerMapping">Add Url</button>
            </td>
        </tr>
        </tbody>
    </table>
    <table>
        <thead>
        <tr>
            <th colspan="3">URL Container Exceptions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="url in urlExceptions" :key="url.id">
            <td>URL Pattern</td>
            <td><input type="text" v-model="url.pattern"/></td>
            <td>
                <button @click="removeUrl(url.id)">Remove</button>
            </td>
        </tr>
        <tr>
            <td class="actions">
                <button @click="save">Save</button>
            </td>
            <td>&nbsp;</td>
            <td class="actions">
                <button @click="addUrlException">Add Url</button>
            </td>
        </tr>
        </tbody>
    </table>
</template>

<script>
import {toRaw} from 'vue'
import {v4 as uuid} from 'uuid'

export default {
    data() {
        return {
            urlContainerMappings: [],
            urlExceptions: [],
            contextualIdentities: [],
        }
    },
    async mounted() {
        console.debug('Load storage:', await browser.storage.sync.get({urls: []}))
        const {urlContainerMappings, urlExceptions} = await browser.storage.sync.get({urlContainerMappings: [], urlExceptions: []})
        this.urlContainerMappings = urlContainerMappings
        this.urlExceptions = urlExceptions
        browser.storage.sync.onChanged.addListener(this.syncStorage)
        this.contextualIdentities = await browser.contextualIdentities.query({})
    },
    unmounted() {
        browser.storage.sync.onChanged.addListener(this.syncStorage)
    },
    methods: {
        addUrlContainerMapping() {
            this.urlContainerMappings.push({
                id: uuid(),
                pattern: '',
                // Use name as assumed unique container identifier, as this is how the Multi-Account
                // Containers extension handles uniqueness when syncing
                // See https://github.com/mozilla/multi-account-containers/blob/e5fa98d69e317b52b7ab107545f8ffdeb7b753a5/src/js/background/sync.js#L329
                containerName: this.contextualIdentities[0].name,
            })
        },
        addUrlException() {
            this.urlExceptions.push({
                id: uuid(),
                pattern: '',
            })
        },
        save() {
            console.debug('Save URLs:', toRaw(this.urlContainerMappings))
            console.debug('Save URLExceptions:', toRaw(this.urlExceptions))
            for (let i = this.urlContainerMappings.length - 1; i >= 0; i--) {
                if (this.urlContainerMappings[i].pattern === '') {
                    this.urlContainerMappings.splice(i, 1)
                }
            }
            for (let i = this.urlExceptions.length - 1; i >= 0; i--) {
                if (this.urlExceptions[i].pattern === '') {
                    this.urlExceptions.splice(i, 1)
                }
            }
            browser.storage.sync.set({
                urlContainerMappings: toRaw(this.urlContainerMappings),
                urlExceptions: toRaw(this.urlExceptions),
            })
        },
        syncStorage(changes) {
            console.debug('Storage updated:', changes)
            if (changes.urlContainerMappings) {
                this.urlContainerMappings = changes.urlContainerMappings.newValue
            }
            if (changes.urlExceptions) {
                this.urlExceptions = changes.urlExceptions.newValue
            }

        },
        removeUrl(id) {
            this.urlExceptions = this.urlExceptions.filter(url => url.id !== id)
            this.urlContainerMappings = this.urlContainerMappings.filter(url => url.id !== id)
        },
    },
}
</script>

<style lang="scss" scoped>
@media (prefers-color-scheme: light) {
    /* Table header background color */
    th {
        background-color: #f2f2f2;
    }
    /* Alternate row colors */
    tr:nth-child(even) {
        background-color: #f9f9f9;
    }
    /* Hover effect for rows */
    tr:hover {
        background-color: #f1f1f1;
    }
    th,
    td {
        border: 1px solid #ddd;
    }
}

/* TODO: Theese do not look good in dark mode */
@media (prefers-color-scheme: dark) {
    /* Table header background color */
    th {
        background-color: #333333;
    }
    /* Alternate row colors */
    tr:nth-child(even) {
        background-color: #222222;
    }
    /* Hover effect for rows */
    tr:hover {
        background-color: #444444;
    }
    th,
    td {
        border: 1px solid #888888;
    }
}

/* Table header styling */
th,
td {
    padding: 12px;
}

.row {
    display: flex;
    width: 100%;
}

/* Basic table styling */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 18px;
    text-align: left;
}


.actions {
    text-align: center;
}
</style>
