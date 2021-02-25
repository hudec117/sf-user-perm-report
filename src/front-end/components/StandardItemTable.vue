<template>
    <b-table :items="searchedItems"
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

        <template #row-details="row">
            <permission-table :permissions="row.item.permissions"></permission-table>
        </template>
    </b-table>
</template>

<script>
    import PermissionTable from './PermissionTable.vue';

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
                    {
                        key: 'name'
                    }
                ]
            };
        },
        computed: {
            searchedItems: function() {
                return this.items.filter(item => item._visible);
            }
        },
        methods: {
            onRowClick: function(item) {
                item._showDetails = !item._showDetails;
            }
        }
    };
</script>