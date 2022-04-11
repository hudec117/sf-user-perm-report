# Publishing

## General
- Ensure the version in `manifest.json` and `package.json` is updated.

## Chrome
1. Build production version by running `npm run build` in `src` folder.
2. Copy `report.html`, `icons`, `background.js`, `content-script.js`, `manifest.json` and (optionally) `build.js.map` from the `src` folder into the new `dist` folder.
3. Side load the `dist` folder into Chrome and test it works correctly.
4. Zip up all the files inside the `dist` folder and name it `salesforce-user-perm-report-VERSION-chrome.zip`
5. Upload new version to Chrome Developer Dashboard

## Edge

1. Build production version by running `npm run build` in `src` folder.
2. Copy `report.html`, `icons`, `background.js`, `content-script.js`, `manifest.json` and (optionally) `build.js.map` from the `src` folder into the new `dist` folder.
3. Add the following line to `manifest.json`
```json
    "update_URL": "https://edge.microsoft.com/extensionwebstorebase/v1/crx",
```
4. Side load the `dist` folder into Edge and test it works correctly.
5. Zip up all the files inside the `dist` folder and name it `salesforce-user-perm-report-VERSION-edge.zip`
6. Upload new version to Microsoft Partner Center

## Opera (incl OperaGX)

1. Build production version by running `npm run build` in `src` folder.
2. Copy `report.html`, `icons`, `background.js`, `content-script.js`, `manifest.json` and (optionally) `build.js.map` from the `src` folder into the new `dist` folder.
3. Replace `minimum_chrome_version` with the following in `manifest.json`
```json
    "minimum_opera_version": "74",
```
4. Side load the `dist` folder into Opera and OperaGX and test it works correctly.
5. Zip up all the files inside the `dist` folder and name it `salesforce-user-perm-report-VERSION-opera.zip`
6. Upload new version to TODO

## Firefox

At the time of writing, Firefox has not yet implemented support for manifest v3 and therefore this extension is not compatible with Firefox.