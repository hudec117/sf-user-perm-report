<template>
    <div class="container-fluid mt-3">
        <div class="row">
            <div class="col-auto">
                <button type="button"
                        class="btn btn-lg btn-primary"
                        v-on:click="onRunReportClick"
                        v-bind:disabled="!ready">Run Report for {{ user.name ? user.name : '...' }}</button>
            </div>
            <div class="col">
                <div class="progress">
                    <div class="progress-bar" role="progressbar" style="width: 50%;"></div>
                </div>
            </div>
        </div>
        <div class="row">

        </div>
    </div>
</template>

<script>
    import Vue from 'vue';

    import SalesforceService from './services/SalesforceService.js';

    export default {
        data() {
            return {
                state: 'loading',
                serverHost: '',
                user: {
                    id: '',
                    name: '',
                    profile: '',
                    permissionSets: []
                },
                sessionId: ''
            };
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

                this.ready = 'ready';
            },
            onRunReportClick: async function() {
                // Read profile and permission set metadata

                // Merge metadata into one data structure
            }
        }
    };
</script>

<style>
.progress {
    height: 44px;
}
</style>