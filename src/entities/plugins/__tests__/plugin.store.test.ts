import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePluginStore } from '../plugin.store'

// Mock the db module
vi.mock('@/shared/lib/db', () => ({
  getAllPlugins: vi.fn(() => Promise.resolve([])),
  putPlugin: vi.fn(() => Promise.resolve()),
  deletePluginFromDb: vi.fn(() => Promise.resolve()),
}))

describe('PluginStore', () => {
  beforeEach(() => {
    usePluginStore.setState({
      plugins: [],
      searchQuery: '',
      selectedPluginId: null,
    })
  })

  it('should add a new plugin', () => {
    const { addPlugin } = usePluginStore.getState()

    addPlugin({
      name: 'Test Plugin',
      description: 'A test plugin',
      icon: '🧪',
      version: '1.0.0',
      author: 'Test Author',
      status: 'available',
      permissions: ['read', 'write'],
      config: { enabled: true },
    })

    const plugins = usePluginStore.getState().plugins
    expect(plugins).toHaveLength(1)
    expect(plugins[0].name).toBe('Test Plugin')
    expect(plugins[0].id).toMatch(/^plugin-/)
  })

  it('should install a plugin', () => {
    const { addPlugin, installPlugin } = usePluginStore.getState()

    // Add a plugin first
    addPlugin({
      name: 'Test Plugin',
      description: 'Test',
      icon: '🧪',
      version: '1.0.0',
      author: 'Test',
      status: 'available',
      permissions: ['read'],
      config: {},
    })

    const pluginId = usePluginStore.getState().plugins[0].id

    installPlugin(pluginId)

    const updatedPlugin = usePluginStore.getState().plugins[0]
    expect(updatedPlugin.status).toBe('installed')
    expect(updatedPlugin.installedAt).toBeDefined()
  })

  it('should uninstall a plugin', () => {
    const { addPlugin, installPlugin, uninstallPlugin } = usePluginStore.getState()

    // Add and install a plugin
    addPlugin({
      name: 'Test Plugin',
      description: 'Test',
      icon: '🧪',
      version: '1.0.0',
      author: 'Test',
      status: 'available',
      permissions: ['read'],
      config: {},
    })

    const pluginId = usePluginStore.getState().plugins[0].id
    installPlugin(pluginId)

    // Now uninstall it
    uninstallPlugin(pluginId)

    const updatedPlugin = usePluginStore.getState().plugins[0]
    expect(updatedPlugin.status).toBe('available')
    expect(updatedPlugin.installedAt).toBeUndefined()
  })

  it('should enable and disable a plugin', () => {
    const { addPlugin, installPlugin, disablePlugin, enablePlugin } = usePluginStore.getState()

    // Add and install a plugin
    addPlugin({
      name: 'Test Plugin',
      description: 'Test',
      icon: '🧪',
      version: '1.0.0',
      author: 'Test',
      status: 'available',
      permissions: ['read'],
      config: {},
    })

    const pluginId = usePluginStore.getState().plugins[0].id
    installPlugin(pluginId)

    // Disable the plugin
    disablePlugin(pluginId)
    expect(usePluginStore.getState().plugins[0].status).toBe('disabled')

    // Enable the plugin
    enablePlugin(pluginId)
    expect(usePluginStore.getState().plugins[0].status).toBe('installed')
  })

  it('should update plugin config', () => {
    const { addPlugin, updateConfig } = usePluginStore.getState()

    addPlugin({
      name: 'Test Plugin',
      description: 'Test',
      icon: '🧪',
      version: '1.0.0',
      author: 'Test',
      status: 'available',
      permissions: ['read'],
      config: { enabled: false },
    })

    const pluginId = usePluginStore.getState().plugins[0].id
    const newConfig = { enabled: true, apiKey: 'test-key' }

    updateConfig(pluginId, newConfig)

    expect(usePluginStore.getState().plugins[0].config).toEqual(newConfig)
  })

  it('should delete a plugin', () => {
    const { addPlugin, deletePlugin, selectPlugin } = usePluginStore.getState()

    // Add two plugins
    addPlugin({
      name: 'Plugin 1',
      description: 'Test',
      icon: '🧪',
      version: '1.0.0',
      author: 'Test',
      status: 'available',
      permissions: ['read'],
      config: {},
    })

    addPlugin({
      name: 'Plugin 2',
      description: 'Test',
      icon: '🔧',
      version: '1.0.0',
      author: 'Test',
      status: 'available',
      permissions: ['write'],
      config: {},
    })

    const plugins = usePluginStore.getState().plugins
    const pluginToDelete = plugins[0].id
    const pluginToKeep = plugins[1].id

    // Select the plugin to delete
    selectPlugin(pluginToDelete)

    deletePlugin(pluginToDelete)

    const remainingPlugins = usePluginStore.getState().plugins
    expect(remainingPlugins).toHaveLength(1)
    expect(remainingPlugins[0].id).toBe(pluginToKeep)
    expect(usePluginStore.getState().selectedPluginId).toBeNull()
  })

  it('should get installed plugins', () => {
    const { addPlugin, installPlugin, getInstalled } = usePluginStore.getState()

    // Add multiple plugins with different statuses
    addPlugin({
      name: 'Plugin 1',
      description: 'Test',
      icon: '1️⃣',
      version: '1.0.0',
      author: 'Test',
      status: 'available',
      permissions: ['read'],
      config: {},
    })

    addPlugin({
      name: 'Plugin 2',
      description: 'Test',
      icon: '2️⃣',
      version: '1.0.0',
      author: 'Test',
      status: 'available',
      permissions: ['write'],
      config: {},
    })

    const plugins = usePluginStore.getState().plugins
    installPlugin(plugins[0].id)
    installPlugin(plugins[1].id)

    const installed = getInstalled()
    expect(installed).toHaveLength(2)
    expect(installed.every(p => p.status === 'installed')).toBe(true)
  })

  it('should get available plugins', () => {
    const { addPlugin, installPlugin, getAvailable } = usePluginStore.getState()

    // Add multiple plugins
    addPlugin({
      name: 'Plugin 1',
      description: 'Test',
      icon: '1️⃣',
      version: '1.0.0',
      author: 'Test',
      status: 'available',
      permissions: ['read'],
      config: {},
    })

    addPlugin({
      name: 'Plugin 2',
      description: 'Test',
      icon: '2️⃣',
      version: '1.0.0',
      author: 'Test',
      status: 'available',
      permissions: ['write'],
      config: {},
    })

    const plugins = usePluginStore.getState().plugins

    // Install only the first one
    installPlugin(plugins[0].id)

    const available = getAvailable()
    expect(available).toHaveLength(1)
    expect(available[0].name).toBe('Plugin 2')
  })

  it('should set and filter by search query', () => {
    const { addPlugin, setSearchQuery } = usePluginStore.getState()

    addPlugin({
      name: 'Code Formatter',
      description: 'Formats code',
      icon: '🔧',
      version: '1.0.0',
      author: 'Test',
      status: 'available',
      permissions: ['read', 'write'],
      config: {},
    })

    addPlugin({
      name: 'Image Analyzer',
      description: 'Analyzes images',
      icon: '🖼️',
      version: '1.0.0',
      author: 'Test',
      status: 'available',
      permissions: ['read'],
      config: {},
    })

    setSearchQuery('code')

    expect(usePluginStore.getState().searchQuery).toBe('code')
  })

  it('should hydrate plugins from database with defaults', async () => {
    const { hydrate } = usePluginStore.getState()
    const { getAllPlugins, putPlugin } = await import('@/shared/lib/db')

    // Mock empty database to trigger default plugins
    vi.mocked(getAllPlugins).mockResolvedValueOnce([])
    vi.mocked(putPlugin).mockResolvedValue(undefined)

    await hydrate()

    const plugins = usePluginStore.getState().plugins
    expect(plugins.length).toBeGreaterThan(0)
    expect(plugins[0].name).toBe('Code Formatter')
  })
})