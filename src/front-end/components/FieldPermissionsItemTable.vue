<template>
    <b-table :items="objects"
             :fields="itemFields"
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
            <b-table :items="objectRow.item.fields"
                     :fields="itemFields"
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

                <template #row-details="row">
                    <permission-table :permissions="row.item.permissions"></permission-table>
                </template>
            </b-table>
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
            objects: function() {
                const objectLookup = new Map();

                for (const item of this.items) {
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
                        _showDetails: false,
                        name: fieldName,
                        permissions: item.permissions
                    });
                }

                return Array.from(objectLookup.values());
            }
        },
        methods: {
            onRowClick: function(item) {
                item._showDetails = !item._showDetails;
            }
        }
    };
</script>