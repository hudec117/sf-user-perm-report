<template>
    <b-container fluid>
        <div class="p-3 fixed-top bg-dark border-bottom border-secondary">
            <b-row>
                <b-col>
                    <b-alert variant="danger" :show="page.fault !== ''">
                        <template v-if="page.fault === 'sf:INVALID_SESSION_ID'">Your session has timed out. <a target="_blank" :href="'https://' + serverHost">Login to Salesforce</a> and refresh.</template>
                        <template v-else>{{ alertMessageLookup[page.fault] }}</template>
                    </b-alert>
                </b-col>
            </b-row>
            <b-row>
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
                    <b-form-checkbox name="check-button" v-model="tableOptions.managed" :disabled="!canToggleManagedMetadata" button>
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
        </div>
        <b-row class="table-row">
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
                alertMessageLookup: {
                    'supr:MISSING_SERVER_HOST': 'Missing server host, please launch the report from a user record.',
                    'supr:MISSING_USER_ID': 'Missing user ID, please launch the report from a user record.',
                    'supr:MISSING_PERMS': 'Missing system permissions to generate report, make sure you have at least the Download AppExchange Packages permission. This is required to query the managed packages you have installed to support toggling between unmanaged and managed metadata.',
                    'supr:FAILED_MERGE': 'Failed to merge, see console for details.'
                },
                page: {
                    state: 'loading',
                    progress: '',
                    fault: ''
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
            canToggleManagedMetadata: function() {
                return this.canRefreshReport && this.tableOptions.managedPrefixes.length > 0;
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
                    this.page.fault = 'supr:MISSING_SERVER_HOST';
                    return;
                }

                this.user.id = params.get('user');
                if (!this.user.id) {
                    this.page.fault = 'supr:MISSING_USER_ID';
                    return;
                }

                // Initialise session ID
                const self = this;
                chrome.runtime.sendMessage({ operation: 'get-session', host: this.serverHost }, async function(session) {
                    if (!session.id) {
                        self.page.fault = 'sf:INVALID_SESSION_ID';
                        return;
                    }

                    // Initialise Salesforce service
                    Vue.prototype.$salesforceService = new SalesforcePermissionsService(self.serverHost, session.id);

                    if (await self.sessionUserHasPermissions()) {
                        await self.runReport();
                    } else {
                        self.page.fault = 'supr:MISSING_PERMS';
                    }
                });
            },
            sessionUserHasPermissions: async function() {
                this.page.progress = 'Getting session user info...';

                // Get user info from session
                const getSessionUserInfoResult = await this.$salesforceService.getUserInfo();
                if (!getSessionUserInfoResult.success) {
                    this.alertErrorResult(getSessionUserInfoResult);
                    return false;
                }

                this.page.progress = 'Checking session user permissions...';

                // Get User LEX/Classic preference and Download AppExchange Packages system permission.
                const sessionUserId = getSessionUserInfoResult.userInfo.userId;
                const sessionUserQuery = `SELECT UserPreferencesLightningExperiencePreferred, Profile.PermissionsInstallMultiforce FROM User WHERE Id = '${sessionUserId}'`;
                const sessionUserQueryResult = await this.$salesforceService.query(sessionUserQuery);
                if (!sessionUserQueryResult.success) {
                    this.alertErrorResult(sessionUserQueryResult);
                    return false;
                }

                const userRecord = sessionUserQueryResult.records[0];

                this.openUserInLex = userRecord['UserPreferencesLightningExperiencePreferred'];

                // If the profile allow's the user to install AppExchange packages we don't need to check permission sets.
                const canInstallExchangePackages = userRecord['Profile']['PermissionsInstallMultiforce'];
                if (canInstallExchangePackages) {
                    return true;
                } else {
                    // Check if any of the user's permission sets allow the user to install AppExchange packages.
                    const sessionUserPermissionSetQuery = `SELECT PermissionSet.PermissionsInstallPackaging FROM PermissionSetAssignment WHERE AssigneeId = '${sessionUserId}'`;
                    const sessionUserPermissionSetQueryResult = await this.$salesforceService.query(sessionUserPermissionSetQuery);
                    if (!sessionUserPermissionSetQueryResult.success) {
                        this.alertErrorResult(sessionUserPermissionSetQueryResult);
                        return false;
                    }

                    return sessionUserPermissionSetQueryResult.records.filter(record => record['PermissionSet']['PermissionsInstallPackaging'] === true).length > 0;
                }
            },
            runReport: async function() {
                this.page.state = 'loading';
                this.page.progress = 'Querying user info...';

                // Get the users name and profile ID
                const userQuery = `SELECT Username, ProfileId FROM User WHERE Id = '${this.user.id}'`;
                const userQueryResult = await this.$salesforceService.query(userQuery);
                if (!userQueryResult.success) {
                    this.alertErrorResult(userQueryResult);
                    return;
                }

                const userRecord = userQueryResult.records[0];
                this.user.name = userRecord['Username'];
                document.title = `Loading: ${this.user.name}`;

                // Get the profile full name
                const profileId = userRecord['ProfileId'];
                const profileResult = await this.$salesforceService.getProfileName(profileId);
                if (!profileResult.success) {
                    this.alertErrorResult(profileResult);
                    return;
                }

                // Get the permission set full names
                const permissionSetResult = await this.$salesforceService.getPermissionSetNames(this.user.id);
                if (!permissionSetResult.success) {
                    this.alertErrorResult(permissionSetResult);
                    return;
                }

                this.tableOptions.permissionSetNames = [profileResult.name].concat(permissionSetResult.names);

                // Get managed package namespace prefixes
                const namespacePrefixResult = await this.$salesforceService.getManagedPrefixes();
                if (!namespacePrefixResult.success) {
                    this.alertErrorResult(namespacePrefixResult);
                    return;
                }

                this.tableOptions.managedPrefixes = namespacePrefixResult.prefixes;

                this.page.progress = 'Reading profile...';

                // Read profile and permission set metadata
                const profileReadResult = await this.$salesforceService.readMetadata('Profile', [profileResult.name]);
                if (!profileReadResult.success) {
                    this.alertErrorResult(profileReadResult);
                    return;
                }

                const permissionSetsReadResult = await this.$salesforceService.readMetadata('PermissionSet', permissionSetResult.names, (metadataRead) => {
                    this.page.progress = `Reading permission sets... (${metadataRead}/${permissionSetResult.names.length})`;
                });
                if (!permissionSetsReadResult.success) {
                    this.alertErrorResult(permissionSetsReadResult);
                    return;
                }

                this.page.progress = 'Merging...';

                try {
                    // Merge metadata into one data structure
                    this.tree = this.$salesforceService.merge(profileReadResult.records, permissionSetsReadResult.records);

                    this.page.state = 'ready';
                    document.title = `Ready: ${this.user.name}`;
                } catch (error) {
                    this.page.fault = 'supr:FAILED_MERGE';
                    console.error(error);
                }
            },
            alertErrorResult: function(result) {
                this.page.fault = result.faultCode;
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

<style>
    .table-row {
        margin-top: 5.5rem;
    }
</style>