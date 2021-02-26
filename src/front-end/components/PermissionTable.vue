<template>
    <b-table :items="permissions">
        <template #cell(name)="data">
            {{ data.item.name }}
        </template>

        <template #cell()="data">
            <permission-value :permission="data.field.key"
                              :value="data.value">
            </permission-value>
        </template>
    </b-table>
</template>

<script>
    import PermissionValue from './PermissionValue.vue';

    export default {
        components: { PermissionValue },
        props: ['permissions']
    };
</script>