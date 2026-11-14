// Bundled picture library (files in /public/starter, Twemoji CC BY 4.0).
// Adults can pick from these or supply their own photos/images.
export interface LibraryImage { file: string; label: string; }

export const LIBRARY: LibraryImage[] = [
  'haus', 'maus', 'hose', 'rose', 'kuh', 'schuh', 'baer', 'meer', 'katze', 'tatze', 'bein', 'stein',
  'schwein', 'hund', 'mund', 'nase', 'hase', 'apfel', 'auto', 'baum', 'fisch', 'sonne', 'ball',
].map((file) => ({ file, label: file }));

export const libraryUrl = (file: string) => `/starter/${file}.svg`;

export async function libraryBlob(file: string): Promise<Blob> {
  const b = await (await fetch(libraryUrl(file))).blob();
  return new Blob([b], { type: 'image/svg+xml' });
}
