<template>
    <div>
        <!-- "type" refers to permission type like Application Visibility, Page Accesses, Field Permission etc -->
        <!-- "item" refers to the actual metadata names like Account, Contact, standard-Case, WorkOrder.Number etc -->

        <div class="card mb-2" v-for="(type, typeName) of summary" :key="typeName">
            <div class="card-header border-bottom-0" @click="onTypeCollapseClick(typeName)">
                <b-icon-chevron-right v-if="typeCollapse[typeName]"></b-icon-chevron-right>
                <b-icon-chevron-down v-else></b-icon-chevron-down>
                <span class="ml-1">{{ typeName | metadataNodeNameToLabel }}</span>
            </div>
            <div class="card-body p-0" v-if="!typeCollapse[typeName]">
                <table class="table table-sm mb-0">
                    <tr v-for="(item, itemName) of type" :key="itemName">
                        <td>
                            <b-icon-chevron-right v-if="itemCollapse[itemName]"></b-icon-chevron-right>
                            <b-icon-chevron-down v-else></b-icon-chevron-down>
                            <span class="ml-1">{{ itemName }}</span>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
    import Vue from 'vue';

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
        props: ['summary'],
        data: function() {
            return {
                typeCollapse: { },
                itemCollapse: { }
            };
        },
        watch: {
            summary: function(newSummary) {
                const types = Object.keys(newSummary);
                for (const type of types) {
                    Vue.set(this.typeCollapse, type, true);

                    const items = Object.keys(newSummary[type]);
                    for (const item of items) {
                        Vue.set(this.itemCollapse, type + item, true);
                    }
                }
            }
        },
        filters: {
            metadataNodeNameToLabel: function(value) {
                return METADATA_NODE_TO_LABEL_LOOKUP[value];
            },
            toSentenceCase: function(value) {
                const result = value.replace(/([A-Z])/g, ' $1');
                return result.charAt(0).toUpperCase() + result.slice(1);
            }
        },
        methods: {
            onTypeCollapseClick: function(typeName) {
                this.typeCollapse[typeName] = !this.typeCollapse[typeName]
            }
        }
    };
</script>

<style scoped>
.card-header {
    cursor: pointer;
    padding: .5rem .75rem !important;
}

.table td {
    padding-left: 2rem !important;
}
</style>