<template>
    <div>
        <metadata-type-card v-for="metadataType of metadataTypes"
                            :key="metadataType.name"
                            :type="metadataType">
        </metadata-type-card>
    </div>
</template>

<script>
    import MetadataTypeCard from './MetadataTypeCard.vue';

    export default {
        components: {
            MetadataTypeCard
        },
        props: ['tree', 'options'],
        data: function() {
            return {
                metadataTypes: []
            };
        },
        watch: {
            tree: function() {
                this.metadataTypes = [];

                for (const typeName of Object.keys(this.tree)) {
                    const metadataTypeRow = {
                        name: typeName,
                        collapsed: true,
                        items: []
                    };

                    const type = this.tree[typeName];
                    for (const itemName of Object.keys(type)) {
                        const permissions = this.tree[typeName][itemName];

                        // Create new row for the item and push it to the array.
                        // (This allows it to be displayed using a Bootstrap-Vue table)
                        const row = {
                            name: itemName,
                            permissions: this.generatePermissionsTable(permissions),
                            _visible: true,
                            _showDetails: false
                        };

                        metadataTypeRow.items.push(row);
                    }

                    this.metadataTypes.push(metadataTypeRow);
                }

                this.searchMetadataTypes();
            },
            options: {
                handler: function() {
                    this.searchMetadataTypes();
                },
                deep: true
            }
        },
        methods: {
            searchMetadataTypes: function() {
                for (const metadataType of this.metadataTypes) {
                    let anyVisible = false;

                    for (const item of metadataType.items) {
                        item._visible = this.determineItemVisiblity(metadataType, item);

                        if (item._visible) {
                            anyVisible = true;
                        }
                    }

                    if (!anyVisible) {
                        metadataType.collapsed = true;
                    }
                }
            },
            determineItemVisiblity: function(metadataType, item) {
                if (!this.options.managed) {
                    for (const managedPrefix of this.options.managedPrefixes) {
                        if (item.name.startsWith(managedPrefix + '__')) {
                            return false;
                        }
                    }
                }

                const shouldSearch = this.options.search;
                if (shouldSearch) {
                    if (this.options.search) {
                        let toSearch = item.name;

                        // For field permissions and record type visibilities only search the field/record type name
                        if (metadataType.name === 'fieldPermissions' || metadataType.Name == 'recordTypeVisibilities') {
                            toSearch = toSearch.split('.')[1];
                        }

                        if (toSearch.toLowerCase().includes(this.options.search.toLowerCase())) {
                            return true;
                        }
                    }

                    return false;
                }

                return true;
            },
            generatePermissionsTable: function(permissions) {
                const table = [];

                for (const permissionSetName of this.options.permissionSetNames) {
                    const row = {
                        name: permissionSetName
                    };

                    for (const permissionName of Object.keys(permissions)) {
                        const permission = permissions[permissionName];

                        row[permissionName] = permission[permissionSetName];
                    }

                    table.push(row);
                }

                return table;
            },
            setTypeCollapse: function(collapsed) {
                for (const metadataType of this.metadataTypes) {
                    const enabled = metadataType.items.filter(item => item._visible).length > 0;
                    if (enabled) {
                        metadataType.collapsed = collapsed;
                    }
                }
            }
        }
    };
</script>

<style>
/* Below are used by StandardItemTable and FieldPermissionsItemTable */
.collapse-cell {
    width: 50px;
    padding-left: 2rem !important;
}

.hidden-header {
    display: none;
}

.clickable-row:not(.b-table-details) {
    cursor: pointer;
}
</style>