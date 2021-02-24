<template>
    <div>
        <metadata-type-card v-for="metadataType of searchedMetadataTypes"
                            :key="metadataType.name"
                            :type="metadataType">
        </metadata-type-card>
        <h4 v-if="searchedMetadataTypes.length === 0" class="text-center">No search results</h4>
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
                metadataTypes: [],
                permissionSetNames: []
            };
        },
        watch: {
            tree: function(newSummary) {
                this.metadataTypes = [];
                this.permissionSetNames = [];

                for (const typeName of Object.keys(newSummary)) {
                    const metadataTypeRow = {
                        name: typeName,
                        collapsed: true,
                        items: []
                    };

                    const type = newSummary[typeName];
                    for (const itemName of Object.keys(type)) {
                        const item = newSummary[typeName][itemName];

                        // Create new row for the item and push it to the array.
                        // (This allows it to be displayed using a Bootstrap-Vue table)
                        const row = {
                            name: itemName,
                            permissions: item,
                            _showDetails: false
                        };

                        metadataTypeRow.items.push(row);

                        // Dig down to permission sets and get unique names
                        for (const permission of Object.values(item)) {
                            for (const permissionSetName of Object.keys(permission)) {
                                if (!this.permissionSetNames.includes(permissionSetName)) {
                                    this.permissionSetNames.push(permissionSetName);
                                }
                            }
                        }
                    }

                    this.metadataTypes.push(metadataTypeRow);
                }
            }
        },
        computed: {
            searchedMetadataTypes: function() {
                const searched = [];

                for (const metadataType of this.metadataTypes) {
                    for (const item of metadataType.items) {
                        if (this.options.search) {
                            // TODO
                        }

                        if (this.options.managed) {
                            // TODO
                        }
                    }
                }

                return searched;
            }
        },
        methods: {
            setTypeCollapse: function(collapsed) {
                for (const metadataType of this.metadataTypes) {
                    metadataType.collapsed = collapsed;
                }
            }
        }
    };
</script>

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