export interface SetUpDockerOptions {
  projectName: string;
  targetName?: string;
  buildTarget?: string;
  skipPackageJson?: boolean;
  skipFormat?: boolean;
}
