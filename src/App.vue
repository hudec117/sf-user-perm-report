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
                        <b-button variant="secondary" :disabled="!canRefreshReport" @click="filter = ''">
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
                    name: '',
                    profile: '',
                    permissionSets: []
                },
                sessionId: '',
                filter: '',
                summary: { }
            };
        },
        computed: {
            canRefreshReport: function() {
                return this.state === 'ready';
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

                    // Get information on user
                    await self.initialiseUserInfo();

                    // Run the report
                    await self.runReport();
                });
            },
            initialiseUserInfo: async function() {
                this.progress.value = 20;
                this.progress.text = 'Getting user info...';

                // Get the users name and profile ID
                const userQuery = `SELECT Username, ProfileId FROM User WHERE Id = '${this.user.id}'`;
                const userRecords = await this.$salesforceService.query(userQuery);
                const userRecord = userRecords[0];

                this.user.name = userRecord['Username'];

                // Get the profile full name
                const profileId = userRecord['ProfileId'];
                const profileQuery = `SELECT FullName FROM Profile WHERE Id = '${profileId}'`;
                const profileRecords = await this.$salesforceService.query(profileQuery, true);

                this.user.profile = profileRecords[0]['FullName'];

                // Get user permission sets
                const permissionSetQuery = `SELECT PermissionSet.Name FROM PermissionSetAssignment WHERE AssigneeId = '${this.user.id}' AND PermissionSet.IsCustom = true`;
                const permissionSetRecords = await this.$salesforceService.query(permissionSetQuery);

                this.user.permissionSets = permissionSetRecords.map(record => record['PermissionSet']['Name']);
            },
            runReport: async function() {
                this.state = 'processing';

                // Read profile and permission set metadata
                this.progress.value = 40;
                this.progress.text = 'Reading profile...';
                const profileMetadatas = await this.$salesforceService.readMetadata('Profile', [this.user.profile]);
                this.progress.text = 'Reading permission sets...';
                this.progress.value = 60;
                const permissionSetMetadatas = await this.$salesforceService.readMetadata('PermissionSet', this.user.permissionSets);

                // Merge metadata into one data structure
                this.progress.text = 'Merging profile & permission sets...';
                this.progress.value = 80;
                this.summary = SalesforcePermissionsService.merge(profileMetadatas, permissionSetMetadatas);

                this.progress.text = 'Done!';
                this.state = 'ready';
                this.progress.value = 100;
            },
            onRefreshClick: function() {
                this.runReport();
            },
            onFilterUpdate: function(newFilter) {
                this.filter = newFilter;
            }
        }
    };
</script>