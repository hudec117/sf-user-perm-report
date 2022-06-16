<template>
    <div class="card mb-2" v-show="visibleItemCount > 0">
        <div v-bind:class="headerClasses" @click="onCollapseClick">
            <b-icon-plus scale="1.5" v-if="type.collapsed"></b-icon-plus>
            <b-icon-dash scale="1.5" v-else></b-icon-dash>
            <span class="ml-1">{{ type.name | metadataNodeNameToLabel }} - {{ visibleItemCount }} result{{ visibleItemCount === 1 ? '' : 's' }}</span>
        </div>
        <div class="card-body p-0" v-if="!type.collapsed">
            <field-permissions-item-table v-if="type.name === 'fieldPermissions'" :items="type.items"></field-permissions-item-table>
            <standard-item-table v-else :items="type.items"></standard-item-table>
        </div>
    </div>
</template>

<script>
    import StandardItemTable from './StandardItemTable.vue';
    import FieldPermissionsItemTable from './FieldPermissionsItemTable.vue';

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
        'categoryGroupVisibilities': 'Category Group Visibilities'
    };

    export default {
        components: {
            StandardItemTable,
            FieldPermissionsItemTable
        },
        props: ['type'],
        computed: {
            visibleItemCount: function() {
                return this.type.items.filter(item => item._visible).length;
            },
            enabled: function() {
                return this.visibleItemCount > 0;
            },
            headerClasses: function() {
                let baseClasses = 'card-header border-bottom-0';

                if (this.enabled) {
                    baseClasses += ' card-header-enabled';
                } else {
                    baseClasses += ' card-header-disabled';
                }

                return baseClasses;
            }
        },
        filters: {
            metadataNodeNameToLabel: function(value) {
                if (!value) return '<EMPTY TYPE>';

                return value in METADATA_NODE_TO_LABEL_LOOKUP ? METADATA_NODE_TO_LABEL_LOOKUP[value] : value;
            }
        },
        methods: {
            onCollapseClick: function() {
                if (this.enabled) {
                    this.type.collapsed = !this.type.collapsed;
                }
            }
        }
    };
</script>

<style scoped>
.card-header-enabled {
    cursor: pointer;
}

.card-header-disabled {
    cursor: not-allowed;
    color: #888 !important;
}

.card-header {
    padding: .5rem .75rem !important;
}
</style>