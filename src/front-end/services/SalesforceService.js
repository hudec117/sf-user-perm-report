const METADATA_ENDPOINT = '/services/Soap/m/48.0';
const QUERY_ENDPOINT = '/services/data/v48.0/query';
const TOOLING_QUERY_ENDPOINT = '/services/data/v48.0/tooling/query';

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

        const result = await response.json();

        return result.records;
    }

    async readMetadata(type, names) {
        let allRecordNodes = [];

        // The Metadata API readMetadata() call only supports reading 10 pieces
        // of metadata at a time so we need to chunk it.
        const batchSize = 10;
        const nameBatches = [];

        for (let i = 0; i < names.length; i += batchSize) {
            const newNameBatch = names.slice(i, i + batchSize);
            nameBatches.push(newNameBatch);
        }

        for (const nameBatch of nameBatches) {
            const message = this._constructReadMetadataMessage(type, nameBatch);

            const requestUrl = new URL(METADATA_ENDPOINT, this.serverBaseUrl);
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml',
                    'SOAPAction': '""'
                },
                body: message
            });

            // TODO: error handling

            const responseXmlRaw = await response.text();

            const responseXml = new window.DOMParser().parseFromString(responseXmlRaw, 'text/xml');

            const recordNodes = responseXml.querySelectorAll('Envelope Body readMetadataResponse result records');

            allRecordNodes = allRecordNodes.concat(Array.from(recordNodes));
        }

        return allRecordNodes;
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
            <soapenv:Body
                xmlns="http://soap.sforce.com/2006/04/metadata">
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

    _authFetch(requestUrl) {
        const actualRequestUrl = requestUrl.toString().replace('+', '%20');

        return fetch(actualRequestUrl, {
            headers: {
                'Authorization': 'Bearer ' + this.sessionId
            }
        });
    }
}