<template>
    <div>
        <table class="table table-bordered table-sm">
            <tbody v-for="(permissionType, permissionTypeName) of summary" v-bind:key="permissionTypeName">
                <tr>
                    <td>{{ permissionTypeName | metadataNodeNameToLabel }}</td>
                </tr>
                <tr v-for="(item, itemName) of permissionType" v-bind:key="itemName">
                    <td>{{ itemName }}</td>
                    <td v-for="(permission, permissionName) of item" v-bind:key="permissionName">
                        <button type="button"
                                class="btn btn-sm btn-link p-0"
                                v-on:click="onPermissionClick(permission)">
                            {{ permissionName | toSentenceCase }}
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
        <b-modal id="permission-modal" title="Profiles &amp; Permission Sets" hide-footer>
            <table class="table table-bordered table-sm">
                <tr v-for="(item, key) of viewingPermission">
                    {{ key }} = {{ item }}
                </tr>
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
        'classAccesses': 'Apex Classes Accesses',
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
                viewingPermission: { }
            };
        },
        filters: {
            metadataNodeNameToLabel: function(value) {
                if (!value) {
                    return '';
                }

                return METADATA_NODE_TO_LABEL_LOOKUP[value];
            },
            toSentenceCase: function(value) {
                if (!value) {
                    return '';
                }

                const result = value.replace(/([A-Z])/g, ' $1');
                return result.charAt(0).toUpperCase() + result.slice(1);
            }
        },
        methods: {
            onPermissionClick: function(permission) {
                this.viewingPermission = permission;
                this.$bvModal.show('permission-modal');
            }
        }
    };
</script>