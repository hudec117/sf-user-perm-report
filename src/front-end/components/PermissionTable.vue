<template>
    <b-table-simple small bordered hover responsive class="mb-0">
        <b-thead>
            <b-tr>
                <b-th>Name</b-th>
                <b-th v-for="(_, permissionName) of permissions" :key="permissionName">
                    {{ permissionName | sentenceCase }}
                </b-th>
            </b-tr>
        </b-thead>
        <!-- <b-tbody>
            <b-tr v-for="permissionSetName of permissionSetNames" :key="permissionSetName">
                <b-td class="fit-column">
                    <a href="#">
                        {{ metadataInfoLookup[permissionSetName].type == 'PermissionSet' ? metadataInfoLookup[permissionSetName].label : permissionSetName }}
                    </a>
                </b-td>
                <b-td class="fit-column">{{ metadataInfoLookup[permissionSetName].type | sentenceCase }}</b-td>
                <b-td v-for="(_, permissionName) of permissions" :key="permissionName">
                    <PermissionValue :permission="permissionName"
                                     :permissionSetName="permissionSetName"
                                     :lookup="permissions">
                    </PermissionValue>
                </b-td>
            </b-tr>
        </b-tbody> -->
    </b-table-simple>
</template>

<script>
    export default {
        props: ['permissions'],
        filters: {
            sentenceCase: function(value) {
                if (!value) return '';

                const result = value.replace(/([A-Z])/g, ' $1');
                return result.charAt(0).toUpperCase() + result.slice(1);
            }
        }
    };
</script>