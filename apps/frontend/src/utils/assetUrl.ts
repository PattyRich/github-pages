const assetModules = import.meta.glob<string>('../assets/**/*', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function assetUrl(path: string): string {
  const normalizedPath = path.replace(/^\/?assets\//, '');
  const modulePath = `../assets/${normalizedPath}`;

  return assetModules[modulePath] ?? `${import.meta.env.BASE_URL}assets/${normalizedPath}`;
}
