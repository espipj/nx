import {
  addDependenciesToPackageJson,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  logger,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { writeFileSync } from 'fs-extra';
import { SetUpDockerOptions } from './schema';

function normalizeOptions(
  setupOptions: SetUpDockerOptions
): SetUpDockerOptions {
  return {
    ...setupOptions,
    buildTarget: setupOptions.buildTarget ?? 'build',
  };
}

function addDocker(tree: Tree, options: SetUpDockerOptions) {
  const project = readProjectConfiguration(tree, options.projectName);
  if (!project || !options.targetName) {
    return;
  }

  if (tree.exists(joinPathFragments(project.root, 'DockerFile'))) {
    logger.info(
      `Skipping setup since a DockFile already exists inside ${project.root}`
    );
  }
  const outputPath =
    project.targets[`${options.buildTarget}`]?.options.outputPath;
  generateFiles(tree, joinPathFragments(__dirname, './files'), project.root, {
    tmpl: '',
    app: project.sourceRoot,
    buildLocation: outputPath,
  });
}

export function updateProjectConfig(tree: Tree, options: SetUpDockerOptions) {
  let projectConfig = readProjectConfiguration(tree, options.projectName);

  const buildPort = process.env.PORT ?? 3000;

  projectConfig.targets[`${options.targetName}`] = {
    dependsOn: [`${options.buildTarget}`],
    executor: 'nx:run-commands',
    options: {
      command: `docker run -p${buildPort}:${buildPort}`,
    },
  };

  updateProjectConfiguration(tree, options.projectName, projectConfig);
}

export async function setupDockerGenerator(
  tree: Tree,
  setupOptions: SetUpDockerOptions
) {
  const tasks: GeneratorCallback[] = [];
  const options = normalizeOptions(setupOptions);
  // Should check if the node project exists
  addDocker(tree, options);
  updateProjectConfig(tree, options);

  if (!options.skipPackageJson) {
    tasks.push(
      addDependenciesToPackageJson(
        tree,
        {},
        {
          docker: 'latest',
        }
      )
    );
  }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}

export default setupDockerGenerator;
export const setupDockerSchematic = convertNxGenerator(setupDockerGenerator);
