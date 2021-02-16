<template>
    <div>
        <!-- If it's true/false permission we display it as a checkbox -->
        <template v-if="isCheckboxPermission">
            <!-- 
                Here we have to use custom HTML instead of <b-form-checkbox> because otherwise ".prevent.stop" would not work and
                the user would be allowed to change the state of the checkbox.
            -->
            <div class="custom-control custom-checkbox">
                <input type="checkbox" class="custom-control-input" :checked="value" @click.prevent.stop="">
                <label class="custom-control-label"></label>
            </div>
        </template>

        <!-- Otherwise we display just the text -->
        <template v-else-if="isSet">{{ value }}</template>
        <span v-else class="text-muted">Unset</span>
    </div>
</template>

<script>
    const CHECKBOX_PERMISSIONS = ['default', 'visible', 'visibility', 'enabled', 'editable', 'readable', 'allowCreate', 'allowDelete', 'allowEdit', 'allowRead', 'modifyAllRecords', 'viewAllRecords'];

    export default {
        props: ['permission', 'permissionSetName', 'lookup'],
        computed: {
            isCheckboxPermission: function() {
                return CHECKBOX_PERMISSIONS.includes(this.permission);
            },
            isSet: function() {
                return this.permissionSetName in this.lookup[this.permission];
            },
            value: function() {
                if (!this.isSet) {
                    return false;
                }

                const value = this.lookup[this.permission][this.permissionSetName]; 

                if (this.isCheckboxPermission) {
                    return value === 'true';
                }

                return value;
            }
        }
    };
</script>