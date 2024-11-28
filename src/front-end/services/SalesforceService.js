const METADATA_ENDPOINT = '/services/Soap/m/62.0';
const PARTNER_ENDPOINT = '/services/Soap/u/62.0';
const QUERY_ENDPOINT = '/services/data/v62.0/query';
const TOOLING_QUERY_ENDPOINT = '/services/data/v62.0/tooling/query';

export default class SalesforceService {
    constructor(serverHost, sessionId) {
        this.serverBaseUrl = `https://${serverHost}`;
        this.sessionId = sessionId;
    }

    async query(soql, tooling = false) {
        const queryEndpoint = tooling ? TOOLING_QUERY_ENDPOINT : QUERY_ENDPOINT;

        const requestUrl = new URL(queryEndpoint, this.serverBaseUrl);
        requestUrl.searchParams.set('q', soql);

        const response = await this._authFetch(requestUrl);
        const responseBody = await response.json();

        if (response.ok) {
            return {
                success: true,
                records: responseBody.records
            };
        } else {
            return {
                success: false,
                error: responseBody.map(error => error.message).join('\n')
            };
        }
    }

    async readMetadata(type, names, progressCallback) {
        let allRecordNodes = [];

        // The Metadata API readMetadata() call only supports reading 10 pieces
        // of metadata at a time so we need to chunk it.
        const batchSize = 10;
        const nameBatches = [];

        for (let i = 0; i < names.length; i += batchSize) {
            const newNameBatch = names.slice(i, i + batchSize);
            nameBatches.push(newNameBatch);
        }

        let metadataRead = 0;

        for (const nameBatch of nameBatches) {
            const message = this._constructReadMetadataMessage(type, nameBatch);

            if (progressCallback) {
                progressCallback(metadataRead);
            }

            const requestUrl = new URL(METADATA_ENDPOINT, this.serverBaseUrl);
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml',
                    'SOAPAction': '""'
                },
                body: message
            });

            const responseXmlRaw = await response.text();

            const responseXml = new window.DOMParser().parseFromString(responseXmlRaw, 'text/xml');

            if (!response.ok) {
                return this._constructResultFromSoapFault(responseXml);
            }

            const recordNodes = responseXml.querySelectorAll('Envelope Body readMetadataResponse result records');

            const recordNodesArray = Array.from(recordNodes);

            metadataRead += recordNodesArray.length

            allRecordNodes = allRecordNodes.concat(recordNodesArray);
        }

        return {
            success: true,
            records: allRecordNodes
        };
    }

    async getUserInfo() {
        const message = this._constructGetUserInfoMessage();

        const requestUrl = new URL(PARTNER_ENDPOINT, this.serverBaseUrl);
        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml',
                'SOAPAction': '""'
            },
            body: message
        });

        const responseXmlRaw = await response.text();

        const responseXml = new window.DOMParser().parseFromString(responseXmlRaw, 'text/xml');

        if (!response.ok) {
            return this._constructResultFromSoapFault(responseXml);
        }

        const resultNode = responseXml.querySelectorAll('Envelope Body getUserInfoResponse result')[0];

        return {
            success: true,
            userInfo: Array.from(resultNode.childNodes).reduce((prev, curr) => {
                prev[curr.nodeName] = curr.textContent;
                return prev;
            }, {})
        }
    }

    async getManagedPrefixes() {
        const namespacePrefixQuery = 'SELECT SubscriberPackage.NamespacePrefix FROM InstalledSubscriberPackage';
        const namespacePrefixQueryResult = await this.query(namespacePrefixQuery, true);
        if (!namespacePrefixQueryResult.success) {
            return namespacePrefixQueryResult;
        }

        return {
            success: true,
            prefixes: namespacePrefixQueryResult.records.map(record => record['SubscriberPackage']['NamespacePrefix'])
        };
    }

    _constructReadMetadataMessage(type, names) {
        let message = `
        <?xml version="1.0" encoding="UTF-8"?>
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                          xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
            <soapenv:Header xmlns="http://soap.sforce.com/2006/04/metadata">
                <SessionHeader>
                    <sessionId>${this.sessionId}</sessionId>
                </SessionHeader>
            </soapenv:Header>
            <soapenv:Body xmlns="http://soap.sforce.com/2006/04/metadata">
                <readMetadata>
                    <type>${type}</type>`;

        for (const name of names) {
            message += `\n<fullNames>${name}</fullNames>`;
        }

        message += `
                </readMetadata>
            </soapenv:Body>
        </soapenv:Envelope>`;

        return message.trim();
    }

    _constructGetUserInfoMessage() {
        let message = `
        <?xml version="1.0" encoding="UTF-8"?>
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                          xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
            <soapenv:Header xmlns="urn:partner.soap.sforce.com">
                <SessionHeader>
                    <sessionId>${this.sessionId}</sessionId>
                </SessionHeader>
            </soapenv:Header>
            <soapenv:Body xmlns="urn:partner.soap.sforce.com">
                <getUserInfo />
            </soapenv:Body>
        </soapenv:Envelope>`;

        return message.trim();
    }

    _authFetch(requestUrl) {
        const actualRequestUrl = requestUrl.toString().replace('+', '%20');

        return fetch(actualRequestUrl, {
            headers: {
                'Authorization': 'Bearer ' + this.sessionId
            }
        });
    }

    _constructResultFromSoapFault(responseXml) {
        const faultNodes = responseXml.querySelectorAll('Envelope Body Fault faultcode');

        let faultCode = 'unknown';
        if (faultNodes.length > 0) {
            faultCode = faultNodes[0].textContent;
        }

        return {
            success: false,
            error: `SOAP operation failed`,
            faultCode: faultCode
        };
    }
}