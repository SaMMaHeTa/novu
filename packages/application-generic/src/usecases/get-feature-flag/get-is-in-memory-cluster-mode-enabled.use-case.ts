import { Injectable } from '@nestjs/common';
import { FeatureFlagsKeysEnum } from '@novu/shared';

import {
  GetFeatureFlagCommand,
  GetGlobalFeatureFlagCommand,
  FeatureFlagCommand,
} from './get-feature-flag.command';
import { GetFeatureFlag } from './get-feature-flag.use-case';

@Injectable()
export class GetIsInMemoryClusterModeEnabled extends GetFeatureFlag {
  async execute(): Promise<boolean> {
    const value = process.env.IS_IN_MEMORY_CLUSTER_MODE_ENABLED;
    const fallbackValue = false;
    const defaultValue = this.prepareBooleanStringFeatureFlag(
      value,
      fallbackValue
    );
    const key = FeatureFlagsKeysEnum.IS_IN_MEMORY_CLUSTER_MODE_ENABLED;

    const command = this.buildCommand(key, defaultValue);

    return await this.featureFlagsService.getGlobal(command);
  }
}
