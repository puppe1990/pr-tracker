export function getRepoOrganization(fullName: string | undefined): string {
  if (!fullName) {
    return '';
  }

  return fullName.split('/')[0] || '';
}
