import { execFileSync } from 'node:child_process';
import { extname, relative, resolve } from 'node:path';
import ts from 'typescript';

function runGit(repositoryRoot, args, encoding = 'utf8') {
  return execFileSync('git', args, {
    cwd: repositoryRoot,
    encoding: encoding === 'buffer' ? null : encoding,
    maxBuffer: 512 * 1024 * 1024
  });
}

export function computeHarnessImportGraph(repositoryRoot, revision, entryPoint) {
  const root = resolve(repositoryRoot);
  const treeEntries = runGit(root, [
    'ls-tree',
    '-r',
    '--format=%(objectname)%x09%(path)',
    revision
  ]).split(/\r?\n/).filter(Boolean).map(line => {
    const separator = line.indexOf('\t');
    return { objectId: line.slice(0, separator), path: line.slice(separator + 1) };
  });
  const treeFiles = new Set(treeEntries.map(entry => entry.path));
  const sourceCache = new Map();
  const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.json', '.css']);
  const sourceEntries = treeEntries.filter(entry => sourceExtensions.has(extname(entry.path)));
  if (sourceEntries.length > 0) {
    const batch = execFileSync('git', ['cat-file', '--batch'], {
      cwd: root,
      input: `${sourceEntries.map(entry => entry.objectId).join('\n')}\n`,
      encoding: null,
      maxBuffer: 512 * 1024 * 1024
    });
    let offset = 0;
    for (const entry of sourceEntries) {
      const headerEnd = batch.indexOf(10, offset);
      if (headerEnd < 0) throw new Error(`Invalid git cat-file response for ${entry.path}.`);
      const header = batch.subarray(offset, headerEnd).toString('utf8').split(' ');
      const size = Number(header[2]);
      if (header[0] !== entry.objectId || header[1] !== 'blob' || !Number.isInteger(size)) {
        throw new Error(`Invalid git blob header for ${entry.path}.`);
      }
      const contentStart = headerEnd + 1;
      const contentEnd = contentStart + size;
      sourceCache.set(entry.path, batch.subarray(contentStart, contentEnd).toString('utf8'));
      offset = contentEnd + 1;
    }
  }
  const repositoryPath = fileName =>
    relative(root, resolve(fileName)).replace(/\\/g, '/');
  const isRepositoryPath = fileName => {
    const path = repositoryPath(fileName);
    return path !== '..' && !path.startsWith('../') && !path.startsWith('node_modules/');
  };
  const readRevisionFile = fileName => {
    const path = repositoryPath(fileName);
    if (!treeFiles.has(path)) return undefined;
    return sourceCache.get(path);
  };
  const revisionConfigHost = {
    ...ts.sys,
    fileExists: fileName => isRepositoryPath(fileName)
      ? treeFiles.has(repositoryPath(fileName))
      : ts.sys.fileExists(fileName),
    readFile: fileName => readRevisionFile(fileName) ?? ts.sys.readFile(fileName)
  };
  const tsconfigText = runGit(root, ['show', `${revision}:tsconfig.json`]);
  const parsedJson = ts.parseConfigFileTextToJson(`${root}/tsconfig.json`, tsconfigText);
  if (parsedJson.error) {
    throw new Error(ts.flattenDiagnosticMessageText(parsedJson.error.messageText, '\n'));
  }
  const parsedConfig = ts.parseJsonConfigFileContent(parsedJson.config, revisionConfigHost, root);
  const configErrors = parsedConfig.errors.filter(
    diagnostic => diagnostic.category === ts.DiagnosticCategory.Error
  );
  if (configErrors.length > 0) {
    const details = configErrors.map(diagnostic =>
      `TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`
    );
    throw new Error(`Invalid TypeScript configuration at ${revision}:\n${details.join('\n')}`);
  }
  const options = parsedConfig.options;
  const host = ts.createCompilerHost(options);
  const nativeFileExists = host.fileExists.bind(host);
  const nativeDirectoryExists = host.directoryExists?.bind(host);
  const nativeGetDirectories = host.getDirectories.bind(host);
  const nativeReadFile = host.readFile.bind(host);
  const nativeGetSourceFile = host.getSourceFile.bind(host);
  host.fileExists = fileName => isRepositoryPath(fileName)
    ? treeFiles.has(repositoryPath(fileName))
    : nativeFileExists(fileName);
  host.directoryExists = directoryName => {
    if (!isRepositoryPath(directoryName)) {
      return nativeDirectoryExists?.(directoryName) ?? false;
    }
    const directory = repositoryPath(directoryName).replace(/\/$/, '');
    const prefix = directory.length > 0 ? `${directory}/` : '';
    return [...treeFiles].some(file => file.startsWith(prefix));
  };
  host.getDirectories = directoryName => {
    if (!isRepositoryPath(directoryName)) return nativeGetDirectories(directoryName);
    const directory = repositoryPath(directoryName).replace(/\/$/, '');
    const prefix = directory.length > 0 ? `${directory}/` : '';
    const children = new Set();
    for (const file of treeFiles) {
      if (!file.startsWith(prefix)) continue;
      const firstSegment = file.slice(prefix.length).split('/')[0];
      if (firstSegment && firstSegment !== file.slice(prefix.length)) children.add(firstSegment);
    }
    return [...children];
  };
  host.readFile = fileName => readRevisionFile(fileName) ?? nativeReadFile(fileName);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    const revisionContent = readRevisionFile(fileName);
    if (revisionContent !== undefined) {
      return ts.createSourceFile(fileName, revisionContent, languageVersion, true);
    }
    return nativeGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  };

  const entryAbsolutePath = resolve(root, entryPoint);
  const matchesPathPattern = specifier => Object.keys(options.paths ?? {}).some(pattern => {
    const wildcardIndex = pattern.indexOf('*');
    if (wildcardIndex < 0) return specifier === pattern;
    const prefix = pattern.slice(0, wildcardIndex);
    const suffix = pattern.slice(wildcardIndex + 1);
    return specifier.startsWith(prefix)
      && specifier.endsWith(suffix)
      && specifier.length >= prefix.length + suffix.length;
  });
  const hasBaseUrlCandidate = specifier => {
    if (!options.baseUrl) return false;
    const candidatePath = repositoryPath(resolve(options.baseUrl, specifier));
    return treeFiles.has(candidatePath)
      || [...treeFiles].some(path =>
        path.startsWith(`${candidatePath}/`)
        || path.startsWith(`${candidatePath}.`)
      );
  };
  const visited = new Set();
  const edges = new Set();
  const runtimeLoadLimitations = new Set();
  const visit = fileName => {
    const normalizedFile = resolve(fileName);
    if (visited.has(normalizedFile)) return;
    visited.add(normalizedFile);
    const content = readRevisionFile(normalizedFile);
    if (content === undefined) {
      throw new Error(`Harness dependency is missing at ${revision}:${repositoryPath(normalizedFile)}.`);
    }
    const sourceFile = ts.createSourceFile(
      normalizedFile,
      content,
      options.target ?? ts.ScriptTarget.Latest,
      true
    );
    const moduleSpecifiers = [];
    const recordSpecifier = (specifier, loadKind) => moduleSpecifiers.push({ specifier, loadKind });
    const inspect = node => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
        && node.moduleSpecifier
        && ts.isStringLiteralLike(node.moduleSpecifier)) {
        recordSpecifier(node.moduleSpecifier.text, 'static');
      } else if (ts.isImportEqualsDeclaration(node)
        && ts.isExternalModuleReference(node.moduleReference)
        && node.moduleReference.expression
        && ts.isStringLiteralLike(node.moduleReference.expression)) {
        recordSpecifier(node.moduleReference.expression.text, 'import-equals');
      } else if (ts.isImportTypeNode(node)
        && ts.isLiteralTypeNode(node.argument)
        && ts.isStringLiteralLike(node.argument.literal)) {
        recordSpecifier(node.argument.literal.text, 'type');
      } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteralLike(argument)) {
          recordSpecifier(argument.text, 'dynamic-import');
        } else {
          runtimeLoadLimitations.add(
            `${repositoryPath(normalizedFile)}:${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}:dynamic-import`
          );
        }
      } else if (ts.isCallExpression(node)
        && ts.isIdentifier(node.expression)
        && node.expression.text === 'require') {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteralLike(argument)) {
          recordSpecifier(argument.text, 'require');
        } else {
          runtimeLoadLimitations.add(
            `${repositoryPath(normalizedFile)}:${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}:nonliteral-require`
          );
        }
      }
      ts.forEachChild(node, inspect);
    };
    inspect(sourceFile);

    for (const { specifier, loadKind } of moduleSpecifiers) {
      const resolution = ts.resolveModuleName(specifier, normalizedFile, options, host).resolvedModule;
      if (!resolution) {
        if (specifier.startsWith('.') || specifier.startsWith('/')) {
          throw new Error(
            `Cannot resolve ${loadKind} import ${specifier} from ${repositoryPath(normalizedFile)} at ${revision}.`
          );
        }
        if (matchesPathPattern(specifier) || hasBaseUrlCandidate(specifier)) {
          throw new Error(
            `Cannot resolve ${loadKind} import ${specifier} via paths/baseUrl at ${revision}.`
          );
        }
        continue;
      }
      const resolvedPath = resolve(resolution.resolvedFileName);
      if (isRepositoryPath(resolvedPath) && treeFiles.has(repositoryPath(resolvedPath))) {
        edges.add(`${repositoryPath(normalizedFile)} -> ${repositoryPath(resolvedPath)} (${loadKind})`);
        visit(resolvedPath);
      }
    }
  };
  visit(entryAbsolutePath);
  return {
    dependencies: [...visited].map(repositoryPath).sort(),
    edges: [...edges].sort(),
    runtimeLoadLimitations: [...runtimeLoadLimitations].sort()
  };
}
