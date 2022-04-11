<template>
    <b-container fluid>
        <b-row>
            <b-col>
                <b-alert variant="warning" :show="page.alert !== ''" class="mb-0 mt-3">{{ page.alert }}</b-alert>
            </b-col>
        </b-row>
        <b-row class="mt-3">
            <b-col sm="auto" class="pr-0">
                <b-button variant="primary" @click="onOpenUserClick" v-b-tooltip.hover.bottom title="Open user detail in a new tab">
                    <b-icon-person></b-icon-person> Open user
                </b-button>
            </b-col>
            <b-col sm="auto" class="pr-0">
                <b-button variant="primary" :disabled="!canRefreshReport" @click="onRefreshClick" v-b-tooltip.hover.bottom :title="page.state === 'loading' ? 'This may take a while!' : 'Refresh'">
                    <b-icon-arrow-clockwise class="mr-2" :animation="refreshIconAnimation"></b-icon-arrow-clockwise> {{ page.state === 'loading' ? page.progress : user.name }}
                </b-button>
            </b-col>
            <b-col sm="auto" class="pr-0">
                <b-button-group>
                    <b-button variant="secondary"
                              :disabled="!canRefreshReport"
                              @click="onExpandAllClick"
                              v-b-tooltip.hover.bottom
                              title="Expand All"
                              class="mr-1">
                        <b-icon-plus></b-icon-plus>
                    </b-button>
                    <b-button variant="secondary"
                              :disabled="!canRefreshReport"
                              @click="onCollapseAllClick"
                              v-b-tooltip.hover.bottom
                              title="Collapse All">
                        <b-icon-dash></b-icon-dash>
                    </b-button>
                </b-button-group>
            </b-col>
            <b-col sm="auto" class="pr-0">
                <b-form-checkbox name="check-button" v-model="tableOptions.managed" :disabled="!canRefreshReport" button>
                    {{ tableOptions.managed ? 'Hide' : 'Show' }} managed metadata
                </b-form-checkbox>
            </b-col>
            <b-col>
                <b-input type="search"
                         :value="tableOptions.search"
                         :disabled="!canRefreshReport"
                         placeholder="Search metadata..."
                         @search="onSearchUpdate">
                </b-input>
            </b-col>
        </b-row>
        <b-row class="mt-3">
            <b-col>
                <Table ref="table" :tree="tree" :options="tableOptions"></Table>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
    import Vue from 'vue';
    import Table from './components/Table.vue';

    import SalesforcePermissionsService from './services/SalesforcePermissionsService.js';

    export default {
        components: {
            Table
        },
        data() {
            return {
                page: {
                    state: 'loading',
                    progress: '',
                    alert: ''
                },
                serverHost: '',
                openUserInLex: false,
                user: {
                    id: '',
                    name: ''
                },
                tableOptions: {
                    search: '',
                    managed: false,
                    managedPrefixes: [],
                    permissionSetNames: []
                },
                tree: { }
            };
        },
        computed: {
            canRefreshReport: function() {
                return this.page.state === 'ready';
            },
            refreshIconAnimation: function() {
                return this.page.state === 'loading' ? 'spin' : '';
            }
        },
        mounted: function() {
            this.initialise();
        },
        methods: {
            initialise: function() {
                // Initialise server host and user ID from URL
                const params = new URLSearchParams(window.location.search);
                this.serverHost = params.get('host');
                if (!this.serverHost) {
                    this.page.alert = 'Missing server host, please launch the report from a user record.';
                    return;
                }

                this.user.id = params.get('user');
                if (!this.user.id) {
                    this.page.alert = 'Missing user ID, please launch the report from a user record.';
                    return;
                }

                // Initialise session ID
                const self = this;
                chrome.runtime.sendMessage({ operation: 'get-session', host: this.serverHost }, async function(session) {
                    if (!session.id) {
                        self.alert = 'Missing session ID, your sesion may have expired or you\'ve been logged out. Log back in and refresh.';
                        return;
                    }

                    // Initialise Salesforce service
                    Vue.prototype.$salesforceService = new SalesforcePermissionsService(self.serverHost, session.id);

                    self.page.progress = 'Getting session user info...';

                    // Get user info from session
                    const sessionUserInfo = await self.$salesforceService.getUserInfo();
                    const sessionUserQuery = `SELECT UserPreferencesLightningExperiencePreferred FROM User WHERE Id = '${sessionUserInfo.userId}'`;
                    const sessionUserQueryResult = await self.$salesforceService.query(sessionUserQuery);
                    if (!sessionUserQueryResult.success) {
                        self.page.alert = sessionUserQueryResult.error;
                        return;
                    }

                    self.openUserInLex = sessionUserQueryResult.records[0]['UserPreferencesLightningExperiencePreferred'];

                    // Run the report
                    await self.runReport();
                });
            },
            runReport: async function() {
                this.page.state = 'loading';
                this.page.progress = 'Querying user info...';

                // Get the users name and profile ID
                const userQuery = `SELECT Username, ProfileId FROM User WHERE Id = '${this.user.id}'`;
                const userQueryResult = await this.$salesforceService.query(userQuery);
                if (!userQueryResult.success) {
                    this.page.alert = userQueryResult.error;
                    return;
                }

                const userRecord = userQueryResult.records[0];
                this.user.name = userRecord['Username'];
                document.title = this.user.name;

                // Get the profile full name
                const profileId = userRecord['ProfileId'];
                const profileResult = await this.$salesforceService.getProfileName(profileId);
                if (!profileResult.success) {
                    this.page.alert = profileResult.error;
                    return;
                }

                // Get the permission set full names
                const permissionSetResult = await this.$salesforceService.getPermissionSetNames(this.user.id);
                if (!permissionSetResult.success) {
                    this.page.alert = permissionSetResult.error;
                    return;
                }

                this.tableOptions.permissionSetNames = [profileResult.name].concat(permissionSetResult.names);

                // Get managed package namespace prefixes
                const namespacePrefixResult = await this.$salesforceService.getManagedPrefixes();
                if (!namespacePrefixResult.success) {
                    this.page.alert = namespacePrefixResult.error;
                    return;
                }

                this.tableOptions.managedPrefixes = namespacePrefixResult.prefixes;

                this.page.progress = 'Reading profile...';

                // Read profile and permission set metadata
                const profileReadResult = await this.$salesforceService.readMetadata('Profile', [profileResult.name]);
                if (!profileReadResult.success) {
                    this.page.alert = profileReadResult.error;
                    return;
                }

                const permissionSetsReadResult = await this.$salesforceService.readMetadata('PermissionSet', permissionSetResult.names, (metadataRead) => {
                    this.page.progress = `Reading permission sets... (${metadataRead}/${permissionSetResult.names.length})`;
                });
                if (!permissionSetsReadResult.success) {
                    this.page.alert = permissionSetsReadResult.error;
                    return;
                }

                this.page.progress = 'Merging...';

                try {
                    // Merge metadata into one data structure
                    this.tree = this.$salesforceService.merge(profileReadResult.records, permissionSetsReadResult.records);

                    this.page.state = 'ready';
                } catch (error) {
                    this.page.alert = `${error.message} See console for details.`;
                    console.error(error);
                }
            },
            onOpenUserClick: function() {
                let userRelUrl = `/${this.user.id}?noredirect=1&isUserEntityOverride=1`;

                if (this.openUserInLex) {
                    userRelUrl = '/lightning/setup/ManageUsers/page?address=' + encodeURIComponent(userRelUrl);
                }

                window.open(`https://${this.serverHost}${userRelUrl}`);
            },
            onRefreshClick: async function() {
                this.tree = { };

                await this.runReport();
            },
            onCollapseAllClick: function() {
                this.$refs.table.setTypeCollapse(true);
            },
            onExpandAllClick: function() {
                this.$refs.table.setTypeCollapse(false);
            },
            onSearchUpdate: function(event) {
                const newSearch = event.currentTarget.value;

                if (newSearch.trim() !== '') {
                    this.tableOptions.search = newSearch;
                } else {
                    this.tableOptions.search = '';
                }
            }
        }
    };
</script>