import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  unlinkSync,
  rmdirSync,
} from 'node:fs';
import { resolve, join, relative, isAbsolute, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const cliPath = join(backendRoot, 'node_modules/prisma/build/index.js');

// Remove somente entradas do diretório criado por este teste.
function removeFixture(directory, fixtureRoot = directory) {
  const target = resolve(directory);
  const root = resolve(fixtureRoot);
  const childPath = relative(root, target);

  if (
    dirname(root) !== join(backendRoot, 'node_modules') ||
    !basename(root).startsWith('.civix-prisma-probe-') ||
    childPath.startsWith('..') ||
    isAbsolute(childPath)
  ) {
    throw new Error(
      'O diretório de limpeza deve permanecer dentro da fixture do teste',
    );
  }

  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const path = join(target, entry.name);

    if (entry.isDirectory()) {
      removeFixture(path, root);
    } else {
      unlinkSync(path);
    }
  }

  rmdirSync(target);
}

function withFixture(check) {
  const scratch = mkdtempSync(
    join(backendRoot, 'node_modules', '.civix-prisma-probe-'),
  );

  try {
    const schemaPath = join(scratch, 'schema.prisma');
    const generatedPath = join(scratch, 'generated');
    const configPath = join(scratch, 'prisma.config.ts');

    writeFileSync(
      schemaPath,
      `generator client {
  provider = "prisma-client"
  output = ${JSON.stringify(generatedPath.replaceAll('\\', '/'))}
}
datasource db {
  provider = "postgresql"
}
model MigrationProbe {
  id String @id
}
`,
    );
    writeFileSync(
      configPath,
      `export default {
  schema: ${JSON.stringify(schemaPath)},
  datasource: { url: 'postgresql://probe:probe@127.0.0.1:1/probe' }
};
`,
    );

    const run = (args) => {
      try {
        return execFileSync(
          process.execPath,
          [cliPath, ...args, '--config', configPath],
          {
            cwd: backendRoot,
            // Somente comandos offline; não carregar configuração ou URL real.
            env: {
              ...process.env,
              DATABASE_URL: 'postgresql://probe:probe@127.0.0.1:1/probe',
              PRISMA_HIDE_UPDATE_MESSAGE: '1',
              CHECKPOINT_DISABLE: '1',
            },
            encoding: 'utf8',
            timeout: 60_000,
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        );
      } catch (error) {
        throw new Error(
          `Falha no comando Prisma da fixture: ${error.stderr || error.message}`,
          {
            cause: error,
          },
        );
      }
    };

    check({ schemaPath, generatedPath, run });
  } finally {
    removeFixture(scratch);
  }
}

test('Prisma 7 valida e gera um cliente sem banco de dados', () => {
  withFixture(({ schemaPath, generatedPath, run }) => {
    assert.match(run(['validate', '--schema', schemaPath]), /valid/i);
    run(['generate', '--schema', schemaPath]);
    assert.ok(existsSync(join(generatedPath, 'client.ts')));
  });
});

test('SQL nativo de criação e inversão pode ser gerado offline', () => {
  withFixture(({ schemaPath, run }) => {
    const upSql = run([
      'migrate',
      'diff',
      '--from-empty',
      '--to-schema',
      schemaPath,
      '--script',
    ]);

    assert.match(upSql, /CREATE TABLE "MigrationProbe"/);
    assert.match(upSql, /PRIMARY KEY/);

    const inverseSql = run([
      'migrate',
      'diff',
      '--from-schema',
      schemaPath,
      '--to-empty',
      '--script',
    ]);

    assert.match(inverseSql, /DROP TABLE (?:"public"\.)?"MigrationProbe"/);
  });
});

test('CLI, client e adapter PostgreSQL usam a mesma versão exata aprovada', () => {
  const manifest = JSON.parse(readFileSync(join(backendRoot, 'package.json'), 'utf8'));
  const lock = JSON.parse(readFileSync(join(backendRoot, 'package-lock.json'), 'utf8'));
  const version = manifest.devDependencies.prisma;

  assert.equal(version, '7.10.0');
  assert.equal(manifest.dependencies['@prisma/client'], version);
  assert.equal(manifest.dependencies['@prisma/adapter-pg'], version);

  for (const name of ['prisma', '@prisma/client', '@prisma/adapter-pg']) {
    assert.equal(lock.packages[`node_modules/${name}`].version, version);

    const installed = JSON.parse(
      readFileSync(join(backendRoot, `node_modules/${name}/package.json`), 'utf8'),
    );

    assert.equal(installed.version, version);
  }
});
