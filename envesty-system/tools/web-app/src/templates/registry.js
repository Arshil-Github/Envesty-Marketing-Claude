// Auto-imports all templates via Vite glob.
const modules = import.meta.glob('./T*.jsx', { eager: true })

export const templateRegistry = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => {
    const name = path.replace(/^\.\//, '').replace(/\.jsx$/, '')
    return [name, mod.default]
  }),
)
