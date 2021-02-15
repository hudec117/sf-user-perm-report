<template>
    <b-container fluid>
        <b-row>
            <b-col>
                <b-alert variant="warning" :show="alert !== ''" class="mb-0 mt-3">{{ alert }}</b-alert>
            </b-col>
        </b-row>
        <b-row class="mt-3">
            <b-col sm="auto" class="pr-0">
                <b-button variant="primary" size="lg" :disabled="!canRefreshReport" @click="onRefreshClick"  v-b-tooltip.hover.bottom title="Refresh">
                    <b-icon-arrow-clockwise class="mr-2" :animation="refreshIconAnimation"></b-icon-arrow-clockwise> {{ user.name }}
                </b-button>
            </b-col>
            <b-col sm="auto" class="pr-0">
                <b-button-group size="lg">
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
            <b-col>
                <b-input type="search"
                         size="lg"
                         :value="filter"
                         :disabled="!canRefreshReport"
                         placeholder="Search metadata..."
                         @search="onSearchUpdate">
                </b-input>
            </b-col>
        </b-row>
        <b-row class="mt-3">
            <b-col>
                <Table ref="table" :summary="summary" :filter="filter" />
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
    import Vue from 'vue';
    import Table from './Table.vue';

    import SalesforceService from './services/SalesforceService.js';
    import SalesforcePermissionsService from './services/SalesforcePermissionsService.js';

    export default {
        components: {
            Table
        },
        data() {
            return {
                state: 'loading',
                alert: '',
                progress: {
                    value: 0,
                    text: ''
                },
                serverHost: '',
                user: {
                    id: '',
                    name: ''
                },
                sessionId: '',
                filter: '',
                summary: { }
            };
        },
        computed: {
            canRefreshReport: function() {
                return this.state === 'ready';
            },
            refreshIconAnimation: function() {
                return this.state === 'loading' ? 'spin' : '';
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
                this.user.id = params.get('user');

                // Initialise session ID
                const self = this;
                chrome.runtime.sendMessage({ operation: 'get-session', host: this.serverHost }, async function(session) {
                    self.sessionId = session.id;

                    // Initialise Salesforce service
                    Vue.prototype.$salesforceService = new SalesforceService(self.serverHost, self.sessionId);

                    // Run the report
                    await self.runReport();
                });
            },
            runReport: async function() {
                this.state = 'loading';

                // Get the users name and profile ID
                const userQuery = `SELECT Username, ProfileId FROM User WHERE Id = '${this.user.id}'`;
                const userQueryResult = await this.$salesforceService.query(userQuery);
                if (!userQueryResult.success) {
                    this.alert = userQueryResult.error;
                    return;
                }

                const userRecord = userQueryResult.records[0];
                this.user.name = userRecord['Username'];

                // Get the profile full name
                const profileId = userRecord['ProfileId'];
                const profileQuery = `SELECT FullName FROM Profile WHERE Id = '${profileId}'`;
                const profileQueryResult = await this.$salesforceService.query(profileQuery, true);
                if (!profileQueryResult.success) {
                    this.alert = profileQueryResult.error;
                    return;
                }

                const profileName = profileQueryResult.records[0]['FullName'];

                // Get user permission sets
                const permissionSetQuery = `SELECT PermissionSet.Name FROM PermissionSetAssignment WHERE AssigneeId = '${this.user.id}' AND PermissionSet.IsCustom = true`;
                const permissionSetQueryResult = await this.$salesforceService.query(permissionSetQuery);
                if (!permissionSetQueryResult.success) {
                    this.alert = permissionSetQueryResult.error;
                    return;
                }

                const permissionSetNames = permissionSetQueryResult.records.map(record => record['PermissionSet']['Name']);

                // Read profile and permission set metadata
                const profileReadResult = await this.$salesforceService.readMetadata('Profile', [profileName]);
                if (!profileReadResult.success) {
                    this.alert = profileReadResult.error;
                    return;
                }

                const permissionSetsReadResult = await this.$salesforceService.readMetadata('PermissionSet', permissionSetNames);
                if (!permissionSetsReadResult.success) {
                    this.alert = permissionSetsReadResult.error;
                    return;
                }

                // Merge metadata into one data structure
                this.summary = SalesforcePermissionsService.merge(profileReadResult.records, permissionSetsReadResult.records);

                this.state = 'ready';
            },
            onRefreshClick: async function() {
                this.summary = { };

                await this.runReport();
            },
            onCollapseAllClick: function() {
                this.$refs.table.setTypeCollapse(true);
            },
            onExpandAllClick: function() {
                this.$refs.table.setTypeCollapse(false);
            },
            onSearchUpdate: function(event) {
                const newFilter = event.currentTarget.value;

                if (newFilter.trim() !== '') {
                    this.filter = newFilter;
                } else {
                    this.filter = '';
                }
            }
        }
    };
</script>