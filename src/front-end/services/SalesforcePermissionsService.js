import SalesforceService from './SalesforceService';

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

export default class SalesforcePermissionsService extends SalesforceService {
    constructor(serverHost, sessionId) {
        super(serverHost, sessionId);
    }

    async getProfileName(profileId) {
        const profileQuery = `SELECT FullName FROM Profile WHERE Id = '${profileId}'`;
        const profileQueryResult = await this.query(profileQuery, true);
        if (!profileQueryResult.success) {
            return profileQueryResult;
        }

        return {
            success: true,
            name: profileQueryResult.records[0]['FullName']
        };
    }

    async getPermissionSetNames(userId, excludeManaged = true) {
        let permissionSetQuery = `SELECT PermissionSet.Name, PermissionSet.Type FROM PermissionSetAssignment WHERE AssigneeId = '${userId}' AND PermissionSet.IsOwnedByProfile = false`;
        if (excludeManaged) {
            permissionSetQuery += ' AND PermissionSet.NamespacePrefix = \'\'';
        }

        const permissionSetQueryResult = await this.query(permissionSetQuery);
        if (!permissionSetQueryResult.success) {
            return permissionSetQueryResult;
        }

        const names = [];

        for (const permSetAssignmentRecord of permissionSetQueryResult.records) {
            const name = permSetAssignmentRecord['PermissionSet']['Name'];

            // If it's a permission set group, we also need to query to see what permission sets are in the group.
            const type = permSetAssignmentRecord['PermissionSet']['Type'];
            if (type === 'Group') {
                const permSetGroupCompQuery = `SELECT PermissionSet.Name FROM PermissionSetGroupComponent WHERE PermissionSetGroup.DeveloperName = '${name}'`;
                const permSetGroupCompQueryResult = await this.query(permSetGroupCompQuery);
                if (!permSetGroupCompQueryResult.success) {
                    return permSetGroupCompQueryResult;
                }

                for (const permSetGroupCompRecord of permSetGroupCompQueryResult.records) {
                    const innerName = permSetGroupCompRecord['PermissionSet']['Name'];
                    names.push(innerName);
                }
            } else  {
                names.push(name);
            }
        }

        return {
            success: true,
            names: names
        }
    }

    merge(profileMetadatas, permissionSetMetadatas) {
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