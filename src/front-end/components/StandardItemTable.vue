<template>
    <b-table :items="items"
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
            {{ row.item.name }}
            <permission-table></permission-table>
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
        methods: {
            onRowClick: function(item) {
                item._showDetails = !item._showDetails;
            }
        }
    };
</script>