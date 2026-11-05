import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { environmentValues, requests } from './generate.mjs'

const postmanDirectory = join(fileURLToPath(new URL('..', import.meta.url)))

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path))
    else files.push(path)
  }
  return files
}

function flatten(items) {
  return items.flatMap((item) => item.request ? [item] : flatten(item.item ?? []))
}

const collectionPath = join(postmanDirectory, 'import', 'Civix API.postman_collection.json')
const collection = JSON.parse(await readFile(collectionPath, 'utf8'))
const importedRequests = flatten(collection.item)
const v3Requests = (await walk(join(postmanDirectory, 'collections', 'civix-api')))
  .filter((path) => path.endsWith('.request.yaml'))

if (importedRequests.length !== requests.length) {
  throw new Error(`Exportação v2.1 possui ${importedRequests.length} requests; esperado: ${requests.length}.`)
}

if (v3Requests.length !== requests.length) {
  throw new Error(`Collection v3 possui ${v3Requests.length} requests; esperado: ${requests.length}.`)
}

for (const item of importedRequests) {
  for (const event of item.event ?? []) {
    const source = (event.script?.exec ?? []).join('\n')
    try {
      new Function(source)
    } catch (error) {
      throw new Error(`Script ${event.listen} inválido em "${item.name}": ${error.message}`)
    }
  }
}

const uniqueRoutes = new Set(requests.map((route) => `${route.method} ${route.path} ${route.file}`))
if (uniqueRoutes.size !== requests.length) throw new Error('Há requests duplicadas no manifesto.')

const mountedEndpoints = new Set(requests
  .filter((route) => route.folder[0] !== '90-validation-cases')
  .map((route) => `${route.method} ${route.path}`))
if (mountedEndpoints.size !== 53) {
  throw new Error(`A collection cobre ${mountedEndpoints.size} endpoints montados; esperado: 53.`)
}

for (const environmentFile of ['Civix Local.postman_environment.json', 'Civix Staging.postman_environment.json']) {
  const environment = JSON.parse(await readFile(join(postmanDirectory, 'import', environmentFile), 'utf8'))
  const exposedSecret = environment.values.find((value) => value.type === 'secret' && value.value)
  if (exposedSecret) throw new Error(`${environmentFile} contém segredo preenchido: ${exposedSecret.key}.`)
}

const secretKeys = new Set(environmentValues
  .filter(([, , type]) => type === 'secret')
  .map(([key]) => key))

for (const key of secretKeys) {
  const collectionVariable = collection.variable.find((value) => value.key === key)
  if (!collectionVariable || collectionVariable.value !== '') {
    throw new Error(`A variável secreta ${key} não está vazia na collection exportada.`)
  }
}

const generatedTextFiles = [
  ...(await walk(join(postmanDirectory, 'collections'))),
  ...(await walk(join(postmanDirectory, 'environments'))),
  ...(await walk(join(postmanDirectory, 'import'))),
].filter((path) => /\.(?:json|ya?ml)$/i.test(path))

const sensitivePatterns = [
  { name: 'JWT literal', pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/ },
  { name: 'URL de banco com credenciais', pattern: /(?:postgres(?:ql)?|mysql):\/\/[^\s:@/]+:[^\s@/]+@/i },
  { name: 'caminho absoluto do Windows', pattern: /[A-Za-z]:\\(?:Users|Documents|Desktop)\\/i },
]

for (const path of generatedTextFiles) {
  const content = await readFile(path, 'utf8')
  for (const { name, pattern } of sensitivePatterns) {
    if (pattern.test(content)) throw new Error(`${name} encontrado em ${path}.`)
  }
}

console.log(`Validação local concluída: ${requests.length} requests para ${mountedEndpoints.size} endpoints montados em v3 e v2.1, sem segredos exportados.`)
