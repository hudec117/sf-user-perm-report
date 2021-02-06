const PERMISSION_NODE_IDENTIFIERS = {
    'applicationVisibilities': 'application',
    'fieldPermissions': 'field',
    'objectPermissions': 'object',
    'tabSettings': 'tab',
    'userPermissions': 'name',
    'classAccesses': 'apexClass',
    'customMetadataTypeAccesses': 'name',
    'customPermissions': 'name',
    'customSettingAccesses': 'name',
    'externalDataSourceAccesses': 'externalDataSource',
    'flowAccesses': 'flow',
    'pageAccesses': 'apexPage',
    'recordTypeVisibilities': 'recordType',
    'categoryGroupVisibilities': 'dataCategoryGroup',
    'loginFlows': 'friendlyname'
};

export default class SalesforcePermissionsService {
    static merge(profileMetadata, permissionSetMetadatas) {
        const merged = { };

        // Rename "tabVisibilities" nodes to "tabSettings" so it can be merged with permission sets.
        const tabVisibilityNodes = profileMetadata.querySelectorAll('tabVisibilities');
        for (const tabVisibilityNode of tabVisibilityNodes) {
            const tabSettingNode = document.createElementNS(null, 'tabSettings');

            while (tabVisibilityNode.childNodes.length > 0) {
                tabSettingNode.appendChild(tabVisibilityNode.childNodes[0]);
            }

            profileMetadata.removeChild(tabVisibilityNode);
            profileMetadata.appendChild(tabSettingNode);
        }

        // Throw the profile metadata in with permission sets.
        permissionSetMetadatas.push(profileMetadata);

        // Merge each permission set metadata
        for (const permissionSetMetadata of permissionSetMetadatas) {
            // Get permission set name
            const permissionSetName = permissionSetMetadata.getElementsByTagName('fullName')[0].textContent;

            const permissionNodes = permissionSetMetadata.childNodes;
            for (const permissionNode of permissionNodes) {
                const permissionTypeName = permissionNode.tagName;

                if (!(permissionTypeName in PERMISSION_NODE_IDENTIFIERS)) {
                    console.log(`Permission type ${permissionTypeName} not supported.`);
                    continue;
                }

                if (!(permissionTypeName in merged)) {
                    merged[permissionTypeName] = { };
                }

                // Find permission node unique identifier
                const identifierNodeName = PERMISSION_NODE_IDENTIFIERS[permissionTypeName];
                const identifier = permissionNode.getElementsByTagName(identifierNodeName)[0].textContent;

                if (!(identifier in merged[permissionTypeName])) {
                    merged[permissionTypeName][identifier] = { };
                }

                // Add each permission-detail
                const detailPermissions = permissionNode.querySelectorAll(`*:not(${identifierNodeName})`);
                for (const detailPermission of detailPermissions) {
                    const detailPermissionName = detailPermission.tagName;
                    const detailPermissionValue = detailPermission.textContent;

                    if (!(detailPermissionName in merged[permissionTypeName][identifier])) {
                        merged[permissionTypeName][identifier][detailPermissionName] = { };
                    }

                    merged[permissionTypeName][identifier][detailPermissionName][permissionSetName] = detailPermissionValue;
                }
            }
        }

        return merged;
    }
}