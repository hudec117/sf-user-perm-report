<template>
    <div class="card mb-2">
        <div class="card-header border-bottom-0" @click="onCollapseClick">
            <b-icon-plus scale="1.5" v-if="collapsed"></b-icon-plus>
            <b-icon-dash scale="1.5" v-else></b-icon-dash>
            <span class="ml-1">{{ name | metadataNodeNameToLabel }}</span>
        </div>
        <div class="card-body p-0" v-if="!collapsed">
            <!-- <field-permissions-item-table v-if="name === 'fieldPermissions'"></field-permissions-item-table> -->
            <!-- <standard-item-table v-else><standard-item-table> -->
        </div>
    </div>
</template>

<script>
    import StandardItemTable from './StandardItemTable.vue';
    import FieldPermissionsItemTable from './FieldPermissionsItemTable.vue';

    export default {
        components: {
            StandardItemTable,
            FieldPermissionsItemTable
        },
        props: ['name'],
        data: {
            collapsed: true
        },
        methods: {
            onCollapseClick: function() {
                this.collapsed = !this.collapsed;
            }
        }
    };
</script>