<template>
    <div class="container-fluid mt-3">
        <div class="row">
            <div class="col-auto">
                <button type="button" class="btn btn-lg btn-primary">Run Report</button>
            </div>
            <div class="col">
                <div class="progress">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%;"></div>
                </div>
            </div>
        </div>
        <div class="row">

        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                userId: '',
                sessionId: '',
                serverUrl: ''
            };
        },
        mounted: function() {
            console.log('test');
        }
    };
</script>

<style>
.progress {
    height: 44px;
}
</style>