import { vol, fs } from 'memfs';

jest.mock('fs', () => require('memfs').fs);
jest.mock('nx/src/utils/workspace-root', () => ({
  workspaceRoot: '/root',
}));
import { buildProjectGraph } from './build-project-graph';
import { defaultFileHasher } from '../hasher/file-hasher';
import { ProjectsConfigurations } from '../config/workspace-json-project-json';
import { NxJsonConfiguration } from '../config/nx-json';
import { stripIndents } from '../utils/strip-indents';
import { DependencyType } from '../config/project-graph';

describe('project graph', () => {
  let packageJson: any;
  let packageLockJson: any;
  let projects: ProjectsConfigurations;
  let nxJson: NxJsonConfiguration;
  let tsConfigJson: any;
  let filesJson: any;

  beforeEach(() => {
    defaultFileHasher.ensureInitialized();
    packageJson = {
      name: '@nrwl/workspace-src',
      version: '0.0.0',
      dependencies: {
        express: '4.0.0',
        'happy-nrwl': '1.0.0',
      },
      devDependencies: {
        '@nrwl/workspace': '*',
      },
    };
    packageLockJson = {
      name: '@nrwl/workspace-src',
      version: '0.0.0',
      lockfileVersion: 2,
      requires: true,
      packages: {
        '': packageJson,
        'node_modules/@nrwl/workspace': {
          version: '15.0.0',
          resolved:
            'https://registry.npmjs.org/@nrwl/workspace/-/@nrwl/workspace-15.0.0.tgz',
          integrity: 'sha512-12345678==',
          dev: true,
        },
        'node_modules/express': {
          version: '4.0.0',
          resolved: 'https://registry.npmjs.org/express/-/express-4.0.0.tgz',
          integrity: 'sha512-12345678==',
          engines: {
            node: '>=4.2.0',
          },
        },
        'node_modules/happy-nrwl': {
          version: '4.0.0',
          resolved:
            'https://registry.npmjs.org/happy-nrwl/-/happy-nrwl-1.0.0.tgz',
          integrity: 'sha512-12345678==',
        },
      },
      dependencies: {
        '@nrwl/workspace': {
          version: '15.0.0',
          resolved:
            'https://registry.npmjs.org/@nrwl/workspace/-/@nrwl/workspace-15.0.0.tgz',
          integrity: 'sha512-12345678==',
          dev: true,
        },
        express: {
          version: '4.0.0',
          resolved: 'https://registry.npmjs.org/express/-/express-4.0.0.tgz',
          integrity: 'sha512-12345678==',
        },
        'happy-nrwl': {
          version: '1.0.0',
          resolved:
            'https://registry.npmjs.org/happy-nrwl/-/happy-nrwl-1.0.0.tgz',
          integrity: 'sha512-12345678==',
        },
      },
    };
    projects = {
      version: 2,
      projects: {
        demo: {
          root: 'apps/demo/',
          sourceRoot: 'apps/demo/src',
          projectType: 'application',
          implicitDependencies: ['api'],
          targets: {},
        },
        'demo-e2e': {
          root: 'apps/demo-e2e/',
          sourceRoot: 'apps/demo-e2e/src',
          projectType: 'application',
          targets: {},
        },
        ui: {
          root: 'libs/ui/',
          sourceRoot: 'libs/ui/src',
          projectType: 'library',
          targets: {},
        },
        'shared-util': {
          root: 'libs/shared/util/',
          sourceRoot: 'libs/shared/util/src',
          projectType: 'library',
          targets: {},
        },
        'shared-util-data': {
          root: 'libs/shared/util/data',
          sourceRoot: 'libs/shared/util/data/src',
          projectType: 'library',
          targets: {},
        },
        'lazy-lib': {
          root: 'libs/lazy-lib',
          sourceRoot: 'libs/lazy-lib',
          projectType: 'library',
          targets: {},
        },
        api: {
          root: 'apps/api/',
          sourceRoot: 'apps/api/src',
          projectType: 'application',
          targets: {},
        },
      },
    };
    nxJson = {
      npmScope: 'nrwl',
      implicitDependencies: {
        'package.json': {
          scripts: {
            deploy: '*',
          },
        },
      },
    };
    tsConfigJson = {
      compilerOptions: {
        baseUrl: '.',
        paths: {
          '@nrwl/shared/util': ['libs/shared/util/src/index.ts'],
          '@nrwl/shared-util-data': ['libs/shared/util/data/src/index.ts'],
          '@nrwl/ui': ['libs/ui/src/index.ts'],
          '@nrwl/lazy-lib': ['libs/lazy-lib/src/index.ts'],
        },
      },
    };
    filesJson = {
      './apps/api/src/index.ts': stripIndents`
        require('express');
      `,
      './apps/demo/src/index.ts': stripIndents`
        import * as ui from '@nrwl/ui';
        import * as data from '@nrwl/shared-util-data;
        const s = { loadChildren: '@nrwl/lazy-lib#LAZY' }
      `,
      './apps/demo-e2e/src/integration/app.spec.ts': stripIndents`
        describe('whatever', () => {});
      `,
      './libs/ui/src/index.ts': stripIndents`
        import * as util from '@nrwl/shared/util';
        import('@nrwl/lazy-lib');
      `,
      './libs/shared/util/src/index.ts': stripIndents`
        import * as happyNrwl from 'happy-nrwl/a/b/c';
      `,
      './libs/shared/util/data/src/index.ts': stripIndents`
        export const SHARED_DATA = 'shared data';
      `,
      './libs/lazy-lib/src/index.ts': stripIndents`
        export const LAZY = 'lazy lib';
      `,
      './package.json': JSON.stringify(packageJson),
      './package-lock.json': JSON.stringify(packageLockJson),
      './nx.json': JSON.stringify(nxJson),
      './workspace.json': JSON.stringify(projects),
      './tsconfig.base.json': JSON.stringify(tsConfigJson),
    };
    vol.reset();
    vol.fromJSON(filesJson, '/root');
  });

  it('should throw an appropriate error for an invalid json config', async () => {
    vol.appendFileSync('/root/tsconfig.base.json', 'invalid');
    try {
      await buildProjectGraph();
      fail('Invalid tsconfigs should cause project graph to throw error');
    } catch (e) {
      expect(e.message).toMatchInlineSnapshot(`
        "InvalidSymbol in /root/tsconfig.base.json at 1:248
        1: {\\"compilerOptions\\":{\\"baseUrl\\":\\".\\",\\"paths\\":{\\"@nrwl/shared/util\\":[\\"libs/shared/util/src/index.ts\\"],\\"@nrwl/shared-util-data\\":[\\"libs/shared/util/data/src/index.ts\\"],\\"@nrwl/ui\\":[\\"libs/ui/src/index.ts\\"],\\"@nrwl/lazy-lib\\":[\\"libs/lazy-lib/src/index.ts\\"]}}}invalid
                                                                                                                                                                                                                                                                  ^^^^^^^ InvalidSymbol
        "
      `);
    }
  });

  it('should create nodes and dependencies with workspace projects', async () => {
    const graph = await buildProjectGraph();

    expect(graph.nodes).toMatchObject({
      api: { name: 'api', type: 'app' },
      'demo-e2e': { name: 'demo-e2e', type: 'e2e' },
      demo: { name: 'demo', type: 'app' },
      ui: { name: 'ui', type: 'lib' },
      'shared-util': { name: 'shared-util', type: 'lib' },
      'shared-util-data': { name: 'shared-util-data', type: 'lib' },
      'lazy-lib': { name: 'lazy-lib', type: 'lib' },
    });
    expect(graph.externalNodes).toMatchObject({
      'npm:happy-nrwl': {
        name: 'npm:happy-nrwl',
        type: 'npm',
        data: {
          packageName: 'happy-nrwl',
        },
      },
      'npm:express': {
        name: 'npm:express',
        type: 'npm',
        data: {
          packageName: 'express',
        },
      },
    });
    expect(graph.dependencies).toEqual({
      api: [{ source: 'api', target: 'npm:express', type: 'static' }],
      demo: [
        { source: 'demo', target: 'api', type: 'implicit' },
        {
          source: 'demo',
          target: 'ui',
          type: 'static',
        },
        { source: 'demo', target: 'shared-util-data', type: 'static' },
        {
          source: 'demo',
          target: 'lazy-lib',
          type: 'static',
        },
      ],
      'demo-e2e': [],
      'lazy-lib': [],
      'shared-util': [
        { source: 'shared-util', target: 'npm:happy-nrwl', type: 'static' },
      ],
      'shared-util-data': [],
      ui: [
        { source: 'ui', target: 'shared-util', type: 'static' },
        {
          source: 'ui',
          target: 'lazy-lib',
          type: 'static',
        },
      ],
    });
  });

  it('should update the graph if a project got renamed', async () => {
    let graph = await buildProjectGraph();
    expect(graph.nodes).toMatchObject({
      demo: { name: 'demo', type: 'app' },
    });
    projects.projects.renamed = projects.projects.demo;
    fs.writeFileSync('/root/workspace.json', JSON.stringify(projects));

    graph = await buildProjectGraph();
    expect(graph.nodes).toMatchObject({
      renamed: { name: 'renamed', type: 'app' },
    });
  });

  it('should handle circular dependencies', async () => {
    fs.writeFileSync(
      '/root/libs/shared/util/src/index.ts',
      `import * as ui from '@nrwl/ui';`
    );

    const graph = await buildProjectGraph();

    expect(graph.dependencies['shared-util']).toEqual([
      {
        type: DependencyType.static,
        source: 'shared-util',
        target: 'ui',
      },
    ]);
    expect(graph.dependencies['ui']).toEqual([
      {
        type: DependencyType.static,
        source: 'ui',
        target: 'shared-util',
      },
      {
        type: DependencyType.static,
        source: 'ui',
        target: 'lazy-lib',
      },
    ]);
  });
});
