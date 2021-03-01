<template>
    <b-table :items="visibleItems"
             :fields="itemFields"
             @row-clicked="onRowClick"
             primary-key="name"
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
</template>

<script>
    import PermissionTable from './PermissionTable.vue';

    const CHECKBOX_PERMISSIONS = ['default', 'visible', 'enabled', 'editable', 'readable', 'allowCreate', 'allowDelete', 'allowEdit', 'allowRead', 'modifyAllRecords', 'viewAllRecords'];

    export default {
        components: { PermissionTable },
        props: ['items'],
        data: function() {
            return {
                itemFields: [
                    {
                        key: 'show_details',
                        tdClass: 'collapse-cell'
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
.padded-row {
    padding-left: 2rem !important;
}
</style>