const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface ApiResponse<T> {
  data?: T
  error?: string
}

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }

  // Add access token if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  console.log(`[API Call] GET ${url}`)

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`[API Error] ${response.status} ${endpoint}:`, error)
    throw new Error(error || `API error: ${response.status}`)
  }

  const data = await response.json()
  return data
}

export async function getProjects() {
  const response = await apiCall<any>('/projects')
  
  console.log('[getProjects] Raw API response:', response)
  
  let projectsArray: any[] = []
  
  // Handle nested structure: { data: { projects: [...] } }
  if (response.data?.projects && Array.isArray(response.data.projects)) {
    console.log('[getProjects] Found data.projects (nested)')
    projectsArray = response.data.projects
  }
  // Handle direct array (most likely based on API spec)
  else if (Array.isArray(response)) {
    console.log('[getProjects] Found direct array')
    projectsArray = response
  }
  // Handle wrapped in 'projects' property
  else if (response.projects && Array.isArray(response.projects)) {
    console.log('[getProjects] Found response.projects')
    projectsArray = response.projects
  }
  // Handle wrapped in 'data' property (single array)
  else if (response.data && Array.isArray(response.data)) {
    console.log('[getProjects] Found response.data')
    projectsArray = response.data
  }
  else {
    console.error('[getProjects] Could not find projects array in response')
    return []
  }
  
  // Transform the projects to ensure they have 'key' properties
  console.log('[getProjects] Transforming', projectsArray.length, 'projects')
  const transformedProjects = transformProjects(projectsArray)
  
  console.log('[getProjects] Transformed projects:', transformedProjects)
  return transformedProjects
}

/**
 * Transform API response to match expected format.
 * 
 * API returns:
 * {
 *   project_key: "RD",
 *   name: "Report Dashboard",
 *   releases: [
 *     { id: "uuid", name: "v1.0" }
 *   ]
 * }
 * 
 * We transform to:
 * {
 *   key: "RD",
 *   name: "Report Dashboard",
 *   releases: [
 *     { key: "uuid", name: "v1.0" }
 *   ]
 * }
 */
function transformProjects(projects: any[]) {
  return projects.map((project) => {
    // Map 'project_key' from API to 'key' for the app
    const projectKey = project.project_key || project.key
    
    console.log(`[transformProjects] Project "${project.name}" → key: "${projectKey}"`)
    
    // Transform releases: map 'id' to 'key'
    const transformedReleases = (project.releases || []).map((release: any) => {
      // Use the UUID 'id' as the release key for API calls
      const releaseKey = release.id
      
      console.log(`  └─ Release "${release.name}" → key: "${releaseKey}"`)
      
      return {
        key: releaseKey,  // Use UUID for API requests
        name: release.name,
      }
    })
    
    return {
      key: projectKey,  // Use project_key from API (e.g., "RD")
      name: project.name,
      releases: transformedReleases,
    }
  })
}

export async function getReports(projectKey: string, releaseKey: string) {
  console.log(`[getReports] Fetching reports for project="${projectKey}" release="${releaseKey}"`)
  
  // API endpoint: GET /projects/:projectKey/releases/:releaseKey
  // This returns all report data we need (no additional API calls required)
  // Response format:
  // {
  //   jmeter_runs: [...],
  //   pytest_runs: [...]
  // }
  const endpoint = `/projects/${projectKey}/releases/${releaseKey}`
  
  console.log(`[getReports] Calling endpoint: ${endpoint}`)
  
  const response = await apiCall(endpoint)
  console.log('[getReports] Response received:', response)
  
  return response
}

export async function login(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[login] Login failed:', error)
    throw new Error('Login failed')
  }

  const data = await response.json()
  console.log('[login] Login successful')
  return data
}

export async function generateReport(runId: string) {
  return await apiCall<any>(`/jmeter_runs/generate_report/${runId}`, {
    method: 'GET',
  })
}

/**
 * DEPRECATED: Do not use these functions.
 * 
 * The data is already available from getReports() which returns
 * complete report information. These individual fetch calls are unnecessary.
 * 
 * Use the data directly from:
 * const { jmeter_runs, pytest_runs } = await getReports(projectKey, releaseKey)
 */

export async function getJmeterRun(runId: string) {
  console.warn('[getJmeterRun] DEPRECATED: Use data from getReports() instead')
  return apiCall(`/jmeter_runs/${runId}`)
}

export async function getPytestRun(runId: string) {
  console.warn('[getPytestRun] DEPRECATED: Use data from getReports() instead')
  return apiCall(`/pytest_runs/${runId}`)
}