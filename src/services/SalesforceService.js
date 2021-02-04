export default class SalesforceService {
    constructor(serverHost, sessionId) {
        this.serverBaseUrl = `https://${serverHost}`;
        this.sessionId = sessionId;
    }

    async query(soql, tooling = false) {
        const queryEndpoint = tooling ? '/services/data/v48.0/tooling/query' : '/services/data/v48.0/query';

        const requestUrl = new URL(queryEndpoint, this.serverBaseUrl);
        requestUrl.searchParams.set('q', soql);

        const response = await this._authFetch(requestUrl);

        const result = await response.json();

        return result.records;
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