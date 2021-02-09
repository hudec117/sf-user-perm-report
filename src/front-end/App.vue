<template>
    <b-container fluid>
        <b-row class="mt-3">
            <b-col sm="auto" class="pr-0">
                <b-button variant="primary" size="lg" :disabled="!canRefreshReport" @click="onRefreshClick" title="Refresh">
                    <b-icon-arrow-clockwise class="mr-2"></b-icon-arrow-clockwise> {{ user.name }}
                </b-button>
            </b-col>
            <b-col sm="3" class="pr-0">
                <b-input-group>
                    <b-input type="text"
                             size="lg"
                             v-bind:value="filter"
                             :disabled="!canRefreshReport"
                             placeholder="Filter..."
                             v-debounce="onFilterUpdate">
                    </b-input>
                    <b-input-group-append>
                        <b-button variant="secondary" :disabled="!canClearFilter" @click="filter = ''">
                            <b-icon-x-circle></b-icon-x-circle>
                        </b-button>
                    </b-input-group-append>
                </b-input-group>
            </b-col>
            <b-col>
                <b-progress height="46px">
                    <b-progress-bar :value="progress.value">
                        <h5 class="mt-1">{{ progress.text }}</h5>
                    </b-progress-bar>
                </b-progress>
            </b-col>
        </b-row>
        <b-row class="mt-3">
            <b-col>
                <Table :summary="summary" :filter="filter" />
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
            canClearFilter: function() {
                return this.canRefreshReport && this.filter;
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

                this.progress.value = 20;
                this.progress.text = 'Getting user info...';

                // Get the users name and profile ID
                const userQuery = `SELECT Username, ProfileId FROM User WHERE Id = '${this.user.id}'`;
                const userQueryResult = await this.$salesforceService.query(userQuery);
                if (!userQueryResult.success) {
                    console.error(userQueryResult.error);
                    return;
                }

                const userRecord = userQueryResult.records[0];
                this.user.name = userRecord['Username'];

                // Get the profile full name
                const profileId = userRecord['ProfileId'];
                const profileQuery = `SELECT FullName FROM Profile WHERE Id = '${profileId}'`;
                const profileQueryResult = await this.$salesforceService.query(profileQuery, true);
                if (!profileQueryResult.success) {
                    console.error(profileQueryResult.error);
                    return;
                }

                const profileName = profileQueryResult.records[0]['FullName'];

                // Get user permission sets
                const permissionSetQuery = `SELECT PermissionSet.Name FROM PermissionSetAssignment WHERE AssigneeId = '${this.user.id}' AND PermissionSet.IsCustom = true`;
                const permissionSetQueryResult = await this.$salesforceService.query(permissionSetQuery);
                if (!permissionSetQueryResult.success) {
                    console.error(permissionSetQueryResult.error);
                    return;
                }

                const permissionSetNames = permissionSetQueryResult.records.map(record => record['PermissionSet']['Name']);

                this.state = 'processing';

                // Read profile and permission set metadata
                this.progress.value = 40;
                this.progress.text = 'Reading profile...';
                const profileReadResult = await this.$salesforceService.readMetadata('Profile', [profileName]);
                if (!profileReadResult.success) {
                    console.error(profileReadResult.error);
                    return;
                }

                this.progress.text = 'Reading permission sets...';
                this.progress.value = 60;
                const permissionSetsReadResult = await this.$salesforceService.readMetadata('PermissionSet', permissionSetNames);
                if (!permissionSetsReadResult.success) {
                    console.error(profileReadResult.error);
                    return;
                }

                // Merge metadata into one data structure
                this.progress.text = 'Merging profile & permission sets...';
                this.progress.value = 80;
                this.summary = SalesforcePermissionsService.merge(profileReadResult.records, permissionSetsReadResult.records);

                this.progress.text = 'Done!';
                this.progress.value = 100;
                this.state = 'ready';
            },
            onRefreshClick: async function() {
                this.summary = { };

                await this.runReport();
            },
            onFilterUpdate: function(newFilter) {
                if (newFilter.trim() !== '') {
                    this.filter = newFilter;
                } else {
                    this.filter = '';
                }
            }
        }
    };
</script>