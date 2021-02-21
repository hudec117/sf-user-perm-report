<template>
    <div>
        <metadata-type-card v-for="metadataType of metadataTypes"
                            :key="metadataType.name"
                            :type="metadataType">
        </metadata-type-card>
        <h4 v-if="metadataTypes.length === 0" class="text-center">No search results</h4>
    </div>
</template>

<script>
    import MetadataTypeCard from './MetadataTypeCard.vue';

    export default {
        components: {
            MetadataTypeCard
        },
        props: ['summary', 'search'],
        data: function() {
            return {
                metadataTypes: [],
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
        watch: {
            summary: function(newSummary) {
                // Reset data since we're in a computed property
                this.permissionSetNames = [];
                this.metadataTypes = [];

                for (const typeName of Object.keys(this.summary)) {
                    const metadataTypeRow = {
                        name: typeName,
                        collapsed: true,
                        items: []
                    };

                    const type = this.summary[typeName];
                    for (const itemName of Object.keys(type)) {
                        const item = this.summary[typeName][itemName];

                        const shouldAddRow = !this.search || (this.search && itemName.toLowerCase().includes(this.search.toLowerCase()));
                        if (shouldAddRow) {
                            // Create new row for the item and push it to the array.
                            // (This allows it to be displayed using a Bootstrap-Vue table)
                            const row = {
                                name: itemName,
                                permissions: item,
                                _showDetails: false
                            };

                            metadataTypeRow.items.push(row);

                            if (this.search) {
                                metadataTypeRow.collapsed = false;
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

                    this.metadataTypes.push(metadataTypeRow);
                }
            }
        },
        // filters: {
        //     sentenceCase: function(value) {
        //         if (!value) return '';

        //         const result = value.replace(/([A-Z])/g, ' $1');
        //         return result.charAt(0).toUpperCase() + result.slice(1);
        //     }
        // },
        methods: {
            // onTypeCollapseClick: function(typeName) {
            //     this.typeCollapse[typeName] = !this.typeCollapse[typeName]
            // },
            // onRowClick: function(item) {
            //     item._showDetails = !item._showDetails;
            // },
            setTypeCollapse: function(collapsed) {
                for (const typeName of Object.keys(this.typeCollapse)) {
                    this.typeCollapse[typeName] = collapsed;
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