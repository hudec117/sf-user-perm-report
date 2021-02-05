<template>
    <b-container fluid>
        <b-row class="mt-3">
            <b-col sm="auto">
                <b-button variant="primary"
                          size="lg"
                          v-bind:disabled="!canRunReport"
                          @click="onRunReportClick">
                    {{ runReportText }}
                </b-button>
            </b-col>
            <b-col>
                <b-progress height="46px" :value="progress"></b-progress>
            </b-col>
        </b-row>
        <b-row class="mt-3">
            <b-col>
                <Table v-bind:summary="summary" />
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
                progress: 0,
                serverHost: '',
                user: {
                    id: '',
                    name: '',
                    profile: '',
                    permissionSets: []
                },
                sessionId: '',
                summary: { }
            };
        },
        computed: {
            canRunReport: function() {
                return this.state === 'ready';
            },
            runReportText: function() {
                if (this.state === 'loading') {
                    return 'Run Report for ...';
                } else if (this.state === 'ready') {
                    return `Run Report for ${this.user.name}`;
                } else if (this.state === 'processing') {
                    return `Running Report for ${this.user.name}`;
                }
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
                chrome.runtime.sendMessage({ operation: 'get-session', host: this.serverHost }, function(session) {
                    self.sessionId = session.id;

                    // Initialise Salesforce service
                    Vue.prototype.$salesforceService = new SalesforceService(self.serverHost, self.sessionId);

                    // Get information on user
                    self.initialiseUserInfo();
                });
            },
            initialiseUserInfo: async function() {
                // Get the users name and profile ID
                const userQuery = `SELECT FirstName, ProfileId FROM User WHERE Id = '${this.user.id}'`;
                const userRecords = await this.$salesforceService.query(userQuery);
                const userRecord = userRecords[0];

                this.user.name = userRecord['FirstName'];

                // Get the profile full name
                const profileId = userRecord['ProfileId'];
                const profileQuery = `SELECT FullName FROM Profile WHERE Id = '${profileId}'`;
                const profileRecords = await this.$salesforceService.query(profileQuery, true);

                this.user.profile = profileRecords[0]['FullName'];

                // Get user permission sets
                const permissionSetQuery = `SELECT PermissionSet.Name FROM PermissionSetAssignment WHERE AssigneeId = '${this.user.id}' AND PermissionSet.IsCustom = true`;
                const permissionSetRecords = await this.$salesforceService.query(permissionSetQuery);

                this.user.permissionSets = permissionSetRecords.map(record => record['PermissionSet']['Name']);

                this.state = 'ready';
            },
            onRunReportClick: async function() {
                this.state = 'processing';
                this.progress = 0;

                // Read profile and permission set metadata
                const profileMetadata = await this.$salesforceService.readMetadata('Profile', [this.user.profile])[0];
                this.progress = 33;
                const permissionSetMetadatas = await this.$salesforceService.readMetadata('PermissionSet', this.user.permissionSets);
                this.progress = 66;

                // Merge metadata into one data structure
                this.summary = SalesforcePermissionsService.merge(profileMetadata, permissionSetMetadatas);

                this.state = 'ready';
                this.progress = 100;
            }
        }
    };
</script>