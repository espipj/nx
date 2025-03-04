import { readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyV1Workspace } from '@nrwl/devkit/testing';
import { mockViteReactAppGenerator } from '../../utils/test-utils';
import { setModeInConfiguration } from './set-mode-in-configuration';

describe('set mode in configuration object', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyV1Workspace();
    mockViteReactAppGenerator(tree);
  });

  it('should set the mode to be the configuration name and preserve other settings', async () => {
    await setModeInConfiguration(tree);

    const projectConfig = readProjectConfiguration(
      tree,
      'my-test-react-vite-app'
    );

    expect(projectConfig.targets.build.configurations.production.mode).toEqual(
      'production'
    );

    expect(projectConfig.targets.build.configurations.ssr.mode).toEqual('ssr');
    expect(projectConfig.targets.build.configurations.ssr.ssr).toBeTruthy();
    expect(
      projectConfig.targets.build.configurations.ssr['my-other-setting']
    ).toBe('my-other-value');
  });
});
