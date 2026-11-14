// URL of a file in /public, respecting the deploy base path
// ("/" for Tauri, "/dazcards/" on GitHub Pages).
export const asset = (path: string): string => import.meta.env.BASE_URL + path.replace(/^\//, '');
