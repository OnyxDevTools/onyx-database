// filename: src/version.ts
// sdk metadata is read from package.json at build time; tsup inlines the values.
import { name as sdkName, version as sdkVersion } from '../package.json';

export { sdkName, sdkVersion };
