// filename: src/impl/onyx-edge.ts
import * as chain from '../config/chain-edge';
import { createOnyxFacade } from './onyx-core';

export const onyx = createOnyxFacade((config) => chain.resolveConfig(config));
