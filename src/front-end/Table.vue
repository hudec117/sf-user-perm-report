<template>
    <div>
        <!-- Given the similarity in structure between Permission Sets and Profiles, both are referred to as "Permission Sets" in this file. -->
        <!-- "type" refers to permission type like Application Visibility, Page Accesses, Field Permission etc -->
        <!-- "item" refers to the actual metadata names like Account, Contact, standard-Case, WorkOrder.Number etc -->
        <!-- "permission" refers to the permission name like AuthorApex, Enabled, Visible, Readable etc -->
        <!-- "permission value" or "value" refers to the value set for the permission such as DefaultOn, True, False etc -->

        <div class="card mb-2" v-for="(type, typeName) of filteredSummary" :key="typeName">
            <div class="card-header border-bottom-0" @click="onTypeCollapseClick(typeName)">
                <b-icon-plus scale="1.5" v-if="typeCollapse[typeName]"></b-icon-plus>
                <b-icon-dash scale="1.5" v-else></b-icon-dash>
                <span class="ml-1">{{ typeName | metadataNodeNameToLabel }}</span>
            </div>
            <div class="card-body p-0" v-if="!typeCollapse[typeName]">
                <b-table :items="type"
                         :fields="itemFields"
                         primary-key="item"
                         @row-clicked="onRowClick"
                         thead-class="hidden-header"
                         tbody-tr-class="clickable-row"
                         details-td-class="padded-row"
                         table-class="mb-0"
                         fixed
                         small>
                    <template #cell(show_details)="row">
                        <b-icon-plus scale="1.5" v-if="!row.detailsShowing"></b-icon-plus>
                        <b-icon-dash scale="1.5" v-else></b-icon-dash>
                    </template>

                    <template #row-details="row">
                        <b-table-simple small bordered hover responsive class="mb-0">
                            <b-thead>
                                <b-tr>
                                    <b-th>Profile/Permission Set</b-th>
                                    <b-th v-for="(_, permissionName) of row.item.permissionToPermissionSetLookup" :key="permissionName">
                                        {{ permissionName | sentenceCase }}
                                    </b-th>
                                </b-tr>
                            </b-thead>
                            <b-tbody>
                                <b-tr v-for="permissionSetName of permissionSetNames" :key="permissionSetName">
                                    <b-td class="fit-column">{{ permissionSetName }}</b-td>
                                    <b-td v-for="(_, permissionName) of row.item.permissionToPermissionSetLookup" :key="permissionName">
                                        <PermissionValue :permission="permissionName"
                                                         :permissionSetName="permissionSetName"
                                                         :lookup="row.item.permissionToPermissionSetLookup">
                                        </PermissionValue>
                                    </b-td>
                                </b-tr>
                            </b-tbody>
                        </b-table-simple>
                    </template>
                </b-table>
            </div>
        </div>
    </div>
</template>

<script>
    import Vue from 'vue';

    import PermissionValue from './components/PermissionValue.vue';

    const METADATA_NODE_TO_LABEL_LOOKUP = {
        'applicationVisibilities': 'Assigned Apps',
        'fieldPermissions': 'Field Permissions',
        'objectPermissions': 'Object Permissions',
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
        components: {
            PermissionValue
        },
        props: ['summary', 'filter'],
        data: function() {
            return {
                typeCollapse: { },
                permissionSetNames: [],
                itemFields: [
                    {
                        key: 'show_details',
                        tdClass: 'collapse-cell'
                    },
                    {
                        key: 'item'
                    }
                ]
            };
        },
        computed: {
            filteredSummary: function() {
                const filteredSummary = { };

                // Reset data since we're in a computed property
                this.typeCollapse = { };
                this.permissionSetNames = [];

                for (const typeName of Object.keys(this.summary)) {
                    Vue.set(this.typeCollapse, typeName, true);

                    const type = this.summary[typeName];
                    for (const itemName of Object.keys(type)) {
                        const item = this.summary[typeName][itemName];

                        const shouldAddRow = !this.filter || (this.filter && itemName.toLowerCase().includes(this.filter.toLowerCase()));
                        if (shouldAddRow) {
                            // Create new row for the item and push it to the array.
                            // (This allows it to be displayed using a Bootstrap-Vue table)
                            const row = {
                                item: itemName,
                                permissionToPermissionSetLookup: item,
                                _showDetails: false
                            };

                            if (!(typeName in filteredSummary)) {
                                Vue.set(filteredSummary, typeName, []);
                            }

                            filteredSummary[typeName].push(row);

                            if (this.filter) {
                                this.typeCollapse[typeName] = false;
                            }
                        }

                        // Dig down to permission sets and get unique names
                        for (const permission of Object.values(item)) {
                            for (const permissionSetName of Object.keys(permission)) {
                                if (!this.permissionSetNames.includes(permissionSetName)) {
                                    this.permissionSetNames.push(permissionSetName);
                                }
                            }
                        }
                    }
                }

                return filteredSummary;
            }
        },
        filters: {
            metadataNodeNameToLabel: function(value) {
                if (!value) return '';

                return METADATA_NODE_TO_LABEL_LOOKUP[value];
            },
            sentenceCase: function(value) {
                if (!value) return '';

                const result = value.replace(/([A-Z])/g, ' $1');
                return result.charAt(0).toUpperCase() + result.slice(1);
            }
        },
        methods: {
            onTypeCollapseClick: function(typeName) {
                this.typeCollapse[typeName] = !this.typeCollapse[typeName]
            },
            onRowClick: function(item) {
                item._showDetails = !item._showDetails;
            },
            setTypeCollapse: function(collapsed) {
                for (const typeName of Object.keys(this.typeCollapse)) {
                    this.typeCollapse[typeName] = collapsed;
                }
            }
        }
    };
</script>

<style scoped>
.card-header {
    cursor: pointer;
    padding: .5rem .75rem !important;
}
</style>

<style>
.hidden-header {
    display: none;
}

.clickable-row:not(.b-table-details) {
    cursor: pointer;
}

.b-table-details > td {
    padding-left: 4rem !important;
}

.padded-row {
    padding-left: 2rem !important;
}

.collapse-cell {
    width: 50px;
    padding-left: 2rem !important;
}

.fit-column {
    width: 1%;
    min-width: 165px;
}
</style>