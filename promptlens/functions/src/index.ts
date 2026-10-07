// Narrow import: the 'firebase-functions/v2' root loads every trigger type (~4 s).
import { setGlobalOptions } from 'firebase-functions/v2/options';

setGlobalOptions({ region: 'europe-west1', maxInstances: 5 });

export { describeAssetFromImage } from './describe-asset-from-image';
export { describeAssetFromText } from './describe-asset-from-text';
