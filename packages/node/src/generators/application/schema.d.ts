import { Linter } from '@nrwl/linter';

export interface Schema {
  name: string;
  skipFormat?: boolean;
  skipPackageJson?: boolean;
  directory?: string;
  unitTestRunner?: 'jest' | 'none';
  e2eTestRunner?: 'jest' | 'none';
  linter?: Linter;
  tags?: string;
  frontendProject?: string;
  babelJest?: boolean;
  js?: boolean;
  pascalCaseFiles?: boolean;
  setParserOptionsProject?: boolean;
  standaloneConfig?: boolean;
  bundler?: 'esbuild' | 'webpack';
  framework?: NodeJsFrameWorks;
  port?: number;
  rootProject?: boolean;
}

export type NodeJsFrameWorks =
  | 'express'
  | 'koa'
  | 'fastify'
  | 'connect'
  | 'none';
