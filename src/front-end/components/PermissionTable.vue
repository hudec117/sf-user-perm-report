<template>
    <b-table :items="permissions"
             :fields="permissionsFields"
             class="mb-0"
             small
             bordered>
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
        props: ['permissions'],
        computed: {
            permissionsFields: function() {
                let fields = [
                    {
                        key: 'name',
                        tdClass: 'fit-column'
                    }
                ];

                fields = fields.concat(
                    Object.keys(this.permissions[0]).filter(field => field !== 'name')
                );

                return fields;
            }
        }
    };
</script>

<style>
.fit-column {
    width: 1%;
    min-width: 165px;
}
</style>