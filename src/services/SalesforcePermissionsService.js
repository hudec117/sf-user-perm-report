const PERMISSION_TYPE_NODE_IDENTIFIERS = {
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
    static merge(profileMetadatas, permissionSetMetadatas) {
        const merged = { };

        const allMetadatas = profileMetadatas.concat(permissionSetMetadatas);

        // Rename the profile's "tabVisibilities" nodes to "tabSettings" so it can be merged with permission sets.
        for (const profileMetadata of profileMetadatas) {
            const tabVisibilityNodes = profileMetadata.querySelectorAll('tabVisibilities');
            for (const tabVisibilityNode of tabVisibilityNodes) {
                const tabSettingNode = document.createElementNS(null, 'tabSettings');

                while (tabVisibilityNode.childNodes.length > 0) {
                    tabSettingNode.appendChild(tabVisibilityNode.childNodes[0]);
                }

                profileMetadata.removeChild(tabVisibilityNode);
                profileMetadata.appendChild(tabSettingNode);
            }
        }

        // Merge each profile/permission set metadata
        for (const metadata of allMetadatas) {
            // Get profile/permission set name and label
            const metadataName = metadata.getElementsByTagName('fullName')[0].textContent;
            let metadataLabel = metadataName;

            const labelElements = metadata.getElementsByTagName('label');
            if (labelElements.length > 0) {
                metadataLabel = labelElements[0].textContent;
            }

            const permissionTypeNodes = metadata.childNodes;
            for (const permissionTypeNode of permissionTypeNodes) {
                const permissionTypeName = permissionTypeNode.tagName;

                if (!(permissionTypeName in PERMISSION_TYPE_NODE_IDENTIFIERS)) {
                    continue;
                }

                if (!(permissionTypeName in merged)) {
                    merged[permissionTypeName] = { };
                }

                // Find permission node unique identifier
                const identifierNodeName = PERMISSION_TYPE_NODE_IDENTIFIERS[permissionTypeName];
                const itemName = permissionTypeNode.getElementsByTagName(identifierNodeName)[0].textContent;

                if (!(itemName in merged[permissionTypeName])) {
                    merged[permissionTypeName][itemName] = { };
                }

                // Add each permission
                const permissionNodes = permissionTypeNode.querySelectorAll(`*:not(${identifierNodeName})`);
                for (const permissionNode of permissionNodes) {
                    const permissionName = permissionNode.tagName;
                    const permissionValue = permissionNode.textContent;

                    if (!(permissionName in merged[permissionTypeName][itemName])) {
                        merged[permissionTypeName][itemName][permissionName] = { };
                    }

                    merged[permissionTypeName][itemName][permissionName][metadataName] = permissionValue;
                }
            }
        }

        return merged;
    }
}