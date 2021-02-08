(function() {
    // Note: for whatever reason this code executes multiple times on page load and sometimes
    // topButtonRow is null.

    // Add the "Run Permission Report" button when the button row is available.
    const topButtonRow = document.getElementById('topButtonRow');
    if (topButtonRow !== null) {
        const permissionReportButton = document.createElement('input');
        permissionReportButton.value = 'Open Permission Report';
        permissionReportButton.className = 'btn';
        permissionReportButton.type = 'button';
        permissionReportButton.style = 'margin-left: 5px;';
        permissionReportButton.addEventListener('click', function() {
            chrome.runtime.sendMessage({ operation: 'open-report' });
        });

        topButtonRow.appendChild(permissionReportButton);
    }
})();