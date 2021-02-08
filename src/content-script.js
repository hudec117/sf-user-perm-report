(function() {
    // Note: for whatever reason this code executes multiple times on page load and first time we cannot access the DOM.

    const pageTypeElements = document.getElementsByClassName('pageType');

    const canAddButton = pageTypeElements.length > 0 && pageTypeElements[0].innerText === 'User';
    if (canAddButton) {
        const permissionReportButton = document.createElement('input');
        permissionReportButton.value = 'Open Permission Report';
        permissionReportButton.className = 'btn';
        permissionReportButton.type = 'button';
        permissionReportButton.style = 'margin-left: 5px;';
        permissionReportButton.addEventListener('click', function() {
            chrome.runtime.sendMessage({ operation: 'open-report' });
        });

        const topButtonRow = document.getElementById('topButtonRow');
        topButtonRow.appendChild(permissionReportButton);
    }
})();