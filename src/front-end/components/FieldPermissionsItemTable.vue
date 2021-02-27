<template>
    <b-table :items="objects"
             :fields="objectFields"
             @row-clicked="onRowClick"
             primary-key="name"
             thead-class="hidden-header"
             tbody-tr-class="clickable-row"
             table-class="mb-0"
             fixed
             small>
        <template #cell(show_details)="objectRow">
            <b-icon-plus scale="1.5" v-if="!objectRow.detailsShowing"></b-icon-plus>
            <b-icon-dash scale="1.5" v-else></b-icon-dash>
        </template>

        <template #row-details="objectRow">
            <div class="pl-5">
                <b-table :items="objectRow.item.fields"
                        :fields="fieldFields"
                        @row-clicked="onRowClick"
                        primary-key="name"
                        thead-class="hidden-header"
                        tbody-tr-class="clickable-row"
                        table-class="mb-0"
                        fixed
                        small>
                    <template #cell(show_details)="fieldRow">
                        <b-icon-plus scale="1.5" v-if="!fieldRow.detailsShowing"></b-icon-plus>
                        <b-icon-dash scale="1.5" v-else></b-icon-dash>
                    </template>

                    <template #cell(summary)="row">
                        <span v-for="permissionName of permissionNames"
                                :key="permissionName"
                                :class="permissionSummaryBadgeClasses(row.item, permissionName)">
                            {{ permissionName | sentenceCase }}
                        </span>
                    </template>

                    <template #row-details="row">
                        <div class="pl-4">
                            <permission-table :permissions="row.item.permissions"></permission-table>
                        </div>
                    </template>
                </b-table>
            </div>
        </template>
    </b-table>
</template>

<script>
    import PermissionTable from './PermissionTable.vue';

    const CHECKBOX_PERMISSIONS = ['default', 'visible', 'enabled', 'editable', 'readable', 'allowCreate', 'allowDelete', 'allowEdit', 'allowRead', 'modifyAllRecords', 'viewAllRecords'];

    export default {
        components: { PermissionTable },
        props: ['items'],
        data: function() {
            return {
                objectFields: [
                    {
                        key: 'show_details',
                        tdClass: 'collapse-cell'
                    },
                    'name'
                ],
                fieldFields: [
                    {
                        key: 'show_details',
                        tdClass: 'collapse-cell-inner'
                    },
                    'name',
                    'summary'
                ]
            };
        },
        computed: {
            visibleItems: function() {
                return this.items.filter(item => item._visible);
            },
            objects: function() {
                const objectLookup = new Map();

                for (const item of this.visibleItems) {
                    const parts = item.name.split('.');
                    const objectName = parts[0];
                    const fieldName = parts[1];

                    if (!objectLookup.has(objectName)) {
                        const newObjectRow = {
                            _showDetails: false,
                            name: objectName,
                            fields: []
                        };

                        objectLookup.set(objectName, newObjectRow);
                    }

                    const objectRow = objectLookup.get(objectName);

                    objectRow.fields.push({
                        name: fieldName,
                        permissions: item.permissions,
                        _showDetails: false
                    });
                }

                return Array.from(objectLookup.values());
            },
            permissionNames: function() {
                const allFieldNames = Object.keys(this.items[0].permissions[0]);

                const checkboxFieldNames = allFieldNames.filter(field => CHECKBOX_PERMISSIONS.includes(field))

                return checkboxFieldNames;
            }
        },
        filters: {
            sentenceCase: function(value) {
                if (!value) return '';

                const result = value.replace(/([A-Z])/g, ' $1');
                return result.charAt(0).toUpperCase() + result.slice(1);
            }
        },
        methods: {
            onRowClick: function(item) {
                item._showDetails = !item._showDetails;
            },
            permissionSummaryBadgeClasses: function(item, permissionName) {
                let positive = false;

                for (const row of item.permissions) {
                    if (row[permissionName] == 'true') {
                        positive = true;
                    }
                }

                let baseClasses = 'badge badge-pill mr-2';
                if (positive) {
                    baseClasses += ' badge-success';
                } else {
                    baseClasses += ' badge-danger';
                }

                return baseClasses;
            }
        }
    };
</script>

<style>
.collapse-cell-inner {
    width: 25px;
}
</style>