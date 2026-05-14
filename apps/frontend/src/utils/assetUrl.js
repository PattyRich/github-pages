const assetModules = import.meta.glob('../assets/**/*', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function assetUrl(path) {
  const normalizedPath = path.replace(/^\/?assets\//, '');
  const modulePath = `../assets/${normalizedPath}`;

  return assetModules[modulePath] ?? `${import.meta.env.BASE_URL}assets/${normalizedPath}`;
}
