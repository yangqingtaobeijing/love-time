import type { ExportData, GitHubCloudSettings } from '../types'

interface GitHubContentFile {
  type: 'file'
  sha: string
  content: string
  encoding: 'base64'
}

export interface GitHubSaveResult {
  sha: string
  htmlUrl?: string
}

function trimSettings(settings: GitHubCloudSettings) {
  return {
    owner: settings.owner.trim(),
    repo: settings.repo.trim(),
    branch: settings.branch.trim() || 'main',
    path: settings.path.trim().replace(/^\/+/, '') || 'love-time-data.json',
    token: settings.token.trim(),
  }
}

function validateSettings(settings: GitHubCloudSettings): ReturnType<typeof trimSettings> {
  const normalized = trimSettings(settings)
  if (!normalized.owner || !normalized.repo || !normalized.token) {
    throw new Error('请填写 GitHub 用户名、仓库名和 token')
  }
  return normalized
}

function contentUrl(owner: string, repo: string, path: string) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function decodeBase64(value: string) {
  const binary = atob(value.replace(/\s/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

async function githubFetch(url: string, token: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/vnd.github+json')
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('X-GitHub-Api-Version', '2022-11-28')

  const response = await fetch(url, {
    ...init,
    headers,
  })

  if (response.ok) return response

  let message = `GitHub 请求失败：${response.status}`
  try {
    const body = await response.json() as { message?: string }
    if (body.message) message = body.message
  } catch {
    /* keep default */
  }
  throw new Error(message)
}

async function getRemoteFile(settings: GitHubCloudSettings): Promise<GitHubContentFile | null> {
  const normalized = validateSettings(settings)
  const url = `${contentUrl(normalized.owner, normalized.repo, normalized.path)}?ref=${encodeURIComponent(normalized.branch)}`

  try {
    const response = await githubFetch(url, normalized.token)
    const body = await response.json() as GitHubContentFile | GitHubContentFile[]
    if (Array.isArray(body) || body.type !== 'file') {
      throw new Error('云端路径不是 JSON 文件')
    }
    return body
  } catch (error) {
    if (error instanceof Error && error.message === 'Not Found') return null
    throw error
  }
}

export async function testGitHubAccess(settings: GitHubCloudSettings): Promise<void> {
  const normalized = validateSettings(settings)
  const url = `https://api.github.com/repos/${encodeURIComponent(normalized.owner)}/${encodeURIComponent(normalized.repo)}`
  await githubFetch(url, normalized.token)
}

export async function loadDataFromGitHub(settings: GitHubCloudSettings): Promise<ExportData | null> {
  const remoteFile = await getRemoteFile(settings)
  if (!remoteFile) return null
  const raw = JSON.parse(decodeBase64(remoteFile.content)) as ExportData
  if (raw.app !== 'love-timeline' || typeof raw.version !== 'number' || !raw.data) {
    throw new Error('云端数据格式不正确')
  }
  return raw
}

export async function saveDataToGitHub(settings: GitHubCloudSettings, data: ExportData): Promise<GitHubSaveResult> {
  const normalized = validateSettings(settings)
  const remoteFile = await getRemoteFile(settings)
  const url = contentUrl(normalized.owner, normalized.repo, normalized.path)
  const response = await githubFetch(url, normalized.token, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Sync love-time data ${new Date().toISOString()}`,
      content: encodeBase64(JSON.stringify(data, null, 2)),
      branch: normalized.branch,
      sha: remoteFile?.sha,
    }),
  })

  const body = await response.json() as {
    content?: {
      sha?: string
      html_url?: string
    }
  }

  return {
    sha: body.content?.sha ?? '',
    htmlUrl: body.content?.html_url,
  }
}
