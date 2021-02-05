<template>
    <div>
        <table class="table table-bordered table-sm">
            <tbody v-for="(permissionType, permissionTypeName) of summary" :key="permissionTypeName">
                <tr>
                    <td>
                        <b-button variant="link"
                                class="p-0"
                                @click="onCollapseClick(permissionTypeName)">
                            <b-icon-chevron-right v-if="collapseLookup[permissionTypeName]"></b-icon-chevron-right>
                            <b-icon-chevron-down v-else></b-icon-chevron-down>
                        </b-button>
                        {{ permissionTypeName | metadataNodeNameToLabel }}
                    </td>
                </tr>
                <div v-if="!collapseLookup[permissionTypeName]">
                    <tr v-for="(item, itemName) of permissionType" :key="itemName">
                        <td>{{ itemName }}</td>
                        <td v-for="(permission, permissionName) of item" :key="permissionName">
                            <b-button variant="link" class="p-0" @click="onPermissionClick(permission)">
                                {{ permissionName | toSentenceCase }}
                            </b-button>
                        </td>
                    </tr>
                </div>
            </tbody>
        </table>
        <b-modal id="permission-modal" title="Profiles &amp; Permission Sets" hide-footer>
            <table class="table table-bordered table-sm">
                <thead>
                    <tr>
                        <!-- <th>Label</th> -->
                        <th>Full Name</th>
                        <!-- <th>Type</th> -->
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(permissionValue, permissionSetName) of viewingPermission" :key="permissionSetName">
                        <td>
                            {{ permissionSetName }}
                        </td>
                        <td>
                            {{ permissionValue }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </b-modal>
    </div>
</template>

<script>
    const METADATA_NODE_TO_LABEL_LOOKUP = {
        'applicationVisibilities': 'Assigned Apps',
        'fieldPermissions': 'Field Permissions',
        'objectPermissions': 'Object Permissions',
        'tabVisibilities': 'Tab Visibilities',
        'tabSettings': 'Tab Visibilities',
        'userPermissions': 'System Permissions',
        'classAccesses': 'Apex Class Accesses',
        'customMetadataTypeAccesses': 'Custom Metadata Type Accesses',
        'customPermissions': 'Custom Permissions Accesses',
        'customSettingAccesses': 'Custom Setting Accesses',
        'externalDataSourceAccesses': 'External Data Source Accesses',
        'flowAccesses': 'Flow Accesses',
        'pageAccesses': 'Visualforce Accesses',
        'recordTypeVisibilities': 'Record Type Visibilities',
        'categoryGroupVisibilities': 'Category Group Visibilities',
        'loginFlows': 'Login Flows'
    };

    export default {
        props: ['summary'],
        data: function() {
            return {
                collapseLookup: { },
                viewingPermission: { }
            };
        },
        watch: {
            summary: function(newSummary) {
                this.collapseLookup = Object.keys(newSummary).reduce((lookup, key) => {
                    lookup[key] = true;
                    return lookup;
                }, { });
            }
        },
        filters: {
            metadataNodeNameToLabel: function(value) {
                return METADATA_NODE_TO_LABEL_LOOKUP[value];
            },
            toSentenceCase: function(value) {
                const result = value.replace(/([A-Z])/g, ' $1');
                return result.charAt(0).toUpperCase() + result.slice(1);
            }
        },
        methods: {
            onCollapseClick: function(permissionTypeName) {
                this.collapseLookup[permissionTypeName] = !this.collapseLookup[permissionTypeName]
            },
            onPermissionClick: function(permission) {
                this.viewingPermission = permission;
                // this.$bvModal.show('permission-modal');
            }
        }
    };
</script>